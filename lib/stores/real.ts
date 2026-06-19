// lib/stores/real.ts
// Live store adapters. Each makes real API calls using the credentials supplied
// from the Stores page. The registry routes here automatically once the required
// credentials are present; otherwise it falls back to the sandbox adapter.

import type { StoreAdapter, StoreCredentials, StoreInfo, AdapterProduct, Platform } from "@/lib/stores/types";

// ---- helpers ---------------------------------------------------------------

function stripHtml(s: string | null | undefined): string {
  return (s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function normalizeUrl(u: string): string {
  let v = (u || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v;
}
function hostOf(u: string): string {
  try { return new URL(normalizeUrl(u)).host; } catch { return u; }
}
async function asError(res: Response, platform: string): Promise<never> {
  let detail = "";
  try { detail = (await res.text()).slice(0, 300); } catch { /* ignore */ }
  throw new Error(`${platform} API ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
}

abstract class RealAdapterBase implements StoreAdapter {
  abstract platform: Platform;
  abstract requiredCredentials: string[];
  isConfigured(creds: StoreCredentials): boolean {
    return this.requiredCredentials.every((k) => Boolean(creds[k] && String(creds[k]).trim()));
  }
  abstract getStoreInfo(creds: StoreCredentials): Promise<StoreInfo>;
  abstract listProducts(creds: StoreCredentials, limit?: number): Promise<AdapterProduct[]>;
}

// ---- Shopify (Admin GraphQL API) -------------------------------------------
// Creds: shop (your-store.myshopify.com), accessToken (Admin API access token).
export class ShopifyAdapter extends RealAdapterBase {
  platform: Platform = "shopify";
  requiredCredentials = ["shop", "accessToken"];

  private endpoint(creds: StoreCredentials): string {
    const shop = (creds.shop || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    return `https://${shop}/admin/api/2024-10/graphql.json`;
  }
  private async gql(creds: StoreCredentials, query: string, variables?: Record<string, unknown>) {
    const res = await fetch(this.endpoint(creds), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": creds.accessToken },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) await asError(res, "Shopify");
    const json = await res.json();
    if (json.errors) throw new Error(`Shopify: ${JSON.stringify(json.errors).slice(0, 300)}`);
    return json.data;
  }

  async getStoreInfo(creds: StoreCredentials): Promise<StoreInfo> {
    const data = await this.gql(creds, `{ shop { name currencyCode } }`);
    return { name: data.shop.name, domain: creds.shop, productCount: 0, currency: data.shop.currencyCode || "USD" };
  }

  async listProducts(creds: StoreCredentials, limit = 50): Promise<AdapterProduct[]> {
    const data = await this.gql(
      creds,
      `query($n:Int!){
        shop { currencyCode }
        products(first:$n){ edges{ node{
          id title description featuredImage{ url }
          variants(first:1){ edges{ node{ price } } }
        } } }
      }`,
      { n: Math.min(limit, 250) },
    );
    const currency = data.shop?.currencyCode || "USD";
    return (data.products?.edges ?? []).map((e: any) => {
      const n = e.node;
      const price = Number(n.variants?.edges?.[0]?.node?.price ?? 0);
      return {
        externalId: String(n.id),
        title: n.title ?? "",
        description: stripHtml(n.description),
        price: isFinite(price) ? price : 0,
        currency,
        imageUrl: n.featuredImage?.url || "",
        tags: [],
      } as AdapterProduct;
    });
  }
}

// ---- WooCommerce (REST v3, Basic auth) -------------------------------------
// Creds: siteUrl (https://yourstore.com), consumerKey (ck_…), consumerSecret (cs_…).
export class WooCommerceAdapter extends RealAdapterBase {
  platform: Platform = "woocommerce";
  requiredCredentials = ["siteUrl", "consumerKey", "consumerSecret"];

  private base(creds: StoreCredentials) { return `${normalizeUrl(creds.siteUrl)}/wp-json/wc/v3`; }
  private auth(creds: StoreCredentials) {
    return "Basic " + Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString("base64");
  }
  private async currency(creds: StoreCredentials): Promise<string> {
    try {
      const res = await fetch(`${this.base(creds)}/settings/general`, {
        headers: { Authorization: this.auth(creds) }, cache: "no-store",
      });
      if (!res.ok) return "USD";
      const arr = await res.json();
      const row = Array.isArray(arr) ? arr.find((x: any) => x.id === "woocommerce_currency") : null;
      return row?.value || "USD";
    } catch { return "USD"; }
  }

  async getStoreInfo(creds: StoreCredentials): Promise<StoreInfo> {
    // Validate creds with a cheap call; throws clear error on bad keys.
    const res = await fetch(`${this.base(creds)}/products?per_page=1`, {
      headers: { Authorization: this.auth(creds) }, cache: "no-store",
    });
    if (!res.ok) await asError(res, "WooCommerce");
    const total = Number(res.headers.get("x-wp-total") || 0);
    return { name: hostOf(creds.siteUrl), domain: hostOf(creds.siteUrl), productCount: total, currency: await this.currency(creds) };
  }

  async listProducts(creds: StoreCredentials, limit = 50): Promise<AdapterProduct[]> {
    const res = await fetch(`${this.base(creds)}/products?per_page=${Math.min(limit, 100)}&status=publish`, {
      headers: { Authorization: this.auth(creds) }, cache: "no-store",
    });
    if (!res.ok) await asError(res, "WooCommerce");
    const items = await res.json();
    const currency = await this.currency(creds);
    return (Array.isArray(items) ? items : []).map((p: any) => ({
      externalId: String(p.id),
      title: p.name ?? "",
      description: stripHtml(p.short_description || p.description),
      price: Number(p.price || 0) || 0,
      currency,
      imageUrl: p.images?.[0]?.src || "",
      tags: (p.tags ?? []).map((t: any) => t.name).filter(Boolean),
    } as AdapterProduct));
  }
}

// ---- BigCommerce (REST v3) -------------------------------------------------
// Creds: storeHash, accessToken (X-Auth-Token).
export class BigCommerceAdapter extends RealAdapterBase {
  platform: Platform = "bigcommerce";
  requiredCredentials = ["storeHash", "accessToken"];

  private headers(creds: StoreCredentials) {
    return { "X-Auth-Token": creds.accessToken, Accept: "application/json", "Content-Type": "application/json" };
  }
  private async store(creds: StoreCredentials): Promise<{ name: string; currency: string }> {
    const res = await fetch(`https://api.bigcommerce.com/stores/${creds.storeHash}/v2/store`, {
      headers: this.headers(creds), cache: "no-store",
    });
    if (!res.ok) await asError(res, "BigCommerce");
    const j = await res.json();
    return { name: j.name || creds.storeHash, currency: j.currency || "USD" };
  }

  async getStoreInfo(creds: StoreCredentials): Promise<StoreInfo> {
    const s = await this.store(creds);
    return { name: s.name, domain: creds.storeHash, productCount: 0, currency: s.currency };
  }

  async listProducts(creds: StoreCredentials, limit = 50): Promise<AdapterProduct[]> {
    const res = await fetch(
      `https://api.bigcommerce.com/stores/${creds.storeHash}/v3/catalog/products?limit=${Math.min(limit, 250)}&include=images`,
      { headers: this.headers(creds), cache: "no-store" },
    );
    if (!res.ok) await asError(res, "BigCommerce");
    const j = await res.json();
    const currency = (await this.store(creds).catch(() => ({ currency: "USD" }))).currency;
    return (j.data ?? []).map((p: any) => {
      const img = (p.images ?? []).find((i: any) => i.is_thumbnail) ?? p.images?.[0];
      return {
        externalId: String(p.id),
        title: p.name ?? "",
        description: stripHtml(p.description),
        price: Number(p.price || 0) || 0,
        currency,
        imageUrl: img?.url_standard || img?.url_thumbnail || "",
        tags: [],
      } as AdapterProduct;
    });
  }
}

// ---- Magento 2 (REST) ------------------------------------------------------
// Creds: baseUrl (https://yourstore.com), accessToken (integration token).
export class MagentoAdapter extends RealAdapterBase {
  platform: Platform = "magento";
  requiredCredentials = ["baseUrl", "accessToken"];

  private rest(creds: StoreCredentials) { return `${normalizeUrl(creds.baseUrl)}/rest/V1`; }
  private headers(creds: StoreCredentials) {
    return { Authorization: `Bearer ${creds.accessToken}`, Accept: "application/json" };
  }
  private async currency(creds: StoreCredentials): Promise<string> {
    try {
      const res = await fetch(`${this.rest(creds)}/store/storeConfigs`, { headers: this.headers(creds), cache: "no-store" });
      if (!res.ok) return "USD";
      const arr = await res.json();
      return arr?.[0]?.base_currency_code || "USD";
    } catch { return "USD"; }
  }

  async getStoreInfo(creds: StoreCredentials): Promise<StoreInfo> {
    const res = await fetch(`${this.rest(creds)}/products?searchCriteria[pageSize]=1`, {
      headers: this.headers(creds), cache: "no-store",
    });
    if (!res.ok) await asError(res, "Magento");
    const j = await res.json();
    return { name: hostOf(creds.baseUrl), domain: hostOf(creds.baseUrl), productCount: Number(j.total_count || 0), currency: await this.currency(creds) };
  }

  async listProducts(creds: StoreCredentials, limit = 50): Promise<AdapterProduct[]> {
    const res = await fetch(
      `${this.rest(creds)}/products?searchCriteria[pageSize]=${Math.min(limit, 100)}&searchCriteria[currentPage]=1`,
      { headers: this.headers(creds), cache: "no-store" },
    );
    if (!res.ok) await asError(res, "Magento");
    const j = await res.json();
    const currency = await this.currency(creds);
    const base = normalizeUrl(creds.baseUrl);
    return (j.items ?? []).map((p: any) => {
      const attrs: any[] = p.custom_attributes ?? [];
      const desc = attrs.find((a) => a.attribute_code === "short_description" || a.attribute_code === "description")?.value;
      const file = p.media_gallery_entries?.[0]?.file;
      return {
        externalId: String(p.sku ?? p.id),
        title: p.name ?? "",
        description: stripHtml(typeof desc === "string" ? desc : ""),
        price: Number(p.price || 0) || 0,
        currency,
        imageUrl: file ? `${base}/media/catalog/product${file}` : "",
        tags: [],
      } as AdapterProduct;
    });
  }
}
