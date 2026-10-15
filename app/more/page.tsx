import Link from "next/link";
import { PageHead } from "@/components/PageHead";

export default function MorePage() {
  return (
    <div className="rn-page">
      <PageHead
        counter="04 / 04"
        section="LAINNYA"
        title="Lainnya"
        sub="Pengaturan & alat bantu"
      />

      <nav style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <Link
          href="/belajar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 0",
            borderBottom: "1px solid var(--rn-line)",
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
            borderBottom: "1px solid var(--rn-line)",
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
    </div>
  );
}
