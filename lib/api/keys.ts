// API key generation + verification. The raw key is shown once; only its
// SHA-256 hash is stored. Verification hashes the presented key and looks it up.
import crypto from "crypto";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";

export interface GeneratedKey { key: string; prefix: string; hash: string; }

export function generateApiKey(): GeneratedKey {
  const secret = crypto.randomBytes(24).toString("base64url");
  const key = `fec_live_${secret}`;
  const prefix = key.slice(0, 12);
  const hash = hashKey(key);
  return { key, prefix, hash };
}

export function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function extractKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-api-key");
}

/** Returns the org_id for a valid key, or null. Demo mode (no admin) → null. */
export async function verifyApiKey(req: Request): Promise<string | null> {
  const key = extractKey(req);
  if (!key || !isAdminConfigured()) return null;
  try {
    const db = createAdminClient();
    const { data } = await db.from("api_keys").select("org_id").eq("key_hash", hashKey(key)).maybeSingle();
    return (data as { org_id: string } | null)?.org_id ?? null;
  } catch { return null; }
}
