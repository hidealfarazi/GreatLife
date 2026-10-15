/**
 * components/ui/Chip.tsx
 * Selectable chip (quick prompts, filters, options).
 * 44px high, radius 12px. Styles live in app/globals.css (.rn-chip):
 * hover only inside @media (hover:hover), selected = accent 18% fill + accent border,
 * :focus-visible outline, disabled opacity .4. Use inside a flex-wrap container, gap 8px.
 */
"use client";

import React from "react";

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Chip({ label, active = false, onClick, disabled, "aria-label": ariaLabel, className, style }: ChipProps) {
  return (
    <button
      type="button"
      className={["rn-chip", className].filter(Boolean).join(" ")}
      aria-pressed={active}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {label}
    </button>
  );
}
