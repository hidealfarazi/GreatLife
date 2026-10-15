/**
 * lib/useNow.ts
 * Shared "current time" hook for date-dependent UI (groups, countdowns, greeting).
 * Returns null during server render / hydration so prerendered HTML never shows a
 * stale build-time clock, then the real local time, refreshed every 30 seconds.
 */
import { useSyncExternalStore } from "react";

let current = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, 30000);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  if (!current) current = Date.now();
  return current;
}

function getServerSnapshot(): number {
  return 0;
}

/** Current time in ms, or null before the component has mounted on the client. */
export function useNow(): number | null {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return value || null;
}
