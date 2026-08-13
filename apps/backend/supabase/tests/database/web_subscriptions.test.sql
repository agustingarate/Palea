begin;

create extension if not exists pgtap with schema extensions;

select plan(53);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'billing-one@example.com', '', now(), now(), now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'billing-two@example.com', '', now(), now(), now()
  );

insert into public.billing_customers (id, profile_id) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002');

insert into public.billing_customer_external_accounts (
  id, billing_customer_id, provider, environment, external_customer_id, external_app_user_id
) values
  (
    '21000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'paddle', 'sandbox', 'ctm_paddle_one', null
  ),
  (
    '21000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'paddle', 'sandbox', 'ctm_paddle_two', null
  ),
  (
    '21000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'revenuecat', 'sandbox', null, '10000000-0000-0000-0000-000000000001'
  ),
  (
    '21000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    'revenuecat', 'sandbox', null, '10000000-0000-0000-0000-000000000002'
  );

insert into public.billing_products (
  id, plan_id, provider, environment, external_product_id
)
select '30000000-0000-0000-0000-000000000001', id, 'paddle', 'sandbox', 'pro_paddle'
from public.subscription_plans where code = 'pro';

insert into public.billing_products (
  id, plan_id, provider, environment, external_product_id
)
select '30000000-0000-0000-0000-000000000005', id, 'paddle', 'sandbox', 'free_paddle'
from public.subscription_plans where code = 'free';

insert into public.billing_products (
  id, plan_id, provider, environment, external_product_id
)
select '30000000-0000-0000-0000-000000000002', id, 'app_store', 'sandbox', 'com.palea.pro.monthly'
from public.subscription_plans where code = 'pro';

insert into public.billing_products (
  id, plan_id, provider, environment, external_product_id
)
select '30000000-0000-0000-0000-000000000003', id, 'play_store', 'sandbox', 'palea_pro_monthly'
from public.subscription_plans where code = 'pro';

insert into public.billing_products (
  id, plan_id, provider, environment, external_product_id
)
select '30000000-0000-0000-0000-000000000004', id, 'paddle', 'sandbox', 'pro_paddle_legacy'
from public.subscription_plans where code = 'pro';

insert into public.billing_product_price_refs (
  id, billing_product_id, provider, environment, external_price_id
) values (
  '31000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'paddle', 'sandbox', 'pri_pro_monthly'
);

insert into public.provider_entitlement_refs (
  id, entitlement_id, authority_provider, environment, external_entitlement_id
)
select
  '32000000-0000-0000-0000-000000000001', id,
  'revenuecat', 'sandbox', 'pro'
from public.subscription_entitlements where code = 'pro';

select is((select count(*)::integer from public.subscription_plans), 2, 'AC-01 seeds exactly Free and Pro');
select ok((select is_free from public.subscription_plans where code = 'free'), 'BR-01 marks Free as the default');
select is(
  (select count(*)::integer from public.plan_entitlements pe
   join public.subscription_plans p on p.id = pe.plan_id
   join public.subscription_entitlements e on e.id = pe.entitlement_id
   where p.code = 'pro' and e.code = 'pro'),
  1,
  'AC-01 maps the Pro plan to the Pro entitlement'
);
select is((select count(*)::integer from public.billing_products where provider = 'app_store'), 1, 'BR-15 accepts an App Store product');
select is((select count(*)::integer from public.billing_products where provider = 'play_store'), 1, 'BR-15 accepts a Play Store product');
select is((select count(*)::integer from public.billing_product_price_refs where external_price_id = 'pri_pro_monthly'), 1, 'BR-06 stores only the external price reference');

select throws_ok(
  $$insert into public.billing_product_price_refs (billing_product_id, provider, environment, external_price_id) values ('30000000-0000-0000-0000-000000000004', 'paddle', 'sandbox', 'pri_pro_monthly')$$,
  'duplicate key value violates unique constraint "billing_price_external_id_unique"',
  'AC-12 prevents reusing a price ID within one provider environment'
);

select ok(not has_table_privilege('authenticated', 'public.billing_products', 'SELECT'), 'AC-02 clients cannot read billing base tables directly');
select ok(not has_table_privilege('authenticated', 'billing_private.provider_events', 'SELECT'), 'AC-02 clients cannot read provider evidence');
select ok(not has_table_privilege('authenticated', 'public.customer_subscriptions', 'INSERT'), 'AC-02 clients cannot write subscriptions');
select ok(not has_schema_privilege('authenticated', 'billing_private', 'USAGE'), 'AC-02 private billing schema is not exposed to clients');

insert into billing_private.provider_events (
  id, source, environment, external_event_id, event_type,
  event_occurred_at, payload, payload_sha256, payload_expires_at
) values (
  '40000000-0000-0000-0000-000000000001',
  'paddle', 'sandbox', 'evt_paddle_active', 'subscription.created',
  now() - interval '2 hours', '{}'::jsonb, repeat('a', 64), now() + interval '90 days'
);

insert into billing_private.provider_event_customer_links (
  event_id, billing_customer_id, external_account_id, source, environment, linked_by
) values (
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  'paddle', 'sandbox', 'provider_identity'
);

insert into public.customer_subscriptions (
  id, billing_customer_id, plan_id, billing_product_id, external_account_id,
  provider, environment, external_subscription_id, original_transaction_id,
  status, provider_status, started_at, current_period_started_at,
  current_period_ends_at, auto_renew, last_provider_event_id
)
select
  '50000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', plan.id,
  '30000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  'paddle', 'sandbox', 'sub_paddle_one', 'txn_original_one',
  'active', 'active', now() - interval '2 hours', now() - interval '2 hours',
  now() + interval '30 days', true,
  '40000000-0000-0000-0000-000000000001'
from public.subscription_plans plan where plan.code = 'pro';

select is((select count(*)::integer from public.active_customer_entitlements), 0, 'AC-06 Paddle subscription state alone never grants Pro');
select is((select count(*)::integer from billing_private.subscription_state_history where subscription_id = '50000000-0000-0000-0000-000000000001'), 1, 'AC-14 records initial subscription state');

select throws_ok(
  $$update public.customer_subscriptions set status = 'canceled' where id = '50000000-0000-0000-0000-000000000001'$$,
  'Every subscription state change requires a new provider event',
  'AC-14 requires an event for every state transition'
);

insert into billing_private.provider_events (
  id, source, environment, external_event_id, event_type,
  event_occurred_at, payload, payload_sha256, payload_expires_at
) values
  (
    '40000000-0000-0000-0000-000000000002',
    'paddle', 'sandbox', 'evt_paddle_old', 'subscription.updated',
    now() - interval '3 hours', '{}'::jsonb, repeat('b', 64), now() + interval '90 days'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'paddle', 'sandbox', 'evt_paddle_cancel', 'subscription.updated',
    now() - interval '1 hour', '{}'::jsonb, repeat('c', 64), now() + interval '90 days'
  );

insert into billing_private.provider_event_customer_links (
  event_id, billing_customer_id, external_account_id, source, environment, linked_by
) values
  (
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'paddle', 'sandbox', 'provider_identity'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'paddle', 'sandbox', 'provider_identity'
  );

select throws_ok(
  $$update public.customer_subscriptions set status = 'canceled', last_provider_event_id = '40000000-0000-0000-0000-000000000002' where id = '50000000-0000-0000-0000-000000000001'$$,
  'An out-of-order event cannot regress subscription state',
  'AC-04 rejects an older event from changing current state'
);

select lives_ok(
  $$update public.customer_subscriptions set status = 'canceled', auto_renew = false, canceled_at = now(), last_provider_event_id = '40000000-0000-0000-0000-000000000003' where id = '50000000-0000-0000-0000-000000000001'$$,
  'AC-14 accepts a newer provider-backed transition'
);
select is((select count(*)::integer from billing_private.subscription_state_history where subscription_id = '50000000-0000-0000-0000-000000000001'), 2, 'AC-14 preserves both subscription states');

select throws_ok(
  $$insert into public.customer_subscriptions (billing_customer_id, plan_id, billing_product_id, external_account_id, provider, environment, external_subscription_id, status, started_at, last_provider_event_id) select '20000000-0000-0000-0000-000000000001', id, '30000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'paddle', 'sandbox', 'sub_wrong_product', 'active', now(), '40000000-0000-0000-0000-000000000003' from public.subscription_plans where code = 'pro'$$,
  'insert or update on table "customer_subscriptions" violates foreign key constraint "customer_subscriptions_product_fkey"',
  'AC-13 rejects a subscription whose product provider does not match'
);

select throws_ok(
  $$insert into public.customer_subscriptions (billing_customer_id, plan_id, billing_product_id, external_account_id, provider, environment, external_subscription_id, status, started_at, last_provider_event_id) select '20000000-0000-0000-0000-000000000001', id, '30000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', 'paddle', 'sandbox', 'sub_wrong_account', 'active', now(), '40000000-0000-0000-0000-000000000003' from public.subscription_plans where code = 'pro'$$,
  'insert or update on table "customer_subscriptions" violates foreign key constraint "customer_subscriptions_account_fkey"',
  'AC-13 rejects an external account from another provider'
);

select throws_ok(
  $$insert into billing_private.provider_events (source, environment, external_event_id, event_type, event_occurred_at, payload, payload_sha256, payload_expires_at) values ('paddle', 'sandbox', 'evt_paddle_active', 'duplicate', now(), '{}'::jsonb, repeat('d', 64), now() + interval '90 days')$$,
  'duplicate key value violates unique constraint "provider_events_external_id_unique"',
  'AC-04 deduplicates provider events by source and environment'
);
select throws_ok(
  $$insert into billing_private.provider_events (source, environment, external_event_id, event_type, event_occurred_at, payload, payload_sha256, payload_expires_at, payload_purged_at) values ('paddle', 'sandbox', 'evt_missing_payload', 'invalid', now(), null, repeat('d', 64), now() + interval '90 days', now())$$,
  'provider events must be inserted with their raw payload',
  'AC-04 requires the raw payload when an event is first received'
);

select throws_ok(
  $$update billing_private.provider_events set event_type = 'tampered' where id = '40000000-0000-0000-0000-000000000001'$$,
  'provider event envelopes are immutable',
  'AC-04 protects the provider event envelope'
);
select throws_ok(
  $$delete from billing_private.provider_events where id = '40000000-0000-0000-0000-000000000001'$$,
  'provider_events rows cannot be deleted',
  'AC-04 prevents deleting provider evidence'
);

insert into billing_private.provider_event_processing_attempts (
  event_id, attempt_number, status, started_at, completed_at
) values (
  '40000000-0000-0000-0000-000000000001', 1, 'processed', now(), now()
);
select throws_ok(
  $$update billing_private.provider_event_processing_attempts set status = 'ignored' where event_id = '40000000-0000-0000-0000-000000000001'$$,
  'provider_event_processing_attempts rows are append-only',
  'AC-15 keeps processing attempts append-only'
);

insert into billing_private.provider_events (
  id, source, environment, external_event_id, event_type,
  event_occurred_at, received_at, payload, payload_sha256, payload_expires_at
) values (
  '40000000-0000-0000-0000-000000000004',
  'paddle', 'sandbox', 'evt_expired_payload', 'test.expired',
  now() - interval '3 days', now() - interval '2 days',
  '{"secret":"temporary"}'::jsonb, repeat('e', 64), now() - interval '1 day'
);

select is(billing_private.purge_expired_provider_event_payloads(100), 1, 'AC-16 purges payloads after their retention deadline');
select is((select payload from billing_private.provider_events where id = '40000000-0000-0000-0000-000000000004'), null::jsonb, 'AC-16 removes the expired raw payload');
select is((select payload_sha256 from billing_private.provider_events where id = '40000000-0000-0000-0000-000000000004'), repeat('e', 64), 'AC-16 retains the payload hash after purge');

insert into billing_private.provider_events (
  id, source, environment, external_event_id, event_type,
  event_occurred_at, payload, payload_sha256, payload_expires_at
) values
  (
    '40000000-0000-0000-0000-000000000005',
    'revenuecat', 'sandbox', 'evt_rc_active', 'CUSTOMER_INFO_UPDATED',
    now() - interval '30 minutes', '{}'::jsonb, repeat('f', 64), now() + interval '90 days'
  ),
  (
    '40000000-0000-0000-0000-000000000006',
    'revenuecat', 'sandbox', 'evt_rc_inactive', 'EXPIRATION',
    now() - interval '20 minutes', '{}'::jsonb, repeat('0', 64), now() + interval '90 days'
  ),
  (
    '40000000-0000-0000-0000-000000000007',
    'revenuecat', 'sandbox', 'evt_rc_apple_active', 'RENEWAL',
    now() - interval '10 minutes', '{}'::jsonb, repeat('1', 64), now() + interval '90 days'
  );

insert into billing_private.provider_event_customer_links (
  event_id, billing_customer_id, external_account_id, source, environment, linked_by
) values
  ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', 'revenuecat', 'sandbox', 'app_user_id'),
  ('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', 'revenuecat', 'sandbox', 'app_user_id'),
  ('40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', 'revenuecat', 'sandbox', 'app_user_id');

insert into public.provider_entitlement_observations (
  id, billing_customer_id, external_account_id, provider_entitlement_ref_id,
  authority_provider, environment, provider_event_id, source_billing_product_id,
  is_active, starts_at, expires_at, observed_at
) values (
  '60000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000003',
  '32000000-0000-0000-0000-000000000001',
  'revenuecat', 'sandbox', '40000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000001',
  true, now() - interval '30 minutes', now() + interval '30 days', now() - interval '30 minutes'
);

select is((select count(*)::integer from public.active_customer_entitlements), 1, 'AC-06 a RevenueCat observation grants Pro');

insert into public.provider_entitlement_observations (
  id, billing_customer_id, external_account_id, provider_entitlement_ref_id,
  authority_provider, environment, provider_event_id,
  is_active, starts_at, expires_at, observed_at
) values (
  '60000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000003',
  '32000000-0000-0000-0000-000000000001',
  'revenuecat', 'sandbox', '40000000-0000-0000-0000-000000000006',
  false, now() - interval '20 minutes', now() - interval '1 minute', now() - interval '20 minutes'
);

select is((select count(*)::integer from public.active_customer_entitlements), 0, 'AC-06 a newer inactive RevenueCat observation removes Pro');

insert into public.provider_entitlement_observations (
  id, billing_customer_id, external_account_id, provider_entitlement_ref_id,
  authority_provider, environment, provider_event_id, source_billing_product_id,
  is_active, starts_at, expires_at, observed_at
) values (
  '60000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000003',
  '32000000-0000-0000-0000-000000000001',
  'revenuecat', 'sandbox', '40000000-0000-0000-0000-000000000007',
  '30000000-0000-0000-0000-000000000002',
  true, now() - interval '10 minutes', now() + interval '30 days', now() - interval '10 minutes'
);

select is((select count(*)::integer from public.active_customer_entitlements), 1, 'AC-17 RevenueCat grants the same Pro entitlement for an App Store purchase');

select throws_ok(
  $$insert into public.provider_entitlement_observations (billing_customer_id, external_account_id, provider_entitlement_ref_id, authority_provider, environment, provider_event_id, is_active, starts_at, observed_at) values ('20000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000001', 'revenuecat', 'sandbox', '40000000-0000-0000-0000-000000000001', true, now(), now())$$,
  'insert or update on table "provider_entitlement_observations" violates foreign key constraint "provider_entitlement_observations_event_fkey"',
  'AC-06 a Paddle event cannot masquerade as RevenueCat entitlement evidence'
);
select throws_ok(
  $$insert into public.provider_entitlement_observations (billing_customer_id, external_account_id, provider_entitlement_ref_id, authority_provider, environment, provider_event_id, source_billing_product_id, is_active, starts_at, observed_at) values ('20000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000001', 'revenuecat', 'sandbox', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', true, now(), now())$$,
  'Source product plan must grant the observed entitlement',
  'AC-13 rejects entitlement evidence sourced from a product on another plan'
);

insert into public.manual_entitlement_grants (
  id, billing_customer_id, entitlement_id, reason, granted_by, granted_by_role,
  starts_at, ends_at
)
select
  '70000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', id,
  'Support recovery while investigating a provider incident',
  '90000000-0000-0000-0000-000000000001', 'billing.support',
  now() - interval '1 minute', now() + interval '1 day'
from public.subscription_entitlements where code = 'pro';

select is((select count(*)::integer from public.active_customer_entitlements), 2, 'AC-08 manual and provider access coexist as separate evidence');
select throws_ok(
  $$update public.manual_entitlement_grants set reason = 'rewritten' where id = '70000000-0000-0000-0000-000000000001'$$,
  'manual_entitlement_grants rows are append-only',
  'AC-08 manual grant facts are immutable'
);
select throws_ok(
  $$delete from public.manual_entitlement_grants where id = '70000000-0000-0000-0000-000000000001'$$,
  'manual_entitlement_grants rows are append-only',
  'AC-08 manual grants cannot be deleted'
);

insert into public.manual_entitlement_revocations (
  id, grant_id, reason, revoked_by, revoked_by_role, revoked_at
) values (
  '71000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  'Provider incident resolved',
  '90000000-0000-0000-0000-000000000002', 'billing.admin', now()
);

select is((select count(*)::integer from public.active_customer_entitlements), 1, 'AC-08 revocation removes only the manual source');
select throws_ok(
  $$update public.manual_entitlement_revocations set reason = 'rewritten' where id = '71000000-0000-0000-0000-000000000001'$$,
  'manual_entitlement_revocations rows are append-only',
  'AC-08 revocation facts are immutable'
);
select throws_ok(
  $$insert into public.manual_entitlement_revocations (grant_id, reason, revoked_by, revoked_by_role, revoked_at) values ('70000000-0000-0000-0000-000000000001', 'second revocation', '90000000-0000-0000-0000-000000000002', 'billing.admin', now())$$,
  'duplicate key value violates unique constraint "manual_entitlement_revocations_grant_id_key"',
  'AC-08 a grant can be revoked only once'
);

insert into public.customer_trial_usages (
  billing_customer_id, plan_id, billing_product_id, provider, environment, started_at
)
select
  '20000000-0000-0000-0000-000000000001', id,
  '30000000-0000-0000-0000-000000000001', 'paddle', 'sandbox', now()
from public.subscription_plans where code = 'pro';
select is((select count(*)::integer from public.customer_trial_usages), 1, 'AC-05 records one global Pro trial');
select throws_ok(
  $$insert into public.customer_trial_usages (billing_customer_id, plan_id, billing_product_id, provider, environment, started_at) select '20000000-0000-0000-0000-000000000001', id, '30000000-0000-0000-0000-000000000002', 'app_store', 'sandbox', now() from public.subscription_plans where code = 'pro'$$,
  'duplicate key value violates unique constraint "customer_trial_usages_billing_customer_id_plan_id_key"',
  'AC-05 prevents a second trial through another store'
);

insert into billing_private.financial_operations (
  id, billing_customer_id, subscription_id, billing_product_id,
  provider, environment, provider_event_id,
  external_object_type, external_object_id, operation_type, financial_status,
  currency, subtotal_minor, discount_minor, tax_minor, total_minor,
  occurred_at, retention_class
) values (
  '80000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'paddle', 'sandbox', '40000000-0000-0000-0000-000000000001',
  'transaction', 'txn_001', 'initial_purchase', 'completed',
  'USD', 1000, 0, 210, 1210, now() - interval '2 hours', 'financial_evidence'
);

select is((select count(*)::integer from billing_private.financial_operations), 1, 'AC-18 stores the normalized original financial operation');
select throws_ok(
  $$update billing_private.financial_operations set total_minor = 1 where id = '80000000-0000-0000-0000-000000000001'$$,
  'financial_operations rows are append-only',
  'AC-18 financial operations are immutable'
);

insert into billing_private.provider_events (
  id, source, environment, external_event_id, event_type,
  event_occurred_at, payload, payload_sha256, payload_expires_at
) values (
  '40000000-0000-0000-0000-000000000008',
  'paddle', 'sandbox', 'evt_paddle_customer_two', 'transaction.completed',
  now(), '{}'::jsonb, repeat('2', 64), now() + interval '90 days'
);
insert into billing_private.provider_event_customer_links (
  event_id, billing_customer_id, external_account_id, source, environment, linked_by
) values (
  '40000000-0000-0000-0000-000000000008',
  '20000000-0000-0000-0000-000000000002',
  '21000000-0000-0000-0000-000000000002',
  'paddle', 'sandbox', 'provider_identity'
);

select throws_ok(
  $$insert into billing_private.financial_operations (billing_customer_id, subscription_id, billing_product_id, provider, environment, provider_event_id, external_object_type, external_object_id, operation_type, financial_status, currency, total_minor, occurred_at, retention_class) values ('20000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'paddle', 'sandbox', '40000000-0000-0000-0000-000000000008', 'transaction', 'txn_wrong_owner', 'renewal', 'completed', 'USD', 1210, now(), 'financial_evidence')$$,
  'insert or update on table "financial_operations" violates foreign key constraint "financial_operations_subscription_fkey"',
  'AC-13 rejects a transaction linked to another customer subscription'
);

insert into billing_private.provider_events (
  id, source, environment, external_event_id, event_type,
  event_occurred_at, payload, payload_sha256, payload_expires_at
) values
  ('40000000-0000-0000-0000-000000000009', 'paddle', 'sandbox', 'evt_refund_one', 'adjustment.updated', now(), '{}'::jsonb, repeat('3', 64), now() + interval '90 days'),
  ('40000000-0000-0000-0000-000000000010', 'paddle', 'sandbox', 'evt_refund_two', 'adjustment.updated', now(), '{}'::jsonb, repeat('4', 64), now() + interval '90 days');
insert into billing_private.provider_event_customer_links (
  event_id, billing_customer_id, external_account_id, source, environment, linked_by
) values
  ('40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'paddle', 'sandbox', 'provider_identity'),
  ('40000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'paddle', 'sandbox', 'provider_identity');

insert into billing_private.financial_adjustments (
  id, operation_id, billing_customer_id, provider, environment, provider_event_id,
  external_adjustment_id, adjustment_type, financial_status,
  amount_minor, currency, occurred_at, retention_class
) values (
  '81000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'paddle', 'sandbox', '40000000-0000-0000-0000-000000000009',
  'adj_refund_001', 'refund', 'approved', 300, 'USD', now(), 'financial_evidence'
);
select is((select count(*)::integer from billing_private.financial_adjustments where operation_id = '80000000-0000-0000-0000-000000000001'), 1, 'AC-18 links an adjustment to its original operation');

insert into billing_private.financial_adjustments (
  operation_id, billing_customer_id, provider, environment, provider_event_id,
  external_adjustment_id, adjustment_type, financial_status,
  amount_minor, currency, occurred_at, retention_class
) values (
  '80000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'paddle', 'sandbox', '40000000-0000-0000-0000-000000000010',
  'adj_refund_002', 'refund', 'approved', 200, 'USD', now(), 'financial_evidence'
);
select is((select count(*)::integer from billing_private.financial_adjustments where operation_id = '80000000-0000-0000-0000-000000000001'), 2, 'AC-18 supports multiple partial refunds');

select throws_ok(
  $$insert into billing_private.financial_adjustments (operation_id, billing_customer_id, provider, environment, provider_event_id, external_adjustment_id, adjustment_type, financial_status, amount_minor, currency, occurred_at, retention_class) values ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'play_store', 'sandbox', '40000000-0000-0000-0000-000000000010', 'adj_wrong_provider', 'refund', 'approved', 100, 'USD', now(), 'financial_evidence')$$,
  'insert or update on table "financial_adjustments" violates foreign key constraint "financial_adjustments_operation_fkey"',
  'AC-13 rejects an adjustment from another provider'
);

insert into billing_private.payment_attempts (
  operation_id, provider, environment, external_attempt_id, status,
  amount_minor, currency, attempted_at
) values
  ('80000000-0000-0000-0000-000000000001', 'paddle', 'sandbox', 'attempt_001', 'failed', 1210, 'USD', now() - interval '5 minutes'),
  ('80000000-0000-0000-0000-000000000001', 'paddle', 'sandbox', 'attempt_002', 'succeeded', 1210, 'USD', now());
select is((select count(*)::integer from billing_private.payment_attempts where operation_id = '80000000-0000-0000-0000-000000000001'), 2, 'AC-18 preserves multiple payment attempts');
select throws_ok(
  $$update billing_private.financial_adjustments set amount_minor = 1 where id = '81000000-0000-0000-0000-000000000001'$$,
  'financial_adjustments rows are append-only',
  'AC-18 financial adjustments are immutable'
);

select throws_ok(
  $$update public.billing_customer_external_accounts set external_customer_id = 'transferred' where id = '21000000-0000-0000-0000-000000000001'$$,
  'External billing account identity is immutable',
  'AC-09 external provider identities cannot be transferred'
);
select lives_ok(
  $$update public.billing_customer_external_accounts set disconnected_at = now() where id = '21000000-0000-0000-0000-000000000001'$$,
  'AC-09 permits an irreversible external account disconnection'
);
select throws_ok(
  $$update public.billing_customer_external_accounts set disconnected_at = null where id = '21000000-0000-0000-0000-000000000001'$$,
  'External billing account disconnection is irreversible',
  'AC-09 disconnected external accounts cannot be silently restored'
);

delete from auth.users where id = '10000000-0000-0000-0000-000000000001';
select is((select profile_id from public.billing_customers where id = '20000000-0000-0000-0000-000000000001'), null::uuid, 'AC-10 account deletion unlinks the interactive profile');
select is((select count(*)::integer from billing_private.financial_operations where billing_customer_id = '20000000-0000-0000-0000-000000000001'), 1, 'AC-10 account deletion preserves required financial evidence');

select * from finish();
rollback;
