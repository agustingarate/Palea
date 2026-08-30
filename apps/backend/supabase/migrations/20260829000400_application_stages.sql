create type public.application_stage_result as enum (
  'pending',
  'waiting',
  'successful',
  'failed'
);

create type public.application_stage_difficulty as enum (
  'easy',
  'medium',
  'hard'
);

alter table public.application_stages
  rename column details to comments;

alter table public.application_stages
  add column result public.application_stage_result not null default 'pending',
  add column difficulty public.application_stage_difficulty,
  add column questions text,
  add constraint application_stages_name_check
    check (name = btrim(name) and char_length(name) between 1 and 120),
  add constraint application_stages_questions_length_check
    check (questions is null or char_length(questions) <= 10000),
  add constraint application_stages_comments_length_check
    check (comments is null or char_length(comments) <= 10000),
  add constraint application_stages_result_date_check
    check (result = 'pending' or event_on is not null),
  add constraint application_stages_result_difficulty_check
    check (
      (result = 'pending' and difficulty is null)
      or
      (result <> 'pending' and difficulty is not null)
    );

drop index public.application_stages_application_event_idx;

create index application_stages_application_order_idx
  on public.application_stages (
    application_id,
    coalesce(event_on::timestamp, created_at at time zone 'UTC') desc,
    created_at desc,
    id desc
  );
