/**
 * components/BottomNav.tsx
 * Main navigation.
 * - < 1024px: floating dock at the bottom (min(92vw, 420px) x 64px, 12px above the safe area).
 * - >= 1024px: slim permanent left rail.
 * Hand-made thin SVG icons (stroke 1.5, 22px), tiny mono labels, a 2px indicator that slides
 * to the active item. "Lainnya" opens a side sheet: Arsip Tugas, Materi Belajar, Atmosfer
 * switch, Pengingat deadline switch, Pasang aplikasi, Cadangan data, version label
 * (controls in components/SheetSettings.tsx). Focus rings only via :focus-visible (see globals.css).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { setAtmosphereEnabled, useAtmosphereEnabled } from "@/lib/atmosphere";
import { BackupSection, InstallSection, ReminderRow, SwitchRow } from "@/components/SheetSettings";

const APP_VERSION = "0.1.0";

type IconName = "today" | "pr" | "learn" | "more";

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "today" && (
        <>
          {/* Horizon with a rising half sun */}
          <path d="M3 17.5h18" />
          <path d="M7 17.5a5 5 0 0 1 10 0" />
          <path d="M12 6v2.5" />
          <path d="M5.4 10l1.6 1.4" />
          <path d="M18.6 10L17 11.4" />
          <path d="M8 20.5h8" />
        </>
      )}
      {name === "pr" && (
        <>
          {/* Sheet with a folded corner and a tick */}
          <path d="M6.5 3.5h8l3 3v14h-11z" />
          <path d="M14.5 3.5v3h3" />
          <path d="M9.5 13.5l2 2 3.5-4" />
        </>
      )}
      {name === "learn" && (
        <>
          {/* Open book */}
          <path d="M12 7c-2-1.6-5-2.1-8-1.6v13c3-.5 6 0 8 1.6 2-1.6 5-2.1 8-1.6v-13c-3-.5-6 0-8 1.6z" />
          <path d="M12 7v13" />
        </>
      )}
      {name === "more" && (
        <>
          {/* Three uneven lines */}
          <path d="M5 8h14" />
          <path d="M5 12h14" />
          <path d="M5 16h8" />
        </>
      )}
    </svg>
  );
}

const NAVS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Hari Ini", icon: "today" },
  { href: "/pr", label: "PR", icon: "pr" },
  { href: "/belajar", label: "Belajar", icon: "learn" },
];

function activeIndexFor(pathname: string, sheetOpen: boolean): number {
  if (sheetOpen) return 3;
  if (pathname === "/") return 0;
  if (pathname.startsWith("/pr")) return 1;
  if (pathname.startsWith("/belajar")) return 2;
  if (pathname.startsWith("/arsip") || pathname.startsWith("/more")) return 3;
  return -1;
}

export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const atmosphere = useAtmosphereEnabled();
  const closeRef = useRef<HTMLButtonElement>(null);
  const active = activeIndexFor(pathname, sheetOpen);

  // Sheet: focus the close button on open, Escape closes, lock page scroll.
  useEffect(() => {
    if (!sheetOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sheetOpen]);

  const renderItems = (variant: "dock" | "rail") => (
    <>
      {NAVS.map((n, i) => (
        <Link
          key={n.href}
          href={n.href}
          className="rn-nav-item"
          data-active={active === i}
          aria-current={active === i ? "page" : undefined}
        >
          <NavIcon name={n.icon} />
          <span className="rn-nav-label">{n.label}</span>
        </Link>
      ))}
      <button
        type="button"
        className="rn-nav-item"
        data-active={active === 3}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen(true)}
      >
        <NavIcon name="more" />
        <span className="rn-nav-label">Lainnya</span>
      </button>
      {active >= 0 && (
        <span
          aria-hidden="true"
          className={variant === "dock" ? "rn-dock-indicator" : "rn-rail-indicator"}
          style={{ transform: variant === "dock" ? `translateX(${active * 100}%)` : `translateY(${active * 100}%)` }}
        >
          <span />
        </span>
      )}
    </>
  );

  return (
    <>
      <nav aria-label="Navigasi utama" className="rn-dock">
        {renderItems("dock")}
      </nav>

      <nav aria-label="Navigasi samping" className="rn-rail">
        <span className="rn-rail-mark" aria-hidden="true">B</span>
        <div className="rn-rail-items">{renderItems("rail")}</div>
      </nav>

      {sheetOpen && (
        <div className="rn-sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rn-sheet-title"
            className="rn-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="rn-label">04 / 04 — Lainnya</span>
              <button ref={closeRef} type="button" className="rn-icon-btn" onClick={() => setSheetOpen(false)} aria-label="Tutup menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M6.5 6.5l11 11" />
                  <path d="M17.5 6.5l-11 11" />
                </svg>
              </button>
            </div>

            <h2 id="rn-sheet-title" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Lainnya
            </h2>

            <nav aria-label="Menu lainnya" style={{ display: "flex", flexDirection: "column" }}>
              <Link href="/arsip" onClick={() => setSheetOpen(false)} className="rn-sheet-link">
                <span>Arsip Tugas</span>
                <span className="rn-label">Selesai &amp; diarsipkan</span>
              </Link>
              <Link href="/belajar" onClick={() => setSheetOpen(false)} className="rn-sheet-link">
                <span>Materi Belajar</span>
                <span className="rn-label">Istilah &amp; sesi</span>
              </Link>
            </nav>

            <SwitchRow
              title="Atmosfer"
              description="Video hujan & cahaya di Hari Ini"
              checked={atmosphere}
              onToggle={() => setAtmosphereEnabled(!atmosphere)}
            />

            <ReminderRow />
            <InstallSection />
            <BackupSection />

            <p className="rn-label" style={{ marginTop: "auto" }}>
              Belajar v{APP_VERSION}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
