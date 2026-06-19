import { NextResponse } from "next/server";
import { gate } from "@/lib/api/respond";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const g = await gate(req); if (g.error) return g.error;
  return NextResponse.json({ data: { status: "ok", version: "1.0.0", authed: !g.ctx!.demo } });
}
