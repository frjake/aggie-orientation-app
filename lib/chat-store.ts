'use client';

import { create } from 'zustand';
import {
  CHAT_CONFIG,
  MAX_MESSAGE_LENGTH,
  createMessage,
  getClientChannel,
  parseMessageValue,
  summarizeConversations,
  type ChatConversation,
  type ChatMessage,
  type ChatSender,
} from './chat-contract';
import { getOrCreateConversation } from './chat-identity';
import { createChatTransport, type ChatTransport, type TransportStatus } from './chat-transport';

type ChatState = {
  messages: ChatMessage[];
  transport: ChatTransport | null;
  status: TransportStatus;
  isSending: boolean;
  error: string | null;
  role: ChatSender | null;
  clientConversation: ChatConversation | null;
  activeConversationId: string | null;
  subscribers: number;
  connect: (role: ChatSender) => void;
  reconnect: () => void;
  disconnect: () => void;
  selectConversation: (conversationId: string) => void;
  sendMessage: (body: string, sender: ChatSender) => Promise<void>;
};

/** Adds unseen messages and returns them in stable chronological order. */
function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const seen = new Set(existing.map((message) => message.id));
  const added = incoming.filter((message) => !seen.has(message.id));
  if (!added.length) return existing;

  return [...existing, ...added].sort((a, b) => {
    const byTime = a.createdAt.localeCompare(b.createdAt);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  transport: null,
  status: 'disconnected',
  isSending: false,
  error: null,
  role: null,
  clientConversation: null,
  activeConversationId: null,
  subscribers: 0,

  connect: (role) => {
    set((state) => ({ subscribers: state.subscribers + 1 }));
    const state = get();
    if (state.transport && state.role === role) return;

    state.transport?.close();
    const clientConversation = role === 'student'
      ? state.clientConversation ?? getOrCreateConversation()
      : null;
    const roleChanged = state.role !== role;

    set({
      role,
      clientConversation,
      activeConversationId: role === 'student'
        ? clientConversation?.id ?? null
        : roleChanged ? null : state.activeConversationId,
      messages: roleChanged ? [] : state.messages,
      transport: null,
      status: 'connecting',
      error: null,
    });
    get().reconnect();
  },

  reconnect: () => {
    const { role, clientConversation } = get();
    if (!role) return;

    get().transport?.close();
    const subscribeChannel = role === 'mentor'
      ? CHAT_CONFIG.mentorInboxChannel
      : getClientChannel(clientConversation!.id);

    set({ transport: null, status: 'connecting', error: null });

    const transport = createChatTransport({
      subscribeChannel,
      publishChannels: (message) => [
        getClientChannel(message.conversationId),
        CHAT_CONFIG.mentorInboxChannel,
      ],
      onPayloads: (payloads) => {
        let incoming = payloads
          .map(parseMessageValue)
          .filter((message): message is ChatMessage => message !== null);

        if (role === 'student') {
          incoming = incoming.filter((message) =>
            message.conversationId === clientConversation?.id,
          );
        }
        if (!incoming.length) return;

        set((state) => {
          const messages = mergeMessages(state.messages, incoming);
          const firstConversation = role === 'mentor'
            ? summarizeConversations(messages)[0]?.id ?? null
            : clientConversation?.id ?? null;

          return {
            messages,
            activeConversationId: state.activeConversationId ?? firstConversation,
          };
        });
      },
      onStatus: (status, error) => set({ status, error: error ?? null }),
    });

    set({ transport });
  },

  disconnect: () => {
    const { subscribers, transport } = get();
    const remaining = Math.max(0, subscribers - 1);
    set({ subscribers: remaining });
    if (remaining > 0 || !transport) return;

    transport.close();
    set({ transport: null, status: 'disconnected', messages: [], error: null });
  },

  selectConversation: (conversationId) => {
    const exists = get().messages.some((message) => message.conversationId === conversationId);
    if (exists) set({ activeConversationId: conversationId, error: null });
  },

  sendMessage: async (body, sender) => {
    const state = get();
    const activeConversationId = sender === 'student'
      ? state.clientConversation?.id
      : state.activeConversationId;
    const summary = summarizeConversations(state.messages)
      .find((conversation) => conversation.id === activeConversationId);
    const conversation = sender === 'student'
      ? state.clientConversation
      : summary ? { id: summary.id, label: summary.label } : null;
    const message = createMessage(body, sender, conversation);

    if (!message) {
      set({
        error: activeConversationId
          ? `Messages must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`
          : 'Choose a student conversation before replying.',
      });
      return;
    }

    if (!state.transport) {
      set({ error: 'You are not connected. Your message was not sent.' });
      return;
    }

    set({ isSending: true, error: null });

    try {
      await state.transport.publish(message);
      set({ isSending: false, error: null });
    } catch (cause) {
      console.error('Chat publish failed', cause);
      set({ isSending: false, error: 'Your message could not be sent. Try again.' });
    }
  },
}));
