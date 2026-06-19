import { createClient as createSb, SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/config";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export function isAdminConfigured(): boolean { return Boolean(supabaseUrl && serviceKey); }
export function createAdminClient(): SupabaseClient {
  if (!isAdminConfigured()) throw new Error("Supabase service role not configured");
  return createSb(supabaseUrl!, serviceKey!, { auth: { persistSession: false, autoRefreshToken: false } });
}
