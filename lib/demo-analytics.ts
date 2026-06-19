import type { Journey } from "@/lib/analytics-engine/attribution";
import type { ChannelPeriod } from "@/lib/analytics-engine/insights";
import type { DayPoint } from "@/lib/analytics-engine/forecast";

function seeded(seed: number) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
const CH = ["google", "meta", "tiktok", "pinterest"];

export function demoJourneys(count = 400): Journey[] {
  const rnd = seeded(7);
  const out: Journey[] = [];
  for (let i = 0; i < count; i++) {
    const len = 1 + Math.floor(rnd() * 3);
    const tps = Array.from({ length: len }, () => ({ channel: CH[Math.floor(rnd() * CH.length)], daysBeforeConversion: Math.floor(rnd() * 21) }))
      .sort((a, b) => b.daysBeforeConversion - a.daysBeforeConversion);
    const converted = rnd() < 0.45;
    out.push({ touchpoints: tps, converted, revenue: converted ? 50 + Math.round(rnd() * 150) : 0 });
  }
  return out;
}

export function demoForecastSeries(days = 30): DayPoint[] {
  const rnd = seeded(11);
  const out: DayPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const spend = 500 + Math.round(rnd() * 400);
    const revenue = Math.round(spend * (3.0 + (days - i) * 0.03 + rnd() * 0.8)); // mild upward trend
    out.push({ date: d.toISOString().slice(0, 10), spend, revenue });
  }
  return out;
}

export const demoChannelPeriods: ChannelPeriod[] = [
  { channel: "google",    spend: 6200, revenue: 38400, conversions: 410, clicks: 5200, prevRevenue: 31000, prevSpend: 6000 },
  { channel: "meta",      spend: 7800, revenue: 26300, conversions: 300, clicks: 9100, prevRevenue: 29800, prevSpend: 7400 },
  { channel: "tiktok",    spend: 3400, revenue: 6900,  conversions: 95,  clicks: 8200, prevRevenue: 6100,  prevSpend: 3300 },
  { channel: "pinterest", spend: 1500, revenue: 7200,  conversions: 88,  clicks: 2100, prevRevenue: 5400,  prevSpend: 1500 },
];
