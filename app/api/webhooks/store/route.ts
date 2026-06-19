import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminConfigured, createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generic store webhook (e.g. Shopify products/update). In production, verify
// the platform's HMAC header before trusting the payload (see docs/INTEGRATIONS.md).
const schema = z.object({
  org_id: z.string().uuid(),
  store_id: z.string().uuid(),
  product: z.object({
    external_id: z.string(), title: z.string(),
    price: z.number().optional(), currency: z.string().optional(), image_url: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed" }, { status: 422 });
  if (!isAdminConfigured()) return NextResponse.json({ ok: true, note: "demo mode — not persisted" }, { status: 200 });

  const { org_id, store_id, product } = parsed.data;
  const db = createAdminClient();
  await db.from("products").upsert({
    org_id, store_id, external_id: product.external_id, title: product.title,
    price: product.price ?? null, currency: product.currency ?? "USD", image_url: product.image_url ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  return NextResponse.json({ ok: true }, { status: 200 });
}
