// Pre-launch performance prediction. Deterministic heuristic over copy quality
// signals, returning an explainable score + predicted CTR. (A real model can
// replace the scorer later; the contract stays.)
import type { CreativeCopy, PerformancePrediction } from "@/lib/creative/types";

const URGENCY = ["now", "today", "limited", "ends", "last", "only", "hurry"];
const BENEFIT = ["save", "free shipping", "new", "best", "premium", "proven", "results", "fast"];

export function predictPerformance(copy: CreativeCopy): PerformancePrediction {
  const reasoning: string[] = [];
  let score = 40;
  const hl = copy.headline.trim();
  const text = `${copy.headline} ${copy.body}`.toLowerCase();

  if (hl.length >= 15 && hl.length <= 50) { score += 15; reasoning.push("Headline length in the high-CTR range."); }
  else { score -= 8; reasoning.push("Headline length outside the ideal 15–50 chars."); }

  if (copy.cta && copy.cta.length <= 18) { score += 10; reasoning.push("Clear, concise call to action."); }
  else { reasoning.push("Weak or missing call to action."); }

  if (/\d/.test(text)) { score += 8; reasoning.push("Contains a number/price (concrete > vague)."); }
  if (URGENCY.some((w) => text.includes(w))) { score += 9; reasoning.push("Uses urgency/scarcity cue."); }
  if (BENEFIT.some((w) => text.includes(w))) { score += 9; reasoning.push("Leads with a tangible benefit."); }
  if (copy.body.length > 180) { score -= 6; reasoning.push("Body copy is long for an ad unit."); }

  score = Math.max(1, Math.min(99, score));
  const predictedCtr = Math.round((0.006 + (score / 100) * 0.03) * 10000) / 10000; // 0.6%–3.6%
  return { score, predictedCtr, reasoning };
}
