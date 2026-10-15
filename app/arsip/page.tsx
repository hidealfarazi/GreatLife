/**
 * app/arsip/page.tsx — Arsip tugas
 */
"use client";

import { useState } from "react";
import { useRepo } from "@/lib/useRepo";
import { listAssignments, restoreAssignment, deleteAssignment } from "@/lib/repo";
import type { Assignment } from "@/lib/types";
import { subjectColor } from "@/lib/subjectColors";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/Button";

export default function ArsipPage() {
  const stored = useRepo<Assignment[]>(() => listAssignments({ includeArchived: true }).filter((a) => a.archivedAt));
  const archived = stored ?? [];
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleRestore = (id: string) => {
    restoreAssignment(id);
  };

  return (
    <div className="rn-page">
      <PageHead
        counter="04 / 04"
        section="ARSIP"
        title="Arsip"
        sub={stored === null ? "Tugas yang telah diarsipkan" : `Tugas yang telah diarsipkan (${archived.length})`}
      />

      {stored === null ? (
        <div aria-busy="true" style={{ minHeight: "12rem" }} />
      ) : archived.length === 0 ? (
        <div
          style={{
            padding: "2rem 0",
            borderTop: "1px solid var(--rn-line)",
          }}
        >
          <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "var(--rn-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Arsip kosong
          </p>
          <p style={{ fontSize: "1rem", color: "var(--rn-muted)", marginTop: "0.5rem" }}>
            Tugas yang diselesaikan dan diarsipkan akan muncul di sini.
          </p>
        </div>
      ) : (
        <div role="list" style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--rn-line)" }}>
          {archived.map((item) => (
            <div
              key={item.id}
              role="listitem"
              style={{
                padding: "1.25rem 0",
                borderBottom: "1px solid var(--rn-line)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: "2px",
                      height: "0.75rem",
                      backgroundColor: subjectColor(item.subject),
                      borderRadius: "1px",
                      flexShrink: 0,
                    }}
                  />
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
                </div>
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

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {confirmDeleteId === item.id ? (
                  <>
                    <span style={{ flexBasis: "100%", fontSize: "0.9375rem", color: "var(--rn-alert)" }}>
                      Hapus permanen? Tugas ini tidak bisa dipulihkan.
                    </span>
                    <Button
                      variant="primary"
                      onClick={() => {
                        deleteAssignment(item.id);
                        setConfirmDeleteId(null);
                      }}
                      style={{
                        padding: "0 0.85rem",
                        fontSize: "0.6875rem",
                      }}
                    >
                      Ya, hapus
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmDeleteId(null)}
                      style={{
                        padding: "0 0.75rem",
                        fontSize: "0.6875rem",
                      }}
                    >
                      Batal
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => handleRestore(item.id)}
                      style={{
                        padding: "0 0.85rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      Pulihkan
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmDeleteId(item.id)}
                      style={{
                        padding: "0 0.85rem",
                        fontSize: "0.75rem",
                        borderColor: "rgba(217, 119, 107, 0.35)",
                        color: "var(--rn-alert)",
                      }}
                    >
                      Hapus Permanen
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
