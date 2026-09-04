'use client';

import { normalizeConversation, type ChatConversation } from './chat-contract';

const STORAGE_KEY = 'aggie-launch-private-chat-v2';

function createConversation(): ChatConversation {
  const id = crypto.randomUUID();
  const shortId = id.replaceAll('-', '').slice(-4).toUpperCase();
  return { id, label: `Student ${shortId}` };
}

/** Returns the same anonymous conversation for this browser on every visit. */
export function getOrCreateConversation(): ChatConversation {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = normalizeConversation(JSON.parse(stored));
      if (parsed) return parsed;
    }
  } catch {
    // Storage can be unavailable in privacy modes; the page still works.
  }

  const conversation = createConversation();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  } catch {
    // The in-memory conversation still works for the current page.
  }

  return conversation;
}
