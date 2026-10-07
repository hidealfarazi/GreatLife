# AGENTS.md — "Belajar" (personal school + learning app)

Single-user private app: manage school assignments (PR) with deadlines/progress/checkpoints,
plus AI-assisted learning. UI text is Indonesian. The owner is a vocational high-school
software student; he directs, AI agents write most code. Explain new files briefly.

## Read first
- docs/SPEC.md (features, Supabase schema, AI route, build order)
- docs/DESIGN.md (visual rules, tokens). Reference: app/globals.css, components/Today.tsx.
If a task conflicts with these docs, STOP and ask.

## Stack
Next.js App Router + TypeScript (strict), plain CSS classes prefixed `rn-` in app/globals.css
(Tailwind is installed but do not rely on it for new components), Supabase later, Vercel.

## Commands
- `npm run dev` | `npm run build` | `npm run lint`. Run build + lint before every commit.

## Git
- Never commit to main. Branch per task: `agent/<short-task>`. Small commits, clear messages.
- Never commit secrets. `.env*.local` stays gitignored.

## Hard rules
1. TypeScript strict. No `any`, no `// @ts-ignore`. Fix type errors properly.
2. BORDERLESS design: no cards, boxes, shadows, glow, blur, glass. See docs/DESIGN.md.
3. Use existing CSS variables and `rn-` classes. No new colors. No decorative effects.
4. No rain, no video backgrounds, no aksara Jawa or Javanese-language text.
5. Keep ALL data access behind `lib/repo.ts` (mock now, Supabase later). Pages never call a DB directly.
6. Do NOT touch auth, RLS, Supabase config, env files, or API keys unless the task explicitly says so.
7. AI/API keys only on the server (route handlers). Never in client code.
8. No new dependencies without saying why first.
9. Mobile first (390px), touch targets >= 44px, respect prefers-reduced-motion.
10. Dates: real dynamic dates, Indonesian locale. No fake placeholder data in final UI.

## Model roles (Antigravity)
- Claude Sonnet: schema/RLS, auth, AI route, security review, tricky UI.
- Gemini Flash: repetitive CRUD, simple pages, refactors, fixing build/lint errors.
- Security-related work by any model must be reviewed by Claude before merging.

## Definition of done (every task)
Build + lint pass, matches docs/DESIGN.md checklist, summary of files changed/skipped/unsure.
