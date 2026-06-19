"use server";
import { selectBillingProvider } from "@/lib/billing/providers";
import type { PlanId } from "@/lib/billing/plans";

export type CheckoutResponse =
  | { ok: true; provider: string; url?: string; simulated?: boolean }
  | { ok: false; provider: string; error: string };

export async function startCheckout(plan: PlanId, currency: string): Promise<CheckoutResponse> {
  const provider = selectBillingProvider();
  try {
    const res = await provider.createCheckout(plan, currency);
    return { ok: true, provider: res.provider, url: res.url, simulated: res.simulated };
  } catch (e) {
    return { ok: false, provider: provider.name, error: e instanceof Error ? e.message : "checkout failed" };
  }
}

import { generateApiKey } from "@/lib/api/keys";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/auth";

export async function generateKeyAction(name: string): Promise<{ key: string; prefix: string; persisted: boolean }> {
  const { key, prefix, hash } = generateApiKey();
  let persisted = false;
  if (isSupabaseConfigured() && isAdminConfigured()) {
    try {
      const org = await getOrgContext();
      if (org) { const db = createAdminClient(); await db.from("api_keys").insert({ org_id: org.orgId, name: name || "API key", prefix, key_hash: hash }); persisted = true; }
    } catch { /* non-fatal */ }
  }
  return { key, prefix, persisted };
}

export async function saveBrandingAction(brandName: string, brandAccent: string): Promise<{ ok: boolean }> {
  if (isSupabaseConfigured() && isAdminConfigured()) {
    try {
      const org = await getOrgContext();
      if (org) { const db = createAdminClient(); await db.from("organizations").update({ brand_name: brandName, brand_accent: brandAccent }).eq("id", org.orgId); return { ok: true }; }
    } catch { /* non-fatal */ }
  }
  return { ok: false };
}
