// lib/stores/sync.ts
import { z } from "zod";
import { selectProvider } from "@/lib/ai/router";
import { getAdapter } from "@/lib/stores/registry";
import type { Platform, StoreCredentials, AdapterProduct } from "@/lib/stores/types";

export interface SyncResult {
  store: { name: string; domain: string; currency: string };
  products: AdapterProduct[];
  syncedAt: string;
}

/** Pull catalog through the resolved adapter (live or sandbox). */
export async function syncProducts(platform: Platform, creds: StoreCredentials = {}, limit = 50): Promise<SyncResult> {
  const adapter = getAdapter(platform, creds);
  const [info, products] = await Promise.all([adapter.getStoreInfo(creds), adapter.listProducts(creds, limit)]);
  return {
    store: { name: info.name, domain: info.domain, currency: info.currency },
    products,
    syncedAt: new Date().toISOString(),
  };
}

const optimizedSchema = z.object({
  title: z.string(),
  description: z.string(),
  bullets: z.array(z.string()).default([]),
});
export type OptimizedCopy = z.infer<typeof optimizedSchema>;

const CHANNEL_GUIDANCE: Record<string, string> = {
  google: "Google Shopping/Search: front-load the most-searched product keywords; concise, factual.",
  meta: "Meta feed: benefit-led, lifestyle tone, emotionally resonant hook.",
  tiktok: "TikTok: punchy, native, trend-aware, casual voice.",
  pinterest: "Pinterest: aspirational, descriptive, keyword-rich for discovery.",
  amazon: "Amazon: keyword-dense title, spec-forward bullets, conversion-focused.",
};

/** Rewrite a product's copy for a specific ad channel using the AI layer. */
export async function optimizeForChannel(product: AdapterProduct, channel: string): Promise<OptimizedCopy> {
  const provider = selectProvider();
  const res = await provider.complete({
    task: "product_optimization",
    json: true,
    system: "You optimize e-commerce product copy per advertising channel. Keep claims truthful. Output strict JSON {title, description, bullets[]}.",
    prompt: `CHANNEL: ${channel}\nGUIDANCE: ${CHANNEL_GUIDANCE[channel] ?? "General best practices."}\nTITLE: ${product.title}\nDESCRIPTION: ${product.description}\nPRICE: ${product.price} ${product.currency}`,
    maxTokens: 500,
  });
  const match = res.text.match(/\{[\s\S]*\}/);
  return optimizedSchema.parse(JSON.parse(match ? match[0] : res.text));
}
