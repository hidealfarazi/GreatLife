/**
 * components/HeroHeadline.tsx
 * The huge topic headline of the Home hero.
 * - Always a real <h1> with aria-label = the topic.
 * - Animated copy (aria-hidden) uses React Bits TechText (components/ui/TechText.tsx,
 *   fetched verbatim from the reactbits.dev registry), one canvas per wrapped line so it
 *   fits 390px. First part white, second part #8FA3BF.
 * - Static text on the server, before measuring, and under prefers-reduced-motion.
 * - No hover effect on touch devices (reveal off when the device cannot hover).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import TechText from "@/components/ui/TechText";
import { usePrefersReducedMotion } from "@/lib/atmosphere";

const MIN_PX = 48; // 3rem
const MAX_PX = 88; // 5.5rem
const LINE_BOX = 1.5; // canvas height per line (TechText needs room: ink <= 66% of height)
const LINE_PITCH = 1.1; // visual line height

/** Split the topic into a white part and an accent part (explicit "\n" wins). */
function splitParts(topic: string): [string, string] {
  if (topic.includes("\n")) {
    const [a, ...rest] = topic.split("\n");
    return [a.trim(), rest.join(" ").trim()];
  }
  const words = topic.trim().split(/\s+/);
  if (words.length < 2) return [topic.trim(), ""];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/** Greedy word wrap by character budget (TechText shrinks any line that is still too wide). */
function wrap(text: string, maxChars: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function HeroHeadline({ topic }: { topic: string }) {
  const reduce = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ width: number; fontPx: number; canHover: boolean } | null>(null);
  const [first, second] = splitParts(topic);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const fontPx = Math.round(Math.min(MAX_PX, Math.max(MIN_PX, width * 0.13)));
      const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      setLayout((prev) =>
        prev && prev.width === width && prev.fontPx === fontPx && prev.canHover === canHover ? prev : { width, fontPx, canHover }
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const headingStyle: React.CSSProperties = {
    fontSize: "clamp(3rem, 9vw, 5.5rem)",
    fontWeight: 700,
    lineHeight: LINE_PITCH,
    letterSpacing: "-0.025em",
    margin: "1rem 0 0.5rem",
  };

  const animated = !reduce && layout !== null && layout.width > 0;

  if (!animated) {
    return (
      <div ref={wrapRef}>
        <h1 style={headingStyle}>
          <span style={{ color: "var(--rn-text)", display: "block" }}>{first}</span>
          {second && <span style={{ color: "var(--rn-accent)", display: "block" }}>{second}</span>}
        </h1>
      </div>
    );
  }

  const { width, fontPx, canHover } = layout;
  const maxChars = Math.max(6, Math.floor(width / (fontPx * 0.5)));
  const lines = [
    ...wrap(first, maxChars).map((text) => ({ text, color: "var(--rn-text)" })),
    ...wrap(second, maxChars).map((text) => ({ text, color: "var(--rn-accent)" })),
  ];
  const overlap = fontPx * (LINE_BOX - LINE_PITCH);

  return (
    <div ref={wrapRef}>
      <h1 aria-label={topic} style={{ ...headingStyle, fontSize: fontPx, margin: "0.75rem 0 0.25rem" }}>
        <span aria-hidden="true" style={{ display: "block" }}>
          {lines.map((line, i) => (
            <span
              key={`${i}-${line.text}`}
              style={{
                display: "block",
                color: line.color,
                height: fontPx * LINE_BOX,
                marginTop: i === 0 ? -overlap / 2 : -overlap,
                marginBottom: i === lines.length - 1 ? -overlap / 2 : 0,
                // TechText keeps a 5% side margin inside its canvas: widen the box so the
                // glyphs start exactly at the column edge.
                width: "111.112%",
                marginLeft: "-5.556%",
              }}
            >
              <TechText
                text={line.text}
                fontSize={fontPx}
                fontWeight={700}
                letterSpacing={-0.025}
                align="left"
                color="currentColor"
                accentColor="#8FA3BF"
                reveal={canHover ? "letter" : "off"}
                labels={false}
                draggable={false}
                clickKick={false}
                selection={false}
                sweep={false}
                specks={canHover ? 8 : 0}
                intro="type"
                introDuration={0.8}
              />
            </span>
          ))}
        </span>
      </h1>
    </div>
  );
}
