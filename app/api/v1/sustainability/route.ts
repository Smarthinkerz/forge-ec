import { NextResponse } from "next/server";
import { z } from "zod";
import { gate } from "@/lib/api/respond";
import { sustainabilityScore } from "@/lib/sustainability";
export const dynamic = "force-dynamic";
const schema = z.object({ channel: z.string(), impressions: z.number().min(0), conversions: z.number().min(0) });
export async function POST(req: Request) {
  const g = await gate(req); if (g.error) return g.error;
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation failed" }, { status: 422 });
  return NextResponse.json({ data: sustainabilityScore(parsed.data) });
}
