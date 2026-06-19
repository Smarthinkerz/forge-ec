// Ad-channel adapter contract — mirrors the store adapter pattern.
export type AdChannel = "google" | "meta" | "tiktok" | "pinterest" | "amazon";

export interface CampaignDraft {
  name: string;
  channel: AdChannel;
  objective: "conversions" | "traffic" | "awareness" | "catalog_sales";
  budgetDaily: number;
  currency: string;
  audience: string;
}

export interface CampaignResult {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export type ChannelCredentials = Record<string, string>;

export interface ChannelAdapter {
  channel: AdChannel;
  requiredCredentials: string[];
  isConfigured(creds: ChannelCredentials): boolean;
  /** Create the campaign on the platform; returns an external id. */
  createCampaign(draft: CampaignDraft, creds: ChannelCredentials): Promise<{ externalId: string }>;
  /** Fetch (or simulate) performance for a campaign over `days`. */
  getResults(externalId: string, draft: CampaignDraft, days?: number): Promise<CampaignResult>;
}
