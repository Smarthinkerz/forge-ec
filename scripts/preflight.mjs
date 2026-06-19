#!/usr/bin/env node
// Deploy preflight: prints integration readiness and exits non-zero if the core
// (database/auth) isn't configured. Run: node scripts/preflight.mjs
const env = process.env;
const has = (k) => Boolean(env[k]);
const line = (ok, name, detail) => console.log(`  ${ok ? "✓" : "○"} ${name.padEnd(28)} ${detail}`);

const supabase = has("NEXT_PUBLIC_SUPABASE_URL") && has("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const ai = env.ANTHROPIC_API_KEY ? "anthropic" : env.OPENAI_API_KEY ? "openai" : env.GOOGLE_GEMINI_API_KEY ? "gemini" : null;
const billing = env.STRIPE_SECRET_KEY ? "stripe" : env.TAP_SECRET_KEY ? "tap" : null;

console.log("\nForgeEC deploy preflight\n");
line(supabase, "Database/Auth (Supabase)", supabase ? "live" : "DEMO — set NEXT_PUBLIC_SUPABASE_URL + ANON_KEY");
line(has("SUPABASE_SERVICE_ROLE_KEY"), "Service role (admin)", "webhooks + persistence");
line(Boolean(ai), "AI provider", ai ?? "mock (set OPENAI/ANTHROPIC/GEMINI key)");
line(Boolean(billing), "Billing", billing ?? "sandbox (set STRIPE_SECRET_KEY or TAP_SECRET_KEY)");
line(has("BILLING_WEBHOOK_SECRET"), "Billing webhook secret", "needed for live plan activation");
line(has("UPSTASH_REDIS_REST_URL"), "Rate limiter", has("UPSTASH_REDIS_REST_URL") ? "Upstash" : "in-memory (single instance)");

console.log(`\nMode: ${supabase ? "LIVE" : "DEMO"}\n`);
if (!supabase) { console.error("Core not configured — app will run in demo mode. Configure Supabase for production.\n"); process.exit(1); }
console.log("Core ready. ✅\n");
