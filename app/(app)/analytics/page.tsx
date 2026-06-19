import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import { getForecastSeries, getChannelPeriods, getJourneys } from "@/lib/analytics-engine/source";
import { forecastROAS, predictLTV, cac, ltvCacRatio } from "@/lib/analytics-engine/forecast";
import { generateInsights } from "@/lib/analytics-engine/insights";
import { getGA4Summary } from "@/lib/analytics-engine/ga4";

export const metadata = { title: "Analytics · ForgeEC" };

export default async function AnalyticsPage() {
  const [seriesS, periodsS, journeysS, ga4] = await Promise.all([
    getForecastSeries(), getChannelPeriods(), getJourneys(), getGA4Summary(),
  ]);

  const forecast = forecastROAS(seriesS.data, 14);
  const ltv = predictLTV({ aov: 82, purchasesPerYear: 2.4, grossMarginPct: 45, retentionRate: 0.55 });
  const totalSpend = periodsS.data.reduce((s, c) => s + c.spend, 0);
  const totalConversions = periodsS.data.reduce((s, c) => s + c.conversions, 0);
  const customerAcq = cac(totalSpend, totalConversions);
  const ratio = ltvCacRatio(ltv, customerAcq);
  const insights = generateInsights(periodsS.data);
  const isReal = seriesS.isReal || periodsS.isReal || journeysS.isReal;

  return (
    <AnalyticsClient
      journeys={journeysS.data} forecast={forecast} ltv={ltv} cac={customerAcq} ltvCac={ratio}
      ga4={{ sessions: ga4.sessions, engagementRate: ga4.engagementRate, source: ga4.source }}
      insights={insights} isReal={isReal}
    />
  );
}
