# RaktSetu Live: instructions for the coding agent

## Mission
Build and ship **RaktSetu Live**, a production website that shows families which nearby blood banks have the blood group they need, how many units, and how recently the bank updated. Blood bank staff publish stock from a simple screen. The people using it are panicked, on cheap phones, often on weak mobile data. Speed, clarity and honest data matter more than features.

Read `docs/SPEC.md` first, then `docs/BUILD_PLAN.md`. Work one phase at a time.

## Stack (already scaffolded and building)
- Next.js 14 (App Router) + TypeScript, deployed on Vercel
- Supabase: Postgres, Auth, Realtime, Row Level Security
- No UI framework. Plain CSS in `app/globals.css`

## Commands
- `npm install`, `npm run dev`, `npm run typecheck`, `npm run build`
- Env vars live in `.env.local` (copy `.env.example`). Never commit real keys.

## Repo map
- `app/page.tsx` landing page. `app/find/page.tsx` public finder. `app/staff/page.tsx` bank staff stock update. `app/admin/page.tsx` approve banks.
- `lib/supabase.ts` client, types, helpers. `lib/auth.tsx` session hook and login form. `lib/areas.ts` quick-pick areas.
- `supabase/schema.sql` base schema. New changes go in `supabase/migrations/` (see the supabase-migrations skill).
- `.agents/` rules, skills and the `/build-raktsetu` workflow.

## Non-negotiable rules
1. **Never invent real data.** No made-up blood banks, phone numbers or stock for real places. Demo data must say "Demo" and use `0000000000`.
2. **Never weaken security to make something work.** Every table keeps Row Level Security on. Public users read approved banks only. Staff write only through `publish_stock`. The service role key is server-only and never reaches client code or the browser bundle.
3. **Stock data must always show its age.** Every number is shown with "Updated X ago". Past 6 hours it shows "may be outdated, call to confirm". Do not remove this.
4. **Emergency UX.** Core flow is group, location, nearest banks, call. No login, no sign-up, no popups on the public side. Works on a basic phone and slow network.
5. **No donor registry in v1.** It adds privacy and verification risks. It is a later phase only if the human asks.
6. **Do not add medical advice.** Compatibility hints stay worded "confirm with a doctor".
7. Keep dependencies minimal. Ask before adding a large library.

## How to work
1. State a short plan for the phase before coding.
2. Implement in small commits-sized steps.
3. Run the verify-before-done skill before saying a task is finished.
4. Report: what changed, what you verified, what you could not verify, and anything the human must do (accounts, keys, real bank onboarding).

## Definition of done (every phase)
`npm run typecheck` and `npm run build` pass, new behaviour works in the browser at 375px width, keyboard focus is visible, no secrets in the diff, and `docs/BUILD_PLAN.md` checkboxes are updated.
