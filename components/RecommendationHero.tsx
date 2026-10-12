/**
 * components/RecommendationHero.tsx
 * Hero Rekomendasi di Hari Ini (~75svh).
 * Label "Sinyal industri — minggu ini", judul topik 2 baris (putih & biru-abu),
 * alasan 1-2 kalimat, info mono (tingkat, menit), aksi "Mulai sesi" & "Ganti topik",
 * serta sumber sinyal bila ada.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { getTodayRecommendation, switchRecommendationTopic } from "@/lib/repo";
import { TechText } from "@/components/TechText";
import type { Recommendation } from "@/lib/ai/types";

export function RecommendationHero() {
  const [rec, setRec] = useState<Recommendation>(() => getTodayRecommendation());

  const handleSwitchTopic = () => {
    const updated = switchRecommendationTopic();
    setRec({ ...updated });
  };

  // Pisahkan topik menjadi 2 baris jika ada newline (\n) atau separator
  const [line1, line2] = rec.topic.includes("\n")
    ? rec.topic.split("\n")
    : [rec.topic, ""];

  const tierLabel =
    rec.tier === "fondasi"
      ? "Fondasi"
      : rec.tier === "ai"
      ? "AI Engineering"
      : "Kompetensi";

  return (
    <section
      aria-label="Rekomendasi Belajar Hari Ini"
      style={{
        minHeight: "70svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "1rem 0 2rem",
        position: "relative",
      }}
    >
      {/* Label sinyal industri */}
      <div>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.6875rem",
            letterSpacing: "0.15em",
            color: "var(--rn-muted)",
            textTransform: "uppercase",
          }}
        >
          Sinyal industri — minggu ini
        </span>
      </div>

      {/* Judul topik sangat besar */}
      <h1
        style={{
          fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          margin: "1rem 0 0.5rem",
          wordBreak: "normal",
          hyphens: "none",
        }}
      >
        <span style={{ color: "var(--rn-text)", display: "block" }}>
          <TechText text={line1} />
        </span>
        {line2 && (
          <span style={{ color: "var(--rn-accent)", display: "block", marginTop: "0.25rem" }}>
            <TechText text={line2} />
          </span>
        )}
      </h1>

      {/* Alasan 1-2 kalimat */}
      <p
        style={{
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          color: "var(--rn-muted)",
          maxWidth: "32rem",
          marginTop: "0.75rem",
        }}
      >
        {rec.reason}
      </p>

      {/* Baris info mono */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.6875rem",
          letterSpacing: "0.08em",
          color: "var(--rn-muted)",
          textTransform: "uppercase",
          marginTop: "1.25rem",
        }}
      >
        <span style={{ color: "var(--rn-accent)", fontWeight: 700 }}>{tierLabel}</span>
        <span>·</span>
        <span>{rec.minutes} menit</span>
      </div>

      {/* Teks aksi: Mulai sesi & Ganti topik */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          marginTop: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <Link
          href={`/belajar/sesi/${rec.radarItemId ?? "rekomendasi"}`}
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
        <button
          type="button"
          onClick={handleSwitchTopic}
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--rn-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            minHeight: 44,
            padding: "0 0.5rem",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Ganti Topik
        </button>
      </div>

      {/* Sumber sinyal */}
      {rec.signalSource && (
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.6875rem",
            color: "var(--rn-muted)",
          }}
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
          <span>·</span>
          <span>Saran AI, cek sumbernya</span>
        </div>
      )}
    </section>
  );
}
