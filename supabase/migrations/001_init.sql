-- RaktSetu Live: tables, security rules and functions.
-- Run this once in Supabase -> SQL Editor.

create type public.blood_group as enum ('A+','A-','B+','B-','O+','O-','AB+','AB-');

create table public.banks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  area text not null,
  address text,
  phone text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  approved boolean not null default false,
  last_published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.stock (
  bank_id uuid not null references public.banks(id) on delete cascade,
  grp public.blood_group not null,
  units int not null default 0 check (units between 0 and 999),
  primary key (bank_id, grp)
);

-- One row per staff or admin login. Created by an admin, never by the public.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('staff','admin')),
  bank_id uuid references public.banks(id) on delete set null
);

-- Every stock update is recorded: who, which bank, what numbers, when.
create table public.audit_log (
  id bigint generated always as identity primary key,
  bank_id uuid not null references public.banks(id) on delete cascade,
  user_id uuid not null,
  units jsonb not null,
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin');
$$;

create function public.my_bank() returns uuid
language sql stable security definer set search_path = public as $$
  select bank_id from public.profiles where user_id = auth.uid();
$$;

alter table public.banks enable row level security;
alter table public.stock enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;

-- The public can read approved banks and their stock. Nothing else.
create policy "public reads approved banks" on public.banks
  for select using (approved or public.is_admin());
create policy "admin adds banks" on public.banks
  for insert with check (public.is_admin());
create policy "admin edits banks" on public.banks
  for update using (public.is_admin()) with check (public.is_admin());
create policy "public reads stock of approved banks" on public.stock
  for select using (exists (
    select 1 from public.banks b where b.id = bank_id and (b.approved or public.is_admin())
  ));
create policy "users read own profile" on public.profiles
  for select using (user_id = auth.uid());
create policy "admin reads audit log" on public.audit_log
  for select using (public.is_admin());

-- Staff cannot write to the stock table directly. They call this function,
-- which only ever touches the bank their account is linked to.
create function public.publish_stock(p_units jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_bank uuid := public.my_bank();
  v_key text;
begin
  if auth.uid() is null or v_bank is null then
    raise exception 'This account is not linked to a blood bank.';
  end if;
  if jsonb_typeof(p_units) <> 'object' then
    raise exception 'Invalid stock data.';
  end if;
  for v_key in select jsonb_object_keys(p_units) loop
    insert into public.stock (bank_id, grp, units)
    values (v_bank, v_key::public.blood_group, (p_units ->> v_key)::int)
    on conflict (bank_id, grp) do update set units = excluded.units;
  end loop;
  update public.banks set last_published_at = now() where id = v_bank;
  insert into public.audit_log (bank_id, user_id, units) values (v_bank, auth.uid(), p_units);
end;
$$;

-- Nearest banks first, with the chosen group's units and all 8 groups.
create function public.nearby_banks(p_lat double precision, p_lng double precision, p_group public.blood_group)
returns table (
  id uuid, name text, area text, address text, phone text,
  lat double precision, lng double precision,
  units int, last_published_at timestamptz, distance_km double precision, all_stock jsonb
)
language sql stable security invoker set search_path = public as $$
  select b.id, b.name, b.area, b.address, b.phone, b.lat, b.lng,
         coalesce(s.units, 0), b.last_published_at,
         2 * 6371 * asin(sqrt(
           power(sin(radians(b.lat - p_lat) / 2), 2) +
           cos(radians(p_lat)) * cos(radians(b.lat)) * power(sin(radians(b.lng - p_lng) / 2), 2)
         )),
         (select jsonb_object_agg(x.grp::text, x.units) from public.stock x where x.bank_id = b.id)
  from public.banks b
  left join public.stock s on s.bank_id = b.id and s.grp = p_group
  where b.approved
  order by 10
  limit 20;
$$;

revoke execute on function public.publish_stock(jsonb) from public, anon;
grant execute on function public.publish_stock(jsonb) to authenticated;
grant execute on function public.nearby_banks(double precision, double precision, public.blood_group) to anon, authenticated;

-- Live updates for the public page.
alter publication supabase_realtime add table public.banks;
