-- Remove promptly, but retain the job until every upload token has expired.
alter table public.resume_cleanup_jobs add column finalize_after timestamptz not null default now();
update public.resume_cleanup_jobs set finalize_after = greatest(available_at, created_at + interval '3 hours'), available_at = now();

create or replace function public.enqueue_resume_cleanup() returns trigger
language plpgsql set search_path = '' as $$
begin
  insert into public.resume_cleanup_jobs(storage_path, available_at, finalize_after)
  values (old.storage_path, now(), greatest(now(), old.created_at + interval '3 hours'))
  on conflict (storage_path) do nothing;
  return null;
end;
$$;
-- A reservation lasts at most one hour; an issued upload token lasts two more.
revoke all on function public.enqueue_resume_cleanup() from public;
