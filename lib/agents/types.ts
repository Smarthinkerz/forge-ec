// Autonomous growth agent domain types.
export type ActionType = "pause" | "scale_up" | "scale_down" | "reallocate" | "alert";
export type Risk = "none" | "low" | "medium" | "high";
export type AutonomyLevel = "suggest" | "supervised" | "autonomous";
export type Decision = "applied" | "proposed" | "skipped";

export interface CampaignSnapshot {
  id: string; name: string; channel: string;
  roas: number; prevRoas: number;
  spend: number; conversions: number; clicks: number;
  budgetDaily: number; status: "active" | "paused";
}

export interface AgentAction {
  type: ActionType;
  campaignId: string;
  campaignName: string;
  risk: Risk;
  confidence: number;        // 0–1
  rationale: string;         // explainable "why"
  rule: string;              // which rule fired
  fromBudget?: number;
  toBudget?: number;
  notes?: string[];          // guardrail adjustments
}

export interface AgentPolicy {
  pauseRoasBelow: number;    // e.g. 1.5
  scaleRoasAbove: number;    // e.g. 4.0
  scaleStepPct: number;      // e.g. 0.25
  declineStepPct: number;    // e.g. 0.2
  minSpendToAct: number;     // data sufficiency
}

export interface GuardrailConfig {
  maxChangePct: number;      // clamp budget move per run, e.g. 0.5
  maxDailyBudget: number;    // hard ceiling
  minDailyBudget: number;    // hard floor
  cooldownActedIds: string[]; // campaigns acted on recently → vetoed
}

export interface DecidedAction extends AgentAction { decision: Decision; skipReason?: string; }
export interface AgentRun {
  level: AutonomyLevel;
  applied: DecidedAction[];
  proposed: DecidedAction[];
  skipped: DecidedAction[];
  summary: string;
}

export const DEFAULT_POLICY: AgentPolicy = { pauseRoasBelow: 1.5, scaleRoasAbove: 4.0, scaleStepPct: 0.25, declineStepPct: 0.2, minSpendToAct: 300 };
export const DEFAULT_GUARDRAILS: GuardrailConfig = { maxChangePct: 0.5, maxDailyBudget: 2000, minDailyBudget: 20, cooldownActedIds: [] };
