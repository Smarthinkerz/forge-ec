import { test } from "node:test";
import assert from "node:assert/strict";
import { systemReadiness } from "../lib/system/readiness";

test("demo mode when core env is absent", () => {
  const r = systemReadiness({});
  assert.equal(r.mode, "demo");
  assert.equal(r.coreReady, false);
  assert.ok(r.components.length >= 6);
  assert.ok(r.components.every((c) => ["configured", "demo", "missing"].includes(c.status)));
});

test("live mode when Supabase + providers configured", () => {
  const r = systemReadiness({
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "svc",
    ANTHROPIC_API_KEY: "a",
    STRIPE_SECRET_KEY: "sk",
    BILLING_WEBHOOK_SECRET: "shh",
  });
  assert.equal(r.mode, "live");
  assert.equal(r.coreReady, true);
  const ai = r.components.find((c) => c.name === "AI provider")!;
  assert.equal(ai.status, "configured");
  assert.equal(ai.detail, "anthropic");
  const billing = r.components.find((c) => c.name === "billing")!;
  assert.equal(billing.detail, "stripe");
});
