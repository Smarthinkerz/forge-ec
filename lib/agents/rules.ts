// Deterministic monitoring rules → candidate actions. Each action carries a
// rationale + the rule that fired (explainability). Budget magnitudes are
// proposed here and clamped later by guardrails.
import type { CampaignSnapshot, AgentAction, AgentPolicy } from "@/lib/agents/types";

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function evaluateCampaign(s: CampaignSnapshot, p: AgentPolicy): AgentAction[] {
  const actions: AgentAction[] = [];
  const base = { campaignId: s.id, campaignName: s.name };

  // Anomaly: spending with clicks but zero conversions (no data threshold needed).
  if (s.status === "active" && s.spend > 0 && s.conversions === 0 && s.clicks >= 100) {
    actions.push({ ...base, type: "alert", risk: "none", confidence: 0.9,
      rule: "zero-conversion-anomaly",
      rationale: `${s.clicks} clicks and ${s.spend} spend but 0 conversions — likely tracking or landing-page break.` });
  }

  // Below data threshold → don't make budget decisions yet.
  if (s.spend < p.minSpendToAct) return actions;

  // Pause persistent underperformers.
  if (s.status === "active" && s.roas < p.pauseRoasBelow) {
    actions.push({ ...base, type: "pause", risk: "medium",
      confidence: clamp01(0.5 + (p.pauseRoasBelow - s.roas) / p.pauseRoasBelow),
      rule: "roas-below-pause-threshold",
      rationale: `ROAS ${s.roas.toFixed(2)}x is below the ${p.pauseRoasBelow}x floor with sufficient spend.` });
    return actions;
  }

  // Scale winners (only if not collapsing vs previous period).
  if (s.status === "active" && s.roas >= p.scaleRoasAbove && s.roas >= s.prevRoas * 0.9) {
    const toBudget = Math.round(s.budgetDaily * (1 + p.scaleStepPct));
    actions.push({ ...base, type: "scale_up", risk: "high",
      confidence: clamp01(0.5 + (s.roas - p.scaleRoasAbove) / 10),
      rule: "roas-above-scale-threshold",
      rationale: `ROAS ${s.roas.toFixed(2)}x ≥ ${p.scaleRoasAbove}x and stable — room to deploy more budget.`,
      fromBudget: s.budgetDaily, toBudget });
    return actions;
  }

  // Trim declining mid-performers.
  if (s.status === "active" && s.roas >= p.pauseRoasBelow && s.roas < 2.5 && s.roas < s.prevRoas) {
    const toBudget = Math.round(s.budgetDaily * (1 - p.declineStepPct));
    actions.push({ ...base, type: "scale_down", risk: "low", confidence: 0.6,
      rule: "declining-mid-performer",
      rationale: `ROAS ${s.roas.toFixed(2)}x is soft and trending down from ${s.prevRoas.toFixed(2)}x — trim to protect efficiency.`,
      fromBudget: s.budgetDaily, toBudget });
  }
  return actions;
}
