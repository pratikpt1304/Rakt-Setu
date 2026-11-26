# Build plan

Work top to bottom. Tick boxes as you finish. Each phase ends with the verify-before-done skill.

## Phase 0: run the starter
- [ ] `npm install`, copy `.env.example` to `.env.local`, fill Supabase URL and anon key (human provides)
- [ ] Confirm `npm run dev` shows the finder and demo banks after the human runs `schema.sql` and `seed_demo.sql`
Done when: the finder lists demo banks and changing blood group updates the cards.

## Phase 1: database hardening and tests
- [ ] Move `schema.sql` into `supabase/migrations/001_init.sql`; keep `schema.sql` as a copy of the latest full schema
- [ ] Write `supabase/tests/rls.sql` proving: anon cannot insert, update or delete any table; anon can read only approved banks; staff A cannot change bank B stock; non-staff cannot call `publish_stock`
- [ ] Add a stock rate limit inside `publish_stock` (max 60 publishes per hour per bank)
- [ ] Add `updated_by` to `stock` and show nothing sensitive publicly
Done when: the RLS test script runs clean and is documented in README.

## Phase 2: real map
- [ ] Add Leaflet with a map tile provider that allows production use (not the public OSM tile server for heavy traffic; use MapTiler, Stadia or similar free tier, key in env)
- [ ] Colour-coded pins: 5+ units green, 1-4 amber, 0 red, no data grey; blue "you" marker; legend; pin tap scrolls to the card
- [ ] Map loads after the list (lazy), list works without it, attribution shown
Done when: list works with the map blocked, and the map matches the list.

## Phase 3: admin onboarding
- [ ] Admin form to add a bank (name, area, address, phone, lat/lng picker)
- [ ] Admin form to invite a staff login linked to a bank, via a server route handler using the service role key (server-only env var). The handler must verify the caller's JWT belongs to an admin before doing anything
- [ ] Disable the ability for the public to sign up (document the Supabase setting)
- [ ] Admin audit view of the last 100 publishes
Done when: an admin can onboard a new bank and staff login without touching SQL, and a non-admin gets 403 from the route.

## Phase 4: sharing and posters
- [ ] "Share on WhatsApp" button on a bank card and on the results (pre-filled summary with group, bank, units, age, phone)
- [ ] `/qr` printable A4 poster: big QR to the site URL, short instructions, works in print preview
- [ ] Open Graph tags so the link previews well in WhatsApp
Done when: a shared link or QR opens the finder with the same group preselected (`/find?g=B%2B`; the plus sign must be encoded).

## Phase 5: reach and reliability
- [ ] English, Hindi and Marathi UI strings with a language switch; remember choice in localStorage
- [ ] PWA: manifest, icons, offline shell with the last results cached and clearly marked "offline, may be outdated"
- [ ] Staff reminder: banner on `/staff` if stock was last published over 24 hours ago
- [ ] Error and empty states reviewed for plain language
Done when: the finder is usable offline with a clear offline notice, and all strings come from the translation files.

## Phase 6: quality gates
- [ ] Unit tests (Vitest) for `ago`, `isStale`, `level`, distance ordering
- [ ] Playwright smoke test: finder loads, group change updates the list, staff login page renders
- [ ] Content-Security-Policy header allowing only Supabase, the map provider and self
- [ ] Lighthouse mobile on `/` and `/find`: Performance 85+, Accessibility 95+
- [ ] Error monitoring (Sentry or Vercel logs) with no personal data in logs
Done when: `npm test` and `npm run build` pass in CI (add a GitHub Actions workflow).

## Phase 7: launch
- [ ] README deployment steps verified end to end on Vercel + a fresh Supabase project
- [ ] Remove demo data, add privacy page and "how it works" page
- [ ] Supabase backups on, Auth email templates set, redirect URLs set to the real domain
- [ ] Final security review against `.agents/rules/security.md`
Done when: the human completes `docs/HUMAN_TASKS.md` and the site is live with at least one real approved bank.
