/**
 * app/page.tsx — Hari Ini (Today) page
 * Uses TechText for greeting, CometDial for assignment progress,
 * and repo.ts for live data. Borderless DESIGN.md styling.
 */

import Link from "next/link";
import { AI_BRIEF } from "@/lib/repo";
import { getGreeting, formatDate } from "@/lib/mock";
import { TechText } from "@/components/TechText";
import { AssignmentList } from "@/components/AssignmentList";

const NAV = [
  { href: "/", label: "Hari Ini", icon: "○" },
  { href: "/pr", label: "PR", icon: "□" },
  { href: "/ai", label: "AI", icon: "◇" },
  { href: "/more", label: "Lainnya", icon: "≡" },
] as const;

export default function HomePage() {
  const greeting = getGreeting();
  const greetingText = `${greeting},`;
  const now = new Date();

  return (
    <div
      style={{
        background: "var(--rn-bg)",
        color: "var(--rn-text)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-serif, serif)",
        position: "relative",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "3rem 1.5rem 7rem",
          maxWidth: "36rem",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "2.25rem",
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
            01 / 03
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
              fontSize: "clamp(2.75rem, 12vw, 5.5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--rn-text)",
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
            fontStyle: "italic",
            fontSize: "1rem",
            lineHeight: 1.65,
            color: "var(--rn-muted)",
            maxWidth: "28rem",
          }}
        >
          {AI_BRIEF}
        </p>

        {/* Hairline */}
        <div style={{ height: "1px", background: "rgba(168, 159, 140, 0.2)", width: "100%" }} />

        {/* Today section */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                color: "var(--rn-accent)",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              02 / 03 — HARI INI
            </span>
          </div>
          <AssignmentList />
        </div>
      </main>

      {/* Bottom Nav */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          borderTop: "1px solid rgba(168, 159, 140, 0.2)",
          background: "var(--rn-bg)",
          zIndex: 10,
        }}
        aria-label="Navigasi utama"
      >
        {NAV.map(({ href, label, icon }) => {
          const isActive = href === "/";
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
                minHeight: "56px",
                padding: "0.5rem 0",
                color: isActive ? "var(--rn-accent)" : "var(--rn-muted)",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <span aria-hidden="true" style={{ fontSize: "1rem", lineHeight: 1 }}>
                {icon}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.5625rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
