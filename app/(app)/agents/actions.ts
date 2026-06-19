"use server";
import { runAgent } from "@/lib/agents/engine";
import { getAgentSnapshots } from "@/lib/agents/snapshots";
import type { AutonomyLevel, AgentRun } from "@/lib/agents/types";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function runAgentAction(level: AutonomyLevel): Promise<{ run: AgentRun; isReal: boolean }> {
  const { snapshots, isReal } = await getAgentSnapshots();
  const run = runAgent(snapshots, level);

  // Best-effort audit of auto-applied actions when configured.
  if (isSupabaseConfigured() && isAdminConfigured() && run.applied.length) {
    try {
      const org = await getOrgContext();
      if (org) {
        const db = createAdminClient();
        await db.from("audit_log").insert(run.applied.map((a) => ({
          org_id: org.orgId, action: `agent.${a.type}`,
          meta: { campaign: a.campaignName, rule: a.rule, rationale: a.rationale, toBudget: a.toBudget ?? null },
        })));
      }
    } catch { /* non-fatal */ }
  }
  return { run, isReal };
}
