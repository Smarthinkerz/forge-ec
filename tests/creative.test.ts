import { test } from "node:test";
import assert from "node:assert/strict";
import { applyGuardrails, DEFAULT_BRAND } from "../lib/creative/brand";
import { bannerSVG } from "../lib/creative/svg";
import { predictPerformance } from "../lib/creative/predict";
import { runABTest } from "../lib/creative/abtest";
import { generateCreative } from "../lib/creative/generate";

test("guardrails remove banned words and cap headline", () => {
  const r = applyGuardrails(
    { headline: "Guaranteed miracle results in a headline that is definitely far too long to fit nicely", body: "cheapest ever", cta: "" },
    DEFAULT_BRAND,
  );
  assert.ok(!/guaranteed|miracle/i.test(r.copy.headline));
  assert.ok(!/cheapest/i.test(r.copy.body));
  assert.ok(r.copy.headline.length <= DEFAULT_BRAND.maxHeadlineLen);
  assert.equal(r.copy.cta, "Shop now"); // empty cta defaulted
  assert.ok(r.violations.length >= 2);
});

test("banner SVG embeds copy + is valid-ish svg", () => {
  const svg = bannerSVG({ brand: DEFAULT_BRAND, copy: { headline: "New Season Knits", body: "b", cta: "Shop now" }, productTitle: "Merino Sweater", price: "$89" });
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("Merino Sweater"));
  assert.ok(svg.includes("$89"));
  assert.ok(svg.includes("Shop now"));
});

test("prediction is deterministic and in range", () => {
  const copy = { headline: "Save 20% on premium knitwear today", body: "Soft merino.", cta: "Shop now" };
  const a = predictPerformance(copy), b = predictPerformance(copy);
  assert.deepEqual(a, b);
  assert.ok(a.score >= 1 && a.score <= 99);
  assert.ok(a.predictedCtr > 0 && a.predictedCtr < 0.05);
  assert.ok(a.reasoning.length >= 3);
});

test("A/B test picks the stronger variant and recommends", () => {
  const mk = (id: string, score: number) => ({ id, label: id, copy: { headline: id, body: "b", cta: "Shop now" }, prediction: predictPerformance({ headline: "Save today now", body: "b", cta: "Shop now" }) , });
  const strong = { id: "A", label: "A", copy: { headline: "Save 20% today — limited", body: "Premium results", cta: "Shop now" }, prediction: predictPerformance({ headline: "Save 20% today — limited", body: "Premium results", cta: "Shop now" }) };
  const weak = { id: "B", label: "B", copy: { headline: "x", body: "y".repeat(200), cta: "" }, prediction: predictPerformance({ headline: "x", body: "y".repeat(200), cta: "" }) };
  const r = runABTest([strong, weak]);
  assert.equal(r.winnerId, "A");
  assert.ok(r.liftPct >= 0);
  assert.ok(["high", "medium", "low"].includes(r.confidence));
});

test("generateCreative produces copy + SVG preview (mock AI, no image key)", async () => {
  const c = await generateCreative({ productTitle: "Merino Sweater", productDescription: "Soft knit.", price: "$89", channel: "meta", format: "static" });
  assert.ok(c.copy.headline.length > 0);
  assert.ok(c.previewSvg && c.previewSvg.includes("<svg"));
  assert.ok(c.prediction.score >= 1);
});
