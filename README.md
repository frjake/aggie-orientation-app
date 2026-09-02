#  Aggie Launch — The Next-Generation Student Orientation Experience Platform

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Node](https://img.shields.io/badge/node-%3E%3D22.13-green)
![Status](https://img.shields.io/badge/status-prototype-orange)
![Made with](https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F-red)

> **Aggie Launch** isn't just an orientation website — it's a comprehensive, end-to-end digital onboarding ecosystem that empowers incoming Utah State students to seamlessly navigate their first week on campus.

---

##  Overview

In today's fast-paced higher education landscape, traditional orientations simply doesn't cut it anymore. Students arrive on campus expecting the same **frictionless**, **intuitive**, and **delightful** experiences they get from the world-class consumer applications they use every day.

Aggie Launch stands as a testament to what's possible when modern web technology meets student-centered design. Built from the ground up with a mobile-first philosophy, it serves as a role model for the excellence that Utah State University strives to achieve. The experience leverages a robust, meticulously architected real-time engagement layer that fosters genuine human connection between incoming students and the A-Team mentors who guide them — highlighting the university's enduring commitment to student success.

Industry best practices suggest that students who engage meaningfully during orientation week are significantly more likely to persist through their first year. Aggie Launch was engineered with exactly that outcome in mind.

---

##  Table of Contents

- [ Overview](#-overview)
- [ Features](#-features)
- [ Getting Started](#-getting-started)
- [ Architecture](#️-architecture)
- [ Project Structure](#-project-structure)
- [ Security](#-security)
- [ Testing](#-testing)
- [ Accessibility](#-accessibility)
- [️ Roadmap](#️-roadmap)
- [ Contributing](#-contributing)

---

## Features

- ** Intelligent Schedule Builder**: A vibrant, fully interactive schedule that lets students discover, filter, and curate the events that matter most to them.
- ** Bookmarking**: Students can flag the sessions they care about and keep an eye on how their week is shaping up.
- ** Real-Time Mentor Chat**: A cutting-edge, low-latency messaging surface that connects students with current USU students in real time.
- ** Interactive Campus Map**: Seamlessly integrated wayfinding that helps students effortlessly navigate the Logan campus.
- ** Fully Responsive**: A carefully tuned experience from mobile to tablet to desktop.
- ** Accessibility-Minded**: Semantic markup, ARIA attributes, and a considered focus on inclusive design.
- ** Input Validation**: Message content is validated and normalized before it leaves the client.

---

##  Getting Started

### Prerequisites

Before you begin, please ensure your local development environment meets the following requirements:

- **Node.js** `>= 22.13.0`
- **npm** (or **yarn**, or **pnpm** — the choice is yours!)
- A modern web browser

### Installation

Getting up and running is a breeze. Simply clone the repository and install the dependencies:

```bash
git clone https://github.com/nritschel/aggie-orientation-app.git
cd aggie-orientation-app
npm install
```

### Configuration

No additional configuration is required to run the application locally. Everything the app needs to start is already part of the repository, which keeps onboarding delightfully frictionless for new contributors.

### Running the Development Server

```bash
npm run dev
```

The application exposes two surfaces:

| Route | Description |
| --- | --- |
| [`/`](http://localhost:3000) | The student orientation experience |
| [`/mentor`](http://localhost:3000/mentor) | The A-Team mentor desk, where mentors reply to incoming students |

Open [http://localhost:3000](http://localhost:3000) in your browser to get started. That's it — you're up and running! 🎉

### Building for Production

```bash
npm run build
npm run start
```

---

## 🏗️ Architecture

Aggie Launch is built on a modern, layered architecture that cleanly separates presentation, domain logic, and transport concerns. This separation of concerns is crucial for long-term maintainability and dramatically reduces the cognitive load on future contributors.

>  For the full treatment — topology, layer reference, message lifecycle, decision records, and module reference — see **[ARCHITECTURE.MD](ARCHITECTURE.MD)**.

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│         app/page.tsx  ·  components/*.tsx                │
├─────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                        │
│      lib/events.ts  ·  lib/chat-contract.ts              │
├─────────────────────────────────────────────────────────┤
│                  STATE ORCHESTRATION                     │
│           lib/chat-store.ts  (Zustand)                   │
├─────────────────────────────────────────────────────────┤
│                    TRANSPORT LAYER                       │
│              MQTT over WebSocket (wss://)                │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
aggie-orientation-app/
├── app/                    # Next.js App Router routes
│   ├── layout.tsx          # Root document shell + metadata
│   ├── page.tsx            # Primary student experience
│   ├── mentor/page.tsx     # Mentor desk
│   └── globals.css         # Global design tokens and styles
├── components/             # Reusable presentational components
│   └── OrientationChat.tsx # Real-time conversation surface
├── lib/                    # Domain logic and shared contracts
│   ├── events.ts           # Orientation event domain module
│   ├── chat-contract.ts    # Shared messaging contract
│   └── chat-store.ts       # Realtime engagement command center
├── public/                 # Static assets
└── test/                   # Test suite
```

---

## Security

Security is something the team thinks about throughout the development process.

- ** Content Sanitization**: Message bodies are passed through a sanitization step before they are rendered in the transcript.
- ** Encrypted Transport**: Messages travel over a TLS-secured WebSocket connection (`wss://`), so traffic is encrypted in transit.
- ** Input Validation**: Message length and sender role are normalized and validated by a shared contract module used on both ends of the pipeline.
- ** Pinned Dependencies**: Every dependency resolution is locked in `package-lock.json` for reproducible installs.
- ** Colocated Configuration**: Deployment and runtime configuration lives alongside the application code, which keeps local setup simple and avoids environment drift.

Despite these measures, security is an ongoing journey rather than a destination. We welcome responsible disclosure from the community.

---

## Testing

The project ships with a test suite covering the core domain logic — event filtering, message normalization, and the shared chat contract.

```bash
npm test
```

Our testing philosophy is simple: the domain layer is where correctness matters most, so that's where the coverage goes. Additionally, contributors are encouraged to run the full suite locally before opening a pull request.

---

## Accessibility

Accessibility isn't a checkbox for us — it's a core value.

The interface is built on semantic HTML with ARIA attributes applied throughout: landmark regions, `aria-label` on icon-only buttons, `aria-pressed` on the date selector, `aria-live` on the chat transcript, and `role="dialog"` with `aria-modal` on the event detail overlay. Screen-reader-only helper text supports the search and compose inputs. The color palette draws on the university's established brand contrast pairings.

Accessibility is a journey, and we continue to invest in it release over release.

---

## Roadmap

- [x] Core schedule builder
- [x] Real-time mentor chat
- [x] Interactive campus map
- [x] Social share card
- [ ] Push notifications for saved events
- [ ] Native mobile applications (iOS & Android)
- [ ] AI-powered personalized schedule recommendations
- [ ] Multi-campus support (Logan, Eastern, and beyond)

Despite the ambitious scope of this roadmap, the team remains confident that Aggie Launch is ready to ensure a seamless orientation for USU's 2030 cohort!

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the existing code style.

---

## Conclusion

In summary, Aggie Launch represents a bold reimagining of what student orientation can be in the modern era. By combining a thoughtfully crafted user experience, a considered technical foundation, and a genuine commitment to accessibility, the platform aims to deliver real value to every incoming Aggie.

Ultimately, Aggie Launch is more than just software — it's the first handshake between a student and their university.

Go Aggies!

---


I hope this helps! Let me know if you'd like me to expand on any section.
