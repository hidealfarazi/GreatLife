/**
 * app/pr/page.tsx — Daftar PR
 * Shows CometDial 44px on right, links to detail pages.
 */

import Link from "next/link";
import { listAssignments, listChecklist } from "@/lib/repo";
import { formatTime, minutesUntil } from "@/lib/mock";
import { Assignment } from "@/lib/types";
import { CometDial } from "@/components/CometDial";

function AssignmentRow({ item }: { item: Assignment }) {
  const mins = minutesUntil(item.dueAt);
  const urgent = mins >= 0 && mins < 60;
  const steps = listChecklist("assignment", item.id).filter((c) => c.kind === "step");
  const progress = steps.length > 0 ? Math.round((steps.filter((s) => s.done).length / steps.length) * 100) : item.progress;

  return (
    <Link
      href={`/pr/${item.id}`}
      style={{
        display: "block",
        padding: "1.25rem 0",
        borderBottom: "1px solid rgba(168, 159, 140, 0.2)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.6875rem",
                letterSpacing: "0.1em",
                color: urgent ? "var(--rn-seal)" : "var(--rn-gold)",
                textTransform: "uppercase",
              }}
            >
              {item.subject}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.6875rem",
                color: urgent ? "var(--rn-seal)" : "var(--rn-muted)",
                letterSpacing: "0.05em",
              }}
            >
              {formatTime(item.dueAt)}
            </span>
          </div>
          <p
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              lineHeight: 1.25,
              color: "var(--rn-text)",
              letterSpacing: "-0.01em",
            }}
          >
            {item.title}
          </p>
          <p
            style={{
              marginTop: "0.5rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.65rem",
              color: "var(--rn-muted)",
            }}
          >
            {item.status} · Prioritas {item.priority}
          </p>
        </div>
        <div style={{ flexShrink: 0, marginTop: "0.2rem" }}>
          <CometDial value={progress} size={44} />
        </div>
      </div>
    </Link>
  );
}

export default function PrPage() {
  const all = listAssignments().filter((a) => !a.archivedAt);

  return (
    <div style={{ background: "var(--rn-bg)", color: "var(--rn-text)", minHeight: "100dvh", padding: "2rem 1.5rem 6rem", maxWidth: "36rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>PR</h1>
      <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "var(--rn-muted)", marginBottom: "2rem" }}>Daftar tugas aktif ({all.length})</p>
      <div role="list">
        {all.length === 0 ? (
          <p style={{ color: "var(--rn-muted)", fontStyle: "italic" }}>Belum ada tugas.</p>
        ) : (
          all.map((item) => <AssignmentRow key={item.id} item={item} />)
        )}
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="/" style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "var(--rn-gold)", textDecoration: "underline" }}>
          ← Kembali ke Hari Ini
        </Link>
      </div>
    </div>
  );
}
