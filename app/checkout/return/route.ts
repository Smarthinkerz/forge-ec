import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { tapConfigured, retrieveCharge, mapTapStatus } from "@/lib/billing/tap";
import type { PlanId } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Authoritative reconciliation: re-fetch the charge from Tap (never trust query
// params), update the order, grant the plan on success, then redirect.
export async function GET(req: NextRequest) {
  const o = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const tapId = req.nextUrl.searchParams.get("tap_id");
  if (!tapId || !tapConfigured() || !isAdminConfigured()) return NextResponse.redirect(`${o}/checkout/pending`);

  try {
    const charge = await retrieveCharge(tapId);
    const status = mapTapStatus(charge.status);
    const db = createAdminClient();
    const update: Record<string, unknown> = { status };
    if (status === "paid") update.paid_at = new Date().toISOString();
    await db.from("orders").update(update).eq("tap_charge_id", tapId);

    if (status === "paid") {
      const plan = charge.metadata?.plan as PlanId | undefined;
      const orgId = charge.metadata?.org_id;
      if (plan && orgId) {
        await db.from("organizations").update({ plan }).eq("id", orgId);
        await db.from("audit_log").insert({ org_id: orgId, action: "billing.plan_activated", meta: { plan, tap_charge_id: tapId } });
      }
      return NextResponse.redirect(`${o}/checkout/success?plan=${plan ?? ""}`);
    }
    if (status === "initiated") return NextResponse.redirect(`${o}/checkout/pending`);
    return NextResponse.redirect(`${o}/checkout/cancelled`);
  } catch {
    return NextResponse.redirect(`${o}/checkout/pending`);
  }
}
