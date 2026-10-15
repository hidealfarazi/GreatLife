/**
 * lib/atmosphere.ts
 * The "Atmosfer" preference (rain video + bokeh on the Home hero), saved in the device
 * settings through lib/repo.ts, so the Lainnya sheet switch and the hero stay in sync.
 */
import { useSyncExternalStore } from "react";
import { getSettings, updateSettings } from "./repo";
import { useRepo } from "./useRepo";

export function setAtmosphereEnabled(enabled: boolean): void {
  updateSettings({ atmosphere: enabled });
}

/**
 * true = Nyala (default), false = Mati. While the saved settings are still loading this
 * returns false, so a "Mati" choice never flashes the video for a moment.
 */
export function useAtmosphereEnabled(): boolean {
  return useRepo(() => getSettings().atmosphere) ?? false;
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
