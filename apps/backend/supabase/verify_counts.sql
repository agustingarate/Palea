select
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('profiles', 'profile_interests', 'user_interests', 'skills', 'user_skills', 'work_experiences', 'resumes', 'applications', 'application_stages', 'application_notes', 'application_resources')) as tables,
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('profiles', 'profile_interests', 'user_interests', 'skills', 'user_skills', 'work_experiences', 'resumes', 'applications', 'application_stages', 'application_notes', 'application_resources') and c.relrowsecurity) as rls_tables,
  (select count(*) from pg_policies where schemaname = 'public') as policies,
  (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not t.tgisinternal) as triggers,
  (select count(*) from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e') as enums,
  (select max(version) from supabase_migrations.schema_migrations) as migration;
