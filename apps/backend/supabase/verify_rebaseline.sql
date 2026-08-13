-- Run in the staging SQL Editor before a destructive rebaseline.
-- Every value must be zero. Auth and Storage are checked separately because
-- resetting public tables alone does not prove that they are disposable.

select jsonb_build_object(
  'auth_users', (select count(*) from auth.users),
  'storage_objects', (select count(*) from storage.objects),
  'profiles', (select count(*) from public.profiles),
  'work_experiences', (select count(*) from public.work_experiences),
  'resumes', (select count(*) from public.resumes),
  'applications', (select count(*) from public.applications),
  'application_stages', (select count(*) from public.application_stages),
  'application_notes', (select count(*) from public.application_notes),
  'application_resources', (select count(*) from public.application_resources),
  'billing_customers', (select count(*) from public.billing_customers),
  'customer_subscriptions', (select count(*) from public.customer_subscriptions)
) as rebaseline_counts;
