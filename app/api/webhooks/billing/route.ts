import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";
import type { PlanId } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generic billing webhook. Verifies an HMAC-SHA256 signature over the RAW body
// using BILLING_WEBHOOK_SECRET (constant-time). For live Stripe/Tap, verify
// their native signature header instead (see docs/INTEGRATIONS.md). On a valid
// paid event, set the org's plan. Idempotent on event_id.
const seen = new Set<string>();

function verify(raw: string, sig: string | null, secret: string): boolean {
  if (!sig) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.BILLING_WEBHOOK_SECRET;

  if (!secret || !isAdminConfigured()) {
    return NextResponse.json({ ok: true, note: "demo mode — billing webhook not active" }, { status: 200 });
  }
  if (!verify(raw, req.headers.get("x-forge-signature"), secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let evt: { event_id?: string; type?: string; org_id?: string; plan?: PlanId };
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  if (evt.event_id) { if (seen.has(evt.event_id)) return NextResponse.json({ ok: true, dedup: true }); seen.add(evt.event_id); }

  if (evt.type === "subscription.paid" && evt.org_id && evt.plan) {
    const db = createAdminClient();
    await db.from("organizations").update({ plan: evt.plan }).eq("id", evt.org_id);
    await db.from("audit_log").insert({ org_id: evt.org_id, action: "billing.plan_activated", meta: { plan: evt.plan } });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
