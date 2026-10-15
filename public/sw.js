/*
 * public/sw.js — hand-written service worker for "Belajar" (no libraries).
 * Registered only in production builds (components/AppRuntime.tsx) as /sw.js?v=<build>.
 *
 * - Versioned caches: "belajar-shell-<v>" (app shell) and "belajar-runtime-<v>".
 *   A new build = a new version; old caches are deleted on activate.
 * - App shell is cached on install (main pages + their JS/CSS) so the app opens offline.
 * - Pages: network first, cached copy when offline. Hashed /_next/static files: cache first.
 * - /api/* is NEVER cached (AI answers must always be fresh, and may be private).
 * - Video files are not cached (big, and served with range requests).
 * - Deadline reminders: notificationclick opens /pr/<id>.
 */

const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const PREFIX = "belajar-";
const SHELL_CACHE = `${PREFIX}shell-${VERSION}`;
const RUNTIME_CACHE = `${PREFIX}runtime-${VERSION}`;

const SHELL_PAGES = ["/", "/pr", "/pr/new", "/belajar", "/arsip", "/more"];
const SHELL_FILES = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
];

const STATIC_ASSET_RE = /\/_next\/static\/[^"'\s)\\]+/g;

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isVideo(url) {
  return /\.(mp4|webm|mov)$/i.test(url.pathname);
}

/** RSC payload requests made by the Next.js router during client-side navigation. */
function isRscRequest(request, url) {
  return request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

/** Fetches a page, stores it, and also stores every /_next/static file it references. */
async function cachePageWithAssets(cache, path) {
  const res = await fetch(path, { cache: "reload", credentials: "same-origin" });
  if (!res.ok || res.redirected) return;
  const html = await res.clone().text();
  await cache.put(path, res);
  const assets = Array.from(new Set(html.match(STATIC_ASSET_RE) || []));
  await Promise.all(
    assets.map(async (asset) => {
      if (await cache.match(asset)) return;
      try {
        const r = await fetch(asset, { credentials: "same-origin" });
        if (r.ok) await cache.put(asset, r);
      } catch {
        /* one missing chunk must not break the install */
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        SHELL_FILES.map((f) =>
          cache.add(new Request(f, { cache: "reload" })).catch(() => undefined)
        )
      );
      for (const page of SHELL_PAGES) {
        try {
          await cachePageWithAssets(cache, page);
        } catch {
          /* offline during install: the page is cached later on first visit */
        }
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith(PREFIX) && !keep.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

/** Pages: try the network, keep a copy; offline -> same page from cache -> Home. */
async function handleNavigation(request, url) {
  const key = url.pathname;
  try {
    const res = await fetch(request);
    if (res.ok && !res.redirected) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(key, res.clone());
    }
    return res;
  } catch {
    const cached = (await caches.match(key)) || (await caches.match("/"));
    if (cached) return cached;
    return new Response(
      "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'>" +
        "<body style='background:#0B0D10;color:#F2F2EE;font-family:system-ui;padding:2rem'>" +
        "<p>Kamu sedang offline. Buka aplikasi sekali saat online agar bisa dipakai offline.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/** Hashed build files never change: cache first. */
async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, res.clone());
  }
  return res;
}

/** Other same-origin files (icons, poster, manifest): cached copy now, refresh in background. */
async function handleOther(event, request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok && res.type === "basic") cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  const res = await network;
  return res || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never touch the AI routes or video: the browser handles them normally, no cache.
  if (isApi(url) || isVideo(url) || request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request, url));
    return;
  }
  // Router payloads: network only. When offline the fetch fails and Next.js falls back to
  // a full page load, which handleNavigation serves from the cache.
  if (isRscRequest(request, url)) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(handleStatic(request));
    return;
  }
  event.respondWith(handleOther(event, request));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  // The app sends the detail pages of saved tasks/materials so they also open offline.
  if (data.type === "CACHE_PAGES" && Array.isArray(data.paths)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        for (const path of data.paths.slice(0, 60)) {
          if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("/api/")) continue;
          if (await caches.match(path)) continue;
          try {
            await cachePageWithAssets(cache, path);
          } catch {
            /* offline: try again next time */
          }
        }
      })()
    );
  }
});

// ---------- deadline reminders ----------

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const path = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
              return;
            } catch {
              /* uncontrolled client: open a new window below */
            }
          } else {
            return;
          }
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
