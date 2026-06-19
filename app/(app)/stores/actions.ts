// app/(app)/stores/actions.ts
"use server";

import { syncProducts, optimizeForChannel } from "@/lib/stores/sync";
import { runSiteAudit, type SiteAudit } from "@/lib/stores/audit";
import { getAdapter } from "@/lib/stores/registry";
import { encryptJSON, decryptJSON, credentialsEncryptionAvailable } from "@/lib/stores/crypto";
import type { Platform, AdapterProduct, StoreCredentials } from "@/lib/stores/types";
import { getOrgContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface ConnectResult {
  store: { name: string; domain: string; currency: string };
  products: AdapterProduct[];
  audit: SiteAudit;
  persisted: boolean;
  credentialsSaved: boolean;
  mode: "live" | "sandbox";
}
export type ConnectOutcome = { ok: true; result: ConnectResult } | { ok: false; error: string };

export interface SavedStore {
  id: string;
  platform: Platform;
  name: string;
  domain: string;
  status: string;
  hasCredentials: boolean;
  lastSyncedAt: string | null;
}

const FALLBACK_AUDIT: SiteAudit = {
  score: 0,
  summary: "Catalog synced. Connect AI keys to generate a full conversion audit.",
  findings: [],
};

async function persistCatalog(
  orgId: string,
  platform: Platform,
  store: ConnectResult["store"],
  products: AdapterProduct[],
  creds: StoreCredentials | null,
): Promise<{ persisted: boolean; credentialsSaved: boolean }> {
  try {
    const supabase = await createClient();
    const credentialsEnc = creds && credentialsEncryptionAvailable() ? encryptJSON(creds) : null;
    const { data: row } = await supabase
      .from("stores")
      .insert({
        org_id: orgId, platform, name: store.name, domain: store.domain, status: "connected",
        ...(credentialsEnc ? { credentials_enc: credentialsEnc } : {}),
        last_synced_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (!row) return { persisted: false, credentialsSaved: false };
    const storeId = (row as { id: string }).id;
    if (products.length) {
      await supabase.from("products").insert(
        products.map((p) => ({
          org_id: orgId, store_id: storeId, external_id: p.externalId,
          title: p.title, price: p.price, currency: p.currency, image_url: p.imageUrl ?? null,
        })),
      );
    }
    return { persisted: true, credentialsSaved: Boolean(credentialsEnc) };
  } catch {
    return { persisted: false, credentialsSaved: false };
  }
}

/** Connect a store. mode "live" uses the supplied credentials and real APIs;
 *  mode "sandbox" ignores them and runs the demo adapter. */
export async function connectStore(
  platform: Platform,
  credsInput: StoreCredentials,
  opts: { mode: "live" | "sandbox"; save?: boolean } = { mode: "sandbox" },
): Promise<ConnectOutcome> {
  const live = opts.mode === "live";
  const creds = live ? credsInput : {};

  // Guard: in live mode the resolved adapter must actually be the configured real one.
  if (live) {
    const adapter = getAdapter(platform, creds);
    if (!adapter.isConfigured(creds)) {
      return { ok: false, error: "Please fill in all required credential fields." };
    }
  }

  let synced;
  try {
    synced = await syncProducts(platform, creds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Connection failed.";
    return { ok: false, error: msg.slice(0, 300) };
  }

  const audit = await runSiteAudit(synced.store.domain).catch(() => FALLBACK_AUDIT);

  let persisted = false;
  let credentialsSaved = false;
  if (isSupabaseConfigured()) {
    const org = await getOrgContext();
    if (org) {
      const r = await persistCatalog(org.orgId, platform, synced.store, synced.products, live && opts.save ? creds : null);
      persisted = r.persisted;
      credentialsSaved = r.credentialsSaved;
    }
  }

  return { ok: true, result: { store: synced.store, products: synced.products, audit, persisted, credentialsSaved, mode: opts.mode } };
}

/** List stores already saved for the current org. */
export async function listSavedStores(): Promise<SavedStore[]> {
  if (!isSupabaseConfigured()) return [];
  const org = await getOrgContext();
  if (!org) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("stores")
      .select("id, platform, name, domain, status, credentials_enc, last_synced_at")
      .eq("org_id", org.orgId)
      .order("last_synced_at", { ascending: false });
    return (data ?? []).map((s: any) => ({
      id: s.id, platform: s.platform, name: s.name, domain: s.domain, status: s.status,
      hasCredentials: Boolean(s.credentials_enc), lastSyncedAt: s.last_synced_at ?? null,
    }));
  } catch {
    return [];
  }
}

/** Re-pull the catalog for a saved store using its stored (encrypted) credentials. */
export async function resyncStore(storeId: string): Promise<ConnectOutcome> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Database not connected." };
  const org = await getOrgContext();
  if (!org) return { ok: false, error: "Not signed in." };

  let platform: Platform;
  let creds: StoreCredentials | null;
  try {
    const supabase = await createClient();
    const { data: s } = await supabase
      .from("stores").select("platform, credentials_enc").eq("id", storeId).eq("org_id", org.orgId).single();
    if (!s) return { ok: false, error: "Store not found." };
    platform = (s as any).platform;
    creds = decryptJSON<StoreCredentials>((s as any).credentials_enc);
  } catch {
    return { ok: false, error: "Could not load store." };
  }
  if (!creds) return { ok: false, error: "No saved credentials (or encryption key changed). Reconnect to re-enable sync." };

  let synced;
  try {
    synced = await syncProducts(platform, creds);
  } catch (e) {
    return { ok: false, error: (e instanceof Error ? e.message : "Sync failed.").slice(0, 300) };
  }

  try {
    const supabase = await createClient();
    await supabase.from("products").delete().eq("store_id", storeId).eq("org_id", org.orgId);
    if (synced.products.length) {
      await supabase.from("products").insert(
        synced.products.map((p) => ({
          org_id: org.orgId, store_id: storeId, external_id: p.externalId,
          title: p.title, price: p.price, currency: p.currency, image_url: p.imageUrl ?? null,
        })),
      );
    }
    await supabase.from("stores").update({ last_synced_at: new Date().toISOString() }).eq("id", storeId).eq("org_id", org.orgId);
  } catch {
    // products synced but DB write failed — still return what we pulled
  }

  const audit = await runSiteAudit(synced.store.domain).catch(() => FALLBACK_AUDIT);
  return { ok: true, result: { store: synced.store, products: synced.products, audit, persisted: true, credentialsSaved: true, mode: "live" } };
}

/** Remove a saved store and its products. */
export async function deleteStore(storeId: string): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured()) return { ok: false };
  const org = await getOrgContext();
  if (!org) return { ok: false };
  try {
    const supabase = await createClient();
    await supabase.from("products").delete().eq("store_id", storeId).eq("org_id", org.orgId);
    await supabase.from("stores").delete().eq("id", storeId).eq("org_id", org.orgId);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function optimizeProduct(product: AdapterProduct, channel: string) {
  return optimizeForChannel(product, channel);
}
