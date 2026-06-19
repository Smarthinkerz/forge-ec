"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type State = { error?: string } | undefined;

// After auth, send paid-plan signups straight to checkout; everyone else to the app.
function nextAfterAuth(planRaw: unknown): string {
  const plan = String(planRaw ?? "").trim();
  if (plan === "starter" || plan === "growth") return `/api/checkout?plan=${plan}`;
  return "/dashboard";
}

export async function signIn(_p: State, fd: FormData): Promise<State> {
  if (!isSupabaseConfigured()) return { error: "Auth not configured. Add Supabase keys to .env.local." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect(nextAfterAuth(fd.get("plan")));
}

export async function signUp(_p: State, fd: FormData): Promise<State> {
  if (!isSupabaseConfigured()) return { error: "Auth not configured. Add Supabase keys to .env.local." };
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const plan = String(fd.get("plan") ?? "").trim();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(fd.get("email") ?? ""), password,
    options: { data: { full_name: String(fd.get("fullName") ?? ""), org_name: String(fd.get("orgName") ?? "") } },
  });
  if (error) return { error: error.message };
  // Email confirmation OFF -> a session exists now, go straight to plan/checkout.
  if (data.session) { revalidatePath("/", "layout"); redirect(nextAfterAuth(plan)); }
  // Email confirmation ON -> ask them to confirm, preserving the chosen plan.
  redirect(`/login?checkEmail=1${plan ? `&plan=${plan}` : ""}`);
}
