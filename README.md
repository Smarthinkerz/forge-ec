# ForgeEC

> The autonomous growth OS for global commerce.

An AI-powered E-commerce Growth Operating System: unify every ad channel,
generate creative, attribute revenue, and let autonomous agents optimize spend —
global-first, privacy-first, explainable.

This repo is built **phase by phase**, each verified (typecheck + build + tests)
before the next. It runs in **demo mode with zero setup**.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000  (demo mode)
# or
docker compose up --build
```

No keys needed to explore: the dashboard renders deterministic demo data, and
the marketing site + app shell are fully navigable. Add Supabase keys in
`.env.local` to turn on real accounts, organizations, and data.

```bash
npm run typecheck   # strict TS
npm test            # unit tests (Node test runner)
npm run build       # production build (standalone output)
```

## Honest scope

This is a **modular monolith**, not the literal microservices/Kafka/Pinecone
stack from the original brief — that's the buildable, testable, self-hostable
choice, with clean seams to extract services later. Things that require *your*
accounts or platform approval (Shopify Partner app, Meta/Google/TikTok Ads API
access, generation APIs, Stripe) are built behind **adapters with working mock
providers**, so the full flow runs now and real providers activate when you add
credentials. Marketing outcomes (ROAS multiples, SOC2, uptime %) are not code
artifacts and aren't claimed as "done."

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind · Recharts · Supabase
(Postgres + Auth) · Zod · Docker (standalone) · GitHub Actions.

## Phase status

- **Phase 1 — Foundation ✅** multi-tenant schema + org-scoped RLS, auth & orgs
  with roles (RBAC), app shell (sidebar + topbar), dashboard with charts + KPIs,
  marketing site, i18n + RTL (English/Arabic), dark/light themes, health
  endpoint, Docker, CI, unit tests.
- **Phase 2 — Store integrations ✅** `StoreAdapter` pattern with a working
  sandbox provider + documented real skeletons (Shopify/Woo/BigCommerce/Magento),
  product sync, per-channel AI copy optimization, AI site audit, store webhook,
  and an interactive Stores UI (connect → sync → audit → optimize). AI layer
  (router + mock/OpenAI/Anthropic/Gemini) added. See docs/INTEGRATIONS.md.
- **Phase 3 — Channels & campaigns ✅** ad-channel adapter pattern (sandbox +
  Google/Meta/TikTok/Pinterest/Amazon skeletons), natural-language campaign
  builder, launch→simulated-results flow, smart budget allocation (ROAS-weighted
  with diminishing returns + floor), pause/resume, and a CAPI-style /api/track
  event endpoint.
- **Phase 4 — AI Creative Studio ✅** copy generation via the AI layer, brand
  guardrails (banned-word scrub + limits), real renderable **SVG banner**
  creatives (no image API needed), image-provider skeletons (Replicate/OpenAI),
  explainable pre-launch performance prediction, and an A/B test engine with
  winner/lift/confidence + scaling recommendation.
- **Phase 5 — Analytics & Intelligence ✅** real engine: multi-touch attribution
  (last/first/linear/position/time-decay, revenue-conserving), ROAS forecast
  (least-squares trend), LTV/CAC, and explainable insight detectors. A real-data
  **source** pulls live results from `metrics_daily` + a `touchpoints` table when
  connected (org-scoped), with a sample-data fallback and a live/sample badge.
  `/api/track` records attribution touchpoints; GA4 mock + documented real hook.
- **Phase 6 — Autonomous Growth Agents ✅** deterministic monitoring rules
  (pause losers, scale winners, trim decliners, anomaly alerts) + safety
  guardrails (max change %, budget caps/floors, cooldowns, data-sufficiency) +
  three autonomy levels (suggest / supervised / autonomous) with human approval
  queue, portfolio reallocation, and audit logging. Reads live channel metrics
  via the analytics source (sample fallback).
- **Phase 7 — Full-funnel orchestration ✅** email/SMS adapter layer
  (Klaviyo/Mailchimp/Twilio skeletons + sandbox), lifecycle flow templates
  (welcome, abandoned-cart, post-purchase, win-back) with deterministic funnel
  simulation, onsite personalization rules (new/returning/cart/VIP) with
  explainable offers, and AI landing-page variants scored + winner-picked. New
  Orchestration section in the app.
- **Phase 8 — Billing & plans ✅** Free/Starter/Growth/Enterprise tiers as a
  single source of truth, real entitlement gating (limits + agent access),
  usage metering (live counts or sample), multi-currency display (incl. OMR/AED/
  SAR), a billing-provider abstraction (Stripe + Tap, sandbox-first), an
  HMAC-verified billing webhook that activates plans, and a Settings billing page
  with usage meters + upgrade.
- **Phase 9 — Advanced ✅** public **API v1** (health/campaigns/sustainability)
  with Bearer API-key auth (hashed) + rate limiting, **OpenAPI spec** +
  **Swagger docs** at /api-docs, **sustainability scoring** (carbon estimate +
  grade + carbon-aware tips, surfaced on the dashboard and via API),
  **white-label branding** + API-key management in Settings, structured
  **observability** (logging + error capture), and a security hardening doc.
- **Phase 10 — Deploy ✅** standalone Docker server, deploy **preflight**
  (`npm run preflight`), readiness-reporting `/api/health`, and full docs:
  ARCHITECTURE (Mermaid), DEPLOYMENT runbook (VPS/Railway/Vercel), COSTS
  (100/1k/10k stores), SECURITY, and LAUNCH checklist + v1.1 roadmap.

---

**All 10 phases complete.** 20 routes · 48 unit tests · typecheck clean · production build green. See `docs/` for deployment.

## Architecture (Phase 1)

```
app/
  (marketing)/page.tsx     Landing
  (auth)/login             Auth (email; OAuth-ready via Supabase)
  (app)/                   Authenticated shell
    dashboard              KPIs + charts + campaign table
    stores|campaigns|…     Section routes (filled in later phases)
  api/health               Liveness probe
lib/
  supabase/                Browser/server/admin clients + config guard
  i18n/                    en + ar dictionaries, dir()
  rbac/                    Role → permission checks
  utils/                   Formatting + cn
  demo.ts                  Deterministic demo dataset
supabase/schema.sql        Multi-tenant schema with org-scoped RLS
```

Multi-tenancy: every business row carries `org_id`; RLS restricts access to
orgs the user belongs to (`my_org_ids()`). A new signup gets a profile, a
personal organization, and an `owner` membership via a DB trigger.
