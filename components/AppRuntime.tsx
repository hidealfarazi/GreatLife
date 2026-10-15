/**
 * components/AppRuntime.tsx
 * Invisible client helper mounted once in app/layout.tsx:
 * - loads the device database early (lib/repo.ts),
 * - registers the service worker (production builds only),
 * - asks the worker to keep saved task / material pages for offline use,
 * - runs the deadline reminder checks while the app is open (lib/reminders.ts),
 * - in the installed app, asks the browser to keep the data (persistent storage).
 */
"use client";

import { useEffect } from "react";
import { ensureRepoReady, listAssignments, listMaterials } from "@/lib/repo";
import { cachePagesForOffline, isStandalone, registerServiceWorker } from "@/lib/pwa";
import { startReminderLoop } from "@/lib/reminders";

export function AppRuntime() {
  useEffect(() => {
    let alive = true;
    let stopReminders: (() => void) | null = null;
    void (async () => {
      const [reg] = await Promise.all([registerServiceWorker(), ensureRepoReady()]);
      if (!alive) return;
      stopReminders = startReminderLoop();
      // Installed app: ask the browser not to evict the database under storage pressure.
      if (isStandalone() && navigator.storage?.persist) void navigator.storage.persist().catch(() => false);
      if (reg) {
        await navigator.serviceWorker.ready;
        const paths = [
          ...listAssignments({ includeArchived: true }).map((a) => `/pr/${encodeURIComponent(a.id)}`),
          ...listMaterials().map((m) => `/belajar/sesi/${encodeURIComponent(m.id)}`),
          "/belajar/sesi/rekomendasi",
        ];
        if (alive) void cachePagesForOffline(paths);
      }
    })();
    return () => {
      alive = false;
      stopReminders?.();
    };
  }, []);

  return null;
}
