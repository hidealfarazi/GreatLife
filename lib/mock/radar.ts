/**
 * lib/mock/radar.ts
 * Offline starting roadmap, shown as "Roadmap awal (offline)" when GET /api/ai/radar is
 * unavailable (no key / AI disabled). Same starting point as the owner's server seed.
 */
import type { Radar } from "@/lib/ai/types";

export const OFFLINE_RADAR: Radar = {
  items: [
    { id: "git", name: "Git & GitHub", kind: "tool", track: "web", status: "adopt", why: "Dasar kerja tim dan portofolio.", startWhen: "Sekarang" },
    { id: "sql-postgresql", name: "SQL & PostgreSQL", kind: "language", track: "data", status: "adopt", why: "Hampir semua aplikasi butuh basis data.", startWhen: "Sekarang" },
    { id: "typescript", name: "TypeScript", kind: "language", track: "web", status: "adopt", why: "Standar proyek web modern, aman untuk kode hasil AI.", startWhen: "Setelah dasar JavaScript" },
    { id: "react-nextjs", name: "React + Next.js", kind: "framework", track: "web", status: "adopt", why: "Ekosistem front end terbesar.", startWhen: "Setelah TypeScript dasar" },
    { id: "laravel", name: "Laravel", kind: "framework", track: "web", status: "trial", why: "Back end PHP yang produktif, banyak dipakai lokal.", startWhen: "Satu proyek kecil" },
    { id: "python", name: "Python", kind: "language", track: "ai", status: "adopt", why: "Bahasa utama AI, data, dan otomasi.", startWhen: "Sekarang" },
    { id: "llm-api", name: "Integrasi LLM lewat API", kind: "platform", track: "ai", status: "trial", why: "Pembeda: menambah fitur AI ke aplikasi nyata.", startWhen: "Setelah Tier 2" },
    { id: "rag", name: "RAG (embedding + vector DB)", kind: "tool", track: "ai", status: "assess", why: "Menjawab dari data sendiri; konsep penting Tier 3.", startWhen: "Setelah integrasi LLM" },
    { id: "react-native", name: "React Native / Expo", kind: "framework", track: "mobile", status: "assess", why: "Aplikasi HP dengan keahlian React yang sama.", startWhen: "Setelah React" },
    { id: "esp32", name: "C/C++ untuk ESP32/Arduino", kind: "language", track: "iot", status: "assess", why: "Jalur IoT sesuai minatmu.", startWhen: "Proyek kecil" },
    { id: "phaser", name: "Phaser (game web)", kind: "framework", track: "game", status: "trial", why: "Game berbasis web dengan JavaScript/TypeScript.", startWhen: "Proyek kecil" },
  ],
  sources: [],
  pending: [],
  checkedAt: null,
  updatedAt: null,
};
