/**
 * components/AssignmentList.tsx
 * Client list: Grouped by Terlambat, Hari Ini, Besok, Minggu Ini.
 * Sorted by dueAt ascending. Overdue has distinct alert badge.
 * Most urgent item has larger focal title.
 * Real date logic: tasks whose time has passed today move to "Terlambat".
 */
"use client";

import { useEffect, useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  listAssignments,
  archiveAssignment,
  deleteAssignment,
  listChecklist,
} from "@/lib/repo";
import { formatTime } from "@/lib/mock";
import { subjectColor } from "@/lib/subjectColors";
import type { Assignment } from "@/lib/types";
import { CometDial } from "@/components/CometDial";
import { SwipeRow } from "@/components/SwipeRow";
import { Button } from "@/components/ui/Button";
import { useNow } from "@/lib/useNow";

const HINT_KEY = "rn_swipe_hint_shown";
const subscribeHint = (cb: () => void) => {
  window.addEventListener("rn_swipe_hint", cb);
  return () => window.removeEventListener("rn_swipe_hint", cb);
};

function progressOf(item: Assignment): number {
  const steps = listChecklist("assignment", item.id).filter((c) => c.kind === "step");
  if (steps.length === 0) return item.progress;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}

interface GroupedAssignments {
  label: string;
  isOverdue?: boolean;
  items: Assignment[];
}

export function AssignmentList() {
  const [items, setItems] = useState<Assignment[]>(() =>
    listAssignments().filter((a) => !a.archivedAt)
  );
  const [pending, setPending] = useState<Assignment | null>(null);
  const nowMs = useNow();
  // Swipe hint is shown once: until the first time a row's actions are opened
  // (SwipeRow stores the flag in localStorage and fires "rn_swipe_hint").
  const hintDone = useSyncExternalStore(
    subscribeHint,
    () => localStorage.getItem(HINT_KEY) === "true",
    () => true
  );

  const refresh = () => {
    setItems(listAssignments().filter((a) => !a.archivedAt));
  };

  // Real deletion happens 5 seconds after "Hapus" unless "Urungkan" clears `pending`.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      deleteAssignment(pending.id);
      setPending(null);
      setItems(listAssignments().filter((a) => !a.archivedAt));
    }, 5000);
    return () => clearTimeout(timer);
  }, [pending]);

  const handleArchive = (id: string) => {
    archiveAssignment(id);
    refresh();
  };

  const handleDeleteRequest = (item: Assignment) => {
    // A second delete while one is pending commits the first one right away.
    if (pending && pending.id !== item.id) deleteAssignment(pending.id);
    setItems((prev) => prev.filter((a) => a.id !== item.id));
    setPending(item);
  };

  const handleUndo = () => {
    setPending(null);
    refresh();
  };

  // Group items by: Terlambat, Hari Ini, Besok, Minggu Ini
  const groups = useMemo(() => {
    if (nowMs === null) return [];
    const now = new Date(nowMs);
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
      res.push({ label: "Terlambat", isOverdue: true, items: overdue });
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
  }, [items, nowMs]);

  // The very first active task is the most urgent focal point
  const mostUrgentId = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    return sorted[0]?.id;
  }, [items]);

  let globalIndex = 0;

  if (nowMs === null) {
    // Server render / hydration: wait for the real local clock so no task is mis-grouped.
    return <div aria-busy="true" style={{ minHeight: "12rem" }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {items.length === 0 && !pending ? (
        <p style={{ color: "var(--rn-muted)" }}>Belum ada tugas aktif.</p>
      ) : (
        groups.map((group) => (
          <section key={group.label} aria-labelledby={`group-${group.label}`}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.5rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--rn-line)",
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
                }}
              >
                {group.label}
                <span style={{ fontWeight: 400, marginLeft: "0.5rem" }}>{group.items.length}</span>
              </h2>
            </div>

            {!hintDone && globalIndex === 0 && (
              <p className="rn-label" style={{ letterSpacing: "0.08em", padding: "0.75rem 0 0" }}>
                Geser baris ke kiri untuk Arsip atau Hapus
              </p>
            )}

            <div role="list">
              {group.items.map((item) => {
                const currentIndex = globalIndex++;
                const mins = Math.floor((new Date(item.dueAt).getTime() - nowMs) / 60000);
                const isOverdue = mins < 0;
                const isAlert = !isOverdue && mins < 60;
                const isAmber = !isOverdue && mins >= 60 && mins < 240;
                const timeColor = isOverdue || isAlert
                  ? "var(--rn-alert)"
                  : isAmber
                  ? "var(--rn-amber)"
                  : "var(--rn-muted)";
                const progress = progressOf(item);
                const isFocal = item.id === mostUrgentId;

                return (
                  <div key={item.id} role="listitem" style={{ borderBottom: "1px solid var(--rn-line)" }}>
                    <SwipeRow
                      ariaLabel={`Tugas ${item.title}`}
                      isFirst={currentIndex === 0}
                      onArchive={() => handleArchive(item.id)}
                      onDelete={() => handleDeleteRequest(item)}
                    >
                      <Link
                        href={`/pr/${item.id}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "1rem",
                          padding: isFocal ? "1.5rem 0" : "1.25rem 0",
                          color: "inherit",
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
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                              <span
                                aria-hidden="true"
                                style={{
                                  display: "inline-block",
                                  width: "2px",
                                  height: "0.75rem",
                                  backgroundColor: subjectColor(item.subject),
                                  flexShrink: 0,
                                }}
                              />
                              <span className="rn-label" style={{ letterSpacing: "0.1em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.subject}
                              </span>
                            </div>
                            <span
                              style={{
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: "0.6875rem",
                                color: timeColor,
                                letterSpacing: "0.05em",
                                flexShrink: 0,
                                fontWeight: isOverdue || isAlert ? 700 : 400,
                              }}
                            >
                              {formatTime(new Date(item.dueAt))}
                            </span>
                          </div>
                          <p
                            style={{
                              fontFamily: "var(--font-display, var(--font-body, sans-serif))",
                              fontSize: isFocal ? "1.375rem" : "1.125rem",
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
                          <CometDial value={progress} size={isFocal ? 52 : 44} />
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

      {/* Undo toast (5 seconds before the real deletion) */}
      {pending && (
        <div role="status" aria-live="polite" className="rn-toast">
          <span style={{ fontSize: "0.9375rem" }}>Tugas dihapus.</span>
          <Button variant="secondary" onClick={handleUndo}>
            Urungkan
          </Button>
        </div>
      )}
    </div>
  );
}
