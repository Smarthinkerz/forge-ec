// lib/stores/types.ts
export type Platform = "shopify" | "woocommerce" | "bigcommerce" | "magento" | "custom";

export interface AdapterProduct {
  externalId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  tags?: string[];
}

export interface StoreInfo {
  name: string;
  domain: string;
  productCount: number;
  currency: string;
}

export type StoreCredentials = Record<string, string>;

export interface StoreAdapter {
  platform: Platform;
  /** Human-readable list of credential keys this adapter needs for live use. */
  requiredCredentials: string[];
  /** True when the supplied credentials are sufficient for live API calls. */
  isConfigured(creds: StoreCredentials): boolean;
  getStoreInfo(creds: StoreCredentials): Promise<StoreInfo>;
  listProducts(creds: StoreCredentials, limit?: number): Promise<AdapterProduct[]>;
}
