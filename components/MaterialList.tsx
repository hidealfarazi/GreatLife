/**
 * components/MaterialList.tsx
 * Client component for Belajar (/belajar) page: Material list + term checklist.
 */
"use client";

import { useState } from "react";
import {
  listMaterials,
  createMaterial,
  listChecklist,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
} from "@/lib/repo";
import type { Material } from "@/lib/types";
import { Checklist } from "@/components/Checklist";

export function MaterialList() {
  const [materials, setMaterials] = useState<Material[]>(() => listMaterials());
  const [newTitle, setNewTitle] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // For checklist refresh: simple trigger state
  const [tick, setTick] = useState(0);

  const refresh = () => {
    setMaterials(listMaterials());
    setTick((t) => t + 1);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMaterial(newTitle.trim());
    setNewTitle("");
    refresh();
  };

  return (
    <div>
      {/* Form tambah materi — tanpa kotak, hanya garis bawah */}
      <form
        onSubmit={handleCreate}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "0.75rem",
          marginBottom: "2.25rem",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid rgba(168, 159, 140, 0.3)",
        }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Tambah materi baru…"
          aria-label="Judul materi baru"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            borderRadius: 0,
            color: "var(--rn-text)",
            padding: "0.5rem 0 0.6rem",
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: "0.9375rem",
            minHeight: 44,
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            flexShrink: 0,
            minHeight: 44,
            padding: "0 0.25rem",
            background: "transparent",
            color: "var(--rn-accent)",
            border: "none",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            cursor: "pointer",
          }}
        >
          Tambah
        </button>
      </form>

      {/* Daftar materi */}
      {materials.length === 0 ? (
        <p style={{ color: "var(--rn-muted)", fontStyle: "italic" }}>Belum ada materi.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {materials.map((mat) => {
            const isExpanded = expandedId === mat.id;
            const terms = listChecklist("material", mat.id);
            // Use tick to force re-read after mutation
            void tick;

            return (
              <div
                key={mat.id}
                style={{
                  borderBottom: "1px solid rgba(168, 159, 140, 0.15)",
                  padding: "0.75rem 0",
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : mat.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.5rem 0",
                    minHeight: 44,
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--rn-text)",
                      textAlign: "left",
                    }}
                  >
                    {mat.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.7rem",
                      color: "var(--rn-muted)",
                      flexShrink: 0,
                      marginLeft: "1rem",
                    }}
                  >
                    {isExpanded ? "Tutup" : `${terms.length} istilah`}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ marginTop: "1rem", paddingLeft: "0.25rem" }}>
                    <Checklist
                      title="Istilah / Checkpoint"
                      kind="term"
                      items={terms}
                      onToggle={(itemId) => {
                        toggleChecklistItem(itemId);
                        refresh();
                      }}
                      onAdd={(title) => {
                        addChecklistItem("material", mat.id, "term", title);
                        refresh();
                      }}
                      onDelete={(itemId) => {
                        deleteChecklistItem(itemId);
                        refresh();
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
