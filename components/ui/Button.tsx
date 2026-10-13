/**
 * components/ui/Button.tsx
 * Kontrol tombol bersama — variant primary dan secondary.
 * Radius 12px, token warna rn-, accessible, reduced-motion safe.
 *
 * Primary  : tinggi 44px, latar aksen, teks gelap, font mono kapital 12px.
 * Secondary: tinggi 44px, latar rgba(255,255,255,.04), border tipis, teks terang 14px.
 */
"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.375rem",
  minHeight: "44px",
  padding: "0 1.25rem",
  borderRadius: "12px",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-mono, monospace)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  transition: "background 200ms ease-out, border-color 200ms ease-out, transform 80ms ease-out, opacity 200ms ease-out",
  position: "relative",
  flexShrink: 0,
  WebkitTapHighlightColor: "transparent",
};

const PRIMARY: React.CSSProperties = {
  ...BASE,
  fontSize: "0.75rem",
  background: "var(--rn-accent)",
  color: "var(--rn-bg)",
};

const SECONDARY: React.CSSProperties = {
  ...BASE,
  fontSize: "0.875rem",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  color: "var(--rn-text)",
};

export function Button({
  variant = "primary",
  children,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  // Detect hover-capable pointer (only on non-touch devices)
  const supportsHover =
    typeof window !== "undefined"
      ? window.matchMedia("(hover: hover)").matches
      : false;

  const baseStyle = variant === "primary" ? PRIMARY : SECONDARY;

  const dynamicStyle: React.CSSProperties = {
    ...baseStyle,
    ...(disabled ? { opacity: 0.4, cursor: "not-allowed" } : {}),
    ...(supportsHover && hovered && !disabled
      ? variant === "primary"
        ? { background: "#A4B6D0" }
        : { background: "rgba(143, 163, 191, 0.12)", borderColor: "rgba(143, 163, 191, 0.45)" }
      : {}),
    ...(pressed && !disabled ? { transform: "scale(0.98)" } : {}),
    ...style,
  };

  return (
    <button
      type={rest.type ?? "button"}
      {...rest}
      disabled={disabled}
      style={dynamicStyle}
      onMouseEnter={(e) => {
        setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        setPressed(false);
        onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        setPressed(true);
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setPressed(false);
        onMouseUp?.(e);
      }}
    >
      {children}
    </button>
  );
}
