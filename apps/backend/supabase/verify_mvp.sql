select json_build_object(
  'tables', (
    select count(*)
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'profiles', 'profile_interests', 'user_interests', 'skills',
        'user_skills', 'work_experiences', 'resumes', 'applications',
        'application_stages', 'application_notes', 'application_resources'
      )
  ),
  'rls_tables', (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles', 'profile_interests', 'user_interests', 'skills',
        'user_skills', 'work_experiences', 'resumes', 'applications',
        'application_stages', 'application_notes', 'application_resources'
      )
      and c.relrowsecurity
  ),
  'policies', (select count(*) from pg_policies where schemaname = 'public'),
  'triggers', (
    select count(*)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and not t.tgisinternal
  ),
  'enums', (
    select count(*)
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  ),
  'migration', (select max(version) from supabase_migrations.schema_migrations)
) as verification;

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where specific_schema = 'public'
  and routine_name = 'handle_new_user'
order by grantee, privilege_type;
