/**
 * components/belajar/SectionHead.tsx
 * Section label for the Belajar page: "01 — Fokus hari ini" + optional right-side meta,
 * over a 1px hairline.
 */
export function SectionHead({ id, number, title, meta }: { id: string; number: string; title: string; meta?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "1rem",
        paddingBottom: "0.5rem",
        marginBottom: "1.25rem",
        borderBottom: "1px solid var(--rn-line)",
      }}
    >
      <h2 id={id} className="rn-label" style={{ color: "var(--rn-accent)", fontWeight: 700, letterSpacing: "0.15em" }}>
        {number} — {title}
      </h2>
      {meta && <span className="rn-label" style={{ letterSpacing: "0.06em" }}>{meta}</span>}
    </div>
  );
}
