import { test } from "node:test";
import assert from "node:assert/strict";
import { getChannelAdapter } from "../lib/channels/registry";
import { MockChannelAdapter } from "../lib/channels/mock";
import { allocateBudget } from "../lib/campaigns/allocate";
import { draftCampaign } from "../lib/campaigns/builder";
import { launchCampaign } from "../lib/campaigns/service";

test("channel registry: sandbox without creds, real adapter with creds", () => {
  assert.equal(getChannelAdapter("meta", {}).constructor.name, "MockChannelAdapter");
  const real = getChannelAdapter("meta", { accessToken: "t", adAccountId: "act_1" });
  assert.equal(real.constructor.name, "MetaAdsAdapter");
});

test("mock channel produces coherent, deterministic results", async () => {
  const a = new MockChannelAdapter("google");
  const draft = { name: "Test", channel: "google" as const, objective: "conversions" as const, budgetDaily: 100, currency: "USD", audience: "x" };
  const { externalId } = await a.createCampaign(draft);
  const r1 = await a.getResults(externalId, draft, 14);
  const r2 = await a.getResults(externalId, draft, 14);
  assert.deepEqual(r1, r2);                       // deterministic
  assert.ok(r1.impressions > r1.clicks);          // funnel sanity
  assert.ok(r1.clicks >= r1.conversions);
  assert.ok(r1.roas >= 0);
});

test("budget allocation favors higher ROAS, respects total + floor", () => {
  const alloc = allocateBudget(1000, [
    { id: "a", name: "A", roas: 6, currentDaily: 200 },
    { id: "b", name: "B", roas: 2, currentDaily: 200 },
    { id: "c", name: "C", roas: 0.5, currentDaily: 200 },
  ]);
  const sum = alloc.reduce((s, x) => s + x.recommendedDaily, 0);
  assert.ok(Math.abs(sum - 1000) <= 3);                       // ~conserves total
  assert.ok(alloc[0].recommendedDaily > alloc[2].recommendedDaily); // winner gets more
  assert.ok(alloc[2].recommendedDaily > 0);                   // floor respected
});

test("NL builder returns a structured draft (mock AI)", async () => {
  const d = await draftCampaign("summer apparel for EU women 25-45", "meta");
  assert.equal(d.channel, "meta");
  assert.ok(d.budgetDaily >= 1);
  assert.ok(["conversions", "traffic", "awareness", "catalog_sales"].includes(d.objective));
});

test("launchCampaign returns results via the adapter", async () => {
  const d = await draftCampaign("retargeting cart abandoners", "meta");
  const launched = await launchCampaign(d);
  assert.ok(launched.externalId.length > 0);
  assert.equal(launched.status, "active");
  assert.ok(launched.result.revenue >= 0);
});
