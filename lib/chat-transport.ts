'use client';

import { CHAT_CONFIG, type ChatMessage } from './chat-contract';

export type TransportStatus = 'connecting' | 'connected' | 'disconnected';

type TransportHandlers = {
  subscribeChannel: string;
  publishChannels: (message: ChatMessage) => string[];
  onPayloads: (payloads: unknown[]) => void;
  onStatus: (status: TransportStatus, error?: string) => void;
};

export type ChatTransport = {
  publish: (message: ChatMessage) => Promise<void>;
  close: () => void;
};

function requestSignal(parent: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort();

  parent.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      parent.removeEventListener('abort', abort);
    },
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const channelPath = (channel: string) => encodeURIComponent(channel);

async function publishToChannel(
  channel: string,
  message: ChatMessage,
  uuid: string,
  lifetime: AbortController,
) {
  const { origin, publishKey, subscribeKey } = CHAT_CONFIG;
  const request = requestSignal(lifetime.signal, 15_000);

  try {
    const url = `${origin}/publish/${publishKey}/${subscribeKey}/0/${channelPath(channel)}/0?uuid=${uuid}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: request.signal,
    });

    if (!response.ok) throw new Error(`publish failed with HTTP ${response.status}`);

    const body: unknown = await response.json();
    if (!Array.isArray(body) || body[0] !== 1) {
      throw new Error(Array.isArray(body) ? String(body[1] ?? 'publish rejected') : 'publish rejected');
    }
  } finally {
    request.dispose();
  }
}

/**
 * Opens one subscription and mirrors each outbound message to the channels
 * chosen by the store (the private client channel and the mentor inbox).
 */
export function createChatTransport({
  subscribeChannel,
  publishChannels,
  onPayloads,
  onStatus,
}: TransportHandlers): ChatTransport {
  const { origin, subscribeKey, historyCount, pollTimeoutMs } = CHAT_CONFIG;
  const uuid = crypto.randomUUID();
  const lifetime = new AbortController();
  let closed = false;

  async function loadHistory() {
    const request = requestSignal(lifetime.signal, 15_000);

    try {
      const url = `${origin}/v2/history/sub-key/${subscribeKey}/channel/${channelPath(subscribeChannel)}?count=${historyCount}&uuid=${uuid}`;
      const response = await fetch(url, { signal: request.signal });
      if (!response.ok) return;

      const body: unknown = await response.json();
      if (Array.isArray(body) && Array.isArray(body[0]) && body[0].length) onPayloads(body[0]);
    } catch {
      // Live messages can continue even when history is temporarily unavailable.
    } finally {
      request.dispose();
    }
  }

  async function subscribeLoop() {
    let cursor = '0';
    let failures = 0;

    while (!closed) {
      const request = requestSignal(lifetime.signal, pollTimeoutMs);

      try {
        const url = `${origin}/v2/subscribe/${subscribeKey}/${channelPath(subscribeChannel)}/0?tt=${cursor}&uuid=${uuid}`;
        const response = await fetch(url, { signal: request.signal });
        if (!response.ok) throw new Error(`subscribe failed with HTTP ${response.status}`);

        const body = await response.json() as { t?: { t?: string }; m?: { d?: unknown }[] };
        if (closed) return;

        cursor = body?.t?.t ?? cursor;
        failures = 0;
        onStatus('connected');

        const payloads = (body?.m ?? []).map((envelope) => envelope?.d);
        if (payloads.length) onPayloads(payloads);
      } catch {
        if (closed) return;

        failures += 1;
        onStatus('disconnected', 'Connection lost. Reconnecting…');
        const backoff = Math.min(
          CHAT_CONFIG.retryBaseDelayMs * 2 ** (failures - 1),
          CHAT_CONFIG.retryMaxDelayMs,
        );
        await delay(backoff);
      } finally {
        request.dispose();
      }
    }
  }

  onStatus('connecting');
  void loadHistory().then(subscribeLoop);

  return {
    async publish(message) {
      const channels = [...new Set(publishChannels(message))];
      await Promise.all(channels.map((channel) =>
        publishToChannel(channel, message, uuid, lifetime),
      ));
    },

    close() {
      closed = true;
      lifetime.abort();
    },
  };
}
