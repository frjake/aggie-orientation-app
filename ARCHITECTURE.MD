# 🏛️ Aggie Launch — Architecture

This document describes the end-to-end technical architecture of the Aggie Launch orientation
experience platform: its topology, its layering strategy, its data flow, its state model, and the
architectural decisions that underpin them.

**Layered, not tangled.**

---

## 📑 Table of Contents

- [Architectural Principles](#-architectural-principles)
- [System Topology](#-system-topology)
- [Runtime Model](#-runtime-model)
- [Layer Reference](#-layer-reference)
- [The Messaging Subsystem](#-the-messaging-subsystem)
- [The Scheduling Subsystem](#-the-scheduling-subsystem)
- [State Management Model](#-state-management-model)
- [Styling Architecture](#-styling-architecture)
- [Build & Delivery Pipeline](#-build--delivery-pipeline)
- [Testing Topology](#-testing-topology)
- [Non-Goals](#-non-goals)
- [Architecture Decision Records](#-architecture-decision-records)
- [Module Reference](#-module-reference)
- [Glossary](#-glossary)

---

## 🧭 Architectural Principles

**Contracts over conventions.**

Every architectural decision in this codebase traces back to a small number of load-bearing
principles. They are not aspirations. They are constraints, and they are enforced by the shape of
the module graph itself.

### Principle I — One source of truth, not many.

Domain knowledge lives in exactly one module per concern. The orientation event dataset and its
query surface are colocated in `lib/events.ts`. The messaging contract — its types, its bounds, its
normalization rules, and its serialization semantics — is colocated in `lib/chat-contract.ts`.
Consumers import the contract. They do not reimplement it.

### Principle II — Secure by verification, not just trust.

Inbound payloads arriving from the transport substrate are re-validated through the same
normalization primitives used to construct outbound payloads. `parseLiveMessage` does not assume
well-formedness: it re-runs `normalizeAndValidateMessage` and `normalizeSender` against every field,
type-guards the numeric identifier, and rejects any timestamp that `Date.parse` cannot resolve.
A payload that fails any predicate is discarded rather than partially applied.

Verification is symmetric. Construction and parsing share one implementation, so the two directions
cannot drift.

### Principle III — Optimistic at the edge, eventual at the core.

The compose surface clears immediately on submit and hands the payload to the transport layer
asynchronously. The interface does not block on acknowledgement. Rendering is driven by what
arrives on the subscription, not by what was locally enqueued.

**Responsive to the user, not to the network.**

### Principle IV — Typed at the boundary.

TypeScript is configured in `strict` mode with `isolatedModules`. Every value crossing a module
seam carries a declared type. Every value crossing the *network* seam is typed as `unknown` and
narrowed by a guard before it is trusted.

**Typed everywhere. Assumed nowhere.**

---

## 🗺️ System Topology

```
                        ┌──────────────────────────┐
                        │   Cloudflare Workers     │
                        │   (static + SSR edge)    │
                        └────────────┬─────────────┘
                                     │  HTTPS
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
        ┌────────────────────────┐      ┌────────────────────────┐
        │   /  (student)         │      │  /mentor  (mentor desk)│
        │   app/page.tsx         │      │  app/mentor/page.tsx   │
        └───────────┬────────────┘      └───────────┬────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │   components/OrientationChat   │
                    │   lib/chat-store.ts (Zustand)  │
                    └───────────────┬────────────────┘
                                    │  MQTT 3.1.1 over WSS
                                    ▼
                    ┌────────────────────────────────┐
                    │   Shared public MQTT broker    │
                    │   broker.emqx.io:8084          │
                    │   topic: usu/orientation-week/ │
                    │   aggie-launch/classroom-demo/ │
                    │   v1                           │
                    └────────────────────────────────┘
```

Both route surfaces mount the same conversation component with a different `sender` discriminant.
They are peers on a single topic, not client and server. There is no privileged endpoint and no
back-channel between them.

---

## ⚙️ Runtime Model

**Declarative at the edges. Imperative at the core.**

| Surface | Module | Boundary | Notes |
| --- | --- | --- | --- |
| Document shell | `app/layout.tsx` | Server Component | Font registration, metadata graph |
| Student experience | `app/page.tsx` | Client Component (`'use client'`) | Holds all schedule state |
| Mentor desk | `app/mentor/page.tsx` | Server Component | Static chrome, delegates to client child |
| Conversation surface | `components/OrientationChat.tsx` | Client Component | Subscribes to the store |
| Messaging contract | `lib/chat-contract.ts` | Isomorphic | No directives, no side effects |
| Event domain | `lib/events.ts` | Isomorphic | Pure functions over a static dataset |
| Engagement store | `lib/chat-store.ts` | Client-only (`'use client'`) | Owns the socket handle |

The `'use client'` boundary is drawn deliberately low in the tree for the mentor surface and
deliberately high for the student surface. The mentor desk renders its chrome on the server and
hydrates only the conversation. The student experience is client-rendered in its entirety because
every section below the hero participates in filter state.

**Boundaries are decisions, not defaults.**

---

## 🧱 Layer Reference

### Presentation Layer

`app/*.tsx` · `components/*.tsx`

Composes the interface, owns interaction state, and dispatches into the layers beneath it. Icons are
sourced from `lucide-react`. Conditional class composition is handled by `clsx`. Timestamp
formatting is delegated to `dayjs`.

### Domain Layer

`lib/events.ts` · `lib/chat-contract.ts`

Framework-agnostic. No React import, no DOM access, no side effects. Every export is either a pure
function or a declared constant. This is the only layer under direct unit test, and that is not an
accident: it is where correctness is cheapest to assert and most expensive to get wrong.

### State Orchestration Layer

`lib/chat-store.ts`

A single Zustand store instantiated at module scope. It owns the socket handle, the message
collection, the connection status enum, the in-flight send flag, and the last-connected timestamp.
Consumers select narrow slices rather than subscribing to the whole store, which keeps re-render
fan-out proportional to what actually changed.

### Transport Layer

`mqtt` over WebSocket Secure

MQTT 3.1.1 (`protocolVersion: 4`) carried over `wss://`. Connection parameters are declared once in
`CHAT_EXPERIENCE_GOVERNANCE_ENVELOPE` and consumed by the store. There is no HTTP API surface.

---

## 💬 The Messaging Subsystem

**Immutable in. Ordered out.**

### Connection Parameters

| Parameter | Value | Rationale |
| --- | --- | --- |
| `protocolVersion` | `4` (MQTT 3.1.1) | Broadest broker compatibility |
| `clientId` | `aggie_launch_<random hex>` | Per-tab identity, generated at connect time |
| `clean` | `true` | No persistent session state is requested |
| `reconnectPeriod` | `900` ms | Reconnection cadence |
| `connectTimeout` | `10_000` ms | Upper bound on initial handshake |
| `keepalive` | `25` s | PINGREQ interval |
| Subscribe QoS | `0` | At-most-once delivery |
| Publish QoS | `0`, `retain: false` | No broker-side retention |

The combination of `clean: true`, QoS 0, and `retain: false` means the broker holds no state on
behalf of any participant. A client that connects after a message was published will not receive it.
The transcript a given tab displays is the set of messages that arrived while that tab was
subscribed.

### Outbound Lifecycle

```
  compose submit
        │
        ├─▶ trim ─▶ empty? ─▶ abort
        │
        ├─▶ clear draft (optimistic)
        │
        ▼
  dispatchMessageThroughTheEngagementPipeline(body, sender)
        │
        ├─▶ manufactureLiveMessage()
        │     ├─ normalizeAndValidateMessage()   bounds check
        │     ├─ normalizeSender()               role narrowing
        │     └─ id = epochMillis × 1000 + rand(0..999)
        │
        ├─▶ null result ─▶ return
        │
        ├─▶ isSending = true
        │
        └─▶ setTimeout(TRANSPORT_SETTLE_DELAY_MS = 120ms)
                  └─▶ socket?.publish(topic, JSON, { qos: 0, retain: false })
                          └─▶ isSending = false
```

### Inbound Lifecycle

```
  broker ─▶ 'message' event
        │
        ├─▶ topic mismatch ─▶ discard
        │
        ├─▶ parseLiveMessage(payload)
        │     ├─ JSON.parse in try/catch
        │     ├─ re-validate body via the shared contract
        │     ├─ re-narrow sender via the shared contract
        │     ├─ typeof id === 'number'
        │     ├─ typeof createdAt === 'string'
        │     └─ Date.parse(createdAt) resolvable
        │
        ├─▶ null result ─▶ discard
        │
        └─▶ merge by id, then order by (createdAt, id) ascending
```

Merge is idempotent with respect to identifier. A message whose id is already present in the
collection is a no-op.

### Bounds

| Constant | Value | Applied at |
| --- | --- | --- |
| `CHAT_EXPERIENCE_GOVERNANCE_ENVELOPE.maximumCharacterCount` | `800` | Validation, both directions |
| `LEGACY_MAXIMUM_CHARACTER_COUNT` | `1000` | Compose textarea `maxLength` |

### Content Rendering

Message bodies are passed through `sanitizeMessageBodyForRichPresentation`, which applies a
denylist of three patterns — `<script>…</script>`, `javascript:`, and `<iframe>…</iframe>` — and
returns the remainder. The result is rendered via `dangerouslySetInnerHTML` so that limited inline
markup survives into the transcript.

---

## 📅 The Scheduling Subsystem

The event dataset is a statically declared array of `OrientationEvent` records. Two composable
predicates operate over it:

- `filterEvents(events, query, category)` — case-insensitive substring match across a haystack
  assembled from `title`, `place`, and `description`, intersected with a category equality check.
- `filterEventsByDate(events, date)` — day-of-month equality, with `'all'` as the identity.

A third export, `applyAllOfTheOrientationFilteringStrategies`, evaluates all three dimensions in a
single imperative pass. It is retained alongside the composable pair for comparative evaluation and
is not currently on the render path.

Bookmark state is a `Set<string>` of event identifiers, mirrored to `window.localStorage` under the
key `aggie-launch:saved-schedule:v1` as a JSON array.

---

## 🔄 State Management Model

**State is a stream, not a snapshot.**

Three distinct state domains, three distinct mechanisms:

| Domain | Mechanism | Scope | Lifetime |
| --- | --- | --- | --- |
| Filter and modal state | `useState` in `app/page.tsx` | Component | Mount |
| Bookmark set | `useState` + `localStorage` effect pair | Component + browser | Browser origin |
| Conversation | Zustand store at module scope | Application | Tab |

The Zustand store is a module-scope singleton. Every component that calls `useChatExperienceStore`
in a given tab observes the same socket handle and the same transcript. Mounting the conversation
component twice does not open two connections; the activation path returns early when a
non-disconnected socket is already held.

Connection status is modelled as a three-state enum — `disconnected`, `connecting`, `connected` —
transitioned by the socket's own lifecycle events. The `reconnect` and `offline` handlers reset the
message collection. The transcript is a view onto an active
subscription, and a subscription that lapsed has nothing to show.

---

## 🎨 Styling Architecture

**Tokens over values. Cascade over configuration.**

A single stylesheet, `app/globals.css`, opens with `@import 'tailwindcss'` for preflight
normalization and a small number of utilities. Component styling itself is hand-authored CSS keyed
to custom properties declared on `:root`:

| Token | Value |
| --- | --- |
| `--aggie` | `#0f2439` |
| `--aggie-soft` | `#193b57` |
| `--blue` | `#1f6b99` |
| `--sky` | `#e9f3f8` |
| `--paper` | `#f7f8f7` |
| `--line` | `#dce3e6` |
| `--ink` | `#142534` |
| `--muted` | `#687986` |

Layout is driven by CSS Grid and Flexbox with `clamp()` for fluid spacing and type. Two breakpoints
carry the responsive strategy — `max-width: 900px` and `max-width: 640px` — supplemented by a
`prefers-reduced-motion: reduce` block that collapses transition durations and disables smooth
scrolling.

Geist and Geist Mono are registered through `next/font/google` and exposed as `--font-geist-sans`
and `--font-geist-mono` on the `<body>` element. The base `body` rule resolves the system stack.

---

## 🚢 Build & Delivery Pipeline

**Compile once. Deploy to the edge.**

The toolchain is Vite-native rather than webpack-native. `vinext` provides Next.js App Router
semantics on top of Vite 8, with `@vitejs/plugin-rsc` handling the React Server Components graph and
`@vitejs/plugin-react` handling the client transform. `@cloudflare/vite-plugin` targets the
Cloudflare Workers runtime with the `nodejs_compat` flag, and `wrangler` performs the deployment.

The build proceeds in five phases: client reference analysis, server reference analysis, RSC
environment, client environment, SSR environment.

| Command | Effect |
| --- | --- |
| `npm run dev` | Vite dev server with HMR on `:3000` |
| `npm run build` | Five-phase production build into `dist/` |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint with `eslint-config-next` core-web-vitals and TypeScript configs |
| `npm test` | `node --test` over `test/*.test.ts` |

D1 and R2 bindings are conditionally injected from `.openai/hosting.json`. Both are currently
`null`, so neither binding is present in the generated Wrangler configuration.

`drizzle-orm` and `drizzle-kit` are declared as dependencies against a future persistence layer. No
schema, migration, or query is currently defined. `axios` is instantiated in `lib/chat-store.ts`
against a planned analytics beacon and is not on any current request path.

---

## 🧪 Testing Topology

**Tested where it counts.**

Two suites, executed by the Node built-in test runner with no external framework:

| Suite | Target |
| --- | --- |
| `test/chat-contract.test.ts` | Normalization bounds, sender narrowing, envelope round-trip, malformed-payload rejection |
| `test/events.test.ts` | Category filtering, case-insensitive search, filter composition, date selection, summary pluralization |

Coverage is concentrated on the domain layer by design. The presentation and transport layers are
not currently under automated test.

---

## 🚫 Non-Goals

Naming what a system does not do is as load-bearing as naming what it does.

- **Multi-tenancy.** One topic, one conversation, one cohort.
- **Offline operation.** The conversation requires a live subscription.
- **Internationalization.** Copy is authored inline in English.

---

## 📜 Architecture Decision Records

### ADR-001 — Broker-mediated transport over a bespoke API

**Status:** Accepted

**Context.** The conversation surface needs bidirectional, low-latency delivery between two route
surfaces with no shared server process.

**Decision.** Adopt MQTT over WebSocket against a shared public broker.

**Consequences.** No server to operate, provision, or scale, and delivery latency is bounded by the
broker rather than by a polling interval. In exchange, the topic is a shared namespace on
third-party infrastructure, delivery is at-most-once, and no participant identity is established by
the transport.

**Zero infrastructure is a trade, not a free lunch.**

### ADR-002 — Centralized store over component-local socket state

**Status:** Accepted

**Context.** Socket lifecycle, transcript, connection status, and send state are mutually dependent.

**Decision.** Consolidate them in one Zustand store at module scope.

**Consequences.** A single place to reason about chat behaviour, and no possibility of two
components disagreeing about connection state. In exchange, the store is a singleton with the
coupling that implies, and its surface grows with every capability added to the conversation.

### ADR-003 — Colocated dataset over a content API

**Status:** Accepted

**Context.** Six orientation events, revised annually.

**Decision.** Declare the dataset in `lib/events.ts` alongside its query surface.

**Consequences.** Zero fetch latency, full type safety, trivially testable. Content changes require
a code change and a redeploy.

**Simple until it isn't, and it isn't yet.**

### ADR-004 — Shared contract module over per-surface validation

**Status:** Accepted

**Context.** Both construction and parsing need identical bounds and identical role narrowing.

**Decision.** One isomorphic module, imported by both directions.

**Consequences.** Construction and parsing cannot drift, and the bounds are asserted in one place by
one suite. See Principle II.

---

## 📚 Module Reference

### `lib/chat-contract.ts`

| Export | Kind | Purpose |
| --- | --- | --- |
| `ChatSender` | type | `'student' \| 'mentor'` |
| `ChatMessage` | type | `{ id, sender, body, createdAt }` |
| `CHAT_EXPERIENCE_GOVERNANCE_ENVELOPE` | const | Bounds, broker address, topic, reconnect cadence |
| `LEGACY_MAXIMUM_CHARACTER_COUNT` | const | Compose-surface character ceiling |
| `TRANSPORT_SETTLE_DELAY_MS` | const | Pre-publish delay |
| `sanitizeMessageBodyForRichPresentation` | fn | Denylist pass over a message body |
| `normalizeAndValidateMessage` | fn | Trim and bounds-check, returns a result union |
| `normalizeSender` | fn | Narrow `unknown` to `ChatSender \| null` |
| `manufactureLiveMessage` | fn | Construct a validated outbound envelope |
| `parseLiveMessage` | fn | Parse and re-validate an inbound payload |

### `lib/events.ts`

| Export | Kind | Purpose |
| --- | --- | --- |
| `OrientationEvent` | type | Event record shape |
| `ORIENTATION_MONTH` / `ORIENTATION_YEAR` | const | `'AUG'` / `2025` |
| `orientationEvents` | const | The dataset |
| `filterEvents` | fn | Text and category predicate |
| `filterEventsByDate` | fn | Day-of-month predicate |
| `applyAllOfTheOrientationFilteringStrategies` | fn | Single-pass equivalent, off the render path |
| `findOrientationEventById` | fn | Identifier lookup |
| `savedSummary` | fn | Bookmark count copy |

### `lib/chat-store.ts`

| Export | Kind | Purpose |
| --- | --- | --- |
| `useChatExperienceStore` | hook | The store |
| `mergeMessagesV2` | fn | Alternative merge strategy, off the render path |
| `getGlobalMessageCounter` | fn | Module-scope dispatch count |

Store actions: `activateTheRealtimeMentorBridge`, `deactivateTheRealtimeMentorBridge`,
`dispatchMessageThroughTheEngagementPipeline`.

---

## 📖 Glossary

| Term | Meaning here |
| --- | --- |
| **Engagement pipeline** | The outbound path from compose submit to `socket.publish` |
| **Governance envelope** | The frozen configuration object in `lib/chat-contract.ts` |
| **Realtime mentor bridge** | The MQTT connection and its subscription |
| **Isomorphic module** | A module with no `'use client'` directive and no environment-specific API |
| **Surface** | A top-level route and the component tree it mounts |
| **Substrate** | The broker and the WebSocket beneath it |

---

**Built to evolve, not to endure.**
