// lib/analytics-engine/source.ts
// Real-data source for the analytics page. When Supabase is connected AND the
// org has data, these return live results computed from the database; otherwise
// they fall back to the sample dataset. Every real query is wrapped so a failure
// degrades gracefully to demo rather than breaking the page.

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOrgContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { demoJourneys, demoForecastSeries, demoChannelPeriods } from "@/lib/demo-analytics";
import type { DayPoint } from "@/lib/analytics-engine/forecast";
import type { ChannelPeriod } from "@/lib/analytics-engine/insights";
import type { Journey } from "@/lib/analytics-engine/attribution";

export interface Sourced<T> { data: T; isReal: boolean; }

type MetricRow = {
  date: string; spend: number; revenue: number; clicks: number; conversions: number;
  campaigns: { channels: { platform: string } | null } | null;
};

async function loadMetrics(orgId: string): Promise<MetricRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metrics_daily")
    .select("date, spend, revenue, clicks, conversions, campaigns(channels(platform))")
    .eq("org_id", orgId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data as unknown as MetricRow[]) ?? [];
}

/** Daily spend/revenue series for the ROAS forecast. */
export async function getForecastSeries(): Promise<Sourced<DayPoint[]>> {
  const org = isSupabaseConfigured() ? await getOrgContext() : null;
  if (org) {
    try {
      const rows = await loadMetrics(org.orgId);
      if (rows.length >= 5) {
        const byDate = new Map<string, DayPoint>();
        for (const r of rows) {
          const d = byDate.get(r.date) ?? { date: r.date, spend: 0, revenue: 0 };
          d.spend += Number(r.spend) || 0; d.revenue += Number(r.revenue) || 0;
          byDate.set(r.date, d);
        }
        return { data: [...byDate.values()], isReal: true };
      }
    } catch { /* fall through to demo */ }
  }
  return { data: demoForecastSeries(30), isReal: false };
}

/** Per-channel current-vs-previous period metrics for insights. */
export async function getChannelPeriods(): Promise<Sourced<ChannelPeriod[]>> {
  const org = isSupabaseConfigured() ? await getOrgContext() : null;
  if (org) {
    try {
      const rows = await loadMetrics(org.orgId);
      if (rows.length >= 5) {
        const dates = rows.map((r) => r.date).sort();
        const cutoff = dates[Math.floor(dates.length / 2)]; // split history in half
        const acc = new Map<string, ChannelPeriod>();
        for (const r of rows) {
          const ch = r.campaigns?.channels?.platform ?? "unknown";
          const c = acc.get(ch) ?? { channel: ch, spend: 0, revenue: 0, conversions: 0, clicks: 0, prevRevenue: 0, prevSpend: 0 };
          const recent = r.date >= cutoff;
          if (recent) { c.spend += +r.spend || 0; c.revenue += +r.revenue || 0; c.conversions += +r.conversions || 0; c.clicks += +r.clicks || 0; }
          else { c.prevSpend += +r.spend || 0; c.prevRevenue += +r.revenue || 0; }
          acc.set(ch, c);
        }
        const periods = [...acc.values()].filter((c) => c.spend > 0);
        if (periods.length) return { data: periods, isReal: true };
      }
    } catch { /* fall through */ }
  }
  return { data: demoChannelPeriods, isReal: false };
}

type TouchRow = { conversion_id: string; channel: string; days_before: number; revenue: number; converted: boolean };

/** Customer journeys (touchpoints grouped by conversion) for attribution. */
export async function getJourneys(): Promise<Sourced<Journey[]>> {
  const org = isSupabaseConfigured() ? await getOrgContext() : null;
  if (org) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("touchpoints")
        .select("conversion_id, channel, days_before, revenue, converted")
        .eq("org_id", org.orgId)
        .limit(5000);
      const rows = (data as TouchRow[] | null) ?? [];
      if (rows.length >= 10) {
        const byConv = new Map<string, Journey>();
        for (const r of rows) {
          const j = byConv.get(r.conversion_id) ?? { touchpoints: [], converted: r.converted, revenue: Number(r.revenue) || 0 };
          j.touchpoints.push({ channel: r.channel, daysBeforeConversion: r.days_before });
          j.converted = j.converted || r.converted;
          byConv.set(r.conversion_id, j);
        }
        const journeys = [...byConv.values()].map((j) => ({
          ...j, touchpoints: j.touchpoints.sort((a, b) => b.daysBeforeConversion - a.daysBeforeConversion),
        }));
        return { data: journeys, isReal: true };
      }
    } catch { /* fall through */ }
  }
  return { data: demoJourneys(400), isReal: false };
}
