/**
 * components/AssignmentDetailClient.tsx
 * Client wrapper for assignment detail page to manage dynamic checklist state.
 */
"use client";

import { useState } from "react";
import { BackArrow, PageLabel } from "@/components/PageHead";
import {
  getAssignment,
  listChecklist,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
} from "@/lib/repo";
import { formatTime, formatDate } from "@/lib/mock";
import { subjectColor } from "@/lib/subjectColors";
import { CometDial } from "@/components/CometDial";
import { Checklist } from "@/components/Checklist";

export function AssignmentDetailClient({ id }: { id: string }) {
  const assignment = getAssignment(id);
  const [items, setItems] = useState(() => listChecklist("assignment", id));

  if (!assignment) {
    return (
      <div className="rn-page">
        <header style={{ display: "flex", alignItems: "center", gap: "0.25rem", minHeight: 44 }}>
          <BackArrow href="/pr" label="Kembali ke daftar PR" />
          <PageLabel counter="02 / 04" section="PR" />
        </header>
        <p style={{ color: "var(--rn-muted)" }}>Tugas tidak ditemukan.</p>
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

  const statusLabel =
    assignment.status === "done" ? "Selesai" : assignment.status === "doing" ? "Dikerjakan" : "Belum mulai";

  return (
    <div className="rn-page" style={{ gap: 0 }}>
      <header style={{ display: "flex", alignItems: "center", gap: "0.25rem", minHeight: 44, marginBottom: "1.25rem" }}>
        <BackArrow href="/pr" label="Kembali ke daftar PR" />
        <PageLabel counter="02 / 04" section="PR" />
      </header>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "2px",
            height: "0.75rem",
            backgroundColor: subjectColor(assignment.subject),
            flexShrink: 0,
          }}
        />
        <span className="rn-label" style={{ color: "var(--rn-accent)", letterSpacing: "0.1em" }}>
          {assignment.subject}
        </span>
      </div>

      <h1 style={{ fontSize: "clamp(1.75rem, 8vw, 2.75rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {assignment.title}
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          margin: "1.75rem 0",
        }}
      >
        <CometDial value={progress} size={120} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span className="rn-label" style={{ color: "var(--rn-text)", letterSpacing: "0.08em" }}>
            {formatTime(assignment.dueAt)} · {formatDate(assignment.dueAt)}
          </span>
          <span className="rn-label" style={{ letterSpacing: "0.08em" }}>
            {statusLabel} · {steps.filter((x) => x.done).length}/{steps.length} langkah
          </span>
        </div>
      </div>

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


    </div>
  );
}
