# Reliability

Network calls must support cancellation, bounded timeouts, normalized errors, and
explicit retry policy. Health checks have no dependency on product data. Mobile's
in-memory datasource keeps local development independent of backend availability.

Cloud Run scales to zero and starts with bounded maximum instances in each
environment. Retries must be bounded and jittered so a downstream outage cannot
amplify traffic or AI spend. Provider quotas and budget exhaustion are expected
failure modes and must produce controlled, observable degradation.

Sentry provides application errors, traces, release tags, and environment tags.
Google Cloud Logging and Monitoring provide runtime and infrastructure evidence.
Logs, analytics, and traces must never mix staging with production or contain
secrets and unnecessary personal data.

AI model aliases are backend configuration. Gateway fallbacks may use only approved
providers and must preserve privacy requirements. Budget exhaustion, including an
AI Gateway HTTP 402 response, is not retried and must fail safely.
