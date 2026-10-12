/**
 * components/BelajarClient.tsx
 * Halaman /belajar: 4 bagian (Fokus hari ini, Jalurmu 3 tier vertikal, Minta sendiri, Materiku).
 * Borderless, CometDial, Checklist, real state via lib/repo.ts.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getTodayLearningFocus,
  refreshLearningFocus,
  toggleFocusCheckpoint,
  listSkillNodes,
  toggleSkillNode,
  listMaterials,
  createMaterial,
  listChecklist,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
} from "@/lib/repo";
import type { Material } from "@/lib/types";
import type { LearningFocus, SkillNode } from "@/lib/mock/learning";
import { CometDial } from "@/components/CometDial";
import { Checklist } from "@/components/Checklist";
import { SpringCheck } from "@/components/SpringCheck";

export function BelajarClient() {
  const [focus, setFocus] = useState<LearningFocus>(() => getTodayLearningFocus());
  const [nodes, setNodes] = useState<SkillNode[]>(() => listSkillNodes());
  const [materials, setMaterials] = useState<Material[]>(() => listMaterials());
  const [newMatTitle, setNewMatTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [expandedMatId, setExpandedMatId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => {
    setFocus({ ...getTodayLearningFocus() });
    setNodes(listSkillNodes());
    setMaterials(listMaterials());
    setTick((t) => t + 1);
  };

  const handleRefreshFocus = () => {
    const updated = refreshLearningFocus();
    setFocus({ ...updated });
  };

  const handleToggleCheckpoint = (cpId: string) => {
    const updated = toggleFocusCheckpoint(cpId);
    setFocus({ ...updated });
  };

  const handleToggleNode = (nodeId: string) => {
    const updated = toggleSkillNode(nodeId);
    setNodes([...updated]);
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatTitle.trim()) return;
    createMaterial(newMatTitle.trim());
    setNewMatTitle("");
    refresh();
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    alert(`(UI Demo) Minta belajar: "${customPrompt}" berhasil dicatat.`);
    setCustomPrompt("");
  };

  const handleQuickPrompt = (text: string) => {
    alert(`(UI Demo) Quick prompt dipilih: "${text}"`);
  };

  // Group nodes by tier
  const tiers = [
    { tier: 1, name: "Tier 1 — Fondasi", nodes: nodes.filter((n) => n.tier === 1) },
    { tier: 2, name: "Tier 2 — Kompetensi", nodes: nodes.filter((n) => n.tier === 2) },
    { tier: 3, name: "Tier 3 — AI Engineering", nodes: nodes.filter((n) => n.tier === 3) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      {/* 01 FOKUS HARI INI */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "1rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(143, 163, 191, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                color: "var(--rn-accent)",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              01 — Fokus Hari Ini
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.625rem",
                padding: "0.15rem 0.4rem",
                background: "rgba(143, 163, 191, 0.12)",
                color: "var(--rn-accent)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {focus.level}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefreshFocus}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6875rem",
              color: "var(--rn-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              minHeight: 44,
              display: "flex",
              alignItems: "center",
            }}
          >
            Perbarui
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.35rem, 5vw, 1.85rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: "var(--rn-text)",
            }}
          >
            {focus.title}
          </h2>
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "var(--rn-muted)",
            }}
          >
            {focus.reason}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6875rem",
              color: "var(--rn-muted)",
              marginBottom: "1rem",
            }}
          >
            <span>Estimasi: {focus.estMinutes} menit</span>
            <span>·</span>
            <span>{focus.checkpoints.filter((c) => c.done).length}/{focus.checkpoints.length} selesai</span>
          </div>

          {/* Checkpoints checklist */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "1.25rem" }}>
            {focus.checkpoints.map((cp) => (
              <div
                key={cp.id}
                style={{
                  borderBottom: "1px solid rgba(168, 159, 140, 0.12)",
                }}
              >
                <SpringCheck
                  label={cp.title}
                  checked={cp.done}
                  onChange={() => handleToggleCheckpoint(cp.id)}
                  ariaLabel={`Centang ${cp.title}`}
                />
              </div>
            ))}
          </div>

          <div>
            <Link
              href={`/belajar/sesi/${focus.sessionId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.75rem 1.5rem",
                background: "var(--rn-text)",
                color: "var(--rn-bg)",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                minHeight: 44,
              }}
            >
              Mulai Sesi →
            </Link>
          </div>
        </div>
      </section>

      {/* 02 JALURMU (Peta vertikal 3 tingkat tanpa kartu) */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "1.25rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(143, 163, 191, 0.15)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              color: "var(--rn-accent)",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            02 — Jalurmu (Peta Kesiapan)
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6875rem",
              color: "var(--rn-muted)",
            }}
          >
            {nodes.filter((n) => n.done).length} / {nodes.length} selesai
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {tiers.map((tierGroup) => (
            <div key={tierGroup.tier} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.1em",
                  color: "var(--rn-muted)",
                  textTransform: "uppercase",
                  marginBottom: "0.25rem",
                }}
              >
                {tierGroup.name}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  paddingLeft: "1rem",
                  borderLeft: "1px solid rgba(143, 163, 191, 0.2)",
                  gap: "0.75rem",
                }}
              >
                {tierGroup.nodes.map((node) => {
                  const progressValue = node.done ? 100 : node.isActive ? 45 : 0;
                  return (
                    <div
                      key={node.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.4rem 0",
                        borderBottom: "1px solid rgba(168, 159, 140, 0.1)",
                        minHeight: 44,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleNode(node.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          flex: 1,
                          minHeight: 44,
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: node.done
                              ? "var(--rn-accent)"
                              : node.isActive
                              ? "var(--rn-amber)"
                              : "rgba(139, 147, 160, 0.4)",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: node.isActive ? 700 : 500,
                            color: node.done ? "var(--rn-muted)" : "var(--rn-text)",
                            textDecoration: node.done ? "line-through" : "none",
                          }}
                        >
                          {node.title}
                        </span>
                      </button>

                      <div style={{ flexShrink: 0, marginLeft: "1rem" }}>
                        {node.isActive ? (
                          <CometDial value={progressValue} size={36} />
                        ) : node.done ? (
                          <span
                            style={{
                              fontFamily: "var(--font-mono, monospace)",
                              fontSize: "0.6875rem",
                              color: "var(--rn-accent)",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                            }}
                          >
                            SELESAI
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--font-mono, monospace)",
                              fontSize: "0.6875rem",
                              color: "rgba(139, 147, 160, 0.4)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 03 MINTA SENDIRI (Input garis-bawah + tautan teks cepat) */}
      <section>
        <div
          style={{
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(143, 163, 191, 0.15)",
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              color: "var(--rn-accent)",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            03 — Minta Sendiri
          </span>
        </div>

        <form
          onSubmit={handlePromptSubmit}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(168, 159, 140, 0.3)",
            marginBottom: "1rem",
          }}
        >
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Aku mau belajar..."
            aria-label="Aku mau belajar topik apa"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              borderRadius: 0,
              color: "var(--rn-text)",
              padding: "0.5rem 0",
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
            Kirim
          </button>
        </form>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.25rem",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.6875rem",
          }}
        >
          {[
            "Jelaskan pakai analogi",
            "Kuis aku",
            "Kasih petunjuk, jangan jawabannya",
          ].map((quickText) => (
            <button
              key={quickText}
              type="button"
              onClick={() => handleQuickPrompt(quickText)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--rn-muted)",
                cursor: "pointer",
                padding: "0.25rem 0",
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                textAlign: "left",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {quickText}
            </button>
          ))}
        </div>
      </section>

      {/* 04 MATERIKU (Daftar materi dengan Comet Dial kecil) */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "1rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(143, 163, 191, 0.15)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              color: "var(--rn-accent)",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            04 — Materiku
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6875rem",
              color: "var(--rn-muted)",
            }}
          >
            {materials.length} materi
          </span>
        </div>

        {/* Form tambah materi */}
        <form
          onSubmit={handleCreateMaterial}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            paddingBottom: "0.4rem",
            borderBottom: "1px solid rgba(168, 159, 140, 0.3)",
          }}
        >
          <input
            type="text"
            value={newMatTitle}
            onChange={(e) => setNewMatTitle(e.target.value)}
            placeholder="Tambah materi baru..."
            aria-label="Judul materi baru"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              borderRadius: 0,
              color: "var(--rn-text)",
              padding: "0.5rem 0",
              fontFamily: "var(--font-body, sans-serif)",
              fontSize: "0.9rem",
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

        {materials.length === 0 ? (
          <p style={{ color: "var(--rn-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
            Belum ada materi.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {materials.map((mat) => {
              const isExpanded = expandedMatId === mat.id;
              const terms = listChecklist("material", mat.id);
              const doneTerms = terms.filter((t) => t.done).length;
              const matProgress = terms.length > 0 ? Math.round((doneTerms / terms.length) * 100) : 0;
              void tick;

              return (
                <div
                  key={mat.id}
                  style={{
                    borderBottom: "1px solid rgba(168, 159, 140, 0.15)",
                    padding: "0.5rem 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: 44,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedMatId(isExpanded ? null : mat.id)}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.15rem",
                      }}
                    >
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--rn-text)" }}>
                        {mat.title}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: "0.65rem",
                          color: "var(--rn-muted)",
                        }}
                      >
                        {terms.length} istilah · {isExpanded ? "Tutup" : "Ketuk untuk detail"}
                      </span>
                    </button>

                    <div style={{ flexShrink: 0, marginLeft: "1rem" }}>
                      <CometDial value={matProgress} size={38} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: "1rem", paddingLeft: "0.5rem" }}>
                      <Checklist
                        title="Istilah / Checkpoint"
                        kind="term"
                        items={terms}
                        onToggle={(id) => {
                          toggleChecklistItem(id);
                          refresh();
                        }}
                        onAdd={(title) => {
                          addChecklistItem("material", mat.id, "term", title);
                          refresh();
                        }}
                        onDelete={(id) => {
                          deleteChecklistItem(id);
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
      </section>
    </div>
  );
}
