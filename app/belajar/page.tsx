/**
 * app/belajar/page.tsx — Materi belajar
 */
import { PageHead } from "@/components/PageHead";
import { MaterialList } from "@/components/MaterialList";

export default function BelajarPage() {
  return (
    <div
      style={{
        background: "transparent",
        color: "var(--rn-text)",
        minHeight: "100dvh",
        padding: "2.5rem 1.5rem 8.5rem",
        maxWidth: "36rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <PageHead
        counter="03 / 04"
        section="BELAJAR"
        title="Belajar"
        sub="Peta kesiapan, fokus harian, & materi"
      />
      <MaterialList />
    </div>
  );
}
