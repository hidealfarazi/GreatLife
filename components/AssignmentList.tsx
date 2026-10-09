/**
 * components/AssignmentList.tsx
 * Client list: Grouped by Terlambat, Hari Ini, Besok, Minggu Ini.
 * Sorted by dueAt ascending. Overdue has distinct alert badge.
 * Most urgent item has larger focal title.
 * Real date logic: tasks whose time has passed today move to "Terlambat".
 */
"use client";

import { useRef, useState, useMemo } from "react";
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
  const steps = listChecklist("assignment", item.id).filter((c) => c.kind === "step");
  if (steps.length === 0) return item.progress;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}

interface GroupedAssignments {
  label: string;
  badge?: string;
  isOverdue?: boolean;
  items: Assignment[];
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

  const handleArchive = (id: string) => {
    if (pending?.id === id) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setPending(null);
    }
    archiveAssignment(id);
    refresh();
  };

  const handleDeleteRequest = (item: Assignment) => {
    if (pending && pending.id !== item.id) {
      deleteAssignment(pending.id);
    }
    if (timerRef.current) clearTimeout(timerRef.current);

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

  // Group items by: Terlambat, Hari Ini, Besok, Minggu Ini
  const groups = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTomorrow = startOfToday + 86400000;
    const startOfDayAfterTomorrow = startOfTomorrow + 86400000;
    const endOfWeek = startOfToday + 7 * 86400000;

    const overdue: Assignment[] = [];
    const today: Assignment[] = [];
    const tomorrow: Assignment[] = [];
    const thisWeek: Assignment[] = [];

    // Sort by dueAt ascending
    const sorted = [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

    for (const item of sorted) {
      const due = new Date(item.dueAt).getTime();
      if (due < now.getTime()) {
        overdue.push(item);
      } else if (due < startOfTomorrow) {
        today.push(item);
      } else if (due < startOfDayAfterTomorrow) {
        tomorrow.push(item);
      } else if (due < endOfWeek) {
        thisWeek.push(item);
      } else {
        thisWeek.push(item);
      }
    }

    const res: GroupedAssignments[] = [];
    if (overdue.length > 0) {
      res.push({ label: "Terlambat", badge: "LEWAT TENGGAT", isOverdue: true, items: overdue });
    }
    if (today.length > 0) {
      res.push({ label: "Hari ini", items: today });
    }
    if (tomorrow.length > 0) {
      res.push({ label: "Besok", items: tomorrow });
    }
    if (thisWeek.length > 0) {
      res.push({ label: "Minggu ini", items: thisWeek });
    }

    return res;
  }, [items]);

  // The very first active task is the most urgent focal point
  const mostUrgentId = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    return sorted[0]?.id;
  }, [items]);

  let globalIndex = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {items.length === 0 && !pending ? (
        <p style={{ color: "var(--rn-muted)", fontStyle: "italic" }}>
          Belum ada tugas aktif.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.label} aria-labelledby={`group-${group.label}`}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(143, 163, 191, 0.15)",
                marginBottom: "0.5rem",
              }}
            >
              <h2
                id={`group-${group.label}`}
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: group.isOverdue ? "var(--rn-alert)" : "var(--rn-muted)",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {group.label}
              </h2>
              {group.badge && (
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.625rem",
                    padding: "0.15rem 0.4rem",
                    background: "rgba(217, 119, 107, 0.15)",
                    color: "var(--rn-alert)",
                    border: "1px solid var(--rn-alert)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 800,
                  }}
                >
                  {group.badge}
                </span>
              )}
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.6875rem",
                  color: "var(--rn-muted)",
                  marginLeft: "auto",
                }}
              >
                {group.items.length}
              </span>
            </div>

            <div role="list">
              {group.items.map((item) => {
                const currentIndex = globalIndex++;
                const mins = minutesUntil(new Date(item.dueAt));
                const isOverdue = mins < 0;
                const isAlert = !isOverdue && mins < 60;
                const isAmber = !isOverdue && mins >= 60 && mins < 240;
                const statusColor = isOverdue
                  ? "var(--rn-alert)"
                  : isAlert
                  ? "var(--rn-alert)"
                  : isAmber
                  ? "var(--rn-amber)"
                  : "var(--rn-accent)";
                const progress = progressOf(item);
                const isFocal = item.id === mostUrgentId;

                return (
                  <div key={item.id} role="listitem">
                    <SwipeRow
                      ariaLabel={`Tugas ${item.title}`}
                      isFirst={currentIndex === 0}
                      onArchive={() => handleArchive(item.id)}
                      onDelete={() => handleDeleteRequest(item)}
                    >
                      <Link
                        href={`/pr/${item.id}`}
                        style={{
                          display: "block",
                          padding: isFocal ? "1.5rem 0" : "1.25rem 0",
                          borderBottom: "1px solid rgba(168, 159, 140, 0.2)",
                          textDecoration: "none",
                          color: "inherit",
                          maxWidth: "100%",
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
                                  color: statusColor,
                                  textTransform: "uppercase",
                                  fontWeight: isOverdue ? 800 : 500,
                                }}
                              >
                                {item.subject} {isOverdue ? "· TERLAMBAT" : ""}
                              </span>
                              <span
                                style={{
                                  fontFamily: "var(--font-mono, monospace)",
                                  fontSize: "0.6875rem",
                                  color: statusColor,
                                  letterSpacing: "0.05em",
                                  flexShrink: 0,
                                  fontWeight: isOverdue ? 700 : 400,
                                }}
                              >
                                {formatTime(new Date(item.dueAt))}
                              </span>
                            </div>
                            <p
                              style={{
                                fontFamily: "var(--font-display, var(--font-body, sans-serif))",
                                fontSize: isFocal ? "1.375rem" : "1.125rem",
                                fontWeight: isFocal ? 800 : 700,
                                lineHeight: 1.25,
                                color: "var(--rn-text)",
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {item.title}
                            </p>
                          </div>
                          <div style={{ flexShrink: 0, marginTop: "0.2rem" }}>
                            <CometDial value={progress} size={isFocal ? 52 : 44} />
                          </div>
                        </div>
                      </Link>
                    </SwipeRow>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* Undo toast */}
      {pending && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: "1rem",
            right: "1rem",
            bottom: "5.5rem",
            maxWidth: "34rem",
            margin: "0 auto",
            background: "var(--rn-text)",
            color: "#0B0D10",
            padding: "0.875rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            zIndex: 150,
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Tugas dihapus.</span>
          <button
            onClick={handleUndo}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "underline",
              minHeight: 44,
              padding: "0 0.5rem",
              color: "#0B0D10",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Urungkan
          </button>
        </div>
      )}
    </div>
  );
}
