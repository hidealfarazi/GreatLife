/**
 * components/belajar/PathSection.tsx
 * 02 Jalurmu — thin vertical path through 3 tiers. Every node is a checkbox (done flag
 * persisted through lib/repo.ts). The active node (first unfinished one) shows a small
 * Comet Dial with its tier's progress.
 */
"use client";

import { listSkillNodes, toggleSkillNode } from "@/lib/repo";
import { INITIAL_SKILL_NODES } from "@/lib/mock/learning";
import { useRepo } from "@/lib/useRepo";
import { CometDial } from "@/components/CometDial";
import { SectionHead } from "./SectionHead";

const TIERS: { tier: 1 | 2 | 3; name: string }[] = [
  { tier: 1, name: "Tier 1 — Fondasi" },
  { tier: 2, name: "Tier 2 — Kompetensi" },
  { tier: 3, name: "Tier 3 — AI Engineering" },
];

const DOT = 11;

export function PathSection() {
  // Saved progress from the device; the starter path is shown (static) while it loads.
  const nodes = useRepo(listSkillNodes) ?? INITIAL_SKILL_NODES;
  const activeId = nodes.find((n) => !n.done)?.id;
  const doneCount = nodes.filter((n) => n.done).length;

  return (
    <section aria-labelledby="sec-jalur">
      <SectionHead id="sec-jalur" number="02" title="Jalurmu" meta={`${doneCount} / ${nodes.length} selesai`} />

      <div style={{ position: "relative", paddingLeft: "1.75rem" }}>
        {/* The continuous thin path */}
        <span
          aria-hidden="true"
          style={{ position: "absolute", left: DOT / 2, top: 8, bottom: 8, width: 1, background: "var(--rn-line)" }}
        />

        {TIERS.map(({ tier, name }) => {
          const tierNodes = nodes.filter((n) => n.tier === tier);
          const tierPct = tierNodes.length ? Math.round((tierNodes.filter((n) => n.done).length / tierNodes.length) * 100) : 0;
          return (
            <div key={tier} role="group" aria-label={name} style={{ marginBottom: "1.75rem" }}>
              <p className="rn-label" style={{ position: "relative", padding: "0.25rem 0 0.5rem" }}>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: `calc(-1.75rem + ${DOT / 2}px - 3.5px)`,
                    top: "0.55em",
                    width: 8,
                    height: 1,
                    background: "var(--rn-muted)",
                  }}
                />
                {name}
              </p>
              {tierNodes.map((node) => {
                const active = node.id === activeId;
                return (
                  <button
                    key={node.id}
                    type="button"
                    role="checkbox"
                    aria-checked={node.done}
                    onClick={() => toggleSkillNode(node.id)}
                    className="rn-path-node"
                    data-active={active}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: `calc(-1.75rem)`,
                        top: "50%",
                        width: DOT,
                        height: DOT,
                        marginTop: -DOT / 2,
                        borderRadius: "50%",
                        background: node.done ? "var(--rn-accent)" : "var(--rn-bg)",
                        border: `1px solid ${node.done || active ? "var(--rn-accent)" : "var(--rn-muted)"}`,
                        transition: "background 200ms ease-out",
                      }}
                    />
                    <span style={{ flex: 1, color: node.done ? "var(--rn-muted)" : "var(--rn-text)", fontWeight: active ? 700 : 400 }}>
                      {node.title}
                    </span>
                    {active ? (
                      <CometDial value={tierPct} size={36} label={`Progres ${name}`} />
                    ) : (
                      <span className="rn-label" style={{ color: node.done ? "var(--rn-accent)" : "var(--rn-muted)" }}>
                        {node.done ? "Selesai" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
