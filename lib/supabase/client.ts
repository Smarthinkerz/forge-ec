import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/config";
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
