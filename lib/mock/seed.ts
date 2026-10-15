/**
 * lib/mock/seed.ts
 * Starter data written to the device database ONLY on the very first run
 * (lib/repo.ts checks a "seeded" flag). Dates are relative to the moment of seeding.
 */
import type { Assignment, ChecklistItem, Material } from "../types";

export interface SeedData {
  assignments: Assignment[];
  checklist: ChecklistItem[];
  materials: Material[];
}

export function buildSeed(now: Date = new Date()): SeedData {
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

  const assignments: Assignment[] = [
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
      createdAt: new Date(now),
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
      createdAt: new Date(now),
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
      createdAt: new Date(now),
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
      createdAt: new Date(now),
    },
  ];

  const step = (id: string, parentId: string, title: string, done: boolean): ChecklistItem => ({
    id,
    parentType: "assignment",
    parentId,
    kind: "step",
    title,
    done,
  });
  const bring = (id: string, parentId: string, title: string, done: boolean): ChecklistItem => ({
    id,
    parentType: "assignment",
    parentId,
    kind: "bring",
    title,
    done,
  });
  const term = (id: string, parentId: string, title: string, done: boolean): ChecklistItem => ({
    id,
    parentType: "material",
    parentId,
    kind: "term",
    title,
    done,
  });

  const checklist: ChecklistItem[] = [
    step("c1", "t1", "Rancang markup HTML", true),
    step("c2", "t1", "Tulis validasi TypeScript", true),
    step("c3", "t1", "Uji coba responsif 390px", false),
    bring("c4", "t1", "Laptop terisi penuh", true),
    bring("c5", "t1", "Kabel charger Type-C", false),
    step("c6", "t2", "Identifikasi entitas utama", true),
    step("c7", "t2", "Tentukan relasi 1-to-Many & Many-to-Many", false),
    bring("c8", "t2", "Buku catatan grid", true),
    step("c9", "b1", "Baca rumus dasar turunan limit", false),
    bring("c10", "b1", "Kalkulator scientific", true),
    step("c11", "b2", "Kompilasi foto dokumentasi", true),
    step("c12", "b2", "Tulis kesimpulan mingguan", true),
    bring("c13", "b2", "Catatan harian PKL", true),
    term("mt1", "m1", "Server Component vs Client Component", false),
    term("mt2", "m1", "Dynamic Routing dan Layouts", true),
    term("mt3", "m2", "Kunci Primer dan Kunci Tamu (Foreign Key)", true),
  ];

  const materials: Material[] = [
    { id: "m1", title: "Pengantar Next.js App Router", subjectId: "s1", createdAt: new Date(now) },
    { id: "m2", title: "Normalisasi Database 1NF - 3NF", subjectId: "s2", createdAt: new Date(now) },
  ];

  return { assignments, checklist, materials };
}
