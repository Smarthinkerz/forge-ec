import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Role } from "@/lib/rbac";

export interface SessionUser { id: string; email: string | null; }
export interface OrgContext { orgId: string; orgName: string; role: Role; }

export async function getUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** The user's primary org + role. Null in demo mode or when not signed in. */
export async function getOrgContext(): Promise<OrgContext | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("role, org_id, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const org = data as unknown as { role: Role; org_id: string; organizations: { name: string } | null };
  return { orgId: org.org_id, orgName: org.organizations?.name ?? "Organization", role: org.role };
}
