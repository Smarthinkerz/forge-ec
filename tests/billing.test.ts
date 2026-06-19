import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANS, getPlan, displayPrice } from "../lib/billing/plans";
import { withinLimit, canUseAgents, aiCreditsRemaining, checkAction } from "../lib/billing/entitlements";

test("plan limits are monotonic across tiers", () => {
  const ids = ["free", "starter", "growth", "enterprise"] as const;
  for (let i = 1; i < ids.length; i++) {
    assert.ok(getPlan(ids[i]).limits.campaigns >= getPlan(ids[i - 1]).limits.campaigns);
    assert.ok(getPlan(ids[i]).limits.aiCredits >= getPlan(ids[i - 1]).limits.aiCredits);
  }
});

test("entitlements gate features correctly", () => {
  assert.equal(canUseAgents("free"), false);
  assert.equal(canUseAgents("growth"), true);
  assert.equal(withinLimit("free", "stores", 0), true);
  assert.equal(withinLimit("free", "stores", 1), false); // free allows 1 store
  assert.equal(withinLimit("enterprise", "campaigns", 9999), true); // unlimited
});

test("ai credits remaining respects unlimited", () => {
  assert.equal(aiCreditsRemaining("starter", 100), 400);
  assert.equal(aiCreditsRemaining("starter", 600), 0); // can't go negative
  assert.equal(aiCreditsRemaining("enterprise", 1e6), Infinity);
});

test("checkAction blocks over-limit with a reason", () => {
  const ok = checkAction("growth", "stores", 1);
  assert.equal(ok.allowed, true);
  const blocked = checkAction("free", "campaigns", 2);
  assert.equal(blocked.allowed, false);
  assert.match(blocked.reason!, /limit/i);
});

test("displayPrice formats per currency and handles free/custom", () => {
  assert.equal(displayPrice(getPlan("free")), "Free");
  assert.equal(displayPrice(getPlan("enterprise")), "Custom");
  assert.match(displayPrice(getPlan("starter"), "USD"), /\$79/);
  assert.ok(displayPrice(getPlan("growth"), "OMR").includes("OMR"));
});
