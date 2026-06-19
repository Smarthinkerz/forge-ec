# Cost model (indicative)

Rough monthly infrastructure cost at three scales. **Estimates only** — actuals
depend on usage, AI volume, region, and negotiated rates. AI and email/SMS are
usage-based and typically dominate at scale.

| Component | 100 stores | 1,000 stores | 10,000 stores |
|---|---|---|---|
| App hosting | $20–50 (1 VPS / Railway) | $150–400 (2–3 instances + LB) | $1.5k–4k (autoscaled + LB) |
| Postgres (Supabase) | $25 (Pro) | $100–300 | $1k–3k (dedicated) |
| Redis (rate limit/queue) | $0 (in-mem) | $10–30 (Upstash) | $100–400 |
| AI (audits/creative/agents) | $50–200 | $500–2k | $5k–20k+ |
| Email/SMS (Klaviyo/Twilio) | pass-through | pass-through | pass-through |
| Object storage/CDN | $5–15 | $30–100 | $300–1k |
| Observability (Sentry/logs) | $0–26 | $80–200 | $500–1.5k |
| **Approx. total/mo** | **~$120–320** | **~$1.4k–5k** | **~$8.5k–30k+** |

**Unit economics:** dominant variable cost is AI per active merchant. Meter AI
credits per plan (Phase 8) so each tier covers its inference cost plus margin.
Use a cheaper model for high-volume tasks (audits, copy) and reserve premium
models for agent reasoning. Cache audits/creatives where possible.
