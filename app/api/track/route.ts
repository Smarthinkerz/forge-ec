import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CAPI-style server-side event intake. Optionally records an attribution
// touchpoint when org_id + conversion_id + channel are supplied. In production,
// authenticate the caller and dedupe on event_id.
const schema = z.object({
  org_id: z.string().uuid().optional(),
  event: z.string().min(1).max(64),
  value: z.number().optional(),
  currency: z.string().max(8).optional(),
  event_id: z.string().max(128).optional(),
  meta: z.record(z.unknown()).optional(),
  // Attribution touchpoint (optional):
  conversion_id: z.string().uuid().optional(),
  channel: z.string().max(32).optional(),
  days_before: z.number().int().min(0).max(365).optional(),
  converted: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed" }, { status: 422 });
  if (!isAdminConfigured()) return NextResponse.json({ ok: true, note: "demo mode — not persisted" }, { status: 200 });

  const p = parsed.data;
  const db = createAdminClient();
  await db.from("audit_log").insert({ org_id: p.org_id ?? null, action: "track", meta: { event: p.event, value: p.value, currency: p.currency, event_id: p.event_id, ...p.meta } });

  // Record attribution touchpoint when enough info is present.
  if (p.org_id && p.conversion_id && p.channel) {
    await db.from("touchpoints").insert({
      org_id: p.org_id, conversion_id: p.conversion_id, channel: p.channel,
      days_before: p.days_before ?? 0, revenue: p.value ?? 0, converted: p.converted ?? true,
    });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
