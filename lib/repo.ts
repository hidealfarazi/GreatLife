/**
 * lib/repo.ts
 * In-memory repository for Assignments, ChecklistItems, Checkpoints, and Materials.
 * All data access goes through here.
 */

import { Assignment, ChecklistItem, ChecklistKind, Checkpoint, Material, Subject } from "./types";
import { INITIAL_SKILL_NODES, SkillNode } from "./mock/learning";
import { OFFLINE_RADAR } from "./mock/radar";
import type { Radar, Recommendation, Source } from "./ai/types";
import { getMockRecommendation } from "./mock/recommendation";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const now = new Date();
const todayAt = (h: number, m: number): Date => {
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d;
};
const tomorrowAt = (h: number, m: number): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return d;
};

let subjects: Subject[] = [
  { id: "s1", name: "Pemrograman Web", color: "#8FA3BF" },
  { id: "s2", name: "Basis Data", color: "#7E9D84" },
  { id: "s3", name: "Matematika", color: "#9B86B3" },
  { id: "s4", name: "PKK", color: "#C9A24B" },
  { id: "s5", name: "Bahasa Indonesia", color: "#B86B6B" },
];

let assignments: Assignment[] = [
  {
    id: "t1",
    subjectId: "s1",
    subject: "Pemrograman Web",
    title: "Buat halaman login dengan validasi form",
    description: "Gunakan TypeScript strict dan pastikan form divalidasi dengan benar.",
    dueAt: todayAt(15, 30),
    priority: 1,
    status: "doing",
    progress: 65,
    estMinutes: 90,
    createdAt: new Date(),
  },
  {
    id: "t2",
    subjectId: "s2",
    subject: "Basis Data",
    title: "Diagram ERD sistem perpustakaan",
    description: "Hubungkan entitas Anggota, Buku, Peminjaman, dan Petugas.",
    dueAt: todayAt(20, 0),
    priority: 2,
    status: "todo",
    progress: 30,
    estMinutes: 60,
    createdAt: new Date(),
  },
  {
    id: "b1",
    subjectId: "s3",
    subject: "Matematika",
    title: "Latihan soal limit fungsi trigonometri",
    description: "Kerjakan soal latihan halaman 45.",
    dueAt: tomorrowAt(8, 0),
    priority: 2,
    status: "todo",
    progress: 0,
    estMinutes: 45,
    createdAt: new Date(),
  },
  {
    id: "b2",
    subjectId: "s4",
    subject: "PKK",
    title: "Laporan praktik kerja lapangan minggu ke-3",
    description: "Dokumentasikan kegiatan harian dan kendala di tempat PKL.",
    dueAt: tomorrowAt(14, 0),
    priority: 1,
    status: "doing",
    progress: 80,
    estMinutes: 120,
    createdAt: new Date(),
  },
];

let checklistItems: ChecklistItem[] = [
  { id: "c1", parentType: "assignment", parentId: "t1", kind: "step", title: "Rancang markup HTML", done: true },
  { id: "c2", parentType: "assignment", parentId: "t1", kind: "step", title: "Tulis validasi TypeScript", done: true },
  { id: "c3", parentType: "assignment", parentId: "t1", kind: "step", title: "Uji coba responsif 390px", done: false },
  { id: "c4", parentType: "assignment", parentId: "t1", kind: "bring", title: "Laptop terisi penuh", done: true },
  { id: "c5", parentType: "assignment", parentId: "t1", kind: "bring", title: "Kabel charger Type-C", done: false },
  { id: "c6", parentType: "assignment", parentId: "t2", kind: "step", title: "Identifikasi entitas utama", done: true },
  { id: "c7", parentType: "assignment", parentId: "t2", kind: "step", title: "Tentukan relasi 1-to-Many & Many-to-Many", done: false },
  { id: "c8", parentType: "assignment", parentId: "t2", kind: "bring", title: "Buku catatan grid", done: true },
  { id: "c9", parentType: "assignment", parentId: "b1", kind: "step", title: "Baca rumus dasar turunan limit", done: false },
  { id: "c10", parentType: "assignment", parentId: "b1", kind: "bring", title: "Kalkulator scientific", done: true },
  { id: "c11", parentType: "assignment", parentId: "b2", kind: "step", title: "Kompilasi foto dokumentasi", done: true },
  { id: "c12", parentType: "assignment", parentId: "b2", kind: "step", title: "Tulis kesimpulan mingguan", done: true },
  { id: "c13", parentType: "assignment", parentId: "b2", kind: "bring", title: "Catatan harian PKL", done: true },
];

let checkpoints: Checkpoint[] = [];

let materials: Material[] = [
  { id: "m1", title: "Pengantar Next.js App Router", subjectId: "s1", createdAt: new Date() },
  { id: "m2", title: "Normalisasi Database 1NF - 3NF", subjectId: "s2", createdAt: new Date() },
];

let materialTerms: ChecklistItem[] = [
  { id: "mt1", parentType: "material", parentId: "m1", kind: "term", title: "Server Component vs Client Component", done: false },
  { id: "mt2", parentType: "material", parentId: "m1", kind: "term", title: "Dynamic Routing dan Layouts", done: true },
  { id: "mt3", parentType: "material", parentId: "m2", kind: "term", title: "Kunci Primer dan Kunci Tamu (Foreign Key)", done: true },
];

export const AI_BRIEF =
  "Prioritaskan login form dulu — sudah 65%. ERD bisa kamu selesaikan malam ini setelah makan.";

export function listAssignments(options?: { includeArchived?: boolean }): Assignment[] {
  if (options?.includeArchived) {
    return [...assignments];
  }
  return assignments.filter((a) => !a.archivedAt);
}

export function getAssignment(id: string): Assignment | undefined {
  return assignments.find((a) => a.id === id);
}

export function createAssignment(data: Omit<Assignment, "id" | "createdAt" | "progress" | "status">): Assignment {
  const newAssignment: Assignment = {
    id: "a_" + Math.random().toString(36).substring(2, 9),
    ...data,
    status: "todo",
    progress: 0,
    createdAt: new Date(),
  };
  assignments.unshift(newAssignment);
  return newAssignment;
}

export function updateAssignment(id: string, patch: Partial<Assignment>): Assignment | undefined {
  const index = assignments.findIndex((a) => a.id === id);
  if (index === -1) return undefined;
  assignments[index] = { ...assignments[index], ...patch };
  return assignments[index];
}

export function archiveAssignment(id: string): Assignment | undefined {
  return updateAssignment(id, { archivedAt: new Date().toISOString(), status: "done", progress: 100 });
}

export function restoreAssignment(id: string): Assignment | undefined {
  return updateAssignment(id, { archivedAt: undefined, status: "todo" });
}

export function deleteAssignment(id: string): boolean {
  const lenBefore = assignments.length;
  assignments = assignments.filter((a) => a.id !== id);
  checklistItems = checklistItems.filter((c) => !(c.parentType === "assignment" && c.parentId === id));
  return assignments.length < lenBefore;
}

export function listChecklist(parentType: "assignment" | "material", parentId: string): ChecklistItem[] {
  const source = parentType === "material" ? materialTerms : checklistItems;
  return source.filter((c) => c.parentType === parentType && c.parentId === parentId);
}

export function addChecklistItem(parentType: "assignment" | "material", parentId: string, kind: ChecklistKind, title: string): ChecklistItem {
  const newItem: ChecklistItem = {
    id: "c_" + Math.random().toString(36).substring(2, 9),
    parentType,
    parentId,
    kind,
    title,
    done: false,
  };
  if (parentType === "material") {
    materialTerms.push(newItem);
  } else {
    checklistItems.push(newItem);
    recalculateAssignmentProgress(parentId);
  }
  return newItem;
}

export function toggleChecklistItem(id: string): ChecklistItem | undefined {
  let item = checklistItems.find((c) => c.id === id);
  if (item) {
    item.done = !item.done;
    recalculateAssignmentProgress(item.parentId);
    return item;
  }
  let mItem = materialTerms.find((c) => c.id === id);
  if (mItem) {
    mItem.done = !mItem.done;
    return mItem;
  }
  return undefined;
}

export function deleteChecklistItem(id: string): boolean {
  const len1 = checklistItems.length;
  checklistItems = checklistItems.filter((c) => {
    if (c.id === id) {
      setTimeout(() => recalculateAssignmentProgress(c.parentId), 0);
      return false;
    }
    return true;
  });
  if (checklistItems.length < len1) return true;

  const len2 = materialTerms.length;
  materialTerms = materialTerms.filter((c) => c.id !== id);
  return materialTerms.length < len2;
}

function recalculateAssignmentProgress(assignmentId: string) {
  const items = checklistItems.filter((c) => c.parentType === "assignment" && c.parentId === assignmentId && c.kind === "step");
  if (items.length === 0) return;
  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);
  const status = progress === 100 ? "done" : progress > 0 ? "doing" : "todo";
  updateAssignment(assignmentId, { progress, status });
}

export function addCheckpoint(assignmentId: string, note?: string, imagePath?: string): Checkpoint {
  const cp: Checkpoint = {
    id: "cp_" + Math.random().toString(36).substring(2, 9),
    assignmentId,
    note,
    imagePath,
    createdAt: new Date(),
  };
  checkpoints.push(cp);
  return cp;
}

export function listMaterials(): Material[] {
  return [...materials];
}

export function createMaterial(title: string, subjectId?: string): Material {
  const mat: Material = {
    id: "m_" + Math.random().toString(36).substring(2, 9),
    title,
    subjectId,
    createdAt: new Date(),
  };
  materials.push(mat);
  return mat;
}

// ==========================================
// Skill path ("Jalurmu") — done flags persisted in localStorage
// ==========================================

const SKILL_KEY = "rn_skill_done_v1";
let skillSnapshot: SkillNode[] | null = null;
const skillListeners = new Set<() => void>();

function readSkillNodes(): SkillNode[] {
  try {
    const raw = localStorage.getItem(SKILL_KEY);
    if (!raw) return INITIAL_SKILL_NODES;
    const done = new Set(JSON.parse(raw) as string[]);
    return INITIAL_SKILL_NODES.map((n) => ({ ...n, done: done.has(n.id) }));
  } catch {
    return INITIAL_SKILL_NODES;
  }
}

export function subscribeSkillNodes(callback: () => void): () => void {
  skillListeners.add(callback);
  return () => skillListeners.delete(callback);
}

/** Stable snapshot for useSyncExternalStore (client). */
export function listSkillNodes(): SkillNode[] {
  if (typeof window === "undefined") return INITIAL_SKILL_NODES;
  if (!skillSnapshot) skillSnapshot = readSkillNodes();
  return skillSnapshot;
}

/** Server / first-render snapshot. */
export function listSkillNodesInitial(): SkillNode[] {
  return INITIAL_SKILL_NODES;
}

export function toggleSkillNode(nodeId: string): SkillNode[] {
  skillSnapshot = listSkillNodes().map((n) => (n.id === nodeId ? { ...n, done: !n.done } : n));
  try {
    localStorage.setItem(SKILL_KEY, JSON.stringify(skillSnapshot.filter((n) => n.done).map((n) => n.id)));
  } catch {
    /* ignore */
  }
  skillListeners.forEach((l) => l());
  return skillSnapshot;
}

// ==========================================
// Today's focus checkpoints (Belajar 01) — 3 per recommended topic, per day
// ==========================================

export interface FocusCheckpoint {
  id: string;
  title: string;
  done: boolean;
}

const FOCUS_KEY = "rn_focus_checks_v1";

function defaultFocusCheckpoints(topic: string): FocusCheckpoint[] {
  return [
    { id: "f1", title: `Pahami inti "${topic}" dalam satu kalimat`, done: false },
    { id: "f2", title: "Coba satu contoh kecil sendiri", done: false },
    { id: "f3", title: "Catat satu hal yang masih membingungkan", done: false },
  ];
}

export function getFocusCheckpoints(topic: string): FocusCheckpoint[] {
  try {
    const raw = localStorage.getItem(FOCUS_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { day: string; topic: string; items: FocusCheckpoint[] };
      if (saved.day === todayKey() && saved.topic === topic && Array.isArray(saved.items)) return saved.items;
    }
  } catch {
    /* ignore */
  }
  return defaultFocusCheckpoints(topic);
}

export function toggleFocusCheckpoint(topic: string, id: string): FocusCheckpoint[] {
  const items = getFocusCheckpoints(topic).map((c) => (c.id === id ? { ...c, done: !c.done } : c));
  try {
    localStorage.setItem(FOCUS_KEY, JSON.stringify({ day: todayKey(), topic, items }));
  } catch {
    /* ignore */
  }
  return items;
}

// ==========================================
// Recommendation (Home hero) — cached once per day
// ==========================================

export type RecommendationSource = "ai" | "mock";

export interface StoredRecommendation {
  day: string;
  source: RecommendationSource;
  rec: Recommendation;
  /** Topic the AI originally suggested (before "Ganti topik"). */
  originalTopic: string;
}

const REC_STORAGE_KEY = "rn_recommendation_v1";
let recMemory: StoredRecommendation | null = null;

function readStoredRecommendation(): StoredRecommendation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRecommendation;
    return parsed && typeof parsed.rec?.topic === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/** Today's cached recommendation (memory, then localStorage for AI results), or null. */
export function getCachedRecommendation(): StoredRecommendation | null {
  const day = todayKey();
  if (recMemory?.day === day) return recMemory;
  const stored = readStoredRecommendation();
  if (stored?.day === day) {
    recMemory = stored;
    return stored;
  }
  return null;
}

/**
 * Save today's recommendation. AI results persist for the day (localStorage);
 * the mock fallback stays in memory only, so a later visit tries the AI again.
 */
export function saveRecommendation(rec: Recommendation, source: RecommendationSource, originalTopic?: string): StoredRecommendation {
  const entry: StoredRecommendation = { day: todayKey(), source, rec, originalTopic: originalTopic ?? rec.topic };
  recMemory = entry;
  if (source === "ai" && typeof window !== "undefined") {
    try {
      localStorage.setItem(REC_STORAGE_KEY, JSON.stringify(entry));
    } catch {
      /* storage full / unavailable: memory cache is enough */
    }
  }
  return entry;
}

/** Clearly-labelled mock used when the AI route is unavailable. */
export function getFallbackRecommendation(): Recommendation {
  return getMockRecommendation();
}

/** "Ganti topik": rotate to the next alternative locally, without calling the API. */
export function switchRecommendationTopic(): StoredRecommendation | null {
  const current = getCachedRecommendation();
  if (!current || current.rec.alternatives.length === 0) return current;
  const { rec } = current;
  const [next, ...rest] = rec.alternatives;
  const updated: Recommendation = {
    ...rec,
    topic: next.topic,
    tier: next.tier,
    minutes: next.minutes,
    // radarItemId belonged to the original topic only
    radarItemId: next.topic === current.originalTopic ? rec.radarItemId : undefined,
    alternatives: [...rest, { topic: rec.topic, tier: rec.tier, minutes: rec.minutes }],
  };
  return saveRecommendation(updated, current.source, current.originalTopic);
}

/** Request body for POST /api/ai/recommend — no personal data (no names, no notes). */
export function buildRecommendationRequest(): {
  tasks: { subject: string; title: string; dueInHours: number }[];
  doneTopics: string[];
} {
  const nowMs = Date.now();
  const tasks = listAssignments()
    .filter((a) => a.status !== "done")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 10)
    .map((a) => ({
      subject: a.subject,
      title: a.title,
      dueInHours: Math.round(((new Date(a.dueAt).getTime() - nowMs) / 3600000) * 10) / 10,
    }));
  const doneTopics = listSkillNodes().filter((n) => n.done).map((n) => n.title);
  return { tasks, doneTopics };
}

let recInFlight: Promise<StoredRecommendation> | null = null;

/**
 * Today's recommendation for Home AND Belajar (shared, so the API is called at most once):
 * cached entry -> POST /api/ai/recommend -> labelled mock fallback. Never throws.
 */
export function loadTodayRecommendation(): Promise<StoredRecommendation> {
  const cached = getCachedRecommendation();
  if (cached) return Promise.resolve(cached);
  if (recInFlight) return recInFlight;
  recInFlight = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRecommendationRequest()),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = (await res.json()) as { recommendation?: Recommendation };
        const rec = data.recommendation;
        if (rec && typeof rec.topic === "string" && rec.topic) {
          return saveRecommendation({ ...rec, alternatives: Array.isArray(rec.alternatives) ? rec.alternatives : [] }, "ai");
        }
      }
    } catch {
      /* network error / timeout: fall back below */
    } finally {
      clearTimeout(timer);
    }
    return saveRecommendation(getFallbackRecommendation(), "mock");
  })().finally(() => {
    recInFlight = null;
  });
  return recInFlight;
}

/** Session link for a recommendation (Home hero + Belajar "Fokus hari ini"). */
export function sessionHrefFor(rec: Recommendation): string {
  return `/belajar/sesi/${encodeURIComponent(rec.radarItemId || "rekomendasi")}`;
}

// ==========================================
// Tech-stack roadmap (GET/POST /api/ai/radar) with offline seed
// ==========================================

export interface RadarLoad {
  radar: Radar;
  stale: boolean;
  /** true = API unavailable, showing the local seed ("Roadmap awal (offline)"). */
  offline: boolean;
}

function isRadar(v: unknown): v is Radar {
  return typeof v === "object" && v !== null && Array.isArray((v as Radar).items) && Array.isArray((v as Radar).pending);
}

export async function loadRadar(): Promise<RadarLoad> {
  try {
    const res = await fetch("/api/ai/radar", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { radar?: unknown; stale?: boolean };
      if (isRadar(data.radar)) {
        return { radar: { ...data.radar, sources: data.radar.sources ?? [] }, stale: data.stale === true, offline: false };
      }
    }
  } catch {
    /* fall through to the seed */
  }
  return { radar: OFFLINE_RADAR, stale: false, offline: true };
}

/** apply / dismiss a pending change (by index) or refresh. Returns null on failure. */
export async function updateRadar(action: "apply" | "dismiss" | "refresh", index?: number): Promise<RadarLoad | null> {
  try {
    const res = await fetch("/api/ai/radar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(index === undefined ? { action } : { action, index }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { radar?: unknown; stale?: boolean };
    return isRadar(data.radar) ? { radar: data.radar, stale: data.stale === true, offline: false } : null;
  } catch {
    return null;
  }
}

// ==========================================
// "Tanya dikit" (POST /api/ai/ask)
// ==========================================

export type AskMode = "normal" | "analogy" | "hint" | "quiz";
export interface AskTurn {
  role: "user" | "model";
  text: string;
}
export type AskResult =
  | { ok: true; answer: string; sources: Source[] }
  | { ok: false; reason: "budget" | "rate_limit" | "unavailable" };

export async function askTutor(question: string, history: AskTurn[], mode: AskMode, search: boolean): Promise<AskResult> {
  try {
    const res = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history: history.slice(-6), mode, search }),
    });
    const data = (await res.json().catch(() => ({}))) as { answer?: unknown; sources?: unknown; code?: unknown };
    if (res.ok && typeof data.answer === "string" && data.answer.trim()) {
      const sources = Array.isArray(data.sources)
        ? (data.sources as Source[]).filter((x) => typeof x?.url === "string" && /^https?:\/\//.test(x.url))
        : [];
      return { ok: true, answer: data.answer, sources };
    }
    if (data.code === "budget") return { ok: false, reason: "budget" };
    if (data.code === "rate_limit") return { ok: false, reason: "rate_limit" };
    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
