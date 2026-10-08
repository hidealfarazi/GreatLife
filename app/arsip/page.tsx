/**
 * app/arsip/page.tsx — Arsip tugas terarsip dengan aksi Pulihkan dan Hapus permanen.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { listAssignments, restoreAssignment, deleteAssignment } from "@/lib/repo";
import type { Assignment } from "@/lib/types";

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
        background: "var(--rn-bg)",
        color: "var(--rn-text)",
        minHeight: "100dvh",
        padding: "2rem 1.5rem 6rem",
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Arsip</h1>
      <p
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.75rem",
          color: "var(--rn-muted)",
          marginBottom: "2rem",
        }}
      >
        Tugas yang telah selesai dan diarsipkan ({archived.length})
      </p>

      {archived.length === 0 ? (
        <p style={{ color: "var(--rn-muted)", fontStyle: "italic" }}>Belum ada tugas diarsipkan.</p>
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
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.75rem",
            color: "var(--rn-accent)",
            textDecoration: "underline",
          }}
        >
          ← Kembali ke Hari Ini
        </Link>
      </div>
    </div>
  );
}
