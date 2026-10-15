import type { NextConfig } from "next";

// A new value on every build: the service worker is registered as /sw.js?v=<this>, so each
// deploy installs a fresh worker with its own versioned caches (old ones are cleaned up).
const BUILD_STAMP = Date.now().toString(36);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BUILD_STAMP: BUILD_STAMP,
  },
  async headers() {
    return [
      {
        // The worker script itself must never be served from the HTTP cache.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
