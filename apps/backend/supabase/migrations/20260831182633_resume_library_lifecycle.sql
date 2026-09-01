-- Policy is authoritative for the API, database and private Storage bucket.
create table public.resume_library_policy (
  id text primary key check (id = 'global'),
  max_size_bytes bigint not null check (max_size_bytes > 0),
  max_resumes integer not null check (max_resumes > 0),
  updated_at timestamptz not null default now()
);
insert into public.resume_library_policy (id, max_size_bytes, max_resumes)
values ('global', 10485760, 10);
alter table public.resume_library_policy enable row level security;
revoke all on public.resume_library_policy from anon, authenticated;

create function public.sync_resume_storage_policy() returns trigger
language plpgsql set search_path = '' as $$
begin
  update storage.buckets set file_size_limit = new.max_size_bytes,
    allowed_mime_types = array['application/pdf'], public = false
    where id = 'resumes';
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.sync_resume_storage_policy() from public;
create trigger resume_storage_policy_sync before update on public.resume_library_policy
for each row execute function public.sync_resume_storage_policy();
update public.resume_library_policy set max_size_bytes = max_size_bytes;

alter table public.resumes drop constraint resumes_size_check;
alter table public.resumes add constraint resumes_size_check check (size_bytes > 0);

create function public.enforce_resume_library_policy() returns trigger
language plpgsql set search_path = '' as $$
declare limits public.resume_library_policy; occupied integer;
begin
  if new.upload_status = 'failed' then return new; end if;
  perform id from public.profiles where id = new.profile_id for update;
  select * into strict limits from public.resume_library_policy where id = 'global';
  if (tg_op = 'INSERT' or new.size_bytes <> old.size_bytes or new.upload_status <> old.upload_status)
    and new.size_bytes > limits.max_size_bytes then
    raise exception 'resume.maxSize' using errcode = '23514';
  end if;
  if tg_op = 'INSERT' or old.upload_status = 'failed' or old.profile_id <> new.profile_id then
    select count(*) into occupied from public.resumes
      where profile_id = new.profile_id and id <> new.id and
        (upload_status = 'ready' or (upload_status = 'pending' and upload_expires_at > now()));
    if occupied >= limits.max_resumes then
      raise exception 'resume.library_full' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_resume_library_policy() from public;
create trigger resumes_enforce_library_policy
before insert or update of size_bytes, upload_status, upload_expires_at, profile_id on public.resumes
for each row execute function public.enforce_resume_library_policy();

-- This outbox survives deletion of both a CV and its account. Storage failures
-- cannot erase the only reference to the private object that must be removed.
create table public.resume_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  available_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);
create index resume_cleanup_jobs_available_idx on public.resume_cleanup_jobs(available_at);
alter table public.resume_cleanup_jobs enable row level security;
revoke all on public.resume_cleanup_jobs from anon, authenticated;

create function public.enqueue_resume_cleanup() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- Supabase upload tokens live for two hours. Final removal waits until those
  -- tokens expire, so a late PUT cannot recreate an object after cleanup.
  insert into public.resume_cleanup_jobs(storage_path, available_at)
  values (old.storage_path, greatest(now(), old.created_at + interval '125 minutes'))
  on conflict (storage_path) do nothing;
  return null;
end;
$$;
revoke all on function public.enqueue_resume_cleanup() from public;
create trigger resumes_cleanup_deleted after delete on public.resumes
for each row execute function public.enqueue_resume_cleanup();
create trigger resumes_cleanup_failed after update of upload_status on public.resumes
for each row when (new.upload_status = 'failed' and old.upload_status <> 'failed')
execute function public.enqueue_resume_cleanup();

insert into public.resume_cleanup_jobs(storage_path, available_at)
select storage_path, greatest(now(), created_at + interval '125 minutes')
from public.resumes where upload_status = 'failed';
