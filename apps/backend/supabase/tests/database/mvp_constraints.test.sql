begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

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

insert into public.applications (
  id, profile_id, company_name, role, status, position
) values (
  '14000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  'Palea', 'Engineer', 'draft', 0
);

select is(
  (select applied_on from public.applications where id = '14000000-0000-0000-0000-000000000001'),
  null::date,
  'SPEC-APPLICATIONS-002 allows draft applications without a date'
);

select throws_ok(
  $$insert into public.application_compensations (application_id, kind, currency, period) values ('14000000-0000-0000-0000-000000000001', 'expected', 'USD', 'month')$$,
  '23514',
  null,
  'SPEC-APPLICATIONS-002 requires at least one compensation bound'
);

insert into public.application_compensations (
  application_id, kind, minimum_minor, currency, period
) values (
  '14000000-0000-0000-0000-000000000001',
  'expected', 100000, 'USD', 'month'
);

select is(
  (select minimum_minor from public.application_compensations where application_id = '14000000-0000-0000-0000-000000000001'),
  100000::bigint,
  'SPEC-APPLICATIONS-002 persists exact minor units with a partial range'
);

insert into public.resumes (
  id, profile_id, storage_path, display_name, mime_type, size_bytes,
  upload_status, uploaded_at
) values (
  '15000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001/resume.pdf',
  'Resume.pdf', 'application/pdf', 100, 'ready', now()
);

insert into public.resume_skills (resume_id, skill_id, confidence)
select '15000000-0000-0000-0000-000000000001', id, 0.9000
from public.skills where slug = 'skill-1';

insert into public.application_required_skills (
  application_id, skill_id, confidence
)
select '14000000-0000-0000-0000-000000000001', id, 0.8000
from public.skills where slug = 'skill-1';

select ok(
  exists(select 1 from public.resume_skills where resume_id = '15000000-0000-0000-0000-000000000001'),
  'SPEC-APPLICATIONS-002 prepares resume skill persistence'
);

select ok(
  exists(select 1 from public.application_required_skills where application_id = '14000000-0000-0000-0000-000000000001'),
  'SPEC-APPLICATIONS-002 prepares required skill persistence'
);

select ok(
  not has_table_privilege('authenticated', 'public.application_compensations', 'SELECT'),
  'SPEC-APPLICATIONS-002 keeps compensation reads behind Nest'
);

select ok(
  not has_table_privilege('authenticated', 'public.resume_skills', 'INSERT'),
  'SPEC-APPLICATIONS-002 keeps skill writes behind Nest'
);

select * from finish();
rollback;
