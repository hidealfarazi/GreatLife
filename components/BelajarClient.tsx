/**
 * components/BelajarClient.tsx
 * /belajar sections: 01 Fokus hari ini, 02 Jalurmu, 03 Roadmap tech stack,
 * 04 Tanya dikit, 05 Materiku. Each section lives in components/belajar/.
 */
"use client";

import { FocusSection } from "@/components/belajar/FocusSection";
import { PathSection } from "@/components/belajar/PathSection";
import { RadarSection } from "@/components/belajar/RadarSection";
import { AskSection } from "@/components/belajar/AskSection";
import { MaterialsSection } from "@/components/belajar/MaterialsSection";

export function BelajarClient() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
      <FocusSection />
      <PathSection />
      <RadarSection />
      <AskSection />
      <MaterialsSection />
    </div>
  );
}
