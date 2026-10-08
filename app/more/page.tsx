import Link from "next/link";

export default function MorePage() {
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
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Lainnya</h1>
      <p
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.75rem",
          color: "var(--rn-muted)",
          marginBottom: "2rem",
        }}
      >
        Pengaturan & alat bantu
      </p>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <Link
          href="/belajar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 0",
            borderBottom: "1px solid rgba(168, 159, 140, 0.2)",
            textDecoration: "none",
            color: "var(--rn-text)",
          }}
        >
          <span style={{ fontWeight: 700 }}>Materi Belajar</span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.7rem",
              color: "var(--rn-muted)",
            }}
          >
            Daftar istilah & checkpoint →
          </span>
        </Link>
        <Link
          href="/arsip"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 0",
            borderBottom: "1px solid rgba(168, 159, 140, 0.2)",
            textDecoration: "none",
            color: "var(--rn-text)",
          }}
        >
          <span style={{ fontWeight: 700 }}>Arsip</span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.7rem",
              color: "var(--rn-muted)",
            }}
          >
            Tugas yang selesai →
          </span>
        </Link>
      </nav>

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
