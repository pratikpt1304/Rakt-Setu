# RaktSetu Live

Real-time blood bank stock availability for families in urgent need. Built for speed, clarity, and low-end mobile devices on weak networks.

## Features

- **Public Blood Finder (`/find`)**:
  - Pick any of the 8 blood groups (`A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-`) with compatibility guidance.
  - Sort nearest blood banks first using quick-pick areas or browser GPS.
  - Displays exact unit counts, `"Updated X ago"` freshness timestamps, automatic `> 6h` stale warnings, and `"No data yet"` for unpublished banks.
  - One-tap **Call** (`tel:`) and **Get directions** (Google Maps) actions.
  - Live updates via Supabase Realtime when any bank publishes new stock.
- **Blood Bank Staff Portal (`/staff`)**:
  - Authenticated staff update all 8 blood groups with `+` / `−` steppers and publish via the `publish_stock` Postgres RPC.
- **Admin Dashboard (`/admin`)**:
  - Approve or hide listed blood banks.
- **Security & Privacy**:
  - Row Level Security (RLS) enabled on all tables (`banks`, `stock`, `profiles`, `stock_audit`).
  - Public users can only read approved banks; staff can only update their own linked bank through `publish_stock`.
  - No public sign-up, no tracking cookies, and no login required for families.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, plain CSS (`app/globals.css`)
- **Backend & Database**: Supabase (Postgres, Auth, Realtime, Row Level Security)
- **Hosting**: Vercel

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project (**Project Settings → API**).

3. **Set up the database**:
   - Run `supabase/schema.sql` (or push `supabase/migrations/001_init.sql` with `supabase db push --remote`).
   - In Supabase **Authentication → Providers / Settings**, disable public sign-ups.
   - Create an admin user in Supabase Auth and assign the `admin` role:
     ```sql
     insert into public.profiles (user_id, role) values ('YOUR-USER-UUID', 'admin');
     ```

4. **Run the dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run typecheck
npm run build
```

## Deployment (Vercel)

1. Push this repository to GitHub (or deploy directly with Vercel CLI).
2. Import the project in **Vercel** and add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.
