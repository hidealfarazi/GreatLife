/**
 * app/belajar/page.tsx — Materi belajar
 */
import { PageHead } from "@/components/PageHead";
import { BelajarClient } from "@/components/BelajarClient";

export default function BelajarPage() {
  return (
    <div className="rn-page" style={{ gap: "2.5rem" }}>
      <PageHead
        counter="03 / 04"
        section="BELAJAR"
        title="Belajar"
        sub="Peta kesiapan, fokus harian, & materi"
      />
      <BelajarClient />
    </div>
  );
}
