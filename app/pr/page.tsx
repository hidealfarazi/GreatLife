/**
 * app/pr/page.tsx — Daftar PR
 */
import { PageHead } from "@/components/PageHead";
import { AssignmentList } from "@/components/AssignmentList";
import { Button } from "@/components/ui/Button";

export default function PrPage() {
  return (
    <div className="rn-page" style={{ gap: "1.75rem" }}>
      <PageHead
        counter="02 / 04"
        section="PR"
        title="Daftar PR"
        sub="Tugas aktif dan progres"
      />
      <div>
        <Button href="/pr/new" variant="secondary">
          + Tugas Baru
        </Button>
      </div>
      <AssignmentList />
    </div>
  );
}
