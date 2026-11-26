# Things only a human can do

The coding agent cannot do these. Do them in this order.

1. Create a free Supabase project. Copy the project URL and anon key into `.env.local`.
2. In Supabase SQL Editor run `supabase/schema.sql`, then (for testing only) `supabase/seed_demo.sql`.
3. In Supabase Authentication settings, turn OFF public sign-ups. Create your own admin user in the dashboard, then run:
   `insert into public.profiles (user_id, role) values ('YOUR-USER-UUID', 'admin');`
4. Create a Vercel project from this repo, add the two env vars (plus any later keys), deploy.
5. Talk to real blood banks. Get their permission to list them, confirm their public counter phone number, and agree who will publish stock and when. Start with one or two banks and make them successful before adding more.
6. Run the Lab 8 usability test with 2-3 real people using the live site (task: "find the nearest blood bank with B- blood"). Write down what they actually did and said.
7. Add a privacy and contact page with a real contact email. Have your faculty or a legal advisor review the disclaimer wording.
8. Remove demo data before sharing the link publicly:
   `delete from public.banks where name like 'Demo %';`
