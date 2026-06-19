// Single source of truth for plans, limits, and pricing. Used everywhere for
// entitlement gating (real) and for display (multi-currency, indicative FX).
export type PlanId = "free" | "starter" | "growth" | "enterprise";
export type Resource = "stores" | "channels" | "campaigns" | "aiCredits" | "seats";

export interface Plan {
  id: PlanId;
  name: string;
  priceUSD: number | null;        // null = custom (enterprise)
  limits: Record<Resource, number>; // Infinity = unlimited
  agents: boolean;                  // autonomous agents entitlement
  features: string[];
}

export const PLANS: Plan[] = [
  { id: "free", name: "Free", priceUSD: 0, agents: false,
    limits: { stores: 1, channels: 1, campaigns: 2, aiCredits: 50, seats: 1 },
    features: ["1 store", "1 ad channel", "Sandbox campaigns", "Creative studio (limited)", "Basic analytics"] },
  { id: "starter", name: "Starter", priceUSD: 79, agents: false,
    limits: { stores: 1, channels: 3, campaigns: 10, aiCredits: 500, seats: 2 },
    features: ["Everything in Free", "3 ad channels", "10 campaigns", "500 AI credits/mo", "Full analytics"] },
  { id: "growth", name: "Growth", priceUSD: 249, agents: true,
    limits: { stores: 3, channels: 8, campaigns: 50, aiCredits: 5000, seats: 5 },
    features: ["Everything in Starter", "Autonomous agents", "Multi-touch attribution", "A/B testing", "5 seats"] },
  { id: "enterprise", name: "Enterprise", priceUSD: null, agents: true,
    limits: { stores: Infinity, channels: Infinity, campaigns: Infinity, aiCredits: Infinity, seats: Infinity },
    features: ["Everything in Growth", "White-label / agency", "Public API + SSO", "Performance-fee billing", "Dedicated support"] },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

// Indicative FX multipliers for display only (NOT real-time rates, NOT billing FX).
const FX: Record<string, number> = { USD: 1, OMR: 0.385, AED: 3.67, SAR: 3.75, EUR: 0.92, GBP: 0.79 };
export const CURRENCIES = Object.keys(FX);

export function displayPrice(plan: Plan, currency = "USD"): string {
  if (plan.priceUSD === null) return "Custom";
  if (plan.priceUSD === 0) return "Free";
  const rate = FX[currency] ?? 1;
  const amount = Math.round(plan.priceUSD * rate);
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount) + "/mo";
}
