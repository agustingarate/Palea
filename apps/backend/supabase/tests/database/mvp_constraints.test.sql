begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select ok(
  not (select public from storage.buckets where id = 'resumes'),
  'SPEC-DATA-001 keeps the resumes bucket private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'resumes'),
  10485760::bigint,
  'SPEC-DATA-001 enforces the 10 MiB upload limit in Storage'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'resumes'),
  array['application/pdf']::text[],
  'SPEC-DATA-001 accepts only PDF uploads in Storage'
);
select ok(
  not has_table_privilege('authenticated', 'public.applications', 'SELECT'),
  'SPEC-DATA-001 routes product reads through Nest'
);
select ok(
  not has_table_privilege('authenticated', 'public.resumes', 'INSERT'),
  'SPEC-DATA-001 routes resume metadata writes through Nest'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values (
  '11000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'mvp-limits@example.com', '', now(), now(), now()
);

insert into public.profile_interests (id, name, slug) values
  ('12000000-0000-0000-0000-000000000001', 'Interest 1', 'interest-1'),
  ('12000000-0000-0000-0000-000000000002', 'Interest 2', 'interest-2'),
  ('12000000-0000-0000-0000-000000000003', 'Interest 3', 'interest-3'),
  ('12000000-0000-0000-0000-000000000004', 'Interest 4', 'interest-4');

insert into public.user_interests (profile_id, interest_id)
select '11000000-0000-0000-0000-000000000001', id
from public.profile_interests
where slug in ('interest-1', 'interest-2', 'interest-3');

select throws_ok(
  $$insert into public.user_interests (profile_id, interest_id) values ('11000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000004')$$,
  'A profile can have at most 3 interests',
  'SPEC-DATA-001 rejects a fourth profile interest'
);

insert into public.skills (id, name, slug)
select
  ('13000000-0000-0000-0000-' || lpad(value::text, 12, '0'))::uuid,
  'Skill ' || value,
  'skill-' || value
from generate_series(1, 11) value;

insert into public.user_skills (profile_id, skill_id)
select '11000000-0000-0000-0000-000000000001', id
from public.skills
where slug like 'skill-%' and slug <> 'skill-11';

select throws_ok(
  $$insert into public.user_skills (profile_id, skill_id) select '11000000-0000-0000-0000-000000000001', id from public.skills where slug = 'skill-11'$$,
  'A profile can have at most 10 skills',
  'SPEC-DATA-001 rejects an eleventh skill'
);

select throws_ok(
  $$insert into public.resumes (profile_id, storage_path, display_name, mime_type, size_bytes) values ('11000000-0000-0000-0000-000000000001', 'invalid.txt', 'Invalid', 'text/plain', 1)$$,
  'new row for relation "resumes" violates check constraint "resumes_pdf_check"',
  'SPEC-DATA-001 rejects non-PDF resume metadata'
);

select throws_ok(
  $$insert into public.resumes (profile_id, storage_path, display_name, mime_type, size_bytes) values ('11000000-0000-0000-0000-000000000001', 'large.pdf', 'Large', 'application/pdf', 10485761)$$,
  'new row for relation "resumes" violates check constraint "resumes_size_check"',
  'SPEC-DATA-001 rejects resume metadata above 10 MiB'
);

select * from finish();
rollback;
