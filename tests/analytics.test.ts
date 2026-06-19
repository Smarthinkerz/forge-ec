import { test } from "node:test";
import assert from "node:assert/strict";
import { attribute, type Journey } from "../lib/analytics-engine/attribution";
import { forecastROAS, predictLTV, cac, ltvCacRatio } from "../lib/analytics-engine/forecast";
import { generateInsights } from "../lib/analytics-engine/insights";

const journeys: Journey[] = [
  { converted: true, revenue: 100, touchpoints: [{ channel: "meta", daysBeforeConversion: 5 }, { channel: "google", daysBeforeConversion: 0 }] },
  { converted: true, revenue: 200, touchpoints: [{ channel: "tiktok", daysBeforeConversion: 3 }, { channel: "meta", daysBeforeConversion: 1 }, { channel: "google", daysBeforeConversion: 0 }] },
  { converted: false, revenue: 0, touchpoints: [{ channel: "pinterest", daysBeforeConversion: 2 }] },
];

test("attribution conserves total revenue across models", () => {
  for (const m of ["last", "first", "linear", "position", "time_decay"] as const) {
    const r = attribute(journeys, m);
    const sum = r.channels.reduce((s, c) => s + c.creditedRevenue, 0);
    assert.ok(Math.abs(sum - 300) <= 2, `${m} conserves revenue (got ${sum})`);
    assert.equal(r.totalRevenue, 300);
  }
});

test("last vs first touch credit different channels", () => {
  const last = attribute(journeys, "last").channels;
  const first = attribute(journeys, "first").channels;
  // last touch is google in both journeys → google leads
  assert.equal(last[0].channel, "google");
  // first touch differs (meta / tiktok)
  assert.notEqual(first[0].channel, "google");
});

test("forecast extends history with projected points", () => {
  const series = Array.from({ length: 10 }, (_, i) => ({ date: `2026-06-${String(i + 1).padStart(2, "0")}`, spend: 100, revenue: 300 + i * 20 }));
  const f = forecastROAS(series, 7);
  assert.equal(f.length, 17);
  assert.equal(f.filter((p) => p.projected).length, 7);
  assert.ok(f[f.length - 1].roas >= f[0].roas); // upward trend continues
});

test("LTV / CAC math", () => {
  const ltv = predictLTV({ aov: 80, purchasesPerYear: 2, grossMarginPct: 50, retentionRate: 0.5 });
  assert.ok(ltv > 0);
  assert.equal(cac(1000, 50), 20);
  assert.equal(ltvCacRatio(120, 30), 4);
  assert.equal(cac(1000, 0), 1000); // divide-by-zero guard
});

test("insights detect ROAS drop and scaling opportunity", () => {
  const ins = generateInsights([
    { channel: "meta", spend: 1000, revenue: 2000, conversions: 10, clicks: 2000, prevRevenue: 3000, prevSpend: 1000 }, // ROAS down
    { channel: "google", spend: 1000, revenue: 6000, conversions: 100, clicks: 1500, prevRevenue: 5000, prevSpend: 1000 }, // scaling opp
  ]);
  assert.ok(ins.some((i) => /down/i.test(i.title)));
  assert.ok(ins.some((i) => /scaling/i.test(i.title)));
  assert.equal(ins[0].severity, "high"); // sorted high-first
});

test("analytics source falls back to demo when Supabase is not configured", async () => {
  const { getForecastSeries, getJourneys, getChannelPeriods } = await import("../lib/analytics-engine/source");
  const s = await getForecastSeries();
  const j = await getJourneys();
  const c = await getChannelPeriods();
  assert.equal(s.isReal, false);
  assert.equal(j.isReal, false);
  assert.equal(c.isReal, false);
  assert.ok(s.data.length > 0 && j.data.length > 0 && c.data.length > 0);
});
