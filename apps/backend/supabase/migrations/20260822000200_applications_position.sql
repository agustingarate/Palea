alter table public.applications
  add column position integer not null default 0;

with ranked as (
  select
    id,
    row_number() over (
      partition by profile_id, status
      order by applied_on desc, id desc
    ) - 1 as position
  from public.applications
)
update public.applications applications
set position = ranked.position
from ranked
where applications.id = ranked.id;

drop index if exists public.applications_profile_status_idx;
create index applications_profile_status_position_idx
  on public.applications(profile_id, status, position, id);
