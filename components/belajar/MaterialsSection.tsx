/**
 * components/belajar/MaterialsSection.tsx
 * 05 Materiku — materials with a small Comet Dial (share of terms checked), expandable
 * term checklist, and an add-material Field with inline validation (no alert()).
 */
"use client";

import { useState } from "react";
import { useRepo } from "@/lib/useRepo";
import {
  addChecklistItem,
  createMaterial,
  deleteChecklistItem,
  listChecklist,
  listMaterials,
  toggleChecklistItem,
} from "@/lib/repo";
import type { Material } from "@/lib/types";
import { Checklist } from "@/components/Checklist";
import { CometDial } from "@/components/CometDial";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "./SectionHead";

function validateTitle(title: string, existing: Material[]): string | null {
  if (title.length < 3) return "Judul materi minimal 3 huruf.";
  if (title.length > 80) return "Judul materi maksimal 80 huruf.";
  if (existing.some((m) => m.title.toLowerCase() === title.toLowerCase())) return "Materi ini sudah ada.";
  return null;
}

export function MaterialsSection() {
  const stored = useRepo<Material[]>(() => listMaterials());
  const materials = stored ?? [];
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = (value: string) => {
    const clean = value.trim().replace(/\s+/g, " ");
    const problem = validateTitle(clean, materials);
    if (problem) {
      setError(problem);
      return;
    }
    createMaterial(clean);
    setTitle("");
    setError("");
  };

  return (
    <section aria-labelledby="sec-materi">
      <SectionHead id="sec-materi" number="05" title="Materiku" meta={stored === null ? undefined : `${materials.length} materi`} />

      <div style={{ marginBottom: "1.25rem" }}>
        <Field
          value={title}
          onChange={(v) => {
            setTitle(v);
            if (error) setError("");
          }}
          onSubmit={handleAdd}
          placeholder="Tambah materi baru…"
          ariaLabel="Judul materi baru"
          error={error || undefined}
        />
      </div>

      {stored === null ? (
        <div aria-busy="true" style={{ minHeight: "6rem" }} />
      ) : materials.length === 0 ? (
        <p style={{ color: "var(--rn-muted)" }}>Belum ada materi.</p>
      ) : (
        <ul style={{ listStyle: "none" }}>
          {materials.map((mat) => {
            const expanded = expandedId === mat.id;
            const terms = listChecklist("material", mat.id);
            const pct = terms.length ? Math.round((terms.filter((t) => t.done).length / terms.length) * 100) : 0;
            return (
              <li key={mat.id} style={{ borderBottom: "1px solid var(--rn-line)" }}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`mat-${mat.id}`}
                  onClick={() => setExpandedId(expanded ? null : mat.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 0", minHeight: 56, textAlign: "left" }}
                >
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "1.0625rem", fontWeight: 700 }}>{mat.title}</span>
                    <span className="rn-label" style={{ letterSpacing: "0.06em" }}>
                      {terms.length} istilah · {expanded ? "Tutup" : "Buka"}
                    </span>
                  </span>
                  <CometDial value={pct} size={38} label={`Progres ${mat.title}`} />
                </button>
                {expanded && (
                  <div id={`mat-${mat.id}`} style={{ paddingBottom: "0.5rem" }}>
                    <Checklist
                      title="Istilah"
                      kind="term"
                      items={terms}
                      onToggle={(id) => {
                        toggleChecklistItem(id);
                      }}
                      onAdd={(t) => {
                        addChecklistItem("material", mat.id, "term", t);
                      }}
                      onDelete={(id) => {
                        deleteChecklistItem(id);
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
