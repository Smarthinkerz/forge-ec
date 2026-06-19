// Automatic insight reports. Heuristic detectors over per-channel current vs.
// previous-period metrics, each with explainable reasoning + a recommended
// action. (An AI narrative can wrap these via the AI layer; detection stays
// deterministic so reports are reproducible.)

export interface ChannelPeriod {
  channel: string;
  spend: number; revenue: number; conversions: number; clicks: number;
  prevRevenue: number; prevSpend: number;
}
export interface Insight {
  title: string; detail: string; direction: "up" | "down" | "neutral";
  severity: "high" | "medium" | "low"; reasoning: string; action: string;
}

const CVR_BENCHMARK = 0.02; // 2% conversion-from-click benchmark

export function generateInsights(channels: ChannelPeriod[]): Insight[] {
  const out: Insight[] = [];
  for (const c of channels) {
    const roas = c.spend > 0 ? c.revenue / c.spend : 0;
    const prevRoas = c.prevSpend > 0 ? c.prevRevenue / c.prevSpend : 0;
    const roasDelta = prevRoas > 0 ? (roas - prevRoas) / prevRoas : 0;
    const cvr = c.clicks > 0 ? c.conversions / c.clicks : 0;

    if (roasDelta >= 0.1) out.push({
      title: `${c.channel}: ROAS up ${Math.round(roasDelta * 100)}%`, direction: "up", severity: "medium",
      detail: `ROAS rose to ${roas.toFixed(1)}x from ${prevRoas.toFixed(1)}x period-over-period.`,
      reasoning: "Revenue grew faster than spend versus the previous period.",
      action: "Increase budget incrementally while ROAS holds.",
    });
    if (roasDelta <= -0.1) out.push({
      title: `${c.channel}: ROAS down ${Math.round(Math.abs(roasDelta) * 100)}%`, direction: "down", severity: "high",
      detail: `ROAS fell to ${roas.toFixed(1)}x from ${prevRoas.toFixed(1)}x.`,
      reasoning: "Spend efficiency declined versus the previous period.",
      action: "Refresh creative and review targeting before it compounds.",
    });
    if (cvr > 0 && cvr < CVR_BENCHMARK) out.push({
      title: `${c.channel}: conversion rate below benchmark`, direction: "down", severity: "medium",
      detail: `CVR is ${(cvr * 100).toFixed(1)}% vs a ${(CVR_BENCHMARK * 100).toFixed(0)}% benchmark.`,
      reasoning: "Clicks are arriving but not converting — likely a landing-page or offer issue.",
      action: "Run a landing-page audit and test the offer/price.",
    });
    if (roas >= 4 && roasDelta >= 0) out.push({
      title: `${c.channel}: scaling opportunity`, direction: "up", severity: "low",
      detail: `Sustained ${roas.toFixed(1)}x ROAS with stable or rising efficiency.`,
      reasoning: "High, stable ROAS indicates room to deploy more budget profitably.",
      action: "Allocate additional budget via the smart allocator.",
    });
  }
  // Highest severity first.
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
