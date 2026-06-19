// Builds campaign snapshots for the agent from the analytics data source, so it
// inherits the same live-vs-sample behavior: real per-channel metrics when
// connected, sample data otherwise.
import { getChannelPeriods } from "@/lib/analytics-engine/source";
import type { CampaignSnapshot } from "@/lib/agents/types";

export async function getAgentSnapshots(): Promise<{ snapshots: CampaignSnapshot[]; isReal: boolean }> {
  const { data, isReal } = await getChannelPeriods();
  const snapshots: CampaignSnapshot[] = data.map((c) => {
    const roas = c.spend > 0 ? Math.round((c.revenue / c.spend) * 100) / 100 : 0;
    const prevRoas = c.prevSpend > 0 ? Math.round((c.prevRevenue / c.prevSpend) * 100) / 100 : roas;
    return {
      id: c.channel, name: `${c.channel} campaigns`, channel: c.channel,
      roas, prevRoas, spend: c.spend, conversions: c.conversions, clicks: c.clicks,
      budgetDaily: Math.max(20, Math.round(c.spend / 14)), status: "active",
    };
  });
  return { snapshots, isReal };
}
