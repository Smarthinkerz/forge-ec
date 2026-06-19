# Deployment runbook

ForgeEC ships as a standalone Next.js server (Docker-ready). It runs in **demo
mode with zero config**; configure the env below to go live.

## 1. Prerequisites
- Node 22+ (local) or Docker.
- A Supabase project (Postgres + Auth).
- Optional: AI key, ad-platform credentials, Stripe/Tap, Klaviyo/Mailchimp/Twilio.

## 2. Database
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (creates tables, RLS, triggers).
3. Copy the project URL, anon key, and service-role key.

## 3. Environment
Copy `.env.example` → `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # webhooks/persistence
ANTHROPIC_API_KEY=... (or OPENAI/GEMINI)
BILLING_PROVIDER=stripe|tap          # + STRIPE_SECRET_KEY or TAP_SECRET_KEY
BILLING_WEBHOOK_SECRET=...
UPSTASH_REDIS_REST_URL=... (multi-instance rate limiting)
```
Then run the preflight: `npm run preflight` (exits non-zero if core not set).

## 4. Deploy — choose one
**A) VPS + Docker (recommended self-host).**
```
docker compose up --build -d          # app on :3000
```
Put Caddy/Nginx in front for TLS. Health probe: `GET /api/health`.

**B) Railway.** Connect the repo; set env vars; Railway builds the Dockerfile.
Add an Upstash Redis plugin for rate limiting.

**C) Vercel.** Import the repo; set env vars. Use Upstash for rate limiting/
idempotency (serverless has no shared memory). Webhooks work as serverless fns.

## 5. Post-deploy checks
- `GET /api/health` → `mode: "live"`, components configured.
- Sign up → confirms profile + org + owner membership (trigger).
- Connect a store (Shopify self-serve first), launch a sandbox campaign.
- Register provider webhooks → `/api/webhooks/{store,billing}`; verify signatures.

## 6. Scaling
- Move rate limiting + webhook idempotency to Redis.
- Extract agent runs / catalog syncs to a queue + worker.
- Consider read replicas + Timescale for `metrics_daily` at high volume.
