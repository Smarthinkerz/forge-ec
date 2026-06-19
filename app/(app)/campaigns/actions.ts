// app/(app)/campaigns/actions.ts
"use server";

import { draftCampaign } from "@/lib/campaigns/builder";
import { launchCampaign, type LaunchedCampaign } from "@/lib/campaigns/service";
import type { AdChannel, CampaignDraft } from "@/lib/channels/types";
import { getOrgContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function draftCampaignAction(text: string, channel: AdChannel): Promise<CampaignDraft> {
  return draftCampaign(text, channel);
}

export async function launchCampaignAction(draft: CampaignDraft): Promise<LaunchedCampaign & { persisted: boolean }> {
  const launched = await launchCampaign(draft);
  let persisted = false;

  if (isSupabaseConfigured()) {
    const org = await getOrgContext();
    if (org) {
      try {
        const supabase = await createClient();
        const { data: ch } = await supabase
          .from("channels")
          .upsert({ org_id: org.orgId, platform: draft.channel, account_name: `${draft.channel} (sandbox)`, status: "connected" }, { onConflict: "id" })
          .select("id")
          .maybeSingle();
        const { data: camp } = await supabase
          .from("campaigns")
          .insert({
            org_id: org.orgId, channel_id: (ch as { id: string } | null)?.id ?? null,
            name: draft.name, objective: draft.objective, status: "active",
            budget_daily: draft.budgetDaily, currency: draft.currency,
          })
          .select("id")
          .single();
        if (camp) {
          await supabase.from("metrics_daily").insert({
            org_id: org.orgId, campaign_id: (camp as { id: string }).id, date: new Date().toISOString().slice(0, 10),
            spend: launched.result.spend, revenue: launched.result.revenue,
            impressions: launched.result.impressions, clicks: launched.result.clicks, conversions: launched.result.conversions,
          });
          persisted = true;
        }
      } catch { /* non-fatal */ }
    }
  }
  return { ...launched, persisted };
}
