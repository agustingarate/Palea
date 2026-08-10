# Security baseline

Palea follows applicable OWASP MASVS principles: least privilege, explicit trust
boundaries, safe storage, secure transport, validated input, and non-sensitive
logging. Client applications never contain backend or AI provider secrets. Future
session tokens must use platform secure storage rather than general preferences.

Staging and production use separate data stores, credentials, OAuth applications,
runtime identities, AI Gateway keys, push credentials, and public endpoints.
Production personal data is never copied into staging. Every environment variable,
HTTP payload, webhook, tRPC input, and structured AI response is parsed with Zod at
its system boundary.

Cloudflare is an edge control for TLS, DDoS mitigation, bot challenges, caching,
and web application filtering. It does not replace Nest authentication,
authorization, rate limits, business invariants, database permissions, or input
validation.

AI calls originate only in Nest. Prompts minimize personal data, disallow provider
training, and use an approved provider allowlist. Sensitive workflows require an
approved zero-data-retention route and legal review before release. Generated
content remains untrusted and cannot directly authorize actions, execute tools, or
persist structured data without validation.

Supabase and AI providers are international subprocessors. Region selection does
not replace the contractual and disclosure obligations applicable to international
personal-data transfers.
