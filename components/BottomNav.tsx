/**
 * components/BottomNav.tsx
 * Persistent bottom navigation bar for mobile-first views.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navs = [
    { href: "/", label: "Hari Ini", icon: "○" },
    { href: "/pr", label: "PR", icon: "□" },
    { href: "/belajar", label: "Belajar", icon: "◇" },
    { href: "/more", label: "Lainnya", icon: "≡" },
  ];

  return (
    <nav
      aria-label="Navigasi utama"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--rn-bg)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {navs.map((n) => {
        const isActive = pathname === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
              minHeight: "56px",
              padding: "0.5rem 0",
              color: isActive ? "var(--rn-accent)" : "var(--rn-muted)",
              textDecoration: "none",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <span style={{ fontSize: "1rem", lineHeight: 1 }}>{n.icon}</span>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.625rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {n.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
