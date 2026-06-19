// Billing provider abstraction. Mock simulates checkout; Stripe & Tap are
// documented skeletons that activate when their keys are present.
import type { PlanId } from "@/lib/billing/plans";

export interface CheckoutResult { url?: string; simulated?: boolean; provider: string; }
export interface BillingProvider {
  name: string;
  isConfigured(): boolean;
  createCheckout(plan: PlanId, currency: string): Promise<CheckoutResult>;
}

class MockBilling implements BillingProvider {
  name = "mock";
  isConfigured() { return true; }
  async createCheckout(): Promise<CheckoutResult> { return { simulated: true, provider: this.name }; }
}

/** Stripe — set STRIPE_SECRET_KEY (+ price IDs). Create a Checkout Session and return its URL. */
class StripeBilling implements BillingProvider {
  name = "stripe";
  isConfigured() { return Boolean(process.env.STRIPE_SECRET_KEY); }
  async createCheckout(): Promise<CheckoutResult> {
    // TODO: POST https://api.stripe.com/v1/checkout/sessions; return session.url. See docs/INTEGRATIONS.md
    throw new Error("Stripe checkout not implemented — add STRIPE_SECRET_KEY + price IDs.");
  }
}

/** Tap Payments (GCC) — set TAP_SECRET_KEY. Create a charge/session and return its URL. */
class TapBilling implements BillingProvider {
  name = "tap";
  isConfigured() { return Boolean(process.env.TAP_SECRET_KEY); }
  async createCheckout(): Promise<CheckoutResult> {
    // TODO: POST https://api.tap.company/v2/charges; return transaction.url. See docs/INTEGRATIONS.md
    throw new Error("Tap checkout not implemented — add TAP_SECRET_KEY.");
  }
}

export function selectBillingProvider(): BillingProvider {
  const forced = process.env.BILLING_PROVIDER; // "stripe" | "tap"
  const all = [new StripeBilling(), new TapBilling()];
  const configured = all.filter((p) => p.isConfigured());
  if (forced) { const m = configured.find((p) => p.name === forced); if (m) return m; }
  return configured[0] ?? new MockBilling();
}
