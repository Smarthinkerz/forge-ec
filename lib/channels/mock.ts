// lib/channels/mock.ts
// Sandbox ad-channel adapter: simulates campaign creation and realistic,
// deterministic performance so the full launch→results flow works with no
// ad-account credentials.

import type { ChannelAdapter, AdChannel, CampaignDraft, CampaignResult, ChannelCredentials } from "@/lib/channels/types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

// Rough per-channel economics so results feel platform-appropriate.
const PROFILE: Record<AdChannel, { ctr: number; cvr: number; cpc: number; aov: number }> = {
  google:    { ctr: 0.035, cvr: 0.045, cpc: 1.1, aov: 95 },
  meta:      { ctr: 0.018, cvr: 0.030, cpc: 0.9, aov: 80 },
  tiktok:    { ctr: 0.012, cvr: 0.020, cpc: 0.6, aov: 65 },
  pinterest: { ctr: 0.015, cvr: 0.025, cpc: 0.7, aov: 88 },
  amazon:    { ctr: 0.025, cvr: 0.090, cpc: 1.3, aov: 70 },
};

export class MockChannelAdapter implements ChannelAdapter {
  channel: AdChannel;
  requiredCredentials: string[] = [];
  constructor(channel: AdChannel) { this.channel = channel; }
  isConfigured() { return true; }

  async createCampaign(draft: CampaignDraft): Promise<{ externalId: string }> {
    await new Promise((r) => setTimeout(r, 200));
    return { externalId: `${this.channel}-camp-${hash(draft.name) % 100000}` };
  }

  async getResults(externalId: string, draft: CampaignDraft, days = 14): Promise<CampaignResult> {
    await new Promise((r) => setTimeout(r, 200));
    const p = PROFILE[this.channel];
    const jitter = 0.85 + (hash(externalId) % 30) / 100; // 0.85–1.15
    const spend = Math.round(draft.budgetDaily * days * jitter);
    const clicks = Math.max(1, Math.round((spend / p.cpc) * jitter));
    const impressions = Math.round(clicks / p.ctr);
    const conversions = Math.max(0, Math.round(clicks * p.cvr * jitter));
    const revenue = Math.round(conversions * p.aov);
    const roas = spend ? Math.round((revenue / spend) * 100) / 100 : 0;
    return { impressions, clicks, spend, conversions, revenue, roas };
  }
}
