/**
 * lib/mock/recommendation.ts
 * CONTOH (mock) recommendation for the Home hero. Used ONLY as a fallback when
 * POST /api/ai/recommend is unavailable (e.g. no API key yet). The UI labels it
 * "Contoh · AI belum tersedia". Type comes from "@/lib/ai/types" (import only).
 */
import type { Recommendation } from "@/lib/ai/types";

export const MOCK_RECOMMENDATION: Recommendation = {
  topic: "Server Actions untuk mutasi form",
  reason:
    "Contoh saran: Server Actions membuat form bisa menyimpan data langsung dari server tanpa membuat endpoint API manual.",
  tier: "kompetensi",
  minutes: 30,
  radarItemId: undefined,
  alternatives: [
    { topic: "Streaming dengan Suspense di App Router", tier: "kompetensi", minutes: 25 },
    { topic: "Normalisasi tabel sampai 3NF", tier: "fondasi", minutes: 20 },
  ],
  generatedAt: new Date(0).toISOString(),
  // No signalSource on purpose: the mock must never pretend to cite a real source.
};

export function getMockRecommendation(): Recommendation {
  return {
    ...MOCK_RECOMMENDATION,
    alternatives: MOCK_RECOMMENDATION.alternatives.map((a) => ({ ...a })),
    generatedAt: new Date().toISOString(),
  };
}
