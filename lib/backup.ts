/**
 * lib/backup.ts
 * JSON backup format for "Cadangan data" (Ekspor / Impor) and its validation.
 * Pure functions only — reading and writing the database stays in lib/repo.ts.
 */
import type { Assignment, ChecklistItem, Checkpoint, Material } from "./types";

export const BACKUP_APP = "belajar";
export const BACKUP_FORMAT = 1;

/** Dates are ISO strings inside the file. */
export interface BackupFile {
  app: typeof BACKUP_APP;
  format: typeof BACKUP_FORMAT;
  /** Database schema version that wrote the file. */
  schemaVersion: number;
  exportedAt: string;
  data: {
    assignments: BackupAssignment[];
    checklist: ChecklistItem[];
    checkpoints: BackupCheckpoint[];
    materials: BackupMaterial[];
    /** Settings, Jalurmu progress, caches, reminder log. Unknown keys are ignored on import. */
    kv: Record<string, unknown>;
  };
}

type WithIsoDates<T, K extends keyof T> = Omit<T, K> & { [P in K]: string };
export type BackupAssignment = WithIsoDates<Assignment, "dueAt" | "createdAt">;
export type BackupCheckpoint = WithIsoDates<Checkpoint, "createdAt">;
export type BackupMaterial = WithIsoDates<Material, "createdAt">;

export interface ParsedBackup {
  assignments: Assignment[];
  checklist: ChecklistItem[];
  checkpoints: Checkpoint[];
  materials: Material[];
  kv: Record<string, unknown>;
  exportedAt: string;
}

export type ParseResult = { ok: true; backup: ParsedBackup } | { ok: false; error: string };

// ---------- small guards ----------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isOptStr = (v: unknown): v is string | undefined => v === undefined || typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function toDate(v: unknown): Date | null {
  if (!isStr(v) && !(v instanceof Date)) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseAssignment(v: unknown): Assignment | null {
  if (!isObj(v)) return null;
  const dueAt = toDate(v.dueAt);
  const createdAt = toDate(v.createdAt);
  if (!isStr(v.id) || !isStr(v.subject) || !isStr(v.title) || !dueAt || !createdAt) return null;
  if (v.priority !== 1 && v.priority !== 2 && v.priority !== 3) return null;
  if (v.status !== "todo" && v.status !== "doing" && v.status !== "done") return null;
  if (!isNum(v.progress) || v.progress < 0 || v.progress > 100) return null;
  if (!isOptStr(v.subjectId) || !isOptStr(v.description) || !isOptStr(v.archivedAt)) return null;
  if (v.estMinutes !== undefined && !isNum(v.estMinutes)) return null;
  return {
    id: v.id,
    subjectId: v.subjectId,
    subject: v.subject,
    title: v.title,
    description: v.description,
    dueAt,
    priority: v.priority,
    status: v.status,
    progress: v.progress,
    estMinutes: v.estMinutes,
    createdAt,
    archivedAt: v.archivedAt,
  };
}

function parseChecklistItem(v: unknown): ChecklistItem | null {
  if (!isObj(v)) return null;
  if (!isStr(v.id) || !isStr(v.parentId) || !isStr(v.title) || typeof v.done !== "boolean") return null;
  if (v.parentType !== "assignment" && v.parentType !== "material") return null;
  if (v.kind !== "step" && v.kind !== "bring" && v.kind !== "term") return null;
  return { id: v.id, parentType: v.parentType, parentId: v.parentId, kind: v.kind, title: v.title, done: v.done };
}

function parseCheckpoint(v: unknown): Checkpoint | null {
  if (!isObj(v)) return null;
  const createdAt = toDate(v.createdAt);
  if (!isStr(v.id) || !isStr(v.assignmentId) || !createdAt) return null;
  if (!isOptStr(v.note) || !isOptStr(v.imagePath)) return null;
  return { id: v.id, assignmentId: v.assignmentId, note: v.note, imagePath: v.imagePath, createdAt };
}

function parseMaterial(v: unknown): Material | null {
  if (!isObj(v)) return null;
  const createdAt = toDate(v.createdAt);
  if (!isStr(v.id) || !isStr(v.title) || !createdAt || !isOptStr(v.subjectId)) return null;
  return { id: v.id, title: v.title, subjectId: v.subjectId, createdAt };
}

function parseList<T>(v: unknown, parse: (x: unknown) => T | null): T[] | null {
  if (!Array.isArray(v)) return null;
  const out: T[] = [];
  for (const item of v) {
    const parsed = parse(item);
    if (!parsed) return null;
    out.push(parsed);
  }
  return out;
}

/** Validates a backup file's text. Errors are short Indonesian sentences for the UI. */
export function parseBackup(text: string, maxSchemaVersion: number): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "File ini bukan JSON yang valid." };
  }
  if (!isObj(raw) || raw.app !== BACKUP_APP || !isObj(raw.data)) {
    return { ok: false, error: "File ini bukan cadangan dari aplikasi Belajar." };
  }
  if (raw.format !== BACKUP_FORMAT || !isNum(raw.schemaVersion) || raw.schemaVersion > maxSchemaVersion) {
    return { ok: false, error: "Versi cadangan tidak dikenali. Perbarui aplikasi lalu coba lagi." };
  }
  const d = raw.data;
  const assignments = parseList(d.assignments, parseAssignment);
  const checklist = parseList(d.checklist, parseChecklistItem);
  const checkpoints = parseList(d.checkpoints, parseCheckpoint);
  const materials = parseList(d.materials, parseMaterial);
  if (!assignments || !checklist || !checkpoints || !materials || !isObj(d.kv)) {
    return { ok: false, error: "Isi cadangan rusak atau tidak lengkap." };
  }
  const ids = new Set<string>();
  for (const a of assignments) {
    if (ids.has(a.id)) return { ok: false, error: "Isi cadangan rusak: ada tugas ganda." };
    ids.add(a.id);
  }
  return {
    ok: true,
    backup: {
      assignments,
      checklist,
      checkpoints,
      materials,
      kv: d.kv,
      exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : "",
    },
  };
}

/** Converts Date fields to ISO strings for the JSON file. */
export function buildBackupFile(
  schemaVersion: number,
  data: { assignments: Assignment[]; checklist: ChecklistItem[]; checkpoints: Checkpoint[]; materials: Material[]; kv: Record<string, unknown> }
): BackupFile {
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schemaVersion,
    exportedAt: new Date().toISOString(),
    data: {
      assignments: data.assignments.map((a) => ({ ...a, dueAt: new Date(a.dueAt).toISOString(), createdAt: new Date(a.createdAt).toISOString() })),
      checklist: data.checklist.map((c) => ({ ...c })),
      checkpoints: data.checkpoints.map((c) => ({ ...c, createdAt: new Date(c.createdAt).toISOString() })),
      materials: data.materials.map((m) => ({ ...m, createdAt: new Date(m.createdAt).toISOString() })),
      kv: data.kv,
    },
  };
}
