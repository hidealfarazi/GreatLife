/**
 * app/pr/page.tsx — Daftar PR
 * Uses AssignmentList (SwipeRow with archive & undo)
 */

import Link from "next/link";
import { AssignmentList } from "@/components/AssignmentList";

export default function PrPage() {
  return (
    <div
      style={{
        background: "var(--rn-bg)",
        color: "var(--rn-text)",
        minHeight: "100dvh",
        padding: "2rem 1.5rem 6rem",
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>PR</h1>
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

      <div style={{ marginTop: "2rem" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.75rem",
            color: "var(--rn-accent)",
            textDecoration: "underline",
          }}
        >
          ← Kembali ke Hari Ini
        </Link>
      </div>
    </div>
  );
}
