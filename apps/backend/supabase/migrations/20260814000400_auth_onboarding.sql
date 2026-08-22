create type public.resume_upload_status as enum ('pending', 'ready', 'failed');

alter table public.profiles
  add constraint profiles_nationality_iso_check
  check (nationality is null or nationality ~ '^[A-Z]{2}$');

alter table public.profile_interests
  add column label_es text,
  add column label_en text;
update public.profile_interests set label_es = name, label_en = name;
alter table public.profile_interests
  alter column label_es set not null,
  alter column label_en set not null;

alter table public.skills
  add column label_es text,
  add column label_en text;
update public.skills set label_es = name, label_en = name;
alter table public.skills
  alter column label_es set not null,
  alter column label_en set not null;

create or replace function public.fill_catalog_labels()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.label_es := coalesce(nullif(trim(new.label_es), ''), new.name);
  new.label_en := coalesce(nullif(trim(new.label_en), ''), new.name);
  return new;
end;
$$;

create trigger profile_interests_fill_labels
before insert or update of name, label_es, label_en on public.profile_interests
for each row execute function public.fill_catalog_labels();

create trigger skills_fill_labels
before insert or update of name, label_es, label_en on public.skills
for each row execute function public.fill_catalog_labels();

alter table public.resumes
  add column upload_status public.resume_upload_status not null default 'ready',
  add column upload_expires_at timestamptz,
  add column uploaded_at timestamptz default now();
update public.resumes
  set uploaded_at = created_at
  where upload_status = 'ready' and uploaded_at is null;
alter table public.resumes
  add constraint resumes_upload_state_check check (
    (upload_status = 'pending' and upload_expires_at is not null and uploaded_at is null and not is_primary)
    or (upload_status = 'ready' and upload_expires_at is null and uploaded_at is not null)
    or (upload_status = 'failed' and not is_primary)
  );
create index resumes_pending_expiration_idx
  on public.resumes(upload_expires_at)
  where upload_status = 'pending';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
