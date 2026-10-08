/**
 * components/AssignmentList.tsx
 * Client list: SwipeRow rows + archive + delete with 5s undo.
 */
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  listAssignments,
  archiveAssignment,
  deleteAssignment,
  listChecklist,
} from "@/lib/repo";
import { formatTime, minutesUntil } from "@/lib/mock";
import type { Assignment } from "@/lib/types";
import { CometDial } from "@/components/CometDial";
import { SwipeRow } from "@/components/SwipeRow";

function progressOf(item: Assignment): number {
  // listChecklist reads client-side in-memory repo
  const steps = listChecklist("assignment", item.id).filter((c) => c.kind === "step");
  if (steps.length === 0) return item.progress;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}

export function AssignmentList() {
  const [items, setItems] = useState<Assignment[]>(() =>
    listAssignments().filter((a) => !a.archivedAt)
  );
  const [pending, setPending] = useState<Assignment | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = () => {
    setItems(listAssignments().filter((a) => !a.archivedAt));
  };

  const commitPending = () => {
    if (pending) {
      deleteAssignment(pending.id);
      setPending(null);
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleArchive = (id: string) => {
    // if this id was pending delete, cancel it first
    if (pending?.id === id) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setPending(null);
    }
    archiveAssignment(id);
    refresh();
  };

  const handleDeleteRequest = (item: Assignment) => {
    // commit any previous pending delete immediately
    if (pending && pending.id !== item.id) {
      deleteAssignment(pending.id);
    }
    if (timerRef.current) clearTimeout(timerRef.current);

    // hide optimistically; actual delete after 5s
    setItems((prev) => prev.filter((a) => a.id !== item.id));
    setPending(item);
    timerRef.current = setTimeout(() => {
      deleteAssignment(item.id);
      setPending(null);
      timerRef.current = null;
      refresh();
    }, 5000);
  };

  const handleUndo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setPending(null);
    refresh();
  };

  return (
    <div>
      <div role="list">
        {items.length === 0 && !pending ? (
          <p style={{ color: "var(--rn-muted)", fontStyle: "italic" }}>
            Belum ada tugas aktif.
          </p>
        ) : (
          items.map((item) => {
            const mins = minutesUntil(item.dueAt);
            const urgent = mins >= 0 && mins < 60;
            const progress = progressOf(item);
            return (
              <div key={item.id} role="listitem">
                <SwipeRow
                  ariaLabel={`Tugas ${item.title}`}
                  onArchive={() => handleArchive(item.id)}
                  onDelete={() => handleDeleteRequest(item)}
                >
                  <Link
                    href={`/pr/${item.id}`}
                    style={{
                      display: "block",
                      padding: "1.25rem 0.5rem 1.25rem 0",
                      borderBottom: "1px solid rgba(168, 159, 140, 0.2)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: "0.4rem",
                            gap: "0.75rem",
                          }}
                        >
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
                              flexShrink: 0,
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
                      </div>
                      <div style={{ flexShrink: 0, marginTop: "0.2rem" }}>
                        <CometDial value={progress} size={44} />
                      </div>
                    </div>
                  </Link>
                </SwipeRow>
              </div>
            );
          })
        )}
      </div>

      {/* Undo toast */}
      {pending && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: "1rem",
            right: "1rem",
            bottom: "4.5rem",
            maxWidth: "34rem",
            margin: "0 auto",
            background: "var(--rn-text)",
            color: "#12100E",
            padding: "0.875rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            zIndex: 50,
          }}
        >
          <span style={{ fontSize: "0.875rem" }}>Tugas dihapus.</span>
          <button
            onClick={handleUndo}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "underline",
              minHeight: 44,
              padding: "0 0.5rem",
              color: "#12100E",
            }}
          >
            Urungkan
          </button>
        </div>
      )}
    </div>
  );
}
