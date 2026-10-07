import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1 style={{ marginBottom: "1rem" }}>Belajar — Dev Index</h1>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <li>
          <Link href="/lab/a" style={{ textDecoration: "underline" }}>
            /lab/a — Direction A: Quiet Grotesk
          </Link>
        </li>
        <li>
          <Link href="/lab/b" style={{ textDecoration: "underline" }}>
            /lab/b — Direction B: Ink &amp; Batik
          </Link>
        </li>
        <li>
          <Link href="/lab/c" style={{ textDecoration: "underline" }}>
            /lab/c — Direction C: Hybrid
          </Link>
        </li>
      </ul>
    </main>
  );
}
