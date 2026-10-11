/**
 * lib/subjectColors.ts — 5 warna redup untuk identitas mapel.
 * Palet gelap, hanya garis vertikal 2px di depan label mapel.
 */
export const SUBJECT_PALETTE: Record<string, string> = {
  // biru-abu
  "Pemrograman Web": "#8FA3BF",
  // hijau pudar
  "Basis Data": "#7E9D84",
  // ungu pudar
  Matematika: "#9B86B3",
  // amber redup
  PKK: "#C9A24B",
};

const FALLBACK_ROSE = "#B86B6B";

export function subjectColor(name: string): string {
  return SUBJECT_PALETTE[name] ?? FALLBACK_ROSE;
}
