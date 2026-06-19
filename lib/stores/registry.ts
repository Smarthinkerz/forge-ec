// Resolves an adapter for a platform. Uses the real adapter ONLY when its
// credentials are present and it's implemented; otherwise the sandbox adapter,
// so the full journey always works.
import type { Platform, StoreAdapter, StoreCredentials } from "@/lib/stores/types";
import { MockStoreAdapter } from "@/lib/stores/mock";
import { ShopifyAdapter, WooCommerceAdapter, BigCommerceAdapter, MagentoAdapter } from "@/lib/stores/real";

const REAL: Record<Platform, () => StoreAdapter> = {
  shopify: () => new ShopifyAdapter(),
  woocommerce: () => new WooCommerceAdapter(),
  bigcommerce: () => new BigCommerceAdapter(),
  magento: () => new MagentoAdapter(),
  custom: () => new MockStoreAdapter("custom"),
};

export function getAdapter(platform: Platform, creds: StoreCredentials = {}): StoreAdapter {
  const real = REAL[platform]?.();
  if (real && real.isConfigured(creds)) return real; // live path when creds present
  return new MockStoreAdapter(platform);             // sandbox path otherwise
}

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "shopify", label: "Shopify" },
  { id: "woocommerce", label: "WooCommerce" },
  { id: "bigcommerce", label: "BigCommerce" },
  { id: "magento", label: "Magento" },
  { id: "custom", label: "Custom store" },
];

/** Per-platform credential fields rendered by the Stores connect form.
 *  Labels are kept in English (standard API terminology). `secret` masks input. */
export interface CredentialField { key: string; label: string; placeholder: string; secret?: boolean }

export const CREDENTIAL_FIELDS: Record<Platform, CredentialField[]> = {
  shopify: [
    { key: "shop", label: "Store domain", placeholder: "your-store.myshopify.com" },
    { key: "accessToken", label: "Admin API access token", placeholder: "shpat_…", secret: true },
  ],
  woocommerce: [
    { key: "siteUrl", label: "Site URL", placeholder: "https://yourstore.com" },
    { key: "consumerKey", label: "Consumer key", placeholder: "ck_…", secret: true },
    { key: "consumerSecret", label: "Consumer secret", placeholder: "cs_…", secret: true },
  ],
  bigcommerce: [
    { key: "storeHash", label: "Store hash", placeholder: "abc123" },
    { key: "accessToken", label: "API access token", placeholder: "API token", secret: true },
  ],
  magento: [
    { key: "baseUrl", label: "Base URL", placeholder: "https://yourstore.com" },
    { key: "accessToken", label: "Integration access token", placeholder: "Bearer token", secret: true },
  ],
  custom: [],
};
