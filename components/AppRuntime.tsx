/**
 * components/AppRuntime.tsx
 * Invisible client helper mounted once in app/layout.tsx:
 * - loads the device database early (lib/repo.ts),
 * - registers the service worker (production builds only),
 * - asks the worker to keep saved task / material pages for offline use,
 */
"use client";

import { useEffect } from "react";
import { ensureRepoReady, listAssignments, listMaterials } from "@/lib/repo";
import { cachePagesForOffline, registerServiceWorker } from "@/lib/pwa";

export function AppRuntime() {
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [reg] = await Promise.all([registerServiceWorker(), ensureRepoReady()]);
      if (!alive) return;
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
    };
  }, []);

  return null;
}
