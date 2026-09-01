/** Shared, framework-independent messaging contract. */

export type ChatSender = 'student' | 'mentor';

export type ChatConversation = {
  id: string;
  label: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  clientLabel: string;
  sender: ChatSender;
  body: string;
  createdAt: string;
};

export type ConversationSummary = ChatConversation & {
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
};

export const MAX_MESSAGE_LENGTH = 800;

/**
 * GitHub Pages cannot host a realtime server, so the prototype uses PubNub.
 * Each student listens to a UUID-scoped channel. Mentors listen to a separate
 * inbox containing a copy of every conversation message.
 */
export const CHAT_CONFIG = {
  origin: 'https://ps.pndsn.com',
  publishKey: 'demo',
  subscribeKey: 'demo',
  clientChannelPrefix: 'usu-orientation-week-aggie-launch-client-v2-',
  mentorInboxChannel: 'usu-orientation-week-aggie-launch-mentor-inbox-v2',
  historyCount: 100,
  pollTimeoutMs: 300_000,
  retryBaseDelayMs: 1_000,
  retryMaxDelayMs: 30_000,
} as const;

export function getClientChannel(conversationId: string): string {
  return `${CHAT_CONFIG.clientChannelPrefix}${conversationId}`;
}

type ValidationResult =
  | { ok: true; body: string }
  | { ok: false; error: string };

export function validateMessageBody(value: unknown): ValidationResult {
  if (typeof value !== 'string') return { ok: false, error: 'Message must be text.' };

  const body = value.trim();
  if (!body) return { ok: false, error: 'Message cannot be empty.' };
  if (body.length > MAX_MESSAGE_LENGTH) return { ok: false, error: 'Message is too long.' };

  return { ok: true, body };
}

export function normalizeSender(value: unknown): ChatSender | null {
  return value === 'student' || value === 'mentor' ? value : null;
}

export function normalizeConversation(value: unknown): ChatConversation | null {
  if (typeof value !== 'object' || value === null) return null;

  const { id, label } = value as Record<string, unknown>;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return null;
  if (typeof label !== 'string') return null;

  const normalizedLabel = label.trim();
  if (!normalizedLabel || normalizedLabel.length > 80) return null;

  return { id, label: normalizedLabel };
}

export function createMessage(
  bodyValue: unknown,
  senderValue: unknown,
  conversationValue: unknown,
  now = new Date(),
  id = crypto.randomUUID(),
): ChatMessage | null {
  const body = validateMessageBody(bodyValue);
  const sender = normalizeSender(senderValue);
  const conversation = normalizeConversation(conversationValue);
  if (!body.ok || !sender || !conversation) return null;

  return {
    id,
    conversationId: conversation.id,
    clientLabel: conversation.label,
    sender,
    body: body.body,
    createdAt: now.toISOString(),
  };
}

/** Validates an already-decoded network payload. */
export function parseMessageValue(candidate: unknown): ChatMessage | null {
  if (typeof candidate !== 'object' || candidate === null) return null;

  const {
    id,
    conversationId,
    clientLabel,
    sender: rawSender,
    body: rawBody,
    createdAt,
  } = candidate as Record<string, unknown>;

  const body = validateMessageBody(rawBody);
  const sender = normalizeSender(rawSender);
  const conversation = normalizeConversation({ id: conversationId, label: clientLabel });

  if (!body.ok || !sender || !conversation) return null;
  if (typeof id !== 'string' || !id) return null;
  if (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))) return null;

  return {
    id,
    conversationId: conversation.id,
    clientLabel: conversation.label,
    sender,
    body: body.body,
    createdAt,
  };
}

export function parseMessage(payload: string): ChatMessage | null {
  try {
    return parseMessageValue(JSON.parse(payload));
  } catch {
    return null;
  }
}

/** Derives the mentor sidebar from the messages already received. */
export function summarizeConversations(messages: ChatMessage[]): ConversationSummary[] {
  const summaries = new Map<string, ConversationSummary>();

  for (const message of messages) {
    const existing = summaries.get(message.conversationId);
    if (!existing) {
      summaries.set(message.conversationId, {
        id: message.conversationId,
        label: message.clientLabel,
        lastMessage: message.body,
        lastMessageAt: message.createdAt,
        messageCount: 1,
      });
      continue;
    }

    existing.messageCount += 1;
    if (message.createdAt >= existing.lastMessageAt) {
      existing.label = message.clientLabel;
      existing.lastMessage = message.body;
      existing.lastMessageAt = message.createdAt;
    }
  }

  return [...summaries.values()].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}
