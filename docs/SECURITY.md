# Security & compliance notes

ForgeEC is built with a SOC2-readiness posture (not a certification claim).

## Implemented
- **Multi-tenant isolation** — every business table is org-scoped with Postgres RLS; access requires membership (`my_org_ids()`).
- **AuthN/Z** — Supabase Auth; role-based access control (`lib/rbac`) with five roles.
- **API auth** — Bearer API keys; only a SHA-256 hash is stored, raw key shown once.
- **Rate limiting** — `lib/security/ratelimit` (in-memory; Upstash-ready) applied to the public API.
- **Input validation** — Zod on all API/webhook inputs.
- **Webhook integrity** — billing webhook verifies an HMAC-SHA256 over the raw body (constant-time), idempotent on `event_id`.
- **Transport/security headers** — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy (`next.config.ts`).
- **Observability** — structured JSON logging + Sentry-ready error capture (`lib/observability`).
- **Secrets** — provider keys are server-side env only; never sent to the client.

## Before production (hardening checklist)
- Verify native provider webhook signatures (Stripe-Signature, Tap, Shopify HMAC).
- Move rate limiting + idempotency to Redis for multi-instance deploys.
- Add CSP, dependency scanning, and audit-log retention policies.
- GDPR/CCPA: data export + deletion flows, DPA, cookie consent.
- Penetration test + load test before GA.
