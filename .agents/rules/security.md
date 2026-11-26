---
trigger: always_on
description: Security rules for RaktSetu Live. Always apply.
---
- Row Level Security stays enabled on every table. Any new table gets RLS and explicit policies in the same migration.
- The public (anon) role may only read approved banks and their stock, and call `nearby_banks`. It never writes.
- Staff write stock only through `publish_stock`, which uses the caller's linked bank. Never accept a bank id from the client for stock writes.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only: only in route handlers or server code, never in a `NEXT_PUBLIC_` variable, never imported by a client component. Any route using it must first verify the caller is an admin.
- Validate and clamp all input on the server side (SQL checks or route handlers), not only in the UI.
- No secrets, keys or real personal data in the repo, logs, tests or screenshots.
- Only counter phone numbers of institutions are stored. Never store personal phone numbers or patient data.
- Keep security headers in `next.config.mjs`. Add a Content-Security-Policy when phase 6 is done.
