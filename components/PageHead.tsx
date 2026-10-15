/**
 * components/PageHead.tsx
 * Uniform page header used on every page:
 * [optional back arrow] mono label "0N / 04 — SECTION", big grotesk title, optional mono sub.
 */
import Link from "next/link";

interface PageHeadProps {
  /** Page number, e.g. "02 / 04" */
  counter: string;
  /** Section name, e.g. "PR" */
  section: string;
  title?: string;
  sub?: string;
  /** Detail pages: shows a small back arrow in the header (no "Kembali ke…" links). */
  backHref?: string;
  backLabel?: string;
  /** Use h1 for the title (default true). Set false when the page has its own h1. */
  titleAs?: "h1" | "h2";
}

export function BackArrow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="rn-icon-btn" style={{ marginLeft: "-0.75rem" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.5 6L8.5 12l6 6" />
      </svg>
    </Link>
  );
}

export function PageLabel({ counter, section }: { counter: string; section: string }) {
  return (
    <span className="rn-label">
      {counter} — {section}
    </span>
  );
}

export function PageHead({ counter, section, title, sub, backHref, backLabel = "Kembali", titleAs = "h1" }: PageHeadProps) {
  const Title = titleAs;
  return (
    <header>
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", minHeight: 44 }}>
        {backHref && <BackArrow href={backHref} label={backLabel} />}
        <PageLabel counter={counter} section={section} />
      </div>
      {title && (
        <Title
          style={{
            fontSize: "clamp(2rem, 7vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--rn-text)",
            marginTop: "0.75rem",
          }}
        >
          {title}
        </Title>
      )}
      {sub && (
        <p className="rn-label" style={{ marginTop: "0.75rem", letterSpacing: "0.08em" }}>
          {sub}
        </p>
      )}
    </header>
  );
}
