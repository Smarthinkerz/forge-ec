// Entitlement gating — the real enforcement layer. Pure + testable.
import { getPlan, type PlanId, type Resource } from "@/lib/billing/plans";

export interface Usage { stores: number; channels: number; campaigns: number; aiCredits: number; seats: number; }

export function limitFor(plan: PlanId, resource: Resource): number {
  return getPlan(plan).limits[resource];
}

/** Can the org add one more of `resource` given current usage? */
export function withinLimit(plan: PlanId, resource: Resource, current: number): boolean {
  return current < limitFor(plan, resource);
}

export function canUseAgents(plan: PlanId): boolean {
  return getPlan(plan).agents;
}

export function aiCreditsRemaining(plan: PlanId, used: number): number {
  const limit = limitFor(plan, "aiCredits");
  return limit === Infinity ? Infinity : Math.max(0, limit - used);
}

/** A blocking check used before performing a metered action. */
export function checkAction(plan: PlanId, resource: Resource, current: number): { allowed: boolean; reason?: string } {
  if (withinLimit(plan, resource, current)) return { allowed: true };
  const limit = limitFor(plan, resource);
  return { allowed: false, reason: `Plan limit reached for ${resource} (${limit}). Upgrade to add more.` };
}
