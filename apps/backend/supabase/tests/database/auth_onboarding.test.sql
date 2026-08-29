begin;
select plan(7);

insert into auth.users (id, aud, role, email, encrypted_password, raw_user_meta_data)
values ('21000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'auth-test@palea.local', 'x', '{"full_name":"Auth Test"}');

select is(
  (select full_name from public.profiles where id = '21000000-0000-0000-0000-000000000001'),
  'Auth Test',
  'SPEC-AUTH-001 creates the profile'
);

select throws_ok(
  $$update public.profiles set nationality = 'Argentina' where id = '21000000-0000-0000-0000-000000000001'$$,
  'insert or update on table "profiles" violates foreign key constraint "profiles_nationality_country_code_fkey"',
  'SPEC-AUTH-001 rejects free-form nationality'
);

update public.profiles set nationality = 'AR' where id = '21000000-0000-0000-0000-000000000001';
select is(
  (select nationality from public.profiles where id = '21000000-0000-0000-0000-000000000001'),
  'AR',
  'SPEC-AUTH-001 accepts ISO nationality'
);

select ok((select bool_and(label_es is not null and label_en is not null) from public.profile_interests), 'interest catalog is bilingual');
select ok((select bool_and(label_es is not null and label_en is not null) from public.skills), 'skill catalog is bilingual');

insert into public.resumes (id, profile_id, storage_path, display_name, mime_type, size_bytes, upload_status, upload_expires_at, uploaded_at)
values ('22000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'pending.pdf', 'Pending', 'application/pdf', 5, 'pending', now() + interval '10 minutes', null);

select throws_ok(
  $$update public.resumes set is_primary = true where id = '22000000-0000-0000-0000-000000000001'$$,
  'new row for relation "resumes" violates check constraint "resumes_upload_state_check"',
  'pending resume cannot be primary'
);

update public.resumes set upload_status = 'ready', upload_expires_at = null, uploaded_at = now(), is_primary = true where id = '22000000-0000-0000-0000-000000000001';
select ok((select is_primary from public.resumes where id = '22000000-0000-0000-0000-000000000001'), 'confirmed resume becomes primary');

select * from finish();
rollback;
