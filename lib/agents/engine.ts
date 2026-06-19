// Agent engine: rules → guardrails → decision (apply vs propose vs skip) by
// autonomy level. Plus a portfolio-level reallocation suggestion. Deterministic.
import type { CampaignSnapshot, AgentPolicy, GuardrailConfig, AutonomyLevel, AgentRun, DecidedAction, Risk, AgentAction } from "@/lib/agents/types";
import { DEFAULT_POLICY, DEFAULT_GUARDRAILS } from "@/lib/agents/types";
import { evaluateCampaign } from "@/lib/agents/rules";
import { applyGuardrails } from "@/lib/agents/guardrails";
import { allocateBudget } from "@/lib/campaigns/allocate";

const RISK_RANK: Record<Risk, number> = { none: 0, low: 1, medium: 2, high: 3 };
const APPLY_MAX: Record<AutonomyLevel, number> = { suggest: 0, supervised: 1, autonomous: 3 };

export function runAgent(
  snapshots: CampaignSnapshot[],
  level: AutonomyLevel,
  policy: AgentPolicy = DEFAULT_POLICY,
  guardrails: GuardrailConfig = DEFAULT_GUARDRAILS,
): AgentRun {
  const applied: DecidedAction[] = [], proposed: DecidedAction[] = [], skipped: DecidedAction[] = [];

  for (const s of snapshots) {
    for (const candidate of evaluateCampaign(s, policy)) {
      const g = applyGuardrails(candidate, s, guardrails);
      if (g.vetoed) { skipped.push({ ...g.action, decision: "skipped", skipReason: g.reason }); continue; }
      const canApply = RISK_RANK[g.action.risk] <= APPLY_MAX[level];
      if (canApply) applied.push({ ...g.action, decision: "applied" });
      else proposed.push({ ...g.action, decision: "proposed" });
    }
  }

  // Portfolio reallocation suggestion across active campaigns.
  const active = snapshots.filter((s) => s.status === "active");
  if (active.length >= 2) {
    const total = active.reduce((sum, s) => sum + s.budgetDaily, 0);
    const alloc = allocateBudget(total, active.map((s) => ({ id: s.id, name: s.name, roas: s.roas, currentDaily: s.budgetDaily })));
    const shifts = alloc.filter((a) => Math.abs(a.delta) >= Math.max(5, total * 0.02));
    if (shifts.length) {
      const realloc: AgentAction = {
        type: "reallocate", campaignId: "portfolio", campaignName: "Portfolio", risk: "medium", confidence: 0.7,
        rule: "roas-weighted-reallocation",
        rationale: `Shift budget toward higher-ROAS campaigns: ${shifts.map((s) => `${s.name} ${s.delta > 0 ? "+" : ""}${s.delta}`).join(", ")}.`,
      };
      const decided: DecidedAction = RISK_RANK.medium <= APPLY_MAX[level]
        ? { ...realloc, decision: "applied" } : { ...realloc, decision: "proposed" };
      (decided.decision === "applied" ? applied : proposed).push(decided);
    }
  }

  const summary = `${applied.length} applied · ${proposed.length} awaiting approval · ${skipped.length} skipped (guardrails). Autonomy: ${level}.`;
  return { level, applied, proposed, skipped, summary };
}
