---
name: supabase-migrations
description: Use when changing the database for RaktSetu Live: new tables, columns, functions, policies. Covers migration files, RLS requirements and policy tests.
---
# Supabase migrations

1. Put every change in a new file `supabase/migrations/NNN_short_name.sql` (next number in order). Never edit an applied migration.
2. A new table must `enable row level security` and define policies in the same file. Start with no access and add only what is needed.
3. Functions that write data should be `security definer` with `set search_path = public`, check `auth.uid()`, and be granted only to the roles that need them (revoke from `public` and `anon` first).
4. Update `supabase/schema.sql` so it always equals the full current schema.
5. Add or extend tests in `supabase/tests/rls.sql` for every new policy: one test that the allowed role succeeds and one that a disallowed role fails.
6. Tell the human the exact SQL to run in the Supabase SQL Editor, and what to check afterwards.
7. Never run destructive statements (drop, truncate, delete without where) without stating it and getting a yes.
