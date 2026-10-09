/**
 * app/arsip/page.tsx — Arsip tugas
 */
"use client";

import { useState } from "react";
import { listAssignments, restoreAssignment, deleteAssignment } from "@/lib/repo";
import type { Assignment } from "@/lib/types";
import { PageHead } from "@/components/PageHead";

export default function ArsipPage() {
  const [archived, setArchived] = useState<Assignment[]>(() =>
    listAssignments({ includeArchived: true }).filter((a) => a.archivedAt)
  );

  const refresh = () => {
    setArchived(listAssignments({ includeArchived: true }).filter((a) => a.archivedAt));
  };

  const handleRestore = (id: string) => {
    restoreAssignment(id);
    refresh();
  };

  const handleDeletePermanent = (id: string) => {
    if (confirm("Hapus permanen tugas ini? Tindakan tidak dapat dibatalkan.")) {
      deleteAssignment(id);
      refresh();
    }
  };

  return (
    <div
      style={{
        background: "transparent",
        color: "var(--rn-text)",
        minHeight: "100dvh",
        padding: "2.5rem 1.5rem 6rem",
        maxWidth: "36rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <PageHead
        counter="03 / 03"
        section="ARSIP"
        title="Arsip"
        sub={`Tugas yang telah diarsipkan (${archived.length})`}
      />

      {archived.length === 0 ? (
        <div
          style={{
            padding: "3rem 1rem",
            textAlign: "center",
            border: "1px dashed rgba(143, 163, 191, 0.2)",
          }}
        >
          <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "var(--rn-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Arsip kosong
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--rn-muted)", marginTop: "0.5rem" }}>
            Tugas yang diselesaikan dan diarsipkan akan muncul di sini.
          </p>
        </div>
      ) : (
        <div role="list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {archived.map((item) => (
            <div
              key={item.id}
              role="listitem"
              style={{
                padding: "1.25rem 0",
                borderBottom: "1px solid rgba(168, 159, 140, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.1em",
                    color: "var(--rn-accent)",
                    textTransform: "uppercase",
                  }}
                >
                  {item.subject}
                </span>
                <p
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: "var(--rn-text)",
                    margin: "0.25rem 0",
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.65rem",
                    color: "var(--rn-muted)",
                  }}
                >
                  Diarsipkan: {new Date(item.archivedAt!).toLocaleDateString("id-ID")}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  onClick={() => handleRestore(item.id)}
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "0.5rem 0.75rem",
                    minHeight: 44,
                    border: "1px solid var(--rn-muted)",
                    color: "var(--rn-text)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Pulihkan
                </button>
                <button
                  onClick={() => handleDeletePermanent(item.id)}
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "0.5rem 0.75rem",
                    minHeight: 44,
                    border: "1px solid var(--rn-alert)",
                    color: "var(--rn-alert)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
