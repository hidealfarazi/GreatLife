/**
 * components/SesiBelajarClient.tsx
 * Sesi belajar 4 langkah satu per layar dengan indikator "1 / 4" sampai "4 / 4":
 * (a) Analogi dulu, (b) Istilah/Checkpoint dengan Checklist,
 * (c) Kuis 3 soal pilihan ganda (jawaban & penjelasan terbuka setelah dijawab),
 * (d) Refleksi satu kalimat (simpan & kembali ke /belajar).
 */
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BackArrow, PageLabel } from "@/components/PageHead";
import {
  addChecklistItem,
  deleteChecklistItem,
  ensureSessionTerms,
  getSessionTitle,
  listChecklist,
  saveSessionReflection,
  toggleChecklistItem,
} from "@/lib/repo";
import { Checklist } from "@/components/Checklist";
import { Button } from "@/components/ui/Button";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SAMPLE_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    question: "Apa perbedaan utama antara Server Component dan Client Component di Next.js?",
    options: [
      "Server Component berjalan di browser, Client Component di server",
      "Server Component dirender di server tanpa kirim JS interaktif ke klien, Client Component mendungkung interaktivitas dan hook",
      "Tidak ada perbedaan, keduanya sama persis",
      "Client Component lebih cepat karena tidak perlu render HTML",
    ],
    correctIndex: 1,
    explanation: "Server Component merender markup di server dan mengurangi bundle JavaScript klien, sedangkan Client Component mendukung useState, useEffect, dan interaksi browser.",
  },
  {
    id: 2,
    question: "Kapan waktu yang tepat menggunakan direktif 'use client'?",
    options: [
      "Di setiap file komponen dalam direktori app/",
      "Hanya saat butuh hook (useState, useEffect) atau event handler (onClick)",
      "Saat mengambil data dari database SQL langsung",
      "Untuk menyembunyikan API key rahasia",
    ],
    correctIndex: 1,
    explanation: "'use client' memberitahu Next.js bahwa komponen ini memerlukan runtime browser dan interaktivitas.",
  },
  {
    id: 3,
    question: "Di mana lokasi penyimpanan kunci API yang aman agar tidak bocor ke klien?",
    options: [
      "Di dalam file komponen React (.tsx)",
      "Di dalam localStorage browser",
      "Di server route handler (app/api/) atau variabel lingkungan server (.env.local tanpa NEXT_PUBLIC_)",
      "Di dalam URL query parameters",
    ],
    correctIndex: 2,
    explanation: "Kunci rahasia dan API key pribadi hanya boleh diakses di server-side route handler.",
  },
];

const noopSubscribe = () => () => {};

export function SesiBelajarClient({ id }: { id: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 2 checklist state (terms)
  const [terms, setTerms] = useState(() => ensureSessionTerms(id));
  const title = useSyncExternalStore(
    noopSubscribe,
    () => getSessionTitle(id),
    () => "Sesi belajar"
  );
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new step heading so keyboard / screen-reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);
  const [newTermTitle, setNewTermTitle] = useState("");

  // Step 3 quiz state: record selected answer index per question id
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  // Step 4 reflection state
  const [reflection, setReflection] = useState("");
  const [reflectionError, setReflectionError] = useState("");
  const [saved, setSaved] = useState(false);

  const refreshTerms = () => {
    setTerms(listChecklist("material", id));
  };

  const handleToggleTerm = (termId: string) => {
    toggleChecklistItem(termId);
    refreshTerms();
  };

  const handleAddTerm = (title: string) => {
    addChecklistItem("material", id, "term", title);
    refreshTerms();
  };

  const handleDeleteTerm = (termId: string) => {
    deleteChecklistItem(termId);
    refreshTerms();
  };

  const handleAnswerSelect = (qId: number, optIndex: number) => {
    if (selectedAnswers[qId] !== undefined) return; // sudah dijawab
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim()) {
      setReflectionError("Mohon tuliskan refleksi satu kalimat terlebih dahulu.");
      return;
    }
    setReflectionError("");
    // Simpan sebagai checkpoint materi di repo
    saveSessionReflection(id, reflection.trim());
    setSaved(true);
    setTimeout(() => {
      router.push("/belajar");
    }, 800);
  };

  return (
    <div className="rn-page">
      {/* Top Header: back arrow + uniform label */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", minHeight: 44 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <BackArrow href="/belajar" label="Kembali ke Belajar" />
          <PageLabel counter="03 / 04" section="Sesi belajar" />
        </div>
        <span className="rn-label" style={{ color: "var(--rn-accent)" }}>
          {step} / 4
        </span>
      </header>

      <div>
        <p className="rn-label" style={{ letterSpacing: "0.08em" }}>Contoh materi</p>
        <p style={{ fontFamily: "var(--font-display, sans-serif)", fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.25, marginTop: "0.25rem" }}>
          {title}
        </p>
      </div>

      {saved ? (
        <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "1rem", color: "var(--rn-accent)", marginBottom: "0.5rem" }}>
            Sesi selesai & tersimpan.
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--rn-muted)" }}>Mengembalikan ke halaman Belajar...</p>
        </div>
      ) : (
        <>
          {/* STEP 1: Analogi Dulu */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.12em",
                    color: "var(--rn-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Langkah 01 / 04
                </span>
                <h1 ref={stepHeadingRef} tabIndex={-1} style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)", fontWeight: 700, lineHeight: 1.15, marginTop: "0.3rem", outline: "none" }}>
                  Pahami dengan Analogi
                </h1>
              </div>

              <div
                style={{
                  padding: "1.5rem 0",
                  borderTop: "1px solid var(--rn-line)",
                  borderBottom: "1px solid var(--rn-line)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--rn-text)" }}>
                  Bayangkan sebuah restoran besar. <strong style={{ color: "var(--rn-accent)" }}>Server Component</strong> adalah dapur utama di belakang: tempat koki meracik bahan mentah menjadi hidangan matang yang siap saji tanpa membuat tamu pusing dengan resep rahasia.
                </p>
                <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--rn-text)" }}>
                  Sementara <strong style={{ color: "var(--rn-accent)" }}>Client Component</strong> adalah pramusaji di meja tamu: mereka menerima pesanan langsung, mencatat perubahan menu secara interaktif, dan berinteraksi bolak-balik dengan tamu.
                </p>
              </div>

              <div>
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                >
                  Lanjut ke Istilah
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Istilah & Checkpoint */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.12em",
                    color: "var(--rn-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Langkah 02 / 04
                </span>
                <h1 ref={stepHeadingRef} tabIndex={-1} style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)", fontWeight: 700, lineHeight: 1.15, marginTop: "0.3rem", outline: "none" }}>
                  Istilah & Checkpoint
                </h1>
              </div>

              <Checklist
                title="Daftar Istilah"
                kind="term"
                items={terms}
                onToggle={handleToggleTerm}
                onAdd={handleAddTerm}
                onDelete={handleDeleteTerm}
              />

              <div style={{ display: "flex", gap: "1rem" }}>
                <Button
                  variant="secondary"
                  onClick={() => setStep(1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setStep(3)}
                >
                  Lanjut Kuis
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Kuis 3 Soal Pilihan Ganda */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.12em",
                    color: "var(--rn-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Langkah 03 / 04
                </span>
                <h1 ref={stepHeadingRef} tabIndex={-1} style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)", fontWeight: 700, lineHeight: 1.15, marginTop: "0.3rem", outline: "none" }}>
                  Kuis Pemahaman
                </h1>
                <p style={{ fontSize: "0.85rem", color: "var(--rn-muted)", marginTop: "0.4rem" }}>
                  Jawaban benar dan penjelasan akan terbuka setelah kamu memilih opsi.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                {SAMPLE_QUIZ.map((q, idx) => {
                  const answeredIndex = selectedAnswers[q.id];
                  const isAnswered = answeredIndex !== undefined;

                  return (
                    <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--rn-line)" }}>
                      <p style={{ fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.4 }}>
                        {idx + 1}. {q.question}
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = isAnswered && optIdx === q.correctIndex;
                          const isWrong = isAnswered && optIdx === answeredIndex && optIdx !== q.correctIndex;

                          return (
                            <button
                              key={opt}
                              type="button"
                              className="rn-chip"
                              aria-pressed={answeredIndex === optIdx}
                              aria-disabled={isAnswered && !isCorrect && !isWrong ? true : undefined}
                              onClick={() => handleAnswerSelect(q.id, optIdx)}
                              style={{
                                justifyContent: "flex-start",
                                textAlign: "left",
                                padding: "0.625rem 1rem",
                                color: "var(--rn-text)",
                                fontSize: "0.9375rem",
                                lineHeight: 1.4,
                                cursor: isAnswered ? "default" : "pointer",
                                ...(isCorrect
                                  ? { background: "rgba(143, 163, 191, 0.18)", borderColor: "var(--rn-accent)" }
                                  : isWrong
                                  ? { background: "rgba(217, 119, 107, 0.12)", borderColor: "var(--rn-alert)" }
                                  : {}),
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div
                          style={{
                            padding: "0.25rem 0 0.25rem 1rem",
                            borderLeft: "1px solid var(--rn-accent)",
                            fontSize: "0.9375rem",
                            lineHeight: 1.5,
                            color: "var(--rn-muted)",
                            marginTop: "0.5rem",
                          }}
                        >
                          <strong style={{ color: "var(--rn-text)" }}>Penjelasan:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <Button
                  variant="secondary"
                  onClick={() => setStep(2)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setStep(4)}
                >
                  Lanjut Refleksi
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Refleksi Satu Kalimat */}
          {step === 4 && (
            <form onSubmit={handleFinish} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.12em",
                    color: "var(--rn-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Langkah 04 / 04
                </span>
                <h1 ref={stepHeadingRef} tabIndex={-1} style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)", fontWeight: 700, lineHeight: 1.15, marginTop: "0.3rem", outline: "none" }}>
                  Refleksi Sesi
                </h1>
                <p style={{ fontSize: "0.9rem", color: "var(--rn-muted)", marginTop: "0.4rem" }}>
                  Tuliskan satu kalimat kesimpulan atau pemahaman penting yang kamu dapatkan hari ini.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <input
                  type="text"
                  value={reflection}
                  onChange={(e) => {
                    setReflection(e.target.value);
                    if (reflectionError) setReflectionError("");
                  }}
                  placeholder="Contoh: Saya paham kapan harus pakai Server vs Client Component..."
                  aria-label="Refleksi satu kalimat"
                  aria-invalid={!!reflectionError}
                  autoComplete="off"
                  className="rn-input"
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: reflectionError
                      ? "1px solid var(--rn-alert)"
                      : "1px solid rgba(255, 255, 255, 0.12)",
                    color: "var(--rn-text)",
                    padding: "0 1rem",
                    fontFamily: "var(--font-body, sans-serif)",
                    fontSize: "1rem",
                    minHeight: 44,
                  }}
                />
                {reflectionError && (
                  <p
                    role="alert"
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.75rem",
                      color: "var(--rn-alert)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {reflectionError}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <Button
                  variant="secondary"
                  onClick={() => setStep(3)}
                >
                  Sebelumnya
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Selesai & Simpan
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
