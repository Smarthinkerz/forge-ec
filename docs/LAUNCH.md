# Launch checklist & v1.1 roadmap

## Go-live checklist
- [ ] Supabase live; `schema.sql` applied; `npm run preflight` passes.
- [ ] AI key set; verify audits/creative/campaign drafts use a real model.
- [ ] Implement + connect at least one real store adapter (Shopify is self-serve).
- [ ] Apply for ad-platform API access (Meta/Google/TikTok — allow weeks for review).
- [ ] Billing: Stripe/Tap keys + price IDs; verify native webhook signatures; test upgrade.
- [ ] Security pass: CSP, dependency scan, secrets rotation, rate limits on Redis.
- [ ] Legal: privacy policy, terms, GDPR/CCPA export+deletion, cookie consent, DPA.
- [ ] Observability: wire Sentry DSN; dashboards/alerts on `/api/health` + logs.
- [ ] Load test the core flows; back up the database; document on-call.

## What's live today vs. pending
- **Live (built + verified):** full app + the user journey end-to-end in sandbox;
  real engines (attribution, forecasting, agents, creative, billing entitlements);
  API + docs; multi-tenant RLS; Docker.
- **Pending for production:** real external API implementations + approvals, a live
  database run, deployment, and the hardening above.

## v1.1 roadmap
- Real adapters: Shopify GraphQL, Meta/Google/TikTok Ads (post-approval).
- Incrementality testing & lift studies; competitive intelligence module.
- Deeper agents (LLM-in-the-loop proposals, scheduled autonomous runs via worker).
- Video creative via Replicate/Grok Imagine; DCO at scale.
- 100+ locales via i18next + AI translation fallback.
- Agency/white-label dashboards; usage-based AI-credit metering + performance-fee billing.
