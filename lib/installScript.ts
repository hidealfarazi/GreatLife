/**
 * lib/installScript.ts
 * Server-safe constants for the install prompt (imported by app/layout.tsx).
 * The inline script runs before React loads: it keeps the beforeinstallprompt event on
 * `window` for the "Pasang aplikasi" button (lib/pwa.ts) and hides Chrome's mini-bar.
 */

/** Event fired when the install state changes. */
export const INSTALL_EVENT = "belajar:installstate";

export const INSTALL_CAPTURE_SCRIPT = `(function(){var E=${JSON.stringify(INSTALL_EVENT)};window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__belajarInstallPrompt=e;window.dispatchEvent(new Event(E));});window.addEventListener("appinstalled",function(){window.__belajarInstallPrompt=null;window.__belajarInstalled=true;window.dispatchEvent(new Event(E));});})();`;
