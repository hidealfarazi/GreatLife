# DESIGN.md — Direction (Quiet Grotesk / Rainy Night)

Bold, calm, personal. Cold near-black UI, giant grotesk type, one blue-gray accent.
Content is borderless; interactive controls are rounded boxes. This file supersedes any
older Javanese / gold / kanji / serif styling.

## Tokens (CSS variables in app/globals.css — no new colors)
| Token | Value | Use |
|---|---|---|
| `--rn-bg` | `#0B0D10` | background everywhere |
| `--rn-text` | `#F2F2EE` | primary text |
| `--rn-muted` | `#8B93A0` | secondary text, labels |
| `--rn-accent` | `#8FA3BF` | the single accent (blue-gray) |
| `--rn-amber` | `#E3B87A` | ONLY deadlines < 4 hours |
| `--rn-alert` | `#D9776B` | ONLY deadlines < 1 hour or overdue |
| `--rn-line` | `rgba(143,163,191,.15)` | 1px hairlines |

Subject identity: five muted colors (lib/subjectColors.ts), shown ONLY as a 2px vertical
bar before the subject label.

## Typography (next/font — must actually load, no fallback serif anywhere)
- Headlines: Space Grotesk 700 (`--font-display`). Headings never break mid-word.
- Body: Geist (`--font-body`), 16px+.
- Small labels and times: Geist Mono (`--font-mono`), uppercase.
- One label pattern for page headers: `0N / 04 — SECTION` (e.g. `02 / 04 — PR`).

## Content is BORDERLESS
- No cards, boxes, shadows, glow, blur or glass on content.
- Separate with whitespace, big type and 1px hairlines (`--rn-line`) only.
- Hairlines span the same column width (content column max 36rem).
- Progress is shown with the Comet Dial (read-only, mono number).
- React Bits components are restyled: transparent rows, radius 0, no shadows, tokens only.

## Interactive controls ARE boxed (components/ui/)
- Button primary: 44px high, radius 12px, accent background, dark text, mono uppercase 12px,
  letter-spacing .08em. Hover (only inside `@media (hover:hover)`) lighter. `:active` scale(.98).
  `:disabled` opacity .4 + not-allowed.
- Button secondary / Chip: 44px, radius 12px, `rgba(255,255,255,.04)` fill, 1px
  `rgba(255,255,255,.12)` border, 14px text. Hover: `rgba(143,163,191,.12)` fill +
  `rgba(143,163,191,.45)` border, 200ms. Selected chip: accent 18% fill + accent border.
- Field: 52px, radius 12px, same fill/border, round 36px (radius 10px) send button inside on
  the right (disabled while empty), 16px input, accent caret, `:focus-within` accent border +
  3px ring at 18%. Hidden label / aria-label, never placeholder-only. Enter submits.
- Switch (Atmosfer): rounded 12px box with Nyala / Mati text, `role="switch"`.
- All controls: `:focus-visible` outline 2px accent, offset 2px; touch target ≥ 44px.
  No focus box on mouse clicks. Real navigation links may stay as text.

## Navigation
- Mobile: floating dock at the bottom, width `min(92vw, 420px)`, 64px high, 12px above the
  safe area, `#0B0D10` at 92%, 1px hairline, large radius, no blur. Four items (Hari Ini, PR,
  Belajar, Lainnya), thin hand-made SVG icons (stroke 1.5, 22px), tiny mono labels, a 2px
  indicator that slides to the active item.
- ≥ 1024px: slim permanent left rail instead of the dock.
- "Lainnya" opens a side sheet: Arsip Tugas, Materi Belajar, Atmosfer switch, version label.
- Detail pages get a small back arrow in the header only (no "Kembali ke …" links).

## Atmosphere (Home hero only)
- Rain-on-glass video (`public/rain.webm`, `public/rain.mp4`, poster `public/rain-poster.jpg`)
  ONLY behind the top hero of the Home page, plus 5–7 soft bokeh circles (radial-gradient,
  `mix-blend-mode: screen`, opacity .15–.3, slow drift, no CSS blur filters) and a dark scrim.
- Fades to the plain background as you scroll; the video pauses when nearly invisible, when the
  tab is hidden, and under `prefers-reduced-motion` (poster shown instead).
- Missing video files → poster or dark gradient. Never generate a video in code.
- All other pages use the plain `#0B0D10` background. "Atmosfer" switch turns it off.

## Motion
- Text reveal on load, progress draw, row shift on touch. 200–800ms ease-out.
- Respect `prefers-reduced-motion` everywhere.

## Layout
- Mobile first at 390px; must also look intentional at 1280px.
- Content max-width 36rem, centered. Bottom padding so the dock never covers content.

## Never
- Javanese script, Javanese-language text, batik motifs, gold, kanji, sparkle icons,
  unicode glyphs as icons.
