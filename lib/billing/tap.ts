// Tap Payments (https://api.tap.company/v2) — server-only client.
// Hosted-checkout (redirect) model: createCharge returns a transaction.url to
// send the customer to; we reconcile via retrieveCharge on return and via the
// HMAC-verified webhook. Amounts are USD major units (e.g. 79 = USD 79.00).
import crypto from "crypto";

const TAP_BASE = "https://api.tap.company/v2";

export function tapConfigured(): boolean {
  return Boolean(process.env.TAP_SECRET_KEY);
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export interface CreateChargeParams {
  amount: number;
  currency?: string;
  description: string;
  customer: { first_name: string; last_name?: string; email: string };
  redirectUrl: string;
  postUrl: string;
  metadata?: Record<string, string>;
  reference?: { transaction?: string; order?: string };
}

export interface TapCharge {
  id: string;
  status: string;
  amount?: number;
  currency?: string;
  transaction?: { url?: string };
  reference?: { transaction?: string; order?: string };
  response?: { code?: string; message?: string };
  metadata?: Record<string, string>;
}

export async function createCharge(p: CreateChargeParams): Promise<TapCharge> {
  const body = {
    amount: p.amount,
    currency: p.currency ?? "USD",
    threeDSecure: true,
    save_card: false,
    description: p.description,
    statement_descriptor: "ForgeEC",
    metadata: p.metadata ?? {},
    reference: p.reference ?? {},
    receipt: { email: true, sms: false },
    customer: {
      first_name: p.customer.first_name,
      last_name: p.customer.last_name ?? "",
      email: p.customer.email,
    },
    source: { id: "src_all" },
    redirect: { url: p.redirectUrl },
    post: { url: p.postUrl },
  };
  const res = await fetch(`${TAP_BASE}/charges`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tap createCharge failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (await res.json()) as TapCharge;
}

export async function retrieveCharge(id: string): Promise<TapCharge> {
  const res = await fetch(`${TAP_BASE}/charges/${encodeURIComponent(id)}`, { method: "GET", headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tap retrieveCharge failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (await res.json()) as TapCharge;
}

export type OrderStatus = "initiated" | "paid" | "failed" | "cancelled";

export function mapTapStatus(tapStatus: string): OrderStatus {
  const s = (tapStatus || "").toUpperCase();
  if (s === "CAPTURED" || s === "AUTHORIZED") return "paid";
  if (s === "INITIATED" || s === "IN_PROGRESS" || s === "PENDING") return "initiated";
  if (s === "CANCELLED") return "cancelled";
  return "failed";
}

/** Verify Tap webhook: `hashstring` header == HMAC_SHA256(rawBody, secret) hex, constant-time. */
export function verifyTapWebhook(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(header.toLowerCase());
  const b = Buffer.from(expected.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
