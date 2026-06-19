// Funnel flow templates + deterministic simulation. A flow is a trigger plus an
// ordered set of steps (email / sms / wait). simulateFlow projects per-step
// engagement and downstream revenue for a given audience size.
export type StepKind = "email" | "sms" | "wait";
export interface FlowStep { kind: StepKind; label: string; delayHours?: number; }
export interface FlowTemplate { id: string; name: string; trigger: string; steps: FlowStep[]; }

export const FLOW_TEMPLATES: FlowTemplate[] = [
  { id: "welcome", name: "Welcome series", trigger: "Subscribed / first visit", steps: [
    { kind: "email", label: "Welcome + brand story" }, { kind: "wait", label: "Wait 1 day", delayHours: 24 },
    { kind: "email", label: "Bestsellers + social proof" }, { kind: "wait", label: "Wait 2 days", delayHours: 48 },
    { kind: "email", label: "First-order incentive" } ] },
  { id: "abandoned_cart", name: "Abandoned cart", trigger: "Cart created, no checkout", steps: [
    { kind: "email", label: "Reminder (no discount)" }, { kind: "wait", label: "Wait 4h", delayHours: 4 },
    { kind: "sms", label: "SMS nudge" }, { kind: "wait", label: "Wait 20h", delayHours: 20 },
    { kind: "email", label: "Incentive to complete" } ] },
  { id: "post_purchase", name: "Post-purchase", trigger: "Order placed", steps: [
    { kind: "email", label: "Order confirmation + tips" }, { kind: "wait", label: "Wait 7 days", delayHours: 168 },
    { kind: "email", label: "Review request + cross-sell" } ] },
  { id: "winback", name: "Win-back", trigger: "No purchase in 90 days", steps: [
    { kind: "email", label: "We miss you" }, { kind: "wait", label: "Wait 3 days", delayHours: 72 },
    { kind: "sms", label: "Win-back offer" } ] },
];

export interface StepProjection { label: string; kind: StepKind; sent: number; opens: number; clicks: number; }
export interface FlowProjection {
  enrolled: number; steps: StepProjection[];
  conversions: number; revenue: number; aov: number;
}

const OPEN_RATE = { email: 0.42, sms: 0.85 };
const CLICK_RATE = { email: 0.09, sms: 0.18 };
const STEP_DECAY = 0.82;   // fewer reachable each subsequent message
const CVR_PER_CLICK = 0.06;
const AOV = 78;

export function simulateFlow(template: FlowTemplate, enrolled: number): FlowProjection {
  const steps: StepProjection[] = [];
  let reach = enrolled;
  let totalClicks = 0;
  for (const s of template.steps) {
    if (s.kind === "wait") continue;
    const sent = Math.round(reach);
    const opens = Math.round(sent * OPEN_RATE[s.kind]);
    const clicks = Math.round(opens * (CLICK_RATE[s.kind] / OPEN_RATE[s.kind]));
    steps.push({ label: s.label, kind: s.kind, sent, opens, clicks });
    totalClicks += clicks;
    reach *= STEP_DECAY;
  }
  const conversions = Math.round(totalClicks * CVR_PER_CLICK);
  return { enrolled, steps, conversions, revenue: conversions * AOV, aov: AOV };
}
