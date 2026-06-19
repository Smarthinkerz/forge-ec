import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateFlow, FLOW_TEMPLATES } from "../lib/funnel/flows";
import { personalize } from "../lib/funnel/personalize";
import { getMessagingAdapter } from "../lib/messaging/registry";
import { generateLandingVariants } from "../lib/funnel/landing";

test("flow simulation: funnel decreases and is deterministic", () => {
  const t = FLOW_TEMPLATES.find((f) => f.id === "abandoned_cart")!;
  const a = simulateFlow(t, 1000), b = simulateFlow(t, 1000);
  assert.deepEqual(a, b);
  assert.equal(a.enrolled, 1000);
  for (const s of a.steps) { assert.ok(s.sent >= s.opens && s.opens >= s.clicks); }
  assert.ok(a.revenue === a.conversions * a.aov);
});

test("messaging registry: sandbox without creds, real with creds", () => {
  assert.equal(getMessagingAdapter("klaviyo", {}).provider, "mock");
  assert.equal(getMessagingAdapter("klaviyo", { apiKey: "k" }).provider, "klaviyo");
});

test("personalization returns segment-appropriate, explainable offers", () => {
  assert.match(personalize("new").offer, /shipping/i);
  assert.match(personalize("cart_abandoner").headline, /cart/i);
  assert.match(personalize("vip").offer, /VIP|loyalty|access/i);
  assert.ok(personalize("returning").reasoning.length > 10);
});

test("landing variants generate and a winner is chosen (mock AI)", async () => {
  const r = await generateLandingVariants({ productTitle: "Merino Sweater", productDescription: "Soft knit." }, 2);
  assert.equal(r.variants.length, 2);
  assert.ok(r.winnerIndex >= 0 && r.winnerIndex < 2);
  assert.ok(r.variants[r.winnerIndex].prediction.score >= r.variants[1 - r.winnerIndex].prediction.score);
});
