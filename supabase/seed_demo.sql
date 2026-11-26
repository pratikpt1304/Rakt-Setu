-- DEMO DATA ONLY. Names and numbers are fake. Delete before going live:
--   delete from public.banks where name like 'Demo %';
insert into public.banks (name, area, address, phone, lat, lng, approved, last_published_at) values
  ('Demo Blood Bank A', 'Kopargaon', 'Sample address', '0000000000', 19.8860, 74.4790, true, now()),
  ('Demo Blood Bank B', 'Kopargaon', 'Sample address', '0000000000', 19.8790, 74.4900, true, now() - interval '40 minutes'),
  ('Demo Blood Bank C', 'Shirdi',    'Sample address', '0000000000', 19.7669, 74.4772, true, now() - interval '8 hours');

insert into public.stock (bank_id, grp, units)
select b.id, g, floor(random() * 15)::int
from public.banks b cross join unnest(enum_range(null::public.blood_group)) g
where b.name like 'Demo %';
