// Shared API plumbing: rate limit + optional API-key auth + JSON helpers.
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/security/ratelimit";
import { verifyApiKey } from "@/lib/api/keys";
import { log } from "@/lib/observability/logger";

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
}

export interface ApiContext { orgId: string | null; demo: boolean; }

/** Gate a request: rate limit, then resolve API key (demo-open when no DB). */
export async function gate(req: Request, limit = 60): Promise<{ error?: NextResponse; ctx?: ApiContext }> {
  const rl = rateLimit(`api:${clientKey(req)}`, limit);
  if (!rl.allowed) {
    return { error: NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }) };
  }
  const orgId = await verifyApiKey(req);
  log("info", "api.request", { path: new URL(req.url).pathname, authed: Boolean(orgId) });
  return { ctx: { orgId, demo: orgId === null } };
}

export function ok(data: unknown, demo: boolean) {
  return NextResponse.json({ data, ...(demo ? { note: "demo mode — sample data (no API key / DB)" } : {}) });
}
