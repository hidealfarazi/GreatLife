/**
 * app/pr/page.tsx — Daftar PR
 */
import Link from "next/link";
import { AssignmentList } from "@/components/AssignmentList";

export default function PrPage() {
  return (
    <div
      style={{
        background: "transparent",
        color: "var(--rn-text)",
        minHeight: "100dvh",
        padding: "2rem 1.5rem 6rem",
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.6875rem",
            letterSpacing: "0.12em",
            color: "var(--rn-muted)",
            textTransform: "uppercase",
          }}
        >
          02 / 03 — PR
        </span>
      </div>

      <h1 style={{ fontSize: "clamp(1.75rem, 8vw, 2.75rem)", fontWeight: 800, lineHeight: 1.05, marginBottom: "0.75rem" }}>PR</h1>
      <p
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.75rem",
          color: "var(--rn-muted)",
          marginBottom: "2rem",
        }}
      >
        Daftar tugas aktif
      </p>

      <AssignmentList />
    </div>
  );
}
