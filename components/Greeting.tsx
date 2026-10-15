/**
 * components/Greeting.tsx
 * Small mono greeting label for Home ("SELAMAT PAGI · KAMIS, 15 OKTOBER 2026").
 * Rendered on the client so it always uses the user's real local time.
 */
"use client";

import { getGreeting, formatDate } from "@/lib/mock";
import { useNow } from "@/lib/useNow";

export function Greeting() {
  const now = useNow();
  return (
    <p className="rn-label" style={{ letterSpacing: "0.1em", minHeight: "1em" }} aria-live="off">
      {now ? `${getGreeting(new Date(now))} · ${formatDate(new Date(now))}` : "\u00A0"}
    </p>
  );
}
