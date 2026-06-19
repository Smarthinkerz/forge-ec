// Real ad-channel adapter skeletons. Each needs a developer account + (for most)
// app review/business verification. Until creds are present AND implemented, the
// registry uses the sandbox adapter. Swap-in notes in docs/INTEGRATIONS.md.
import type { ChannelAdapter, AdChannel, CampaignDraft, CampaignResult, ChannelCredentials } from "@/lib/channels/types";

class NotImplemented extends Error {
  constructor(c: string) { super(`${c} live channel adapter not implemented — supply credentials and implement createCampaign/getResults. See docs/INTEGRATIONS.md`); }
}
abstract class Base implements ChannelAdapter {
  abstract channel: AdChannel;
  abstract requiredCredentials: string[];
  isConfigured(creds: ChannelCredentials): boolean { return this.requiredCredentials.every((k) => Boolean(creds[k])); }
  abstract createCampaign(draft: CampaignDraft, creds: ChannelCredentials): Promise<{ externalId: string }>;
  abstract getResults(externalId: string, draft: CampaignDraft, days?: number): Promise<CampaignResult>;
}

/** Google Ads — creds: developerToken, customerId, refreshToken, clientId, clientSecret. */
export class GoogleAdsAdapter extends Base {
  channel: AdChannel = "google";
  requiredCredentials = ["developerToken", "customerId", "refreshToken", "clientId", "clientSecret"];
  async createCampaign(): Promise<{ externalId: string }> { throw new NotImplemented("Google Ads"); }
  async getResults(): Promise<CampaignResult> { throw new NotImplemented("Google Ads"); }
}
/** Meta (FB/IG) — creds: accessToken, adAccountId. Requires Marketing API app review. */
export class MetaAdsAdapter extends Base {
  channel: AdChannel = "meta";
  requiredCredentials = ["accessToken", "adAccountId"];
  async createCampaign(): Promise<{ externalId: string }> { throw new NotImplemented("Meta Ads"); }
  async getResults(): Promise<CampaignResult> { throw new NotImplemented("Meta Ads"); }
}
/** TikTok Ads — creds: accessToken, advertiserId. */
export class TikTokAdsAdapter extends Base {
  channel: AdChannel = "tiktok";
  requiredCredentials = ["accessToken", "advertiserId"];
  async createCampaign(): Promise<{ externalId: string }> { throw new NotImplemented("TikTok Ads"); }
  async getResults(): Promise<CampaignResult> { throw new NotImplemented("TikTok Ads"); }
}
/** Pinterest Ads — creds: accessToken, adAccountId. */
export class PinterestAdsAdapter extends Base {
  channel: AdChannel = "pinterest";
  requiredCredentials = ["accessToken", "adAccountId"];
  async createCampaign(): Promise<{ externalId: string }> { throw new NotImplemented("Pinterest Ads"); }
  async getResults(): Promise<CampaignResult> { throw new NotImplemented("Pinterest Ads"); }
}
/** Amazon Ads — creds: accessToken, profileId, clientId. */
export class AmazonAdsAdapter extends Base {
  channel: AdChannel = "amazon";
  requiredCredentials = ["accessToken", "profileId", "clientId"];
  async createCampaign(): Promise<{ externalId: string }> { throw new NotImplemented("Amazon Ads"); }
  async getResults(): Promise<CampaignResult> { throw new NotImplemented("Amazon Ads"); }
}
