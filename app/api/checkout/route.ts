import { NextRequest, NextResponse } from "next/server";
import { getUser, getOrgContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import { tapConfigured, createCharge } from "@/lib/billing/tap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auth-gated checkout. Signed-in user picks a paid plan -> Tap hosted checkout.
// Free/enterprise short-circuit. Without Tap keys, simulates a successful
// upgrade so the access flow is testable end-to-end.
export async function GET(req: NextRequest) {
  const o = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const planId = (req.nextUrl.searchParams.get("plan") || "free") as PlanId;

  if (!isSupabaseConfigured()) return NextResponse.redirect(`${o}/login?plan=${planId}`);
  const user = await getUser();
  const ctx = await getOrgContext();
  if (!user || !ctx) return NextResponse.redirect(`${o}/login?plan=${planId}`);

  const plan = getPlan(planId);
  if (plan.id === "free" || plan.priceUSD === null) return NextResponse.redirect(`${o}/dashboard`);

  // No Tap keys -> simulate (grant plan) so the flow can be tested before going live.
  if (!tapConfigured() || !isAdminConfigured()) {
    if (isAdminConfigured()) {
      const db = createAdminClient();
      await db.from("organizations").update({ plan: plan.id }).eq("id", ctx.orgId);
      await db.from("audit_log").insert({ org_id: ctx.orgId, action: "billing.plan_activated", meta: { plan: plan.id, simulated: true } });
    }
    return NextResponse.redirect(`${o}/checkout/success?plan=${plan.id}&simulated=1`);
  }

  const ts = Date.now();
  const reference = { transaction: `txn_${plan.id}_monthly_${ts}`, order: `ord_${ts}_${Math.random().toString(36).slice(2, 8)}` };
  try {
    const charge = await createCharge({
      amount: plan.priceUSD,
      currency: "USD",
      description: `ForgeEC ${plan.name} (monthly)`,
      customer: { first_name: ctx.orgName || "Customer", email: user.email || "" },
      redirectUrl: `${o}/checkout/return`,
      postUrl: `${o}/api/tap/webhook`,
      metadata: { plan: plan.id, org_id: ctx.orgId, user_id: user.id },
      reference,
    });
    const url = charge.transaction?.url;
    if (!url) return NextResponse.redirect(`${o}/checkout/cancelled?reason=no_url`);
    const db = createAdminClient();
    await db.from("orders").insert({
      org_id: ctx.orgId, user_id: user.id, plan: plan.id, tap_charge_id: charge.id,
      amount: plan.priceUSD, currency: "USD", status: "initiated", customer_email: user.email,
      reference_order: reference.order, reference_txn: reference.transaction,
    });
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(`${o}/checkout/cancelled?reason=create_failed`);
  }
}
