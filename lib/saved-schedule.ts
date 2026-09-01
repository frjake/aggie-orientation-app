'use client';

/**
 * The student's saved schedule, backed by localStorage.
 *
 * Exposed as an external store so components can read it with
 * `useSyncExternalStore`: the server snapshot is always empty, which keeps the
 * first client render identical to the server output, and storage is only
 * touched in the browser.
 */

const STORAGE_KEY = 'aggie-launch:saved-schedule:v1';
const EMPTY: ReadonlySet<string> = new Set();

const listeners = new Set<() => void>();

/** Authoritative in-memory copy. null until the first browser read. */
let value: ReadonlySet<string> | null = null;

function parse(raw: string | null): ReadonlySet<string> {
  if (!raw) return EMPTY;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private mode or with cookies blocked.
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;

  // Another tab changed the schedule.
  value = parse(readRaw());
  emit();
}

export function subscribeToSavedSchedule(onChange: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', handleStorageEvent);
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Returns a stable set. The identity only changes when the schedule changes,
 * which is what useSyncExternalStore requires.
 */
export function getSavedSchedule(): ReadonlySet<string> {
  if (value === null) value = parse(readRaw());
  return value;
}

export function getSavedScheduleServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

export function toggleSavedEvent(id: string) {
  const next = new Set(getSavedSchedule());
  if (next.has(id)) next.delete(id);
  else next.add(id);

  value = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // Persisting is best effort; the in-memory value still drives the UI.
  }

  emit();
}
