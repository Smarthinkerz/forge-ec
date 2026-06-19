import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { verifyTapWebhook, mapTapStatus, retrieveCharge, tapConfigured } from "@/lib/billing/tap";
import type { PlanId } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOLERANCE_MS = Number(process.env.TAP_WEBHOOK_TOLERANCE_MS || 300000);

// Tap -> server webhook. Verifies HMAC over the RAW body (hashstring header),
// enforces a replay window, is idempotent on <chargeId>:<status>, updates the
// order, and grants the plan on paid. Reconciliation also happens on return.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.TAP_WEBHOOK_SECRET;

  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });
  if (!isAdminConfigured()) return NextResponse.json({ ok: true, note: "demo" }, { status: 200 });
  if (!verifyTapWebhook(raw, req.headers.get("hashstring"), secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let evt: { id?: string; status?: string; metadata?: Record<string, string>; transaction?: { created?: string; asof?: string }; created?: string };
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  if (!evt || typeof evt !== "object" || !evt.id) return NextResponse.json({ error: "no id" }, { status: 400 });

  // replay protection (if a timestamp is present)
  const tsRaw = evt.transaction?.created || evt.transaction?.asof || evt.created;
  if (tsRaw) {
    const ts = Number(tsRaw);
    if (Number.isFinite(ts) && Math.abs(Date.now() - ts) > TOLERANCE_MS) {
      return NextResponse.json({ error: "stale" }, { status: 400 });
    }
  }

  const status = mapTapStatus(evt.status || "");
  const eventKey = `${evt.id}:${(evt.status || "").toUpperCase()}`;
  const db = createAdminClient();

  // idempotency: insert event key; a conflict means we've seen it already
  const { error: insErr } = await db.from("processed_webhook_events").insert({ event_key: eventKey });
  if (insErr) return NextResponse.json({ received: true, duplicate: true }, { status: 200 });

  const update: Record<string, unknown> = { status };
  if (status === "paid") update.paid_at = new Date().toISOString();
  await db.from("orders").update(update).eq("tap_charge_id", evt.id);

  if (status === "paid") {
    let plan = evt.metadata?.plan as PlanId | undefined;
    let orgId = evt.metadata?.org_id;
    if ((!plan || !orgId) && tapConfigured()) {
      try { const c = await retrieveCharge(evt.id); plan = (c.metadata?.plan as PlanId) ?? plan; orgId = c.metadata?.org_id ?? orgId; } catch { /* ignore */ }
    }
    if (plan && orgId) {
      await db.from("organizations").update({ plan }).eq("id", orgId);
      await db.from("audit_log").insert({ org_id: orgId, action: "billing.plan_activated", meta: { plan, tap_charge_id: evt.id, via: "webhook" } });
    }
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
