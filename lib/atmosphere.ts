/**
 * lib/atmosphere.ts
 * The "Atmosfer" preference (rain video + bokeh on the Home hero), stored in localStorage.
 * Small external store so the Lainnya sheet switch and the hero stay in sync.
 */
import { useSyncExternalStore } from "react";

const KEY = "rn_rain_enabled";
const EVENT = "rn_rain_toggle";

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): boolean {
  return localStorage.getItem(KEY) !== "false";
}

export function setAtmosphereEnabled(enabled: boolean): void {
  localStorage.setItem(KEY, String(enabled));
  window.dispatchEvent(new Event(EVENT));
}

/** true = Nyala (default), false = Mati. */
export function useAtmosphereEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

function subscribeReducedMotion(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/** true when the user asked the OS for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}
