import type { AdChannel, ChannelAdapter, ChannelCredentials } from "@/lib/channels/types";
import { MockChannelAdapter } from "@/lib/channels/mock";
import { GoogleAdsAdapter, MetaAdsAdapter, TikTokAdsAdapter, PinterestAdsAdapter, AmazonAdsAdapter } from "@/lib/channels/real";

const REAL: Record<AdChannel, () => ChannelAdapter> = {
  google: () => new GoogleAdsAdapter(),
  meta: () => new MetaAdsAdapter(),
  tiktok: () => new TikTokAdsAdapter(),
  pinterest: () => new PinterestAdsAdapter(),
  amazon: () => new AmazonAdsAdapter(),
};

export function getChannelAdapter(channel: AdChannel, creds: ChannelCredentials = {}): ChannelAdapter {
  const real = REAL[channel]?.();
  if (real && real.isConfigured(creds)) return real;
  return new MockChannelAdapter(channel);
}

export const AD_CHANNELS: { id: AdChannel; label: string }[] = [
  { id: "google", label: "Google Ads" },
  { id: "meta", label: "Meta" },
  { id: "tiktok", label: "TikTok" },
  { id: "pinterest", label: "Pinterest" },
  { id: "amazon", label: "Amazon" },
];
