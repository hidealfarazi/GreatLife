/**
 * components/NextTaskBlock.tsx
 * "Berikutnya": the single most urgent unfinished task, big title, and a live countdown
 * in mono hh:mm (refreshes with the shared clock, at least once a minute).
 * Amber < 4 hours, rose < 1 hour or overdue.
 */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { listAssignments } from "@/lib/repo";
import { useRepo } from "@/lib/useRepo";
import { subjectColor } from "@/lib/subjectColors";
import { formatTime } from "@/lib/mock";
import { useNow } from "@/lib/useNow";
import type { Assignment } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");

export function NextTaskBlock() {
  const stored = useRepo(() => listAssignments());
  const items = useMemo<Assignment[]>(
    () => (stored ?? []).filter((a) => !a.archivedAt && a.status !== "done"),
    [stored]
  );
  const nowMs = useNow();

  const mostUrgent = useMemo(
    () => [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0] ?? null,
    [items]
  );

  if (!mostUrgent || nowMs === null) return null;

  const diffMs = new Date(mostUrgent.dueAt).getTime() - nowMs;
  const isOverdue = diffMs < 0;
  const totalMins = Math.floor(Math.abs(diffMs) / 60000);
  const hh = Math.floor(totalMins / 60);
  const mm = totalMins % 60;
  const countdown = `${isOverdue ? "−" : ""}${pad(hh)}:${pad(mm)}`;
  const color = isOverdue || totalMins < 60 ? "var(--rn-alert)" : totalMins < 240 ? "var(--rn-amber)" : "var(--rn-text)";
  const spoken = isOverdue
    ? `Terlambat ${hh} jam ${mm} menit`
    : `Sisa waktu ${hh} jam ${mm} menit`;

  return (
    <section
      aria-labelledby="next-task-label"
      style={{
        padding: "1.5rem 0",
        borderTop: "1px solid var(--rn-line)",
        borderBottom: "1px solid var(--rn-line)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
        <h2 id="next-task-label" className="rn-label" style={{ fontWeight: 700, letterSpacing: "0.15em" }}>
          Berikutnya
        </h2>
        <span className="rn-label" style={{ color: "var(--rn-muted)" }}>
          {isOverdue ? "Lewat" : "Tersisa"}
        </span>
      </div>

      <Link
        href={`/pr/${mostUrgent.id}`}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", color: "inherit", minHeight: 44 }}
      >
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              aria-hidden="true"
              style={{ display: "inline-block", width: 2, height: "0.75rem", backgroundColor: subjectColor(mostUrgent.subject), flexShrink: 0 }}
            />
            <span className="rn-label" style={{ letterSpacing: "0.1em" }}>
              {mostUrgent.subject} · {formatTime(new Date(mostUrgent.dueAt))}
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "clamp(1.5rem, 6vw, 2rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
              color: "var(--rn-text)",
            }}
          >
            {mostUrgent.title}
          </p>
        </div>
        <span className="rn-visually-hidden">{spoken}</span>
        <span
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "clamp(1.5rem, 6vw, 2rem)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            color,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {countdown}
        </span>
      </Link>
    </section>
  );
}
