/**
 * components/belajar/AskSection.tsx
 * 04 Tanya dikit — Field + mode chips (Biasa, Analogi, Petunjuk, Kuis) + "Cek web" switch
 * -> POST /api/ai/ask (through lib/repo.ts) with the last 6 messages as history.
 * Answers are plain typographic text (no chat bubbles), with source links if any.
 */
"use client";

import { Fragment, useState } from "react";
import { askTutor, type AskMode, type AskTurn } from "@/lib/repo";
import type { Source } from "@/lib/ai/types";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "./SectionHead";

const MODES: { id: AskMode; label: string }[] = [
  { id: "normal", label: "Biasa" },
  { id: "analogy", label: "Analogi" },
  { id: "hint", label: "Petunjuk" },
  { id: "quiz", label: "Kuis" },
];

const FRIENDLY: Record<"budget" | "rate_limit" | "unavailable", string> = {
  budget: "Jatah tanya AI hari ini sudah habis. Lanjut besok, ya.",
  rate_limit: "AI sedang sibuk. Tunggu sebentar lalu coba lagi.",
  unavailable: "AI belum tersedia saat ini. Coba lagi nanti.",
};

interface Exchange {
  question: string;
  answer: string;
  sources: Source[];
}

/** Render an answer as paragraphs; ``` fenced blocks become mono code. */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/```[a-zA-Z]*\n?/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre
            key={i}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              padding: "0.25rem 0 0.25rem 1rem",
              borderLeft: "1px solid var(--rn-line)",
              color: "var(--rn-text)",
              margin: "0.75rem 0",
            }}
          >
            {part.trimEnd()}
          </pre>
        ) : (
          <Fragment key={i}>
            {part
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, j) => (
                <p key={j} style={{ fontSize: "1.0625rem", lineHeight: 1.65, margin: "0.5rem 0", whiteSpace: "pre-line" }}>
                  {p}
                </p>
              ))}
          </Fragment>
        )
      )}
    </>
  );
}

export function AskSection() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<AskMode>("normal");
  const [search, setSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);

  const submit = async (value: string) => {
    const q = value.trim();
    if (!q || loading) return;
    setLoading(true);
    setMessage(null);
    const history: AskTurn[] = exchanges.flatMap((e) => [
      { role: "user" as const, text: e.question },
      { role: "model" as const, text: e.answer },
    ]);
    const result = await askTutor(q, history.slice(-6), mode, search);
    setLoading(false);
    if (result.ok) {
      setExchanges((prev) => [...prev, { question: q, answer: result.answer, sources: result.sources }]);
      setQuestion("");
    } else {
      setMessage(FRIENDLY[result.reason]);
    }
  };

  return (
    <section aria-labelledby="sec-tanya">
      <SectionHead id="sec-tanya" number="04" title="Tanya dikit" />

      <div role="group" aria-label="Mode jawaban" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "0.75rem" }}>
        {MODES.map((m) => (
          <Chip key={m.id} label={m.label} active={mode === m.id} onClick={() => setMode(m.id)} />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <span id="cek-web-label" style={{ fontSize: "1rem", color: "var(--rn-muted)" }}>
          Cek web
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={search}
          aria-labelledby="cek-web-label"
          className="rn-switch"
          onClick={() => setSearch((s) => !s)}
        >
          <span className="rn-switch-track" aria-hidden="true">
            <span className="rn-switch-thumb" />
          </span>
          <span style={{ minWidth: "2.75em", textAlign: "left" }}>{search ? "Nyala" : "Mati"}</span>
        </button>
      </div>

      <Field
        value={question}
        onChange={(v) => {
          setQuestion(v);
          if (message) setMessage(null);
        }}
        onSubmit={submit}
        placeholder="Tanya apa saja soal materi…"
        ariaLabel="Pertanyaan untuk AI"
        disabled={loading}
      />

      <p role="status" aria-live="polite" className="rn-label" style={{ marginTop: "0.75rem", textTransform: "none", letterSpacing: "0.04em", minHeight: "1em" }}>
        {loading ? "Menjawab…" : message ?? ""}
      </p>

      {exchanges.length > 0 && (
        <ol aria-label="Jawaban" style={{ listStyle: "none", marginTop: "1rem" }}>
          {exchanges.map((e, i) => (
            <li key={i} style={{ padding: "1.25rem 0", borderTop: "1px solid var(--rn-line)" }}>
              <p className="rn-label" style={{ textTransform: "none", letterSpacing: "0.02em", fontSize: "0.8125rem" }}>
                {e.question}
              </p>
              <div style={{ marginTop: "0.5rem" }}>
                <AnswerText text={e.answer} />
              </div>
              {e.sources.length > 0 && (
                <ul aria-label="Sumber jawaban" style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: "0 1rem" }}>
                  {e.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rn-label"
                        style={{ color: "var(--rn-accent)", textDecoration: "underline", textUnderlineOffset: 3, textTransform: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}
                      >
                        {s.title || s.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
