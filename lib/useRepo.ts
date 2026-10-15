/**
 * lib/useRepo.ts
 * React hooks over lib/repo.ts. The repo loads from IndexedDB on the client only, so
 * these hooks return null during the server render and the first (hydration) render,
 * then the real data. Components show a quiet placeholder while the value is null.
 */
import { useSyncExternalStore } from "react";
import { getRepoVersion, subscribeRepo } from "./repo";

const serverVersion = () => 0;

/** 0 while loading, then a number that changes on every data change. */
export function useRepoVersion(): number {
  return useSyncExternalStore(subscribeRepo, getRepoVersion, serverVersion);
}

/**
 * Reads data from the repo and re-renders when it changes.
 * `read` runs on every render after loading, so keep it cheap (plain filters are fine).
 */
export function useRepo<T>(read: () => T): T | null {
  const version = useRepoVersion();
  return version === 0 ? null : read();
}
