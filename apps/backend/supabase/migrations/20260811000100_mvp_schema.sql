create extension if not exists pgcrypto;

create type public.application_status as enum ('draft', 'applied', 'interview', 'offer', 'rejected');
create type public.work_mode as enum ('remote', 'hybrid', 'onsite', 'unspecified');
create type public.commitment as enum ('full_time', 'part_time', 'unspecified');
create type public.contract_type as enum ('employment', 'freelance', 'services', 'internship', 'other', 'unspecified');
create type public.duration_type as enum ('indefinite', 'temporary', 'unspecified');
create type public.experience_band as enum ('zero_to_one', 'two_to_four', 'five_to_eight', 'over_eight');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  birth_date date,
  nationality text,
  role_description text,
  experience_band public.experience_band,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_interests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.profile_interests(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_skills (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

create table public.work_experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  role text not null,
  started_on date not null,
  ended_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_experiences_dates_check check (is_current or ended_on is null or ended_on >= started_on),
  constraint work_experiences_current_date_check check (not is_current or ended_on is null)
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  display_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resumes_pdf_check check (lower(mime_type) = 'application/pdf'),
  constraint resumes_size_check check (size_bytes > 0 and size_bytes <= 10485760)
);

create unique index resumes_one_primary_per_profile
  on public.resumes(profile_id)
  where is_primary;

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  role text not null,
  applied_on date not null,
  status public.application_status not null default 'draft',
  url text,
  location text,
  description text,
  work_mode public.work_mode not null default 'unspecified',
  commitment public.commitment not null default 'unspecified',
  contract_type public.contract_type not null default 'unspecified',
  duration_type public.duration_type not null default 'unspecified',
  schedule text,
  resume_id uuid references public.resumes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_stages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  name text not null,
  details text,
  event_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_resources (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  name text not null,
  url text not null,
  resource_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_profile_status_idx on public.applications(profile_id, status);
create index application_stages_application_event_idx on public.application_stages(application_id, event_on, created_at);
create index application_resources_application_idx on public.application_resources(application_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.enforce_profile_interest_limit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended('profile_interests:' || new.profile_id::text, 0)
  );
  if (select count(*) from public.user_interests where profile_id = new.profile_id) >= 3 then
    raise exception 'A profile can have at most 3 interests';
  end if;
  return new;
end;
$$;

create trigger user_interests_limit
  before insert on public.user_interests
  for each row execute procedure public.enforce_profile_interest_limit();

create or replace function public.enforce_profile_skill_limit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended('profile_skills:' || new.profile_id::text, 0)
  );
  if (select count(*) from public.user_skills where profile_id = new.profile_id) >= 10 then
    raise exception 'A profile can have at most 10 skills';
  end if;
  return new;
end;
$$;

create trigger user_skills_limit
  before insert on public.user_skills
  for each row execute procedure public.enforce_profile_skill_limit();

create or replace function public.enforce_application_resume_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.resume_id is not null and not exists (
    select 1
    from public.resumes r
    where r.id = new.resume_id and r.profile_id = new.profile_id
  ) then
    raise exception 'The resume must belong to the application profile';
  end if;
  return new;
end;
$$;

create trigger applications_resume_owner
  before insert or update of profile_id, resume_id on public.applications
  for each row execute procedure public.enforce_application_resume_owner();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'profile_interests', 'skills', 'work_experiences', 'resumes', 'applications', 'application_stages', 'application_notes', 'application_resources'] loop
    execute format('create trigger %I before update on public.%I for each row execute procedure public.set_updated_at()', 'set_updated_at_' || table_name, table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.profile_interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.work_experiences enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.application_stages enable row level security;
alter table public.application_notes enable row level security;
alter table public.application_resources enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'profile_interests',
    'user_interests',
    'skills',
    'user_skills',
    'work_experiences',
    'resumes',
    'applications',
    'application_stages',
    'application_notes',
    'application_resources'
  ] loop
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
  end loop;
end;
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Nest creates signed upload/download URLs after authorizing the current user.
-- Clients receive no direct storage.objects policy for the resumes bucket.
