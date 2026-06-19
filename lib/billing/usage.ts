// Usage metering. Reads real counts from the database when connected, else demo.
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOrgContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Usage } from "@/lib/billing/entitlements";
import type { PlanId } from "@/lib/billing/plans";

const DEMO_USAGE: Usage = { stores: 1, channels: 2, campaigns: 4, aiCredits: 180, seats: 1 };

export interface BillingState { plan: PlanId; usage: Usage; isReal: boolean; }

export async function getBillingState(): Promise<BillingState> {
  if (isSupabaseConfigured()) {
    const org = await getOrgContext();
    if (org) {
      try {
        const supabase = await createClient();
        const count = async (table: string) =>
          (await supabase.from(table).select("id", { count: "exact", head: true }).eq("org_id", org.orgId)).count ?? 0;
        const [stores, channels, campaigns] = await Promise.all([count("stores"), count("channels"), count("campaigns")]);
        const aiCredits = (await supabase.from("audit_log").select("id", { count: "exact", head: true }).eq("org_id", org.orgId).eq("action", "track")).count ?? 0;
        const seats = (await supabase.from("memberships").select("user_id", { count: "exact", head: true }).eq("org_id", org.orgId)).count ?? 1;
        return { plan: (org as { plan?: PlanId }).plan ?? "free", usage: { stores, channels, campaigns, aiCredits, seats }, isReal: true };
      } catch { /* fall through */ }
    }
  }
  return { plan: "growth", usage: DEMO_USAGE, isReal: false };
}
