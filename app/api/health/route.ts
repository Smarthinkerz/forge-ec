import { NextResponse } from "next/server";
import { systemReadiness } from "@/lib/system/readiness";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const r = systemReadiness();
  return NextResponse.json({ status: "ok", uptime: process.uptime(), time: new Date().toISOString(), ...r });
}
