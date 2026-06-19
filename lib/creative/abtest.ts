// A/B (and multivariate) test engine. Given variants with predicted strength,
// simulate a fixed-traffic test deterministically, declare a winner, compute
// lift + a confidence band, and recommend a scaling action.
import type { ABVariant, ABResult } from "@/lib/creative/types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

export function runABTest(variants: ABVariant[], impressionsEach = 20000): ABResult {
  const rows = variants.map((v) => {
    const jitter = 0.92 + (hash(v.id + v.copy.headline) % 16) / 100; // 0.92–1.08
    const ctr = Math.max(0.001, v.prediction.predictedCtr * jitter);
    const clicks = Math.round(impressionsEach * ctr);
    const cvr = Math.max(0.005, 0.02 + (v.prediction.score - 50) / 1000); // score nudges CVR
    const conversions = Math.round(clicks * cvr);
    return { id: v.id, label: v.label, impressions: impressionsEach, clicks, conversions, ctr: Math.round(ctr * 10000) / 10000, cvr: Math.round(cvr * 10000) / 10000 };
  });

  const sorted = [...rows].sort((a, b) => b.conversions - a.conversions);
  const winner = sorted[0];
  const runnerUp = sorted[1] ?? sorted[0];
  const liftPct = runnerUp.conversions > 0
    ? Math.round(((winner.conversions - runnerUp.conversions) / runnerUp.conversions) * 1000) / 10
    : 100;

  const confidence: ABResult["confidence"] = liftPct >= 20 ? "high" : liftPct >= 8 ? "medium" : "low";
  const recommendation =
    confidence === "low"
      ? "Difference is within noise — keep testing or extend the window before scaling."
      : `Scale "${winner.label}" and pause the others; reallocate budget to the winner.`;

  return { variants: rows, winnerId: winner.id, liftPct, confidence, recommendation };
}
