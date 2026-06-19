// Multi-touch attribution. Distributes each converting journey's revenue + one
// conversion across its touchpoints per the chosen model, then aggregates by
// channel. Totals are conserved (sum of credit == sum of converted revenue).

export type AttributionModel = "last" | "first" | "linear" | "position" | "time_decay";

export interface Touchpoint { channel: string; daysBeforeConversion: number; }
export interface Journey { touchpoints: Touchpoint[]; converted: boolean; revenue: number; }

export interface ChannelCredit { channel: string; creditedRevenue: number; creditedConversions: number; }
export interface AttributionResult { model: AttributionModel; channels: ChannelCredit[]; totalRevenue: number; }

function weights(model: AttributionModel, tps: Touchpoint[]): number[] {
  const n = tps.length;
  if (n === 0) return [];
  if (n === 1) return [1];
  switch (model) {
    case "last": return tps.map((_, i) => (i === n - 1 ? 1 : 0));
    case "first": return tps.map((_, i) => (i === 0 ? 1 : 0));
    case "linear": return tps.map(() => 1 / n);
    case "position": {
      // U-shaped: 40% first, 40% last, 20% split across the middle.
      if (n === 2) return [0.5, 0.5];
      const mid = 0.2 / (n - 2);
      return tps.map((_, i) => (i === 0 || i === n - 1 ? 0.4 : mid));
    }
    case "time_decay": {
      // Exponential by recency (7-day half-life on daysBeforeConversion).
      const raw = tps.map((t) => Math.pow(0.5, t.daysBeforeConversion / 7));
      const sum = raw.reduce((a, b) => a + b, 0) || 1;
      return raw.map((r) => r / sum);
    }
  }
}

export function attribute(journeys: Journey[], model: AttributionModel): AttributionResult {
  const map = new Map<string, ChannelCredit>();
  let totalRevenue = 0;
  for (const j of journeys) {
    if (!j.converted || j.touchpoints.length === 0) continue;
    totalRevenue += j.revenue;
    const w = weights(model, j.touchpoints);
    j.touchpoints.forEach((tp, i) => {
      const c = map.get(tp.channel) ?? { channel: tp.channel, creditedRevenue: 0, creditedConversions: 0 };
      c.creditedRevenue += j.revenue * w[i];
      c.creditedConversions += w[i];
      map.set(tp.channel, c);
    });
  }
  const channels = [...map.values()]
    .map((c) => ({ ...c, creditedRevenue: Math.round(c.creditedRevenue), creditedConversions: Math.round(c.creditedConversions * 100) / 100 }))
    .sort((a, b) => b.creditedRevenue - a.creditedRevenue);
  return { model, channels, totalRevenue };
}
