/**
 * components/CometDial.tsx
 * Read-only progress ring (restyled after React Bits Comet Dial): tokens only, mono number,
 * no shadows. Exposed to screen readers as one image: "<label> <n>%".
 * The arc draws in on mount (stroke-dashoffset transition), static under reduced motion.
 */
"use client";

interface CometDialProps {
  value: number; // 0 to 100
  size?: number; // e.g. 44 for row, 120 for detail page
  className?: string;
  label?: string;
}

export function CometDial({ value, size = 44, className = "", label = "Progres" }: CometDialProps) {
  const clamped = Math.round(Math.min(100, Math.max(0, value)));
  const strokeWidth = size > 60 ? 4 : 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={className}
      role="img"
      aria-label={`${label} ${clamped}%`}
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--rn-muted)" strokeWidth={strokeWidth} opacity={0.3} />
        <circle
          className="rn-dial-arc"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--rn-accent)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ ["--rn-dial-from" as string]: String(circumference) } as React.CSSProperties}
        />
      </svg>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: size > 60 ? `${Math.round(size * 0.22)}px` : "10px",
          color: "var(--rn-text)",
          fontWeight: 500,
          letterSpacing: "-0.04em",
        }}
      >
        {clamped}
      </div>
    </div>
  );
}
