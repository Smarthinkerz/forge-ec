// lib/stores/mock.ts
// Sandbox adapter that simulates a connected store end-to-end with a realistic
// catalog. This is the working path until real credentials are supplied.

import type { StoreAdapter, StoreCredentials, StoreInfo, AdapterProduct, Platform } from "@/lib/stores/types";

const CATALOG: Omit<AdapterProduct, "externalId">[] = [
  { title: "Merino Wool Crew Sweater", description: "Soft, breathable everyday knit.", price: 89, currency: "USD", tags: ["apparel", "knitwear"], imageUrl: "" },
  { title: "Trailrunner GTX Shoes", description: "All-terrain waterproof running shoe.", price: 145, currency: "USD", tags: ["footwear", "outdoor"], imageUrl: "" },
  { title: "Ceramic Pour-Over Set", description: "Single-origin brewing, café at home.", price: 54, currency: "USD", tags: ["home", "kitchen"], imageUrl: "" },
  { title: "Linen Oversized Shirt", description: "Breathable warm-weather staple.", price: 72, currency: "USD", tags: ["apparel"], imageUrl: "" },
  { title: "Recycled Daypack 20L", description: "Made from ocean-bound plastics.", price: 98, currency: "USD", tags: ["bags", "sustainable"], imageUrl: "" },
  { title: "Aroma Diffuser — Walnut", description: "Quiet ultrasonic mist, 8h runtime.", price: 63, currency: "USD", tags: ["home"], imageUrl: "" },
  { title: "Performance Yoga Mat", description: "Grippy, non-slip, 6mm cushioning.", price: 48, currency: "USD", tags: ["fitness"], imageUrl: "" },
  { title: "Stainless Travel Bottle", description: "Keeps cold 24h / hot 12h.", price: 34, currency: "USD", tags: ["accessories"], imageUrl: "" },
];

export class MockStoreAdapter implements StoreAdapter {
  platform: Platform;
  requiredCredentials: string[] = [];
  constructor(platform: Platform) { this.platform = platform; }

  isConfigured() { return true; } // always usable

  async getStoreInfo(creds: StoreCredentials): Promise<StoreInfo> {
    await new Promise((r) => setTimeout(r, 200));
    const domain = creds.domain || `${this.platform}-demo.myshop.example`;
    return { name: domain.split(".")[0].replace(/-/g, " "), domain, productCount: CATALOG.length, currency: "USD" };
  }

  async listProducts(_creds: StoreCredentials, limit = 50): Promise<AdapterProduct[]> {
    await new Promise((r) => setTimeout(r, 300));
    return CATALOG.slice(0, limit).map((p, i) => ({ ...p, externalId: `${this.platform}-${1000 + i}` }));
  }
}
