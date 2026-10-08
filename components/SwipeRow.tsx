/**
 * components/SwipeRow.tsx
 * Adapted from React Bits SwipeRow — borderless version.
 * Swipe left to reveal Arsip / Hapus. Flat sharp blocks only when swiped.
 * Tokens: rn-bg, rn-text, rn-muted, rn-accent, rn-alert. No cards/shadows.
 */
"use client";

import { useRef, useState, useCallback } from "react";

interface SwipeRowProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
  ariaLabel?: string;
}

const ACTION_W = 80;
const THRESHOLD = 40;

export function SwipeRow({ children, onArchive, onDelete, ariaLabel = "Baris tugas" }: SwipeRowProps) {
  const [offset, setOffset] = useState(0); // 0 .. -160
  const [open, setOpen] = useState(false);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxOffset = -(ACTION_W * 2);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startX.current = e.clientX;
    dragging.current = false;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) > 5) dragging.current = true;
      // only allow left swipe (negative dx)
      let next = 0;
      if (open) {
        // when open, dx moves from -160
        next = maxOffset + dx;
      } else {
        next = Math.min(0, dx);
      }
      next = Math.max(maxOffset, Math.min(0, next));
      setOffset(next);
    },
    [open, maxOffset]
  );

  const snap = useCallback(
    (finalOffset: number) => {
      const shouldOpen = finalOffset < -THRESHOLD;
      setOpen(shouldOpen);
      setOffset(shouldOpen ? maxOffset : 0);
      startX.current = null;
    },
    [maxOffset]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (startX.current === null) return;
      snap(offset);
    },
    [offset, snap]
  );

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    setOffset(next ? maxOffset : 0);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "transparent",
        borderRadius: 0,
        touchAction: "pan-y",
      }}
      aria-label={ariaLabel}
    >
      {/* Action drawer behind */}
      <div
        aria-hidden={offset === 0}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "stretch",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <button
          onClick={() => {
            setOpen(false);
            setOffset(0);
            onArchive?.();
          }}
          style={{
            width: ACTION_W,
            background: "var(--rn-accent)",
            color: "#0B0D10",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
            borderRadius: 0,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Arsipkan tugas"
        >
          Arsip
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setOffset(0);
            onDelete?.();
          }}
          style={{
            width: ACTION_W,
            background: "var(--rn-alert)",
            color: "#fff",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
            borderRadius: 0,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Hapus tugas"
        >
          Hapus
        </button>
      </div>

      {/* Foreground row */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "relative",
          background: "transparent",
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? "none" : "transform 200ms ease-out",
          display: "flex",
          alignItems: "stretch",
          minHeight: 44,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        {/* Fallback aksi button for accessibility */}
        <button
          onClick={handleToggle}
          aria-label={open ? "Tutup aksi" : "Buka aksi"}
          aria-expanded={open}
          style={{
            flexShrink: 0,
            width: 56,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: open ? "var(--rn-text)" : "var(--rn-accent)",
            background: open ? "rgba(143, 163, 191, 0.12)" : "transparent",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            border: "none",
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          {open ? "✕" : "Aksi"}
        </button>
      </div>
    </div>
  );
}
