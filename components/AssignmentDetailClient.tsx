/**
 * components/AssignmentDetailClient.tsx
 * Client wrapper for assignment detail page to manage dynamic checklist state.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getAssignment,
  listChecklist,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
} from "@/lib/repo";
import { formatTime, formatDate } from "@/lib/mock";
import { CometDial } from "@/components/CometDial";
import { Checklist } from "@/components/Checklist";

export function AssignmentDetailClient({ id }: { id: string }) {
  const assignment = getAssignment(id);
  const [items, setItems] = useState(() => listChecklist("assignment", id));

  if (!assignment) {
    return (
      <div style={{ padding: "2rem", color: "var(--rn-text)" }}>
        <p>Tugas tidak ditemukan.</p>
        <Link href="/pr" style={{ color: "var(--rn-accent)" }}>
          ← Kembali ke PR
        </Link>
      </div>
    );
  }

  const refresh = () => {
    setItems(listChecklist("assignment", id));
  };

  const handleToggle = (itemId: string) => {
    toggleChecklistItem(itemId);
    refresh();
  };

  const handleAdd = (kind: "step" | "bring", title: string) => {
    addChecklistItem("assignment", id, kind, title);
    refresh();
  };

  const handleDelete = (itemId: string) => {
    deleteChecklistItem(itemId);
    refresh();
  };

  const steps = items.filter((c) => c.kind === "step");
  const brings = items.filter((c) => c.kind === "bring");
  const progress =
    steps.length > 0
      ? Math.round((steps.filter((s) => s.done).length / steps.length) * 100)
      : assignment.progress;

  const bringsDone = brings.filter((b) => b.done).length;

  return (
    <div
      style={{
        background: "transparent",
        color: "var(--rn-text)",
        minHeight: "100dvh",
        padding: "2rem 1.5rem 6rem",
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "var(--rn-accent)",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            {assignment.subject}
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem, 8vw, 2.75rem)", fontWeight: 800, lineHeight: 1.1 }}>
            {assignment.title}
          </h1>
        </div>
        <div style={{ flexShrink: 0 }}>
          <CometDial value={progress} size={160} />
        </div>
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.75rem",
          color: "var(--rn-muted)",
          marginBottom: "1rem",
        }}
      >
        {formatTime(assignment.dueAt)} · {formatDate(assignment.dueAt)} · {assignment.status}
      </p>

      {assignment.description && (
        <p style={{ lineHeight: 1.6, color: "var(--rn-muted)", marginBottom: "2rem" }}>
          {assignment.description}
        </p>
      )}

      {/* Langkah (kind step) */}
      <Checklist
        title="Langkah"
        kind="step"
        items={steps}
        onToggle={handleToggle}
        onAdd={(title) => handleAdd("step", title)}
        onDelete={handleDelete}
      />

      {/* Perlu disiapkan (kind bring) */}
      <Checklist
        title="Perlu disiapkan"
        kind="bring"
        items={brings}
        onToggle={handleToggle}
        onAdd={(title) => handleAdd("bring", title)}
        onDelete={handleDelete}
        summaryText={`${bringsDone}/${brings.length} siap`}
      />

      <div>
        <Link
          href="/pr"
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.75rem",
            color: "var(--rn-accent)",
            textDecoration: "underline",
          }}
        >
          ← Kembali ke PR
        </Link>
      </div>
    </div>
  );
}
