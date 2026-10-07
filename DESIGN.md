# DESIGN.md — Japanese-Javanese (current direction)

Bold, calm, personal. NO rain, NO video. Warm ink-black, giant serif type, Javanese batik
used as VISUAL only (never Javanese text or aksara), Japanese accents (kanji, hanko seal).
Reference implementation: app/globals.css, components/Today.tsx, components/Motif.tsx.

## Tokens
bg #12100E | text #EFE6D2 | muted #A89F8C | gold #C9A24B | sogan #8A5A2B | seal #C23B2A
Seal red only for the hanko stamp and deadlines under 1 hour.

## Type
Shippori Mincho 800: giant headlines + subject names. Geist: body (16px+). Geist Mono: labels, times.
Mono uppercase labels are fine but must follow one consistent pattern.

## Borderless rules
- No cards, boxes, shadows, glow, blur, glass. Separate with whitespace, huge type, one 1px hairline under section headings.
- Lists are full-width text rows. Touch/hover = row shifts 8px right + subject turns gold.
- Progress = thin gold line ending in a small diamond (kawung nod). Never a boxed bar.

## Motifs
Kawung pattern (faint, fades into solid), hanko seal 学, vertical proverb text, kanji labels 今日 明日.
UI copy: Indonesian only, paired with kanji labels.

## Motion
Text reveal on load (staggered), progress line draws in, row shift on touch. 400-900ms ease-out.
Nothing loops. Respect prefers-reduced-motion.

## Mobile first
Design at 390px first. Touch targets >= 44px. Content max-width 36rem, centered on desktop.

## Checklist before merging UI
- [ ] No cards/borders/shadows/glow introduced
- [ ] Only tokens above (no new random colors)
- [ ] Indonesian copy, real dynamic dates
- [ ] Looks right at 390px
- [ ] Headline/subject type stays big and confident
