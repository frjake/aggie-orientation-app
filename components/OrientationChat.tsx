'use client';

import clsx from 'clsx';
import dayjs from 'dayjs';
import { Send, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MAX_MESSAGE_LENGTH, summarizeConversations, type ChatSender } from '../lib/chat-contract';
import { useChatStore } from '../lib/chat-store';

type OrientationChatProps = {
  sender: ChatSender;
  compact?: boolean;
};

const STATUS_LABEL = {
  connected: 'Live connection',
  connecting: 'Connecting…',
  disconnected: 'Offline',
} as const;

export function OrientationChat({ sender, compact = false }: OrientationChatProps) {
  const [draft, setDraft] = useState('');

  const allMessages = useChatStore((state) => state.messages);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const isSending = useChatStore((state) => state.isSending);
  const status = useChatStore((state) => state.status);
  const error = useChatStore((state) => state.error);
  const connect = useChatStore((state) => state.connect);
  const disconnect = useChatStore((state) => state.disconnect);
  const reconnect = useChatStore((state) => state.reconnect);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const messageViewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connect(sender);
    return disconnect;
  }, [connect, disconnect, sender]);

  const conversations = useMemo(() => summarizeConversations(allMessages), [allMessages]);
  const activeConversation = conversations.find(({ id }) => id === activeConversationId);
  const messages = allMessages.filter((message) =>
    message.conversationId === activeConversationId,
  );

  useLayoutEffect(() => {
    const viewport = messageViewport.current;
    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();
    if (!body || isSending) return;

    setDraft('');
    sendMessage(body, sender);
  }

  const isConnected = status === 'connected';
  const canCompose = isConnected && (sender === 'student' || Boolean(activeConversation));

  return (
    <section className={clsx('chat-shell', compact && 'chat-shell-compact')} aria-label="Orientation mentor chat">
      <header className="chat-header">
        <div className="chat-avatar" aria-hidden="true">AT</div>
        <div>
          <strong>{sender === 'mentor' ? activeConversation?.label ?? 'Select a conversation' : 'A-Team mentor'}</strong>
          <span className={`connection-${status}`}><i aria-hidden="true" /> {STATUS_LABEL[status]}</span>
        </div>
        <ShieldCheck aria-label="University contact" size={18} />
      </header>

      <div className="chat-messages" ref={messageViewport} aria-live="polite">
        {sender === 'mentor' && !activeConversation ? (
          <div className="chat-welcome">
            <span aria-hidden="true">AT</span>
            <strong>No conversation selected</strong>
            <p>Choose a student from the conversation list to read their history and reply.</p>
          </div>
        ) : status === 'disconnected' && messages.length === 0 ? (
          <div className="chat-welcome">
            <span aria-hidden="true">AT</span>
            <strong>Live chat is offline</strong>
            <p>Messages only appear while this page is connected.</p>
            <button className="chat-reconnect" onClick={reconnect}>Reconnect</button>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-welcome">
            <span aria-hidden="true">AT</span>
            <strong>{sender === 'mentor' ? 'No messages yet' : 'Hi! This chat is just for you.'}</strong>
            <p>{sender === 'mentor' ? 'This student’s messages will appear here.' : 'Ask about orientation, campus, classes, or finding your way around.'}</p>
          </div>
        ) : messages.map((message) => (
          <div className={clsx('chat-message-row', message.sender === sender && 'mine')} key={message.id}>
            <div className="chat-bubble">
              <p>{message.body}</p>
              <time dateTime={message.createdAt}>{dayjs(message.createdAt).format('h:mm A')}</time>
            </div>
          </div>
        ))}
        {error && <p className="chat-error" role="alert">{error}</p>}
      </div>

      <form className="chat-compose" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={`chat-message-${sender}`}>Type a message</label>
        <textarea
          id={`chat-message-${sender}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={!isConnected ? 'Waiting for the connection…' : sender === 'mentor' && !activeConversation ? 'Select a student to reply…' : sender === 'mentor' ? `Reply to ${activeConversation?.label}…` : 'Message an A-Team mentor…'}
          rows={1}
          disabled={!canCompose}
        />
        <button type="submit" disabled={!draft.trim() || isSending || !canCompose} aria-label="Send message">
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
