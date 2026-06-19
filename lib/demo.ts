// lib/demo.ts
// Deterministic demo dataset so the whole app renders before any store/channel
// is connected. Replaced by real org-scoped queries once Supabase is wired.

export interface DayMetric { date: string; spend: number; revenue: number; conversions: number; }
export interface DemoCampaign { name: string; channel: string; status: string; spend: number; revenue: number; roas: number; }

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function demoSeries(days = 30): DayMetric[] {
  const rnd = seeded(42);
  const out: DayMetric[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const spend = 400 + Math.round(rnd() * 600);
    const revenue = Math.round(spend * (2.8 + rnd() * 2.4)); // ~2.8–5.2x
    const conversions = Math.round(revenue / (60 + rnd() * 40));
    out.push({ date: d.toISOString().slice(0, 10), spend, revenue, conversions });
  }
  return out;
}

export function demoTotals(series: DayMetric[]) {
  const spend = series.reduce((s, d) => s + d.spend, 0);
  const revenue = series.reduce((s, d) => s + d.revenue, 0);
  const conversions = series.reduce((s, d) => s + d.conversions, 0);
  return { spend, revenue, conversions, roas: spend ? Math.round((revenue / spend) * 100) / 100 : 0 };
}

export const demoCampaigns: DemoCampaign[] = [
  { name: "Summer Apparel — EU Prospecting", channel: "meta", status: "active", spend: 4200, revenue: 19800, roas: 4.7 },
  { name: "Branded Search — Global", channel: "google", status: "active", spend: 2100, revenue: 13650, roas: 6.5 },
  { name: "UGC Video — TikTok 18-34", channel: "tiktok", status: "active", spend: 3100, revenue: 9920, roas: 3.2 },
  { name: "Retargeting — Cart Abandoners", channel: "meta", status: "active", spend: 980, revenue: 8330, roas: 8.5 },
  { name: "Pinterest — Home & Decor", channel: "pinterest", status: "paused", spend: 540, revenue: 1180, roas: 2.2 },
];
