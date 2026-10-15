/**
 * components/belajar/FocusSection.tsx
 * 01 Fokus hari ini — the SAME recommendation as the Home hero (shared loader in repo,
 * so the API is called at most once per day), 3 Spring Check checkpoints, "Mulai sesi".
 */
"use client";

import { useEffect, useState } from "react";
import {
  getFocusCheckpoints,
  loadTodayRecommendation,
  sessionHrefFor,
  toggleFocusCheckpoint,
  type FocusCheckpoint,
  type StoredRecommendation,
} from "@/lib/repo";
import type { Tier } from "@/lib/ai/types";
import { SpringCheck } from "@/components/SpringCheck";
import { Button } from "@/components/ui/Button";
import { SectionHead } from "./SectionHead";

const TIER_LABEL: Record<Tier, string> = { fondasi: "Fondasi", kompetensi: "Kompetensi", ai: "AI Engineering" };

export function FocusSection() {
  const [entry, setEntry] = useState<StoredRecommendation | null>(null);
  const [checks, setChecks] = useState<FocusCheckpoint[]>([]);

  useEffect(() => {
    let alive = true;
    loadTodayRecommendation().then((loaded) => {
      if (!alive) return;
      setEntry(loaded);
      setChecks(getFocusCheckpoints(loaded.rec.topic));
    });
    return () => {
      alive = false;
    };
  }, []);

  const rec = entry?.rec;
  const done = checks.filter((c) => c.done).length;

  return (
    <section aria-labelledby="sec-fokus" aria-busy={!rec}>
      <SectionHead id="sec-fokus" number="01" title="Fokus hari ini" meta={rec ? `${done}/${checks.length} selesai` : undefined} />
      {!rec ? (
        <div aria-hidden="true" style={{ minHeight: "12rem" }} />
      ) : (
        <div className="rn-reveal" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h3 style={{ fontSize: "clamp(1.5rem, 6vw, 2rem)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.015em" }}>
            {rec.topic}
          </h3>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--rn-muted)" }}>{rec.reason}</p>
          <p className="rn-label" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", letterSpacing: "0.08em" }}>
            <span style={{ color: "var(--rn-accent)", fontWeight: 700 }}>{TIER_LABEL[rec.tier] ?? "Fondasi"}</span>
            <span aria-hidden="true">·</span>
            <span>{rec.minutes} menit</span>
            {entry?.source === "mock" && (
              <>
                <span aria-hidden="true">·</span>
                <span style={{ color: "var(--rn-text)" }}>Contoh · AI belum tersedia</span>
              </>
            )}
          </p>

          <div role="group" aria-label="Checkpoint fokus hari ini" style={{ display: "flex", flexDirection: "column", margin: "0.5rem 0 1.25rem" }}>
            {checks.map((cp) => (
              <div key={cp.id} style={{ borderBottom: "1px solid var(--rn-line)" }}>
                <SpringCheck
                  label={cp.title}
                  checked={cp.done}
                  onChange={() => setChecks(toggleFocusCheckpoint(rec.topic, cp.id))}
                />
              </div>
            ))}
          </div>

          <div>
            <Button variant="primary" href={sessionHrefFor(rec)}>
              Mulai sesi
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
