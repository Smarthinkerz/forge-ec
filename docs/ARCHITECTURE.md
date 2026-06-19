# Architecture

ForgeEC is a **modular monolith** (Next.js App Router) with clean seams for
future service extraction. One deployable app; feature logic lives in `lib/*`
behind adapter interfaces so external providers swap in without UI changes.

```mermaid
flowchart TB
  subgraph Client["Browser (dark/light · i18n · RTL)"]
    UI["Dashboard · Stores · Campaigns · Creative · Analytics · Agents · Orchestration · Settings"]
  end

  subgraph App["Next.js 15 (App Router) — modular monolith"]
    SA["Server Actions"]
    API["API routes: /api/v1, /api/track, /api/webhooks/*, /api/health"]
    subgraph Lib["lib/ (domain modules)"]
      AI["ai (router + providers)"]
      ST["stores (adapters)"]
      CH["channels (adapters)"]
      CMP["campaigns (builder/allocate)"]
      CR["creative (generate/predict/abtest)"]
      AN["analytics-engine (attribution/forecast/insights)"]
      AG["agents (rules/guardrails/engine)"]
      FN["funnel + messaging (flows/personalize)"]
      BL["billing (plans/entitlements)"]
      SEC["security + observability + api keys"]
    end
  end

  subgraph Data["Supabase"]
    PG[("Postgres + RLS")]
    AUTH["Auth"]
  end

  subgraph Ext["External providers (adapter-gated)"]
    AIP["OpenAI / Anthropic / Gemini"]
    ADS["Shopify · Meta · Google · TikTok · Amazon"]
    MSG["Klaviyo · Mailchimp · Twilio"]
    PAY["Stripe · Tap"]
  end

  UI --> SA --> Lib
  UI --> API --> Lib
  Lib --> PG
  SA --> AUTH
  AI --> AIP
  ST --> ADS
  CH --> ADS
  FN --> MSG
  BL --> PAY
  API -. webhooks .- PAY
  API -. webhooks .- ADS
```

**Key principles:** every external dependency sits behind an adapter with a
working sandbox provider; the registry uses the live one only when credentials
are present. Multi-tenancy is enforced at the database via RLS (`my_org_ids()`).
Extraction path: heavy/async work (agent runs, syncs, attribution batch) can move
to a queue + worker; channels/AI can become services behind the same interfaces.
