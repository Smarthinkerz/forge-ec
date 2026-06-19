import { gate, ok } from "@/lib/api/respond";
import { demoCampaigns } from "@/lib/demo";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const g = await gate(req); if (g.error) return g.error;
  const { orgId, demo } = g.ctx!;
  if (orgId && isAdminConfigured()) {
    try {
      const db = createAdminClient();
      const { data } = await db.from("campaigns").select("id,name,objective,status,budget_daily,currency").eq("org_id", orgId).limit(100);
      return ok(data ?? [], false);
    } catch { /* fall through to demo */ }
  }
  return ok(demoCampaigns, demo);
}
