/**
 * app/page.tsx — Hari Ini (Today) page
 */
import { AI_BRIEF } from "@/lib/repo";
import { getGreeting, formatDate } from "@/lib/mock";
import { TechText } from "@/components/TechText";
import { AssignmentList } from "@/components/AssignmentList";
import { WeeklyStrip } from "@/components/WeeklyStrip";
import { RainBackground } from "@/components/RainBackground";

export default function HomePage() {
  const greeting = getGreeting();
  const greetingText = `${greeting},`;
  const now = new Date();

  return (
    <div
      style={{
        background: "transparent",
        color: "var(--rn-text)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-body, sans-serif)",
        position: "relative",
      }}
    >
      <RainBackground />
      <main
        style={{
          flex: 1,
          padding: "3rem 1.5rem 8.5rem",
          maxWidth: "36rem",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "2.25rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top counter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6875rem",
              letterSpacing: "0.12em",
              color: "var(--rn-muted)",
            }}
          >
            01 / 04
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6875rem",
              letterSpacing: "0.12em",
              color: "var(--rn-muted)",
            }}
          >
            HARI INI
          </span>
        </div>

        {/* Greeting with TechText (Tugas 2B) */}
        <div>
          <h1
            style={{
              fontSize: "clamp(2rem, 7vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--rn-text)",
              wordBreak: "normal",
              hyphens: "none",
            }}
          >
            <TechText text={greetingText} />
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6875rem",
              letterSpacing: "0.08em",
              color: "var(--rn-muted)",
              marginTop: "0.75rem",
              textTransform: "capitalize",
            }}
          >
            {formatDate(now)}
          </p>
        </div>

        {/* AI Brief */}
        <p
          style={{
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: "0.9375rem",
            lineHeight: 1.65,
            color: "var(--rn-muted)",
            maxWidth: "28rem",
          }}
        >
          {AI_BRIEF}
        </p>

        {/* Hairline */}
        <div style={{ height: "1px", background: "rgba(168, 159, 140, 0.2)", width: "100%", margin: 0 }} />

        {/* Today section — judul grup + jumlah datang dari AssignmentList */}
        <AssignmentList />
        <WeeklyStrip />
      </main>
    </div>
  );
}
