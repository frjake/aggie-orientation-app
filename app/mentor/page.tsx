'use client';

import dayjs from 'dayjs';
import { ArrowLeft, MessageCircle, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { OrientationChat } from '../../components/OrientationChat';
import { summarizeConversations } from '../../lib/chat-contract';
import { useChatStore } from '../../lib/chat-store';

export default function MentorWorkspace() {
  const messages = useChatStore((state) => state.messages);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const conversations = useMemo(() => summarizeConversations(messages), [messages]);
  const activeConversation = conversations.find(({ id }) => id === activeConversationId);

  return (
    <main className="mentor-workspace">
      <header className="mentor-topbar">
        <div className="mentor-wordmark"><span aria-hidden="true">A</span><div><strong>UTAH STATE</strong><small>A-TEAM MENTOR DESK</small></div></div>
        <div className="mentor-user"><span aria-hidden="true">MP</span><div><strong>Mentor Portal</strong><small>Available</small></div></div>
      </header>
      <div className="mentor-layout">
        <aside className="mentor-sidebar" aria-label="Student conversations">
          <Link href="/"><ArrowLeft size={16} /> Student site</Link>
          <p>CONVERSATIONS <span>{conversations.length}</span></p>
          <div className="mentor-thread-list">
            {conversations.map((conversation) => (
              <button
                className={`mentor-thread${conversation.id === activeConversationId ? ' active' : ''}`}
                aria-current={conversation.id === activeConversationId ? 'true' : undefined}
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
              >
                <span className="thread-avatar"><UserRound size={17} /></span>
                <span>
                  <strong>{conversation.label}</strong>
                  <small>{conversation.lastMessage}</small>
                </span>
                <time dateTime={conversation.lastMessageAt}>{dayjs(conversation.lastMessageAt).format('h:mm A')}</time>
              </button>
            ))}
          </div>
          {conversations.length === 0 && (
            <div className="mentor-queue-note"><MessageCircle size={18} /><strong>No conversations yet</strong><span>Each student’s private thread appears here after they send a message.</span></div>
          )}
        </aside>
        <section className="mentor-chat-area">
          <div className="mentor-chat-title">
            <div><span>ACTIVE CONVERSATION</span><h1>{activeConversation?.label ?? 'Student messages'}</h1></div>
            <p>{activeConversation ? `${activeConversation.messageCount} message${activeConversation.messageCount === 1 ? '' : 's'} · Private thread` : 'Choose a conversation to begin'}</p>
          </div>
          <OrientationChat sender="mentor" />
        </section>
      </div>
    </main>
  );
}
