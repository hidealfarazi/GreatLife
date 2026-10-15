# AGENTS.md — "Belajar" (personal school + learning app)

Single-user private app: manage school assignments (PR) with deadlines/progress/checkpoints,
plus AI-assisted learning. UI text is Indonesian. The owner is a vocational high-school
software student; he directs, AI agents write most code. Explain new files briefly.

## Read first
- SPEC.md (features, Supabase schema, build order) — in the repo ROOT. Parts are outdated
  (AI now lives in lib/ai/ + app/api/ai/*, Gemini, see README-AI in the owner's package).
- DESIGN.md (visual rules, tokens) — in the repo ROOT. Reference: app/globals.css, components/ui/.
If a task conflicts with these docs, STOP and ask.

## Stack
Next.js App Router + TypeScript (strict), plain CSS classes prefixed `rn-` in app/globals.css
(Tailwind is installed but do not rely on it for new components), Supabase later, Vercel.

## Commands
- `npm run dev` | `npm run build` | `npm run lint`. Run build + lint before every commit.

## Git
- Never commit to main. Branch per task: `agent/<short-task>`. Small commits, clear messages.
- Never commit secrets. `.env`, `.env*.local` stay gitignored (`.env.example` is fine).
- Never commit video source files. The rain video is produced by the owner on his machine.

## Hard rules
1. TypeScript strict. No `any`, no `// @ts-ignore`. Fix type errors properly.
2. CONTENT is BORDERLESS: no cards, boxes, shadows, glow, blur or glass. Separate with
   whitespace, big type and 1px hairlines only. INTERACTIVE CONTROLS (buttons, chips, inputs,
   toggles) ARE rounded boxes (radius 12px) with clear hover/focus/active/disabled states.
   Use components/ui/ (Button, Chip, Field). No underlined-text buttons. See DESIGN.md.
3. Use existing CSS variables and `rn-` classes. No new colors. No decorative effects.
4. Rain video ONLY in the Home (Hari Ini) hero; it fades to the plain background on scroll.
   All other pages use the plain background. Never generate or process video in code.
   No Javanese script/text, batik, gold, kanji or sparkle icons.
5. Keep ALL data access behind `lib/repo.ts` (IndexedDB on the device now via lib/db.ts, Supabase
   later). Pages never call a DB directly; components read through `useRepo()` (lib/useRepo.ts).
   Schema changes: bump DB_VERSION in lib/db.ts and add an upgrade step. No localStorage for data.
   PWA: public/sw.js is hand-written; never cache /api/*. Cache versions come from the build
   stamp automatically (next.config.ts), so there is nothing to bump by hand.
6. Do NOT touch auth, RLS, Supabase config, env files, or API keys unless the task explicitly says so.
7. AI/API keys only on the server (route handlers). Never in client code.
8. No new dependencies without saying why first.
9. Mobile first (390px), touch targets >= 44px, respect prefers-reduced-motion.
10. Dates: real dynamic dates, Indonesian locale. No fake placeholder data in final UI.
11. lib/ai/ and app/api/ai/ are the owner's AI backend and are PROTECTED: do not edit,
    delete or move them. NEVER create a file lib/ai.ts (it clashes with the lib/ai/ folder).
    Import types only (e.g. `Recommendation` from "@/lib/ai/types"). Mock/example data goes
    in lib/mock/. UI calls /api/ai/* via fetch only; API keys never appear in client code.
12. UI text is Indonesian. Code, identifiers and comments are English.
    
## Model roles (Antigravity)
- Claude Sonnet: schema/RLS, auth, AI route, security review, tricky UI.
- Gemini Flash: repetitive CRUD, simple pages, refactors, fixing build/lint errors.
- Security-related work by any model must be reviewed by Claude before merging.

## Definition of done (every task)
Build + lint pass, matches DESIGN.md checklist, summary of files changed/skipped/unsure.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
