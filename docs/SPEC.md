# RaktSetu Live: product spec

## Problem and evidence (from the DTIL Group 8 research)
In an emergency, families phone hospital after hospital to find blood. Our own survey (20 responses, 8-9 Oct 2026):
- 13 of 20 had needed blood urgently. 11 of 13 went to a hospital or blood bank first.
- 8 of 13 made 4 or more calls. 7 of 13 waited over 1 hour.
- Information reliability averaged 3.3/5. Stress averaged 4.1/5.
- 16 of 18 (89%) rated a live availability platform 4 or 5.
Rare groups (B-, AB-, O-) were the hardest to find.

## Primary user
Meera, a family member searching for blood for a patient. Panicked, on a phone, wants one answer: who has my group, nearest first, and can I trust the number?

## Secondary users
Blood bank staff (publish stock daily with minimal effort), administrator (approves banks, links staff accounts).

## v1 scope
Public finder: choose blood group, choose area or use GPS, list nearest approved banks with units for the chosen group, all 8 groups per bank, "Updated X ago", stale warning, call button, directions link, live refresh when a bank publishes. Staff: sign in, set units for 8 groups, publish. Admin: approve or hide banks.
Then phases in `BUILD_PLAN.md` add: real map, admin onboarding, QR poster, WhatsApp share, Hindi and Marathi, tests, PWA, launch hardening.

## Out of scope for v1
Donor registry and donor contact, patient accounts, payments, ordering or reserving blood, any medical advice.

## Screens
0. Landing (`/`): what it is, survey evidence, how it works, trust rules, blood bank sign-in, group picker that opens the finder with that group selected.
1. Finder (`/find`): group picker, area picker, "use my location", only-in-stock toggle, bank cards, map (phase 2).
2. Staff (`/staff`): login, stock editor with +/- steppers, publish.
3. Admin (`/admin`): login, list of banks with approve or hide, add bank and invite staff (phase 3).
4. QR poster (`/qr`): printable page for hospital counters (phase 4).

## Data model
`banks`, `stock` (one row per bank and blood group), `profiles` (role staff or admin, linked bank), `audit_log` (who published what, when). See `supabase/schema.sql`.

## Acceptance criteria
- A new visitor on a 375px phone gets a result in 3 taps or fewer and no login.
- Stock published by staff appears on an open public page within 5 seconds, without refresh.
- A staff account can never read or change another bank's stock. An anonymous visitor can never write anything.
- A bank that has not published, or published over 6 hours ago, is visibly marked.
- Lighthouse on `/` and `/find`: Performance 85+, Accessibility 95+ (mobile).

## Known risks and the mitigation required
- Stale data: age label, stale warning, optional daily reminder to staff (phase 5).
- Banks do not update: make publishing take under 30 seconds, onboard few banks well rather than many badly, show "No data yet" honestly.
- Wrong or fake updates: staff accounts are created by the admin only, public sign-up is disabled, audit log records every publish.
- Misuse of phone numbers: only bank counter numbers are shown, never personal numbers.
- Trust: footer disclaimer "call to confirm", staff-published data labelled as such.
