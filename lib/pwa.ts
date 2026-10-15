/**
 * lib/pwa.ts
 * Installable-app helpers: service worker registration (production only) and the
 * "Pasang aplikasi" state. The beforeinstallprompt event is captured by a tiny inline
 * script in app/layout.tsx (it can fire before React has loaded) and kept on `window`.
 */
import { useSyncExternalStore } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __belajarInstallPrompt?: BeforeInstallPromptEvent | null;
    __belajarInstalled?: boolean;
  }
  interface Navigator {
    /** iOS Safari: true when opened from the Home Screen. */
    standalone?: boolean;
  }
}

/** Event fired (by the inline script and by this module) when the install state changes. */
export const INSTALL_EVENT = "belajar:installstate";

/** Inline script for <head>: keeps the install prompt for later and hides Chrome's mini-bar. */
export const INSTALL_CAPTURE_SCRIPT = `(function(){var E=${JSON.stringify(INSTALL_EVENT)};window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__belajarInstallPrompt=e;window.dispatchEvent(new Event(E));});window.addEventListener("appinstalled",function(){window.__belajarInstallPrompt=null;window.__belajarInstalled=true;window.dispatchEvent(new Event(E));});})();`;

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/**
 * - "installed": running as the installed app (or just installed) -> hide the control
 * - "prompt":    the browser offers an install prompt (Chrome/Edge/Android)
 * - "ios":       iPhone/iPad Safari -> show "Bagikan → Tambahkan ke Layar Utama"
 * - "manual":    no prompt available (yet) -> point to the browser menu
 */
export type InstallState = "installed" | "prompt" | "ios" | "manual";

function getInstallState(): InstallState {
  if (window.__belajarInstalled || isStandalone()) return "installed";
  if (window.__belajarInstallPrompt) return "prompt";
  if (isIos()) return "ios";
  return "manual";
}

function subscribeInstall(callback: () => void): () => void {
  const mq = window.matchMedia("(display-mode: standalone)");
  window.addEventListener(INSTALL_EVENT, callback);
  mq.addEventListener("change", callback);
  return () => {
    window.removeEventListener(INSTALL_EVENT, callback);
    mq.removeEventListener("change", callback);
  };
}

/** null during the server render / hydration. */
export function useInstallState(): InstallState | null {
  return useSyncExternalStore<InstallState | null>(subscribeInstall, getInstallState, () => null);
}

/** Shows the browser's install dialog. Returns true when the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = window.__belajarInstallPrompt;
  if (!event) return false;
  window.__belajarInstallPrompt = null; // a prompt event can only be used once
  await event.prompt();
  const choice = await event.userChoice;
  if (choice.outcome === "accepted") window.__belajarInstalled = true;
  window.dispatchEvent(new Event(INSTALL_EVENT));
  return choice.outcome === "accepted";
}

// ==========================================
// Service worker
// ==========================================

export function serviceWorkerSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

/** Registers public/sw.js in production builds only (dev reloads would fight the cache). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (process.env.NODE_ENV !== "production" || !serviceWorkerSupported()) return null;
  try {
    const version = process.env.NEXT_PUBLIC_BUILD_STAMP ?? "0";
    return await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(version)}`, { scope: "/" });
  } catch {
    return null;
  }
}

/** Asks the service worker to keep these pages for offline use (e.g. /pr/<id>). */
export async function cachePagesForOffline(paths: string[]): Promise<void> {
  if (!serviceWorkerSupported() || paths.length === 0) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const worker = reg?.active;
  if (worker) worker.postMessage({ type: "CACHE_PAGES", paths });
}
