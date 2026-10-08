/**
 * lib/repo.ts
 * In-memory repository for Assignments, ChecklistItems, Checkpoints, and Materials.
 * All data access goes through here.
 */

import { Assignment, ChecklistItem, ChecklistKind, Checkpoint, Material, Subject } from "./types";

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
  { id: "s1", name: "Pemrograman Web", color: "#C9A24B" },
  { id: "s2", name: "Basis Data", color: "#8A5A2B" },
  { id: "s3", name: "Matematika", color: "#6B8CAE" },
  { id: "s4", name: "PKK", color: "#C23B2A" },
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
