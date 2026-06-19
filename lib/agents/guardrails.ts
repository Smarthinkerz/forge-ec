// Safety guardrails. Vetoes unsafe actions (cooldown) and clamps budget moves to
// configured limits. Returns the (possibly adjusted) action or a veto reason.
import type { AgentAction, GuardrailConfig, CampaignSnapshot } from "@/lib/agents/types";

export interface GuardrailOutcome { action: AgentAction; vetoed: boolean; reason?: string; }

export function applyGuardrails(action: AgentAction, snapshot: CampaignSnapshot, cfg: GuardrailConfig): GuardrailOutcome {
  // Cooldown: never act twice on the same campaign within the window.
  if (cfg.cooldownActedIds.includes(action.campaignId)) {
    return { action, vetoed: true, reason: "cooldown — campaign acted on recently" };
  }

  if (action.type === "scale_up" || action.type === "scale_down") {
    const from = action.fromBudget ?? snapshot.budgetDaily;
    let to = action.toBudget ?? from;
    const notes: string[] = [];

    // Clamp the move to maxChangePct.
    const maxUp = Math.round(from * (1 + cfg.maxChangePct));
    const maxDown = Math.round(from * (1 - cfg.maxChangePct));
    if (to > maxUp) { to = maxUp; notes.push(`clamped to +${Math.round(cfg.maxChangePct * 100)}% max change`); }
    if (to < maxDown) { to = maxDown; notes.push(`clamped to -${Math.round(cfg.maxChangePct * 100)}% max change`); }

    // Clamp to absolute ceiling/floor.
    if (to > cfg.maxDailyBudget) { to = cfg.maxDailyBudget; notes.push(`capped at max daily ${cfg.maxDailyBudget}`); }
    if (to < cfg.minDailyBudget) { to = cfg.minDailyBudget; notes.push(`floored at min daily ${cfg.minDailyBudget}`); }

    if (to === from) return { action, vetoed: true, reason: "no-op after guardrail clamping" };
    return { action: { ...action, toBudget: to, notes: [...(action.notes ?? []), ...notes] }, vetoed: false };
  }

  return { action, vetoed: false };
}
