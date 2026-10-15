/**
 * lib/repo.ts
 * The ONLY data layer of the app. Pages and components never touch storage directly.
 *
 * How it works:
 * - Data lives on this device in IndexedDB (database "belajar", see lib/db.ts).
 * - On the first client render `ensureRepoReady()` loads everything into memory once.
 *   First run ever: the starter data (lib/mock/seed.ts) is written, and old localStorage
 *   values from earlier versions are migrated once.
 * - Reads are synchronous from that in-memory copy. Writes update memory right away,
 *   notify subscribers (see lib/useRepo.ts) and are saved to IndexedDB in the background,
 *   in order. `flushRepo()` waits until everything is saved.
 * - On the server there is no IndexedDB: the repo stays "not ready" and components render
 *   a quiet placeholder, so server HTML and the first client render always match.
 * - If IndexedDB is unavailable (rare private modes), the app still works in memory and
 *   `getStorageMode()` returns "memory" so the UI can say data is temporary.
 */

import type { Assignment, ChecklistItem, ChecklistKind, Checkpoint, Material } from "./types";
import { INITIAL_SKILL_NODES, type SkillNode } from "./mock/learning";
import { OFFLINE_RADAR } from "./mock/radar";
import { buildSeed } from "./mock/seed";
import type { Radar, Recommendation, Source } from "./ai/types";
import { getMockRecommendation } from "./mock/recommendation";
import { DB_VERSION, getAll, getAllKv, isIndexedDbAvailable, write, type WriteOp } from "./db";
import { buildBackupFile, parseBackup, type BackupFile, type ParseResult, type ParsedBackup } from "./backup";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const newId = (prefix: string): string => prefix + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-3);

// ==========================================
// State, settings and kv keys
// ==========================================

export interface Settings {
  /** "Atmosfer": rain video + bokeh on the Home hero. */
  atmosphere: boolean;
  /** "Pengingat deadline". Only effective with Notification permission "granted". */
  reminders: boolean;
  /** The swipe hint above the task list was dismissed (a row's actions were opened once). */
  swipeHintSeen: boolean;
  /** The one-time swipe nudge animation on the first row already ran. */
  swipeNudgeSeen: boolean;
}

const DEFAULT_SETTINGS: Settings = { atmosphere: true, reminders: false, swipeHintSeen: false, swipeNudgeSeen: false };

export interface FocusCheckpoint {
  id: string;
  title: string;
  done: boolean;
}

interface FocusState {
  day: string;
  topic: string;
  items: FocusCheckpoint[];
}

export type RecommendationSource = "ai" | "mock";

export interface StoredRecommendation {
  day: string;
  source: RecommendationSource;
  rec: Recommendation;
  /** Topic the AI originally suggested (before "Ganti topik"). */
  originalTopic: string;
}

interface RadarCache {
  radar: Radar;
  stale: boolean;
  savedAt: string;
}

const KV = {
  settings: "settings",
  skillDone: "progress.skillDone",
  focus: "progress.focus",
  recommendation: "cache.recommendation",
  radar: "cache.radar",
  remindersSent: "reminders.sent",
  seededAt: "meta.seededAt",
  migratedLocalStorage: "meta.localStorageMigrated",
} as const;

/** kv keys that belong in a backup (meta flags are device-specific). */
const BACKUP_KV_KEYS = [KV.settings, KV.skillDone, KV.focus, KV.recommendation, KV.radar, KV.remindersSent] as const;

interface RepoState {
  assignments: Assignment[];
  checklist: ChecklistItem[];
  checkpoints: Checkpoint[];
  materials: Material[];
  settings: Settings;
  skillDone: string[];
  focus: FocusState | null;
  recommendation: StoredRecommendation | null;
  radar: RadarCache | null;
  remindersSent: Record<string, number>;
}

function emptyState(): RepoState {
  return {
    assignments: [],
    checklist: [],
    checkpoints: [],
    materials: [],
    settings: { ...DEFAULT_SETTINGS },
    skillDone: INITIAL_SKILL_NODES.filter((n) => n.done).map((n) => n.id),
    focus: null,
    recommendation: null,
    radar: null,
    remindersSent: {},
  };
}

let state: RepoState = emptyState();
/** Mock recommendations are kept in memory only, so a later visit tries the AI again. */
let mockRecommendation: StoredRecommendation | null = null;

// ==========================================
// Readiness + subscriptions (used by lib/useRepo.ts)
// ==========================================

export type StorageMode = "loading" | "indexeddb" | "memory";
let storageMode: StorageMode = "loading";
/** 0 = not loaded yet. Increases on every change; used as the useSyncExternalStore snapshot. */
let version = 0;
const listeners = new Set<() => void>();
let readyPromise: Promise<void> | null = null;

function emit(): void {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeRepo(callback: () => void): () => void {
  listeners.add(callback);
  void ensureRepoReady();
  return () => {
    listeners.delete(callback);
  };
}

export function getRepoVersion(): number {
  return version;
}

export function isRepoReady(): boolean {
  return version > 0;
}

export function getStorageMode(): StorageMode {
  return storageMode;
}

/** Loads the device database once (client only). Safe to call many times. */
export function ensureRepoReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!readyPromise) {
    readyPromise = loadFromDevice().then(
      (loaded) => {
        state = loaded;
        storageMode = "indexeddb";
        emit();
      },
      () => {
        // No IndexedDB: keep working in memory with the starter data.
        const seed = buildSeed();
        state = { ...emptyState(), ...seed };
        storageMode = "memory";
        emit();
      }
    );
  }
  return readyPromise;
}

// ---- background writes, strictly in order ----

let writeChain: Promise<void> = Promise.resolve();

function persist(ops: WriteOp[]): void {
  if (storageMode !== "indexeddb" || ops.length === 0) return;
  writeChain = writeChain
    .then(() => write(ops))
    .catch((err: unknown) => {
      console.warn("[repo] saving to IndexedDB failed", err);
    });
}

/** Resolves when every pending write has been saved. */
export function flushRepo(): Promise<void> {
  return writeChain;
}

const putRecord = (store: "assignments" | "checklist" | "checkpoints" | "materials", value: { id: string }): WriteOp => ({ store, type: "put", value });
const delRecord = (store: "assignments" | "checklist" | "checkpoints" | "materials", key: string): WriteOp => ({ store, type: "delete", key });
const putKv = (key: string, value: unknown): WriteOp => ({ store: "kv", type: "put", key, value });

// ==========================================
// Loading, seeding, localStorage migration
// ==========================================

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function readSettings(v: unknown): Settings {
  const s = isObj(v) ? v : {};
  const bool = (key: keyof Settings): boolean => (typeof s[key] === "boolean" ? (s[key] as boolean) : DEFAULT_SETTINGS[key]);
  return { atmosphere: bool("atmosphere"), reminders: bool("reminders"), swipeHintSeen: bool("swipeHintSeen"), swipeNudgeSeen: bool("swipeNudgeSeen") };
}

function readStringList(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : null;
}

function readFocus(v: unknown): FocusState | null {
  if (!isObj(v) || typeof v.day !== "string" || typeof v.topic !== "string" || !Array.isArray(v.items)) return null;
  const items = v.items.filter(
    (i): i is FocusCheckpoint => isObj(i) && typeof i.id === "string" && typeof i.title === "string" && typeof i.done === "boolean"
  );
  return { day: v.day, topic: v.topic, items };
}

function readRecommendation(v: unknown): StoredRecommendation | null {
  if (!isObj(v) || typeof v.day !== "string" || !isObj(v.rec) || typeof v.rec.topic !== "string") return null;
  if (v.source !== "ai") return null; // only AI results are cached on the device
  const rec = v.rec as Recommendation;
  return {
    day: v.day,
    source: "ai",
    rec: { ...rec, alternatives: Array.isArray(rec.alternatives) ? rec.alternatives : [] },
    originalTopic: typeof v.originalTopic === "string" ? v.originalTopic : rec.topic,
  };
}

function isRadar(v: unknown): v is Radar {
  return isObj(v) && Array.isArray(v.items) && Array.isArray(v.pending);
}

function readRadarCache(v: unknown): RadarCache | null {
  if (!isObj(v) || !isRadar(v.radar)) return null;
  return { radar: { ...v.radar, sources: Array.isArray(v.radar.sources) ? v.radar.sources : [] }, stale: v.stale === true, savedAt: typeof v.savedAt === "string" ? v.savedAt : "" };
}

function readRemindersSent(v: unknown): Record<string, number> {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(v)) if (typeof n === "number") out[k] = n;
  return out;
}

/** Fills the kv part of the state from raw kv values (device load and backup import). */
function kvToState(kv: Obj): Pick<RepoState, "settings" | "skillDone" | "focus" | "recommendation" | "radar" | "remindersSent"> {
  return {
    settings: readSettings(kv[KV.settings]),
    skillDone: readStringList(kv[KV.skillDone]) ?? emptyState().skillDone,
    focus: readFocus(kv[KV.focus]),
    recommendation: readRecommendation(kv[KV.recommendation]),
    radar: readRadarCache(kv[KV.radar]),
    remindersSent: readRemindersSent(kv[KV.remindersSent]),
  };
}

function stateToKvOps(s: RepoState): WriteOp[] {
  return [
    putKv(KV.settings, s.settings),
    putKv(KV.skillDone, s.skillDone),
    putKv(KV.remindersSent, s.remindersSent),
    s.focus ? putKv(KV.focus, s.focus) : { store: "kv", type: "delete", key: KV.focus },
    s.recommendation ? putKv(KV.recommendation, s.recommendation) : { store: "kv", type: "delete", key: KV.recommendation },
    s.radar ? putKv(KV.radar, s.radar) : { store: "kv", type: "delete", key: KV.radar },
  ];
}

/** Old localStorage keys from before IndexedDB (read once, then removed). */
const LEGACY = {
  skill: "rn_skill_done_v1",
  focus: "rn_focus_checks_v1",
  recommendation: "rn_recommendation_v1",
  atmosphere: "rn_rain_enabled",
  swipeHint: "rn_swipe_hint_shown",
  swipeNudge: "rn_swipe_nudge_shown",
} as const;

function readLegacyJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

/** Builds kv values from old localStorage entries. Only keys that exist are returned. */
function migrateLocalStorage(): Obj {
  const out: Obj = {};
  try {
    const skill = readStringList(readLegacyJson(LEGACY.skill));
    if (skill) out[KV.skillDone] = skill;
    const focus = readFocus(readLegacyJson(LEGACY.focus));
    if (focus) out[KV.focus] = focus;
    const rec = readRecommendation(readLegacyJson(LEGACY.recommendation));
    if (rec) out[KV.recommendation] = rec;
    const ls = window.localStorage;
    const settings: Partial<Settings> = {};
    if (ls.getItem(LEGACY.atmosphere) !== null) settings.atmosphere = ls.getItem(LEGACY.atmosphere) !== "false";
    if (ls.getItem(LEGACY.swipeHint) === "true") settings.swipeHintSeen = true;
    if (ls.getItem(LEGACY.swipeNudge) !== null) settings.swipeNudgeSeen = true;
    if (Object.keys(settings).length > 0) out[KV.settings] = { ...DEFAULT_SETTINGS, ...settings };
  } catch {
    /* localStorage blocked: nothing to migrate */
  }
  return out;
}

function clearLegacyLocalStorage(): void {
  try {
    Object.values(LEGACY).forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

async function loadFromDevice(): Promise<RepoState> {
  if (!isIndexedDbAvailable()) throw new Error("IndexedDB unavailable");
  let kv = await getAllKv();
  const ops: WriteOp[] = [];

  if (!kv[KV.migratedLocalStorage]) {
    const migrated = migrateLocalStorage();
    for (const [key, value] of Object.entries(migrated)) {
      if (kv[key] === undefined) ops.push(putKv(key, value));
    }
    ops.push(putKv(KV.migratedLocalStorage, new Date().toISOString()));
    kv = { ...migrated, ...kv };
  }

  if (!kv[KV.seededAt]) {
    const seed = buildSeed();
    seed.assignments.forEach((a) => ops.push(putRecord("assignments", a)));
    seed.checklist.forEach((c) => ops.push(putRecord("checklist", c)));
    seed.materials.forEach((m) => ops.push(putRecord("materials", m)));
    ops.push(putKv(KV.seededAt, new Date().toISOString()));
  }

  if (ops.length > 0) {
    await write(ops);
    clearLegacyLocalStorage();
  }

  const [assignments, checklist, checkpoints, materials] = await Promise.all([
    getAll<Assignment>("assignments"),
    getAll<ChecklistItem>("checklist"),
    getAll<Checkpoint>("checkpoints"),
    getAll<Material>("materials"),
  ]);

  return {
    assignments: assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    checklist,
    checkpoints,
    materials: materials.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    ...kvToState(kv),
  };
}

// ==========================================
// Settings
// ==========================================

export function getSettings(): Settings {
  return state.settings;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  state = { ...state, settings: { ...state.settings, ...patch } };
  persist([putKv(KV.settings, state.settings)]);
  emit();
  return state.settings;
}

// ==========================================
// Assignments (PR)
// ==========================================

export function listAssignments(options?: { includeArchived?: boolean }): Assignment[] {
  if (options?.includeArchived) return [...state.assignments];
  return state.assignments.filter((a) => !a.archivedAt);
}

export function getAssignment(id: string): Assignment | undefined {
  return state.assignments.find((a) => a.id === id);
}

export function createAssignment(data: Omit<Assignment, "id" | "createdAt" | "progress" | "status">): Assignment {
  const created: Assignment = {
    id: newId("a_"),
    ...data,
    status: "todo",
    progress: 0,
    createdAt: new Date(),
  };
  state = { ...state, assignments: [created, ...state.assignments] };
  persist([putRecord("assignments", created)]);
  emit();
  return created;
}

export function updateAssignment(id: string, patch: Partial<Assignment>): Assignment | undefined {
  const current = getAssignment(id);
  if (!current) return undefined;
  // Drop keys explicitly set to undefined (e.g. archivedAt on restore).
  const merged: Assignment = { ...current, ...patch, id };
  const updated = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined)) as unknown as Assignment;
  state = { ...state, assignments: state.assignments.map((a) => (a.id === id ? updated : a)) };
  persist([putRecord("assignments", updated)]);
  emit();
  return updated;
}

export function archiveAssignment(id: string): Assignment | undefined {
  return updateAssignment(id, { archivedAt: new Date().toISOString(), status: "done", progress: 100 });
}

export function restoreAssignment(id: string): Assignment | undefined {
  return updateAssignment(id, { archivedAt: undefined, status: "todo" });
}

export function deleteAssignment(id: string): boolean {
  if (!getAssignment(id)) return false;
  const removedChecklist = state.checklist.filter((c) => c.parentType === "assignment" && c.parentId === id);
  const removedCheckpoints = state.checkpoints.filter((c) => c.assignmentId === id);
  state = {
    ...state,
    assignments: state.assignments.filter((a) => a.id !== id),
    checklist: state.checklist.filter((c) => !(c.parentType === "assignment" && c.parentId === id)),
    checkpoints: state.checkpoints.filter((c) => c.assignmentId !== id),
  };
  persist([
    delRecord("assignments", id),
    ...removedChecklist.map((c) => delRecord("checklist", c.id)),
    ...removedCheckpoints.map((c) => delRecord("checkpoints", c.id)),
  ]);
  emit();
  return true;
}

// ==========================================
// Checklists (assignment steps / things to bring, material terms)
// ==========================================

export function listChecklist(parentType: "assignment" | "material", parentId: string): ChecklistItem[] {
  return state.checklist.filter((c) => c.parentType === parentType && c.parentId === parentId);
}

export function addChecklistItem(
  parentType: "assignment" | "material",
  parentId: string,
  kind: ChecklistKind,
  title: string,
  done = false
): ChecklistItem {
  const item: ChecklistItem = { id: newId("c_"), parentType, parentId, kind, title, done };
  state = { ...state, checklist: [...state.checklist, item] };
  persist([putRecord("checklist", item)]);
  if (parentType === "assignment") recalculateAssignmentProgress(parentId);
  emit();
  return item;
}

export function toggleChecklistItem(id: string): ChecklistItem | undefined {
  const current = state.checklist.find((c) => c.id === id);
  if (!current) return undefined;
  const updated = { ...current, done: !current.done };
  state = { ...state, checklist: state.checklist.map((c) => (c.id === id ? updated : c)) };
  persist([putRecord("checklist", updated)]);
  if (updated.parentType === "assignment") recalculateAssignmentProgress(updated.parentId);
  emit();
  return updated;
}

export function deleteChecklistItem(id: string): boolean {
  const current = state.checklist.find((c) => c.id === id);
  if (!current) return false;
  state = { ...state, checklist: state.checklist.filter((c) => c.id !== id) };
  persist([delRecord("checklist", id)]);
  if (current.parentType === "assignment") recalculateAssignmentProgress(current.parentId);
  emit();
  return true;
}

function recalculateAssignmentProgress(assignmentId: string): void {
  const steps = state.checklist.filter((c) => c.parentType === "assignment" && c.parentId === assignmentId && c.kind === "step");
  if (steps.length === 0) return;
  const progress = Math.round((steps.filter((i) => i.done).length / steps.length) * 100);
  const a = getAssignment(assignmentId);
  if (!a || a.archivedAt) return;
  const status = progress === 100 ? "done" : progress > 0 ? "doing" : "todo";
  if (a.progress !== progress || a.status !== status) updateAssignment(assignmentId, { progress, status });
}

// ==========================================
// Checkpoints
// ==========================================

export function addCheckpoint(assignmentId: string, note?: string, imagePath?: string): Checkpoint {
  const cp: Checkpoint = { id: newId("cp_"), assignmentId, note, imagePath, createdAt: new Date() };
  state = { ...state, checkpoints: [...state.checkpoints, cp] };
  persist([putRecord("checkpoints", cp)]);
  emit();
  return cp;
}

export function listCheckpoints(assignmentId: string): Checkpoint[] {
  return state.checkpoints.filter((c) => c.assignmentId === assignmentId);
}

// ==========================================
// Materials
// ==========================================

export function listMaterials(): Material[] {
  return [...state.materials];
}

export function getMaterial(id: string): Material | undefined {
  return state.materials.find((m) => m.id === id);
}

export function createMaterial(title: string, subjectId?: string): Material {
  const mat: Material = { id: newId("m_"), title, subjectId, createdAt: new Date() };
  state = { ...state, materials: [...state.materials, mat] };
  persist([putRecord("materials", mat)]);
  emit();
  return mat;
}

// ==========================================
// Skill path ("Jalurmu")
// ==========================================

export function listSkillNodes(): SkillNode[] {
  const done = new Set(state.skillDone);
  return INITIAL_SKILL_NODES.map((n) => ({ ...n, done: done.has(n.id) }));
}

export function toggleSkillNode(nodeId: string): SkillNode[] {
  const done = new Set(state.skillDone);
  if (done.has(nodeId)) done.delete(nodeId);
  else done.add(nodeId);
  state = { ...state, skillDone: Array.from(done) };
  persist([putKv(KV.skillDone, state.skillDone)]);
  emit();
  return listSkillNodes();
}

// ==========================================
// Today's focus checkpoints (Belajar 01) — 3 per recommended topic, per day
// ==========================================

function defaultFocusCheckpoints(topic: string): FocusCheckpoint[] {
  return [
    { id: "f1", title: `Pahami inti "${topic}" dalam satu kalimat`, done: false },
    { id: "f2", title: "Coba satu contoh kecil sendiri", done: false },
    { id: "f3", title: "Catat satu hal yang masih membingungkan", done: false },
  ];
}

export function getFocusCheckpoints(topic: string): FocusCheckpoint[] {
  const f = state.focus;
  if (f && f.day === todayKey() && f.topic === topic) return f.items;
  return defaultFocusCheckpoints(topic);
}

export function toggleFocusCheckpoint(topic: string, id: string): FocusCheckpoint[] {
  const items = getFocusCheckpoints(topic).map((c) => (c.id === id ? { ...c, done: !c.done } : c));
  state = { ...state, focus: { day: todayKey(), topic, items } };
  persist([putKv(KV.focus, state.focus)]);
  emit();
  return items;
}

// ==========================================
// Recommendation (Home hero) — cached once per day
// ==========================================

/** Today's cached recommendation, or null. */
export function getCachedRecommendation(): StoredRecommendation | null {
  const day = todayKey();
  if (mockRecommendation?.day === day) return mockRecommendation;
  if (state.recommendation?.day === day) return state.recommendation;
  return null;
}

/**
 * Save today's recommendation. AI results are saved on the device for the day;
 * the mock fallback stays in memory only, so a later visit tries the AI again.
 */
export function saveRecommendation(rec: Recommendation, source: RecommendationSource, originalTopic?: string): StoredRecommendation {
  const entry: StoredRecommendation = { day: todayKey(), source, rec, originalTopic: originalTopic ?? rec.topic };
  if (source === "ai") {
    mockRecommendation = null;
    state = { ...state, recommendation: entry };
    persist([putKv(KV.recommendation, entry)]);
    emit();
  } else {
    mockRecommendation = entry;
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
  if (recInFlight) return recInFlight;
  recInFlight = (async () => {
    await ensureRepoReady();
    const cached = getCachedRecommendation();
    if (cached) return cached;
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
// Tech-stack roadmap (GET/POST /api/ai/radar), last good copy cached on the device
// ==========================================

export interface RadarLoad {
  radar: Radar;
  stale: boolean;
  /** true = API unavailable, showing the local seed ("Roadmap awal (offline)"). */
  offline: boolean;
  /** true = API unavailable, showing the last copy saved on this device. */
  fromCache?: boolean;
}

function saveRadarCache(radar: Radar, stale: boolean): void {
  state = { ...state, radar: { radar, stale, savedAt: new Date().toISOString() } };
  persist([putKv(KV.radar, state.radar)]);
  emit();
}

export async function loadRadar(): Promise<RadarLoad> {
  try {
    const res = await fetch("/api/ai/radar", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { radar?: unknown; stale?: boolean };
      if (isRadar(data.radar)) {
        const radar = { ...data.radar, sources: data.radar.sources ?? [] };
        await ensureRepoReady();
        saveRadarCache(radar, data.stale === true);
        return { radar, stale: data.stale === true, offline: false };
      }
    }
  } catch {
    /* fall through to the cache / seed */
  }
  await ensureRepoReady();
  if (state.radar) return { radar: state.radar.radar, stale: false, offline: false, fromCache: true };
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
    if (!isRadar(data.radar)) return null;
    saveRadarCache(data.radar, data.stale === true);
    return { radar: data.radar, stale: data.stale === true, offline: false };
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

// ==========================================
// Learning session (/belajar/sesi/[id]) — mock content helpers
// ==========================================

/** Title for a session: the material, today's recommended topic, or a generic label. */
export function getSessionTitle(id: string): string {
  const mat = getMaterial(id);
  if (mat) return mat.title;
  const rec = getCachedRecommendation()?.rec;
  if (rec && (id === "rekomendasi" || id === rec.radarItemId)) return rec.topic;
  return "Sesi belajar";
}

/** Seeds 3 sample terms the first time a session has none. Call from an effect, not render. */
export function ensureSessionTerms(id: string): ChecklistItem[] {
  const existing = listChecklist("material", id);
  if (existing.length > 0) return existing;
  const seeded: ChecklistItem[] = ["Server Component", "Client Component", "Direktif 'use client'"].map((t, i) => ({
    id: `seed_${id}_${i}`,
    parentType: "material",
    parentId: id,
    kind: "term",
    title: t,
    done: false,
  }));
  state = { ...state, checklist: [...state.checklist, ...seeded] };
  persist(seeded.map((c) => putRecord("checklist", c)));
  emit();
  return seeded;
}

/** One-sentence reflection, saved as a (done) checkpoint on the material. */
export function saveSessionReflection(id: string, sentence: string): ChecklistItem {
  return addChecklistItem("material", id, "term", `Refleksi: ${sentence}`, true);
}

// ==========================================
// Deadline reminders log (lib/reminders.ts) — which task/threshold was already notified
// ==========================================

export function getRemindersSent(): Record<string, number> {
  return state.remindersSent;
}

/** Marks reminder keys as sent/scheduled and drops entries older than `pruneBefore`. */
export function markRemindersSent(keys: string[], at: number, pruneBefore?: number): void {
  const next: Record<string, number> = {};
  for (const [k, t] of Object.entries(state.remindersSent)) {
    if (pruneBefore === undefined || t >= pruneBefore) next[k] = t;
  }
  keys.forEach((k) => {
    next[k] = at;
  });
  state = { ...state, remindersSent: next };
  persist([putKv(KV.remindersSent, next)]);
  // No emit(): the reminder log never changes what the UI shows.
}

// ==========================================
// "Cadangan data": export / import a JSON backup
// ==========================================

export async function exportBackup(): Promise<BackupFile> {
  await ensureRepoReady();
  await flushRepo();
  const kv: Record<string, unknown> = {};
  const values: Record<(typeof BACKUP_KV_KEYS)[number], unknown> = {
    [KV.settings]: state.settings,
    [KV.skillDone]: state.skillDone,
    [KV.focus]: state.focus,
    [KV.recommendation]: state.recommendation,
    [KV.radar]: state.radar,
    [KV.remindersSent]: state.remindersSent,
  };
  BACKUP_KV_KEYS.forEach((k) => {
    if (values[k] !== null && values[k] !== undefined) kv[k] = values[k];
  });
  return buildBackupFile(DB_VERSION, {
    assignments: state.assignments,
    checklist: state.checklist,
    checkpoints: state.checkpoints,
    materials: state.materials,
    kv,
  });
}

/** Validates a backup file's text without changing anything. */
export function readBackupFile(text: string): ParseResult {
  return parseBackup(text, DB_VERSION);
}

/** Replaces ALL data on this device with the backup (one transaction). */
export async function restoreBackup(backup: ParsedBackup): Promise<void> {
  await ensureRepoReady();
  await flushRepo();
  const next: RepoState = {
    assignments: [...backup.assignments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    checklist: backup.checklist,
    checkpoints: backup.checkpoints,
    materials: [...backup.materials].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    ...kvToState(backup.kv),
  };
  if (storageMode === "indexeddb") {
    const ops: WriteOp[] = [
      { store: "assignments", type: "clear" },
      { store: "checklist", type: "clear" },
      { store: "checkpoints", type: "clear" },
      { store: "materials", type: "clear" },
      ...next.assignments.map((a) => putRecord("assignments", a)),
      ...next.checklist.map((c) => putRecord("checklist", c)),
      ...next.checkpoints.map((c) => putRecord("checkpoints", c)),
      ...next.materials.map((m) => putRecord("materials", m)),
      ...stateToKvOps(next),
    ];
    await write(ops); // throws on failure, so the caller can show an error and nothing changes
  }
  state = next;
  mockRecommendation = null;
  emit();
}
