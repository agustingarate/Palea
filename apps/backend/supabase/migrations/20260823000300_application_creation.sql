create type public.compensation_kind as enum ('expected', 'offered');
create type public.compensation_period as enum ('hour', 'day', 'week', 'month', 'year');
create type public.description_source as enum ('manual', 'url', 'image');
create type public.analysis_status as enum ('not_requested', 'pending', 'completed', 'failed');

alter table public.applications
  alter column applied_on drop not null,
  add column description_html text,
  add column description_source public.description_source,
  add column description_asset_path text,
  add column description_capture_status public.analysis_status not null default 'not_requested',
  add column skill_analysis_status public.analysis_status not null default 'not_requested',
  add constraint applications_company_name_length_check check (char_length(trim(company_name)) between 1 and 120),
  add constraint applications_role_length_check check (char_length(trim(role)) between 1 and 120),
  add constraint applications_description_length_check check (description is null or char_length(description) <= 50000),
  add constraint applications_description_html_length_check check (description_html is null or char_length(description_html) <= 100000),
  add constraint applications_description_source_check check (
    description_source is null
    or (description_source = 'manual' and description_html is not null and url is null and description_asset_path is null)
    or (description_source = 'url' and url is not null and description_asset_path is null)
    or (description_source = 'image' and description_asset_path is not null and url is null)
  );

alter table public.application_notes
  add constraint application_notes_body_length_check check (char_length(body) <= 10000);

alter table public.resumes
  add column skill_analysis_status public.analysis_status not null default 'not_requested';

create table public.application_compensations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  kind public.compensation_kind not null,
  minimum_minor bigint,
  maximum_minor bigint,
  currency char(3) not null,
  period public.compensation_period not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, kind),
  constraint application_compensations_bounds_check check (
    (minimum_minor is not null or maximum_minor is not null)
    and (minimum_minor is null or minimum_minor > 0)
    and (maximum_minor is null or maximum_minor > 0)
    and (minimum_minor is null or maximum_minor is null or minimum_minor <= maximum_minor)
  ),
  constraint application_compensations_currency_check check (currency ~ '^[A-Z]{3}$')
);

create table public.resume_skills (
  resume_id uuid not null references public.resumes(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  confidence numeric(5,4) not null,
  extracted_at timestamptz not null default now(),
  primary key (resume_id, skill_id),
  constraint resume_skills_confidence_check check (confidence between 0 and 1)
);

create table public.application_required_skills (
  application_id uuid not null references public.applications(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  confidence numeric(5,4) not null,
  extracted_at timestamptz not null default now(),
  primary key (application_id, skill_id),
  constraint application_required_skills_confidence_check check (confidence between 0 and 1)
);

create trigger set_updated_at_application_compensations
  before update on public.application_compensations
  for each row execute procedure public.set_updated_at();

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
    where r.id = new.resume_id
      and r.profile_id = new.profile_id
      and r.upload_status = 'ready'
  ) then
    raise exception 'The resume must be ready and belong to the application profile';
  end if;
  return new;
end;
$$;

alter table public.application_compensations enable row level security;
alter table public.resume_skills enable row level security;
alter table public.application_required_skills enable row level security;

revoke all on table public.application_compensations from anon, authenticated;
revoke all on table public.resume_skills from anon, authenticated;
revoke all on table public.application_required_skills from anon, authenticated;
grant select, insert, update, delete on table public.application_compensations to service_role;
grant select, insert, update, delete on table public.resume_skills to service_role;
grant select, insert, update, delete on table public.application_required_skills to service_role;

create index application_compensations_application_idx
  on public.application_compensations(application_id);
create index resume_skills_skill_idx on public.resume_skills(skill_id);
create index application_required_skills_skill_idx
  on public.application_required_skills(skill_id);
