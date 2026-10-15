/**
 * components/RecommendationHero.tsx
 * Home hero (~75svh): "Sinyal industri — minggu ini" label, huge topic headline,
 * 1–2 sentence reason, mono info row (tier, minutes), "Mulai sesi" + "Ganti topik",
 * and — only if signalSource exists — a small "Sumber: <name>" link.
 *
 * Data: POST /api/ai/recommend with { tasks: [{subject, title, dueInHours}], doneTopics }
 * (no personal data), cached per day through lib/repo.ts. "Ganti topik" rotates the
 * `alternatives` locally (no API call). If the API fails, a clearly-labelled mock is shown
 * with a small "AI belum tersedia" note; technical errors are never shown.
 */
"use client";

import { useEffect, useState } from "react";
import { loadTodayRecommendation, switchRecommendationTopic, type StoredRecommendation } from "@/lib/repo";
import type { Recommendation } from "@/lib/ai/types";
import { Button } from "@/components/ui/Button";
import { HeroHeadline } from "@/components/HeroHeadline";

const TIER_LABEL: Record<Recommendation["tier"], string> = {
  fondasi: "Fondasi",
  kompetensi: "Kompetensi",
  ai: "AI Engineering",
};

export function RecommendationHero() {
  const [entry, setEntry] = useState<StoredRecommendation | null>(null);

  useEffect(() => {
    let alive = true;
    loadTodayRecommendation().then((loaded) => {
      if (alive) setEntry(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  const handleSwitchTopic = () => {
    const updated = switchRecommendationTopic();
    if (updated) setEntry(updated);
  };

  const rec = entry?.rec ?? null;
  const isMock = entry?.source === "mock";
  const isAlternative = !!entry && entry.rec.topic !== entry.originalTopic;

  return (
    <section
      aria-label="Rekomendasi belajar hari ini"
      aria-busy={!rec}
      style={{
        minHeight: "72svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "1rem 0 2rem",
        position: "relative",
      }}
    >
      <p className="rn-label" style={{ letterSpacing: "0.15em", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <span>Sinyal industri — minggu ini</span>
        {isMock && <span style={{ color: "var(--rn-text)" }}>· Contoh</span>}
      </p>

      {!rec ? (
        // Loading: keep the space so nothing jumps; no spinner, no technical text.
        <div aria-hidden="true" style={{ minHeight: "14rem" }} />
      ) : (
        <div key={rec.topic} className="rn-reveal">
          <HeroHeadline topic={rec.topic} />

          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "var(--rn-muted)",
              maxWidth: "32rem",
              marginTop: "0.75rem",
            }}
          >
            {isAlternative ? `Alternatif untuk hari ini. Saran utama: ${entry?.originalTopic}.` : rec.reason}
          </p>

          <p className="rn-label" style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", letterSpacing: "0.08em" }}>
            <span style={{ color: "var(--rn-accent)", fontWeight: 700 }}>{TIER_LABEL[rec.tier] ?? "Fondasi"}</span>
            <span aria-hidden="true">·</span>
            <span>{rec.minutes} menit</span>
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <Button variant="primary" href={`/belajar/sesi/${encodeURIComponent(rec.radarItemId || "rekomendasi")}`}>
              Mulai sesi
            </Button>
            <Button variant="secondary" onClick={handleSwitchTopic} disabled={rec.alternatives.length === 0}>
              Ganti topik
            </Button>
          </div>

          {isMock && (
            <p className="rn-label" style={{ marginTop: "1.25rem", letterSpacing: "0.06em", textTransform: "none" }}>
              AI belum tersedia — ini contoh saran.
            </p>
          )}

          {rec.signalSource && !isMock && (
            <p
              className="rn-label"
              style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", textTransform: "none" }}
            >
              <a
                href={rec.signalSource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--rn-accent)",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  minHeight: 44,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Sumber: {rec.signalSource.title}
              </a>
              <span aria-hidden="true">·</span>
              <span>Saran AI, cek sumbernya</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
