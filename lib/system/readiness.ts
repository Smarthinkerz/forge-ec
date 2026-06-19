// System readiness: inspects env to report which integrations are live vs demo.
// Pure (env injectable) so it powers both /api/health and the deploy preflight.
export type CompStatus = "configured" | "demo" | "missing";
export interface Component { name: string; status: CompStatus; detail: string; }
export interface Readiness { mode: "live" | "demo"; coreReady: boolean; components: Component[]; }

type Env = Record<string, string | undefined>;

export function systemReadiness(env: Env = process.env): Readiness {
  const has = (k: string) => Boolean(env[k]);
  const components: Component[] = [];

  const supabase = has("NEXT_PUBLIC_SUPABASE_URL") && has("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  components.push({ name: "database/auth (Supabase)", status: supabase ? "configured" : "demo", detail: supabase ? "live" : "demo data + no accounts" });
  components.push({ name: "service role (admin)", status: has("SUPABASE_SERVICE_ROLE_KEY") ? "configured" : "demo", detail: "webhooks/persistence" });

  const aiProvider = env.ANTHROPIC_API_KEY ? "anthropic" : env.OPENAI_API_KEY ? "openai" : env.GOOGLE_GEMINI_API_KEY ? "gemini" : null;
  components.push({ name: "AI provider", status: aiProvider ? "configured" : "demo", detail: aiProvider ?? "mock provider" });

  const billing = env.STRIPE_SECRET_KEY ? "stripe" : env.TAP_SECRET_KEY ? "tap" : null;
  components.push({ name: "billing", status: billing ? "configured" : "demo", detail: billing ?? "sandbox checkout" });
  components.push({ name: "billing webhook secret", status: has("BILLING_WEBHOOK_SECRET") ? "configured" : "missing", detail: "required for live plan activation" });

  const messaging = env.KLAVIYO_API_KEY || env.MAILCHIMP_API_KEY || env.TWILIO_ACCOUNT_SID ? "configured" : "demo";
  components.push({ name: "email/SMS", status: messaging as CompStatus, detail: "Klaviyo/Mailchimp/Twilio" });

  components.push({ name: "rate limiter", status: (has("UPSTASH_REDIS_REST_URL") ? "configured" : "demo"), detail: has("UPSTASH_REDIS_REST_URL") ? "Upstash (multi-instance)" : "in-memory (single instance)" });
  components.push({ name: "analytics (GA4)", status: has("GA4_PROPERTY_ID") ? "configured" : "demo", detail: "GA4 Data API" });

  return { mode: supabase ? "live" : "demo", coreReady: supabase, components };
}
