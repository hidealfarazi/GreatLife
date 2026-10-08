/**
 * components/RainBackground.tsx
 * Subtle atmospheric rain video backdrop.
 * Fixed, pointer-events none, respects prefers-reduced-motion.
 */
"use client";

import { useEffect, useState } from "react";

export function RainBackground() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (reduce) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        opacity: 0.28, // subtle atmospheric overlay
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        src="/hujan-loop.mp4"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.7) contrast(1.1)",
        }}
      />
    </div>
  );
}
