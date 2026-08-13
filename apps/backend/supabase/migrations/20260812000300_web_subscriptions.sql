create schema if not exists billing_private;

revoke all on schema billing_private from public, anon, authenticated;
grant usage on schema billing_private to service_role;

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_free boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_code_check check (code ~ '^[a-z][a-z0-9_]*$')
);

create unique index subscription_plans_single_free_idx
  on public.subscription_plans(is_free)
  where is_free;

create table public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_entitlements_code_check check (code ~ '^[a-z][a-z0-9_]*$')
);

create table public.plan_entitlements (
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  entitlement_id uuid not null references public.subscription_entitlements(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (plan_id, entitlement_id)
);

create table public.billing_products (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  provider text not null,
  environment text not null,
  external_product_id text not null,
  catalog_status text not null default 'active',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_products_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint billing_products_environment_check check (environment in ('sandbox', 'production')),
  constraint billing_products_catalog_status_check check (catalog_status in ('active', 'legacy', 'retired')),
  unique (provider, environment, external_product_id),
  unique (id, environment),
  unique (id, provider, environment),
  unique (id, provider, environment, plan_id)
);

create table public.billing_product_price_refs (
  id uuid primary key default gen_random_uuid(),
  billing_product_id uuid not null,
  provider text not null,
  environment text not null,
  external_price_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_product_price_refs_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint billing_product_price_refs_environment_check check (environment in ('sandbox', 'production')),
  constraint billing_product_price_refs_product_fkey
    foreign key (billing_product_id, provider, environment)
    references public.billing_products(id, provider, environment)
    on delete restrict,
  constraint billing_price_external_id_unique unique (provider, environment, external_price_id),
  unique (id, provider, environment, billing_product_id)
);

create table public.provider_entitlement_refs (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.subscription_entitlements(id) on delete restrict,
  authority_provider text not null,
  environment text not null,
  external_entitlement_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_entitlement_refs_provider_check check (authority_provider ~ '^[a-z][a-z0-9_]*$'),
  constraint provider_entitlement_refs_environment_check check (environment in ('sandbox', 'production')),
  unique (authority_provider, environment, external_entitlement_id),
  unique (id, authority_provider, environment)
);

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.billing_customer_external_accounts (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  provider text not null,
  environment text not null,
  external_customer_id text,
  external_app_user_id text,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_external_accounts_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint billing_external_accounts_environment_check check (environment in ('sandbox', 'production')),
  constraint billing_external_accounts_identity_check check (
    external_customer_id is not null or external_app_user_id is not null
  ),
  constraint billing_external_accounts_dates_check check (
    disconnected_at is null or disconnected_at >= connected_at
  ),
  unique (billing_customer_id, provider, environment),
  unique (id, billing_customer_id, provider, environment)
);

create unique index billing_external_accounts_customer_id_idx
  on public.billing_customer_external_accounts(provider, environment, external_customer_id)
  where external_customer_id is not null;

create unique index billing_external_accounts_app_user_id_idx
  on public.billing_customer_external_accounts(provider, environment, external_app_user_id)
  where external_app_user_id is not null;

create table billing_private.provider_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  environment text not null,
  external_event_id text not null,
  event_type text not null,
  external_subject_id text,
  event_occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  payload jsonb,
  payload_sha256 text not null,
  payload_expires_at timestamptz not null,
  payload_purged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_events_source_check check (source ~ '^[a-z][a-z0-9_]*$'),
  constraint provider_events_environment_check check (environment in ('sandbox', 'production')),
  constraint provider_events_payload_hash_check check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  constraint provider_events_payload_retention_check check (payload_expires_at > received_at),
  constraint provider_events_payload_purge_check check (
    (payload is not null and payload_purged_at is null)
    or (payload is null and payload_purged_at is not null)
  ),
  constraint provider_events_external_id_unique unique (source, environment, external_event_id),
  unique (id, source, environment)
);

create table billing_private.provider_event_customer_links (
  event_id uuid primary key,
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  external_account_id uuid,
  source text not null,
  environment text not null,
  linked_at timestamptz not null default now(),
  linked_by text not null,
  constraint provider_event_customer_links_source_check check (source ~ '^[a-z][a-z0-9_]*$'),
  constraint provider_event_customer_links_environment_check check (environment in ('sandbox', 'production')),
  constraint provider_event_customer_links_event_fkey
    foreign key (event_id, source, environment)
    references billing_private.provider_events(id, source, environment)
    on delete restrict,
  constraint provider_event_customer_links_account_fkey
    foreign key (external_account_id, billing_customer_id, source, environment)
    references public.billing_customer_external_accounts(id, billing_customer_id, provider, environment)
    on delete restrict,
  unique (event_id, billing_customer_id, source, environment)
);

create table billing_private.provider_event_processing_attempts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references billing_private.provider_events(id) on delete restrict,
  attempt_number integer not null,
  status text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  error_code text,
  error_message text,
  worker_reference text,
  created_at timestamptz not null default now(),
  constraint provider_event_attempts_number_check check (attempt_number > 0),
  constraint provider_event_attempts_status_check check (status in ('processing', 'processed', 'ignored', 'failed')),
  constraint provider_event_attempts_dates_check check (completed_at is null or completed_at >= started_at),
  constraint provider_event_attempts_error_check check (
    (status = 'failed' and error_code is not null)
    or (status <> 'failed' and error_code is null and error_message is null)
  ),
  unique (event_id, attempt_number)
);

create table public.customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  billing_product_id uuid not null,
  external_account_id uuid,
  provider text not null,
  environment text not null,
  external_subscription_id text not null,
  original_transaction_id text,
  status text not null,
  provider_status text,
  started_at timestamptz not null,
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  auto_renew boolean not null default true,
  last_provider_event_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_subscriptions_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint customer_subscriptions_environment_check check (environment in ('sandbox', 'production')),
  constraint customer_subscriptions_status_check check (
    status in ('trialing', 'active', 'grace_period', 'billing_retry', 'paused', 'canceled', 'expired', 'revoked')
  ),
  constraint customer_subscriptions_period_check check (
    current_period_ends_at is null
    or current_period_started_at is null
    or current_period_ends_at >= current_period_started_at
  ),
  constraint customer_subscriptions_trial_check check (
    trial_ends_at is null or trial_started_at is null or trial_ends_at >= trial_started_at
  ),
  constraint customer_subscriptions_product_fkey
    foreign key (billing_product_id, provider, environment, plan_id)
    references public.billing_products(id, provider, environment, plan_id)
    on delete restrict,
  constraint customer_subscriptions_account_fkey
    foreign key (external_account_id, billing_customer_id, provider, environment)
    references public.billing_customer_external_accounts(id, billing_customer_id, provider, environment)
    on delete restrict,
  constraint customer_subscriptions_event_fkey
    foreign key (last_provider_event_id, billing_customer_id, provider, environment)
    references billing_private.provider_event_customer_links(event_id, billing_customer_id, source, environment)
    on delete restrict,
  unique (provider, environment, external_subscription_id),
  unique (id, billing_customer_id, provider, environment, billing_product_id)
);

create unique index customer_subscriptions_original_transaction_idx
  on public.customer_subscriptions(provider, environment, original_transaction_id)
  where original_transaction_id is not null;

create table billing_private.subscription_state_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.customer_subscriptions(id) on delete restrict,
  provider_event_id uuid not null references billing_private.provider_events(id) on delete restrict,
  status text not null,
  provider_status text,
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  auto_renew boolean not null,
  recorded_at timestamptz not null default now(),
  unique (subscription_id, provider_event_id)
);

create table public.customer_trial_usages (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  billing_product_id uuid not null,
  provider text not null,
  environment text not null,
  external_reference text,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint customer_trial_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint customer_trial_environment_check check (environment in ('sandbox', 'production')),
  constraint customer_trial_dates_check check (ended_at is null or ended_at >= started_at),
  constraint customer_trial_product_fkey
    foreign key (billing_product_id, provider, environment, plan_id)
    references public.billing_products(id, provider, environment, plan_id)
    on delete restrict,
  unique (billing_customer_id, plan_id)
);

create table public.manual_entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  entitlement_id uuid not null references public.subscription_entitlements(id) on delete restrict,
  reason text not null,
  granted_by uuid not null,
  granted_by_role text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint manual_grants_dates_check check (ends_at > starts_at),
  constraint manual_grants_role_check check (granted_by_role ~ '^[a-z][a-z0-9_.:-]*$')
);

create table public.manual_entitlement_revocations (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null unique references public.manual_entitlement_grants(id) on delete restrict,
  reason text not null,
  revoked_by uuid not null,
  revoked_by_role text not null,
  revoked_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint manual_revocations_role_check check (revoked_by_role ~ '^[a-z][a-z0-9_.:-]*$')
);

create table public.provider_entitlement_observations (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  external_account_id uuid not null,
  provider_entitlement_ref_id uuid not null,
  authority_provider text not null,
  environment text not null,
  provider_event_id uuid not null,
  source_billing_product_id uuid references public.billing_products(id) on delete restrict,
  is_active boolean not null,
  starts_at timestamptz not null,
  expires_at timestamptz,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint provider_entitlement_observations_provider_check check (authority_provider ~ '^[a-z][a-z0-9_]*$'),
  constraint provider_entitlement_observations_environment_check check (environment in ('sandbox', 'production')),
  constraint provider_entitlement_observations_dates_check check (expires_at is null or expires_at >= starts_at),
  constraint provider_entitlement_observations_ref_fkey
    foreign key (provider_entitlement_ref_id, authority_provider, environment)
    references public.provider_entitlement_refs(id, authority_provider, environment)
    on delete restrict,
  constraint provider_entitlement_observations_account_fkey
    foreign key (external_account_id, billing_customer_id, authority_provider, environment)
    references public.billing_customer_external_accounts(id, billing_customer_id, provider, environment)
    on delete restrict,
  constraint provider_entitlement_observations_event_fkey
    foreign key (provider_event_id, billing_customer_id, authority_provider, environment)
    references billing_private.provider_event_customer_links(event_id, billing_customer_id, source, environment)
    on delete restrict,
  constraint provider_entitlement_observations_product_fkey
    foreign key (source_billing_product_id, environment)
    references public.billing_products(id, environment)
    on delete restrict,
  unique (provider_event_id, provider_entitlement_ref_id, billing_customer_id)
);

create table billing_private.billing_retained_identities (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null unique references public.billing_customers(id) on delete restrict,
  legal_name text,
  tax_identifier text,
  country_code text,
  retention_reason text not null,
  retain_until timestamptz not null,
  legal_hold boolean not null default false,
  created_at timestamptz not null default now(),
  constraint retained_identity_country_check check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint retained_identity_value_check check (legal_name is not null or tax_identifier is not null),
  constraint retained_identity_dates_check check (retain_until > created_at)
);

create table billing_private.financial_operations (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  subscription_id uuid,
  billing_product_id uuid not null,
  provider text not null,
  environment text not null,
  provider_event_id uuid not null,
  external_object_type text not null,
  external_object_id text not null,
  operation_type text not null,
  financial_status text not null,
  currency text not null,
  subtotal_minor bigint,
  discount_minor bigint,
  tax_minor bigint,
  total_minor bigint not null,
  fee_minor bigint,
  earnings_minor bigint,
  payout_currency text,
  payout_amount_minor bigint,
  occurred_at timestamptz not null,
  retention_class text not null,
  retain_until timestamptz,
  legal_hold boolean not null default false,
  created_at timestamptz not null default now(),
  constraint financial_operations_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint financial_operations_environment_check check (environment in ('sandbox', 'production')),
  constraint financial_operations_type_check check (operation_type in ('initial_purchase', 'renewal', 'one_time_charge')),
  constraint financial_operations_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint financial_operations_amounts_check check (
    total_minor >= 0
    and (subtotal_minor is null or subtotal_minor >= 0)
    and (discount_minor is null or discount_minor >= 0)
    and (tax_minor is null or tax_minor >= 0)
    and (fee_minor is null or fee_minor >= 0)
    and (earnings_minor is null or earnings_minor >= 0)
    and (payout_amount_minor is null or payout_amount_minor >= 0)
  ),
  constraint financial_operations_payout_check check (
    (payout_currency is null and payout_amount_minor is null)
    or (payout_currency ~ '^[A-Z]{3}$' and payout_amount_minor is not null)
  ),
  constraint financial_operations_retention_check check (retain_until is null or retain_until > occurred_at),
  constraint financial_operations_product_fkey
    foreign key (billing_product_id, provider, environment)
    references public.billing_products(id, provider, environment)
    on delete restrict,
  constraint financial_operations_subscription_fkey
    foreign key (subscription_id, billing_customer_id, provider, environment, billing_product_id)
    references public.customer_subscriptions(id, billing_customer_id, provider, environment, billing_product_id)
    on delete restrict,
  constraint financial_operations_event_fkey
    foreign key (provider_event_id, billing_customer_id, provider, environment)
    references billing_private.provider_event_customer_links(event_id, billing_customer_id, source, environment)
    on delete restrict,
  unique (provider, environment, external_object_type, external_object_id),
  unique (id, provider, environment),
  unique (id, billing_customer_id, provider, environment)
);

create table billing_private.financial_adjustments (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null,
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  provider text not null,
  environment text not null,
  provider_event_id uuid not null,
  external_adjustment_id text not null,
  adjustment_type text not null,
  financial_status text not null,
  amount_minor bigint not null,
  currency text not null,
  occurred_at timestamptz not null,
  retention_class text not null,
  retain_until timestamptz,
  legal_hold boolean not null default false,
  created_at timestamptz not null default now(),
  constraint financial_adjustments_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint financial_adjustments_environment_check check (environment in ('sandbox', 'production')),
  constraint financial_adjustments_type_check check (
    adjustment_type in ('refund', 'chargeback', 'reversal', 'chargeback_reversal')
  ),
  constraint financial_adjustments_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint financial_adjustments_amount_check check (amount_minor > 0),
  constraint financial_adjustments_retention_check check (retain_until is null or retain_until > occurred_at),
  constraint financial_adjustments_operation_fkey
    foreign key (operation_id, billing_customer_id, provider, environment)
    references billing_private.financial_operations(id, billing_customer_id, provider, environment)
    on delete restrict,
  constraint financial_adjustments_event_fkey
    foreign key (provider_event_id, billing_customer_id, provider, environment)
    references billing_private.provider_event_customer_links(event_id, billing_customer_id, source, environment)
    on delete restrict,
  unique (provider, environment, external_adjustment_id)
);

create table billing_private.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null,
  provider text not null,
  environment text not null,
  external_attempt_id text not null,
  status text not null,
  amount_minor bigint,
  currency text,
  attempted_at timestamptz not null,
  failure_code text,
  created_at timestamptz not null default now(),
  constraint payment_attempts_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint payment_attempts_environment_check check (environment in ('sandbox', 'production')),
  constraint payment_attempts_amount_check check (
    (amount_minor is null and currency is null)
    or (amount_minor >= 0 and currency ~ '^[A-Z]{3}$')
  ),
  constraint payment_attempts_operation_fkey
    foreign key (operation_id, provider, environment)
    references billing_private.financial_operations(id, provider, environment)
    on delete restrict,
  unique (provider, environment, external_attempt_id)
);

create table billing_private.financial_reconciliation_links (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references billing_private.financial_operations(id) on delete restrict,
  external_document_type text not null,
  external_document_id text not null,
  linked_at timestamptz not null default now(),
  linked_by uuid not null,
  created_at timestamptz not null default now(),
  unique (operation_id, external_document_type, external_document_id)
);

create or replace function billing_private.protect_append_only_row()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception '% rows are append-only', tg_table_name;
end;
$$;

create or replace function billing_private.protect_provider_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.payload is null or new.payload_purged_at is not null then
      raise exception 'provider events must be inserted with their raw payload';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'provider_events rows cannot be deleted';
  end if;

  if (to_jsonb(new) - 'payload' - 'payload_purged_at' - 'updated_at') <>
     (to_jsonb(old) - 'payload' - 'payload_purged_at' - 'updated_at') then
    raise exception 'provider event envelopes are immutable';
  end if;

  if old.payload is null or new.payload is not null or now() < old.payload_expires_at then
    raise exception 'provider payload may only be purged after its retention deadline';
  end if;

  new.payload_purged_at := coalesce(new.payload_purged_at, now());
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.enforce_entitlement_observation_source()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.source_billing_product_id is not null and not exists (
    select 1
    from public.billing_products product
    join public.plan_entitlements plan_entitlement
      on plan_entitlement.plan_id = product.plan_id
    join public.provider_entitlement_refs entitlement_ref
      on entitlement_ref.id = new.provider_entitlement_ref_id
     and entitlement_ref.entitlement_id = plan_entitlement.entitlement_id
    where product.id = new.source_billing_product_id
      and product.environment = new.environment
  ) then
    raise exception 'Source product plan must grant the observed entitlement';
  end if;
  return new;
end;
$$;

create or replace function billing_private.purge_expired_provider_event_payloads(batch_size integer default 1000)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  purged_count integer;
begin
  if batch_size <= 0 or batch_size > 10000 then
    raise exception 'batch_size must be between 1 and 10000';
  end if;

  with expired as (
    select id
    from billing_private.provider_events
    where payload is not null and payload_expires_at <= now()
    order by payload_expires_at
    limit batch_size
    for update skip locked
  )
  update billing_private.provider_events event
  set payload = null,
      payload_purged_at = now()
  from expired
  where event.id = expired.id;

  get diagnostics purged_count = row_count;
  return purged_count;
end;
$$;

create or replace function public.protect_billing_customer_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.profile_id is null and new.profile_id is not null then
    raise exception 'A detached billing customer cannot be relinked';
  end if;
  if old.profile_id is not null and new.profile_id is not null and old.profile_id <> new.profile_id then
    raise exception 'A billing customer cannot be transferred to another profile';
  end if;
  if old.deleted_at is not null and new.deleted_at is distinct from old.deleted_at then
    raise exception 'Billing customer deletion is irreversible';
  end if;
  return new;
end;
$$;

create or replace function public.protect_external_account_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.billing_customer_id <> old.billing_customer_id
    or new.provider <> old.provider
    or new.environment <> old.environment
    or new.external_customer_id is distinct from old.external_customer_id
    or new.external_app_user_id is distinct from old.external_app_user_id then
    raise exception 'External billing account identity is immutable';
  end if;
  if old.disconnected_at is not null and new.disconnected_at is distinct from old.disconnected_at then
    raise exception 'External billing account disconnection is irreversible';
  end if;
  return new;
end;
$$;

create or replace function public.protect_billing_catalog_mapping()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'billing_products' and
     (to_jsonb(new) - 'catalog_status' - 'is_active' - 'updated_at') <>
     (to_jsonb(old) - 'catalog_status' - 'is_active' - 'updated_at') then
    raise exception 'Billing product identity and plan mapping are immutable';
  elsif tg_table_name = 'billing_product_price_refs' and
     (to_jsonb(new) - 'is_active' - 'updated_at') <>
     (to_jsonb(old) - 'is_active' - 'updated_at') then
    raise exception 'Billing price reference identity is immutable';
  elsif tg_table_name = 'provider_entitlement_refs' and
     (to_jsonb(new) - 'is_active' - 'updated_at') <>
     (to_jsonb(old) - 'is_active' - 'updated_at') then
    raise exception 'Provider entitlement reference identity is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_subscription_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_event_at timestamptz;
  next_event_at timestamptz;
  state_changed boolean;
begin
  if tg_op = 'UPDATE' and (
    new.billing_customer_id <> old.billing_customer_id
    or new.plan_id <> old.plan_id
    or new.billing_product_id <> old.billing_product_id
    or new.external_account_id is distinct from old.external_account_id
    or new.provider <> old.provider
    or new.environment <> old.environment
    or new.external_subscription_id <> old.external_subscription_id
    or (old.original_transaction_id is not null and new.original_transaction_id is distinct from old.original_transaction_id)
  ) then
    raise exception 'Subscription ownership and provider identity are immutable';
  end if;

  state_changed := tg_op = 'INSERT' or (
    new.status is distinct from old.status
    or new.provider_status is distinct from old.provider_status
    or new.current_period_started_at is distinct from old.current_period_started_at
    or new.current_period_ends_at is distinct from old.current_period_ends_at
    or new.trial_started_at is distinct from old.trial_started_at
    or new.trial_ends_at is distinct from old.trial_ends_at
    or new.canceled_at is distinct from old.canceled_at
    or new.auto_renew is distinct from old.auto_renew
  );

  if tg_op = 'UPDATE' and state_changed and new.last_provider_event_id = old.last_provider_event_id then
    raise exception 'Every subscription state change requires a new provider event';
  end if;

  if tg_op = 'UPDATE' and state_changed then
    select event_occurred_at into previous_event_at
    from billing_private.provider_events where id = old.last_provider_event_id;
    select event_occurred_at into next_event_at
    from billing_private.provider_events where id = new.last_provider_event_id;
    if next_event_at < previous_event_at then
      raise exception 'An out-of-order event cannot regress subscription state';
    end if;
  end if;

  return new;
end;
$$;

create or replace function billing_private.record_subscription_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or (
    new.status is distinct from old.status
    or new.provider_status is distinct from old.provider_status
    or new.current_period_started_at is distinct from old.current_period_started_at
    or new.current_period_ends_at is distinct from old.current_period_ends_at
    or new.trial_started_at is distinct from old.trial_started_at
    or new.trial_ends_at is distinct from old.trial_ends_at
    or new.canceled_at is distinct from old.canceled_at
    or new.auto_renew is distinct from old.auto_renew
  ) then
    insert into billing_private.subscription_state_history (
      subscription_id, provider_event_id, status, provider_status,
      current_period_started_at, current_period_ends_at,
      trial_started_at, trial_ends_at, canceled_at, auto_renew
    ) values (
      new.id, new.last_provider_event_id, new.status, new.provider_status,
      new.current_period_started_at, new.current_period_ends_at,
      new.trial_started_at, new.trial_ends_at, new.canceled_at, new.auto_renew
    );
  end if;
  return new;
end;
$$;

create trigger billing_customers_identity
  before update on public.billing_customers
  for each row execute procedure public.protect_billing_customer_identity();

create trigger billing_external_accounts_identity
  before update on public.billing_customer_external_accounts
  for each row execute procedure public.protect_external_account_identity();

create trigger billing_products_mapping_immutable
  before update on public.billing_products
  for each row execute procedure public.protect_billing_catalog_mapping();

create trigger billing_product_price_refs_mapping_immutable
  before update on public.billing_product_price_refs
  for each row execute procedure public.protect_billing_catalog_mapping();

create trigger provider_entitlement_refs_mapping_immutable
  before update on public.provider_entitlement_refs
  for each row execute procedure public.protect_billing_catalog_mapping();

create trigger provider_events_protect
  before insert or update or delete on billing_private.provider_events
  for each row execute procedure billing_private.protect_provider_event();

create trigger provider_event_customer_links_immutable
  before update or delete on billing_private.provider_event_customer_links
  for each row execute procedure billing_private.protect_append_only_row();

create trigger provider_event_processing_attempts_immutable
  before update or delete on billing_private.provider_event_processing_attempts
  for each row execute procedure billing_private.protect_append_only_row();

create trigger customer_subscriptions_enforce_update
  before insert or update on public.customer_subscriptions
  for each row execute procedure public.enforce_subscription_update();

create trigger customer_subscriptions_record_state
  after insert or update on public.customer_subscriptions
  for each row execute procedure billing_private.record_subscription_state();

create trigger subscription_state_history_immutable
  before update or delete on billing_private.subscription_state_history
  for each row execute procedure billing_private.protect_append_only_row();

create trigger customer_trial_usages_immutable
  before update or delete on public.customer_trial_usages
  for each row execute procedure billing_private.protect_append_only_row();

create trigger manual_entitlement_grants_immutable
  before update or delete on public.manual_entitlement_grants
  for each row execute procedure billing_private.protect_append_only_row();

create trigger manual_entitlement_revocations_immutable
  before update or delete on public.manual_entitlement_revocations
  for each row execute procedure billing_private.protect_append_only_row();

create trigger provider_entitlement_observations_immutable
  before update or delete on public.provider_entitlement_observations
  for each row execute procedure billing_private.protect_append_only_row();

create trigger provider_entitlement_observations_source
  before insert on public.provider_entitlement_observations
  for each row execute procedure public.enforce_entitlement_observation_source();

create trigger billing_retained_identities_immutable
  before update or delete on billing_private.billing_retained_identities
  for each row execute procedure billing_private.protect_append_only_row();

create trigger financial_operations_immutable
  before update or delete on billing_private.financial_operations
  for each row execute procedure billing_private.protect_append_only_row();

create trigger financial_adjustments_immutable
  before update or delete on billing_private.financial_adjustments
  for each row execute procedure billing_private.protect_append_only_row();

create trigger payment_attempts_immutable
  before update or delete on billing_private.payment_attempts
  for each row execute procedure billing_private.protect_append_only_row();

create trigger financial_reconciliation_links_immutable
  before update or delete on billing_private.financial_reconciliation_links
  for each row execute procedure billing_private.protect_append_only_row();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'subscription_plans',
    'subscription_entitlements',
    'billing_products',
    'billing_product_price_refs',
    'provider_entitlement_refs',
    'billing_customers',
    'billing_customer_external_accounts',
    'customer_subscriptions'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute procedure public.set_updated_at()',
      'set_updated_at_' || table_name,
      table_name
    );
  end loop;
end;
$$;

create or replace view public.active_customer_entitlements
with (security_invoker = true)
as
with ranked_provider_observations as (
  select
    observation.id,
    observation.billing_customer_id,
    ref.entitlement_id,
    observation.authority_provider,
    observation.environment,
    observation.is_active,
    observation.starts_at,
    observation.expires_at,
    row_number() over (
      partition by observation.billing_customer_id, ref.entitlement_id,
        observation.authority_provider, observation.environment
      order by observation.observed_at desc, observation.created_at desc
    ) as observation_rank
  from public.provider_entitlement_observations observation
  join public.provider_entitlement_refs ref on ref.id = observation.provider_entitlement_ref_id
  where ref.is_active
), active_provider_entitlements as (
  select
    id,
    billing_customer_id,
    entitlement_id,
    'provider_observation'::text as source_type,
    id as source_id,
    starts_at,
    expires_at
  from ranked_provider_observations
  where observation_rank = 1
    and is_active
    and starts_at <= now()
    and (expires_at is null or expires_at > now())
), active_manual_entitlements as (
  select
    grant_row.id,
    grant_row.billing_customer_id,
    grant_row.entitlement_id,
    'manual_grant'::text as source_type,
    grant_row.id as source_id,
    grant_row.starts_at,
    grant_row.ends_at as expires_at
  from public.manual_entitlement_grants grant_row
  where grant_row.starts_at <= now()
    and grant_row.ends_at > now()
    and not exists (
      select 1 from public.manual_entitlement_revocations revocation
      where revocation.grant_id = grant_row.id
    )
)
select * from active_provider_entitlements
union all
select * from active_manual_entitlements;

create index billing_products_plan_idx
  on public.billing_products(plan_id, is_active);
create index customer_subscriptions_customer_status_idx
  on public.customer_subscriptions(billing_customer_id, status, current_period_ends_at);
create index provider_events_retention_idx
  on billing_private.provider_events(payload_expires_at)
  where payload is not null;
create index provider_event_attempts_event_idx
  on billing_private.provider_event_processing_attempts(event_id, attempt_number desc);
create index subscription_state_history_subscription_idx
  on billing_private.subscription_state_history(subscription_id, recorded_at desc);
create index provider_entitlement_observations_current_idx
  on public.provider_entitlement_observations(
    billing_customer_id, provider_entitlement_ref_id, authority_provider, environment,
    observed_at desc, created_at desc
  );
create index financial_operations_customer_idx
  on billing_private.financial_operations(billing_customer_id, occurred_at desc);
create index financial_adjustments_operation_idx
  on billing_private.financial_adjustments(operation_id, occurred_at desc);

insert into public.subscription_plans (code, name, description, is_free)
values
  ('free', 'Free', 'Default access without a paid entitlement', true),
  ('pro', 'Pro', 'Paid Palea subscription plan', false);

insert into public.subscription_entitlements (code, name, description)
values ('pro', 'Pro', 'Access to Palea Pro capabilities');

insert into public.plan_entitlements (plan_id, entitlement_id)
select plan.id, entitlement.id
from public.subscription_plans plan
cross join public.subscription_entitlements entitlement
where plan.code = 'pro' and entitlement.code = 'pro';

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'subscription_plans',
    'subscription_entitlements',
    'plan_entitlements',
    'billing_products',
    'billing_product_price_refs',
    'provider_entitlement_refs',
    'billing_customers',
    'billing_customer_external_accounts',
    'customer_subscriptions',
    'customer_trial_usages',
    'manual_entitlement_grants',
    'manual_entitlement_revocations',
    'provider_entitlement_observations'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
  end loop;
end;
$$;

alter table billing_private.provider_events enable row level security;
alter table billing_private.provider_event_customer_links enable row level security;
alter table billing_private.provider_event_processing_attempts enable row level security;
alter table billing_private.subscription_state_history enable row level security;
alter table billing_private.billing_retained_identities enable row level security;
alter table billing_private.financial_operations enable row level security;
alter table billing_private.financial_adjustments enable row level security;
alter table billing_private.payment_attempts enable row level security;
alter table billing_private.financial_reconciliation_links enable row level security;

revoke all on all tables in schema billing_private from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema billing_private to service_role;

revoke all on table public.active_customer_entitlements from public, anon, authenticated;
grant select on table public.active_customer_entitlements to service_role;

revoke execute on function billing_private.protect_append_only_row() from public, anon, authenticated;
revoke execute on function billing_private.protect_provider_event() from public, anon, authenticated;
revoke execute on function billing_private.purge_expired_provider_event_payloads(integer) from public, anon, authenticated;
revoke execute on function billing_private.record_subscription_state() from public, anon, authenticated;
revoke execute on function public.protect_billing_customer_identity() from public, anon, authenticated;
revoke execute on function public.protect_external_account_identity() from public, anon, authenticated;
revoke execute on function public.protect_billing_catalog_mapping() from public, anon, authenticated;
revoke execute on function public.enforce_subscription_update() from public, anon, authenticated;
revoke execute on function public.enforce_entitlement_observation_source() from public, anon, authenticated;
grant execute on function billing_private.purge_expired_provider_event_payloads(integer) to service_role;

comment on schema billing_private is
  'Billing evidence and legally sensitive data. Not exposed through the Supabase Data API.';
comment on table public.billing_products is
  'Provider-neutral product references. Paddle, App Store and Play Store products may coexist.';
comment on table public.provider_entitlement_observations is
  'Append-only entitlement observations from the configured access authority. RevenueCat is the initial authority across web, iOS and Android.';
comment on view public.active_customer_entitlements is
  'Current access derived only from the latest provider entitlement observation or an unrevoked manual grant.';
