/**
 * app/page.tsx — Hari Ini (Home)
 * Order: page label + small greeting -> HERO (recommendation, rain atmosphere behind it)
 * -> "Berikutnya" block -> task list -> weekly strip.
 */
import { PageLabel } from "@/components/PageHead";
import { Greeting } from "@/components/Greeting";
import { RecommendationHero } from "@/components/RecommendationHero";
import { NextTaskBlock } from "@/components/NextTaskBlock";
import { AssignmentList } from "@/components/AssignmentList";
import { WeeklyStrip } from "@/components/WeeklyStrip";
import { RainBackground } from "@/components/RainBackground";

export default function HomePage() {
  return (
    <div style={{ position: "relative", minHeight: "100dvh" }}>
      <RainBackground />
      <main className="rn-page" style={{ position: "relative", zIndex: 1, gap: "2.5rem" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ minHeight: 44, display: "flex", alignItems: "center" }}>
            <PageLabel counter="01 / 04" section="Hari Ini" />
          </div>
          <Greeting />
        </header>

        <RecommendationHero />
        <NextTaskBlock />
        <AssignmentList />
        <WeeklyStrip />
      </main>
    </div>
  );
}
