/**
 * app/pr/[id]/page.tsx — Detail PR with large CometDial (160px).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssignment, listChecklist } from "@/lib/repo";
import { formatTime, formatDate } from "@/lib/mock";
import { CometDial } from "@/components/CometDial";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrDetailPage({ params }: PageProps) {
  const { id } = await params;
  const assignment = getAssignment(id);
  if (!assignment) {
    return notFound();
  }

  const steps = listChecklist("assignment", assignment.id).filter((c) => c.kind === "step");
  const brings = listChecklist("assignment", assignment.id).filter((c) => c.kind === "bring");
  const progress = steps.length > 0 ? Math.round((steps.filter((s) => s.done).length / steps.length) * 100) : assignment.progress;

  return (
    <div style={{ background: "var(--rn-bg)", color: "var(--rn-text)", minHeight: "100dvh", padding: "2rem 1.5rem 6rem", maxWidth: "36rem", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--rn-gold)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            {assignment.subject}
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem, 8vw, 2.75rem)", fontWeight: 800, lineHeight: 1.1 }}>{assignment.title}</h1>
        </div>
        <div style={{ flexShrink: 0 }}>
          <CometDial value={progress} size={160} />
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "var(--rn-muted)", marginBottom: "1rem" }}>
        {formatTime(assignment.dueAt)} · {formatDate(assignment.dueAt)} · {assignment.status}
      </p>
      {assignment.description && <p style={{ lineHeight: 1.6, color: "var(--rn-muted)", marginBottom: "2rem" }}>{assignment.description}</p>}

      <h2 style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", letterSpacing: "0.12em", color: "var(--rn-muted)", marginBottom: "1rem" }}>
        LANGKAH ({steps.filter((s) => s.done).length}/{steps.length})
      </h2>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
        {steps.length === 0 ? (
          <li style={{ color: "var(--rn-muted)", fontStyle: "italic" }}>Belum ada langkah.</li>
        ) : (
          steps.map((s) => (
            <li key={s.id} style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
              <span style={{ color: s.done ? "var(--rn-gold)" : "var(--rn-muted)" }}>{s.done ? "[x]" : "[ ]"}</span>
              <span style={{ textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}>{s.title}</span>
            </li>
          ))
        )}
      </ul>

      <h2 style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", letterSpacing: "0.12em", color: "var(--rn-muted)", marginBottom: "1rem" }}>
        PERLU DISIAPKAN ({brings.filter((b) => b.done).length}/{brings.length} siap)
      </h2>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
        {brings.length === 0 ? (
          <li style={{ color: "var(--rn-muted)", fontStyle: "italic" }}>Tidak ada barang.</li>
        ) : (
          brings.map((b) => (
            <li key={b.id} style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
              <span style={{ color: b.done ? "var(--rn-gold)" : "var(--rn-muted)" }}>{b.done ? "[x]" : "[ ]"}</span>
              <span style={{ textDecoration: b.done ? "line-through" : "none", opacity: b.done ? 0.6 : 1 }}>{b.title}</span>
            </li>
          ))
        )}
      </ul>

      <div>
        <Link href="/pr" style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "var(--rn-gold)", textDecoration: "underline" }}>
          ← Kembali ke PR
        </Link>
      </div>
    </div>
  );
}
