// Launch a campaign through the resolved channel adapter (sandbox unless live
// creds) and fetch/simulate its results.
import { getChannelAdapter } from "@/lib/channels/registry";
import type { CampaignDraft, CampaignResult, ChannelCredentials } from "@/lib/channels/types";

export interface LaunchedCampaign {
  draft: CampaignDraft;
  externalId: string;
  status: "active";
  result: CampaignResult;
  launchedAt: string;
}

export async function launchCampaign(draft: CampaignDraft, creds: ChannelCredentials = {}): Promise<LaunchedCampaign> {
  const adapter = getChannelAdapter(draft.channel, creds);
  const { externalId } = await adapter.createCampaign(draft, creds);
  const result = await adapter.getResults(externalId, draft, 14);
  return { draft, externalId, status: "active", result, launchedAt: new Date().toISOString() };
}
