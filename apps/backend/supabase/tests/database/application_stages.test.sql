begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('21000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'stages-owner@example.com', '', now(), now(), now()),
  ('21000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'stages-other@example.com', '', now(), now(), now());

insert into public.applications (
  id, profile_id, company_name, role, status, position
) values (
  '22000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  'Palea', 'Engineer', 'interview', 7
);

select is(
  (select count(*) from public.application_stages where application_id = '22000000-0000-0000-0000-000000000001'),
  0::bigint,
  'SPEC-APPLICATIONS-004 creates no initial stages'
);

insert into public.application_stages (
  id, application_id, name, event_on, result, difficulty, questions, comments,
  created_at
) values
  ('23000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Applied', '2026-08-20', 'successful', 'easy', null, 'Done', '2026-08-20T12:00:00Z'),
  ('23000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000001', 'Technical', null, 'pending', null, 'System design?', null, '2026-08-25T12:00:00Z'),
  ('23000000-0000-0000-0000-000000000003', '22000000-0000-0000-0000-000000000001', 'HR', '2026-08-28', 'waiting', 'medium', null, null, '2026-08-24T12:00:00Z');

select is(
  (
    select array_agg(id order by coalesce(event_on::timestamp, created_at at time zone 'UTC') desc, created_at desc, id desc)
    from public.application_stages
    where application_id = '22000000-0000-0000-0000-000000000001'
  ),
  array[
    '23000000-0000-0000-0000-000000000003',
    '23000000-0000-0000-0000-000000000002',
    '23000000-0000-0000-0000-000000000001'
  ]::uuid[],
  'SPEC-APPLICATIONS-004 orders dated and undated stages deterministically'
);

select throws_ok(
  $$insert into public.application_stages (application_id, name) values ('22000000-0000-0000-0000-000000000001', ' ')$$,
  '23514', null, 'rejects blank names'
);
select throws_ok(
  $$insert into public.application_stages (application_id, name) values ('22000000-0000-0000-0000-000000000001', repeat('x', 121))$$,
  '23514', null, 'rejects names above 120 characters'
);
select throws_ok(
  $$insert into public.application_stages (application_id, name, result, difficulty) values ('22000000-0000-0000-0000-000000000001', 'Offer', 'successful', 'easy')$$,
  '23514', null, 'requires a date outside pending'
);
select throws_ok(
  $$insert into public.application_stages (application_id, name, result, difficulty) values ('22000000-0000-0000-0000-000000000001', 'Pending', 'pending', 'easy')$$,
  '23514', null, 'clears difficulty in pending'
);
select throws_ok(
  $$insert into public.application_stages (application_id, name, event_on, result) values ('22000000-0000-0000-0000-000000000001', 'Offer', current_date, 'successful')$$,
  '23514', null, 'requires difficulty outside pending'
);
select throws_ok(
  $$insert into public.application_stages (application_id, name, questions) values ('22000000-0000-0000-0000-000000000001', 'Questions', repeat('q', 10001))$$,
  '23514', null, 'bounds questions'
);
select throws_ok(
  $$insert into public.application_stages (application_id, name, comments) values ('22000000-0000-0000-0000-000000000001', 'Comments', repeat('c', 10001))$$,
  '23514', null, 'bounds comments'
);

select is(
  (select status::text from public.applications where id = '22000000-0000-0000-0000-000000000001'),
  'interview',
  'stage inserts do not alter board status'
);
select is(
  (select position from public.applications where id = '22000000-0000-0000-0000-000000000001'),
  7,
  'stage inserts do not alter board position'
);

delete from public.application_stages where id = '23000000-0000-0000-0000-000000000003';
select is(
  (
    select id from public.application_stages
    where application_id = '22000000-0000-0000-0000-000000000001'
    order by coalesce(event_on::timestamp, created_at at time zone 'UTC') desc, created_at desc, id desc
    limit 1
  ),
  '23000000-0000-0000-0000-000000000002'::uuid,
  'deleting current naturally reveals the previous stage'
);

select ok(
  not has_table_privilege('authenticated', 'public.application_stages', 'SELECT'),
  'stage reads remain behind Nest'
);
select ok(
  not has_table_privilege('authenticated', 'public.application_stages', 'INSERT'),
  'stage writes remain behind Nest'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.application_stages'::regclass),
  'application_stages keeps RLS enabled'
);
select ok(
  exists(
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'application_stages_application_order_idx'
  ),
  'deterministic order index exists'
);

select * from finish();
rollback;
