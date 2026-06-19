import { cookies } from "next/headers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { demoSeries, demoTotals, demoCampaigns } from "@/lib/demo";
import { formatMoney, formatCompact, pct } from "@/lib/utils/format";
import { t, isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { TrendingUp, DollarSign, ShoppingCart, Target, Leaf } from "lucide-react";
import { sustainabilityScore } from "@/lib/sustainability";

export const metadata = { title: "Dashboard · ForgeEC" };

function Kpi({ icon: Icon, label, value, delta }: { icon: React.ElementType; label: string; value: string; delta?: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-dim">{label}</span>
        <Icon className="h-4 w-4 text-dim" />
      </div>
      <div className="text-2xl font-semibold tnum">{value}</div>
      {delta !== undefined && (
        <div className={`mt-1 text-xs ${delta >= 0 ? "text-pos" : "text-neg"}`}>{pct(delta)} vs prev. 30d</div>
      )}
    </Card>
  );
}

export default async function DashboardPage() {
  const jar = await cookies();
  const lc = jar.get("locale")?.value;
  const locale: Locale = isLocale(lc) ? lc : DEFAULT_LOCALE;

  const series = demoSeries(30);
  const totals = demoTotals(series);
  const sus = sustainabilityScore({ channel: "meta", impressions: 1_200_000, conversions: totals.conversions });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "dash.title")}</h1>
        <p className="text-dim text-sm mt-1">{t(locale, "dash.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={TrendingUp} label={t(locale, "kpi.roas")} value={`${totals.roas}x`} delta={12.4} />
        <Kpi icon={DollarSign} label={t(locale, "kpi.spend")} value={formatMoney(totals.spend)} delta={-3.1} />
        <Kpi icon={Target} label={t(locale, "kpi.revenue")} value={formatMoney(totals.revenue)} delta={18.9} />
        <Kpi icon={ShoppingCart} label={t(locale, "kpi.conversions")} value={formatCompact(totals.conversions)} delta={9.7} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">{t(locale, "dash.chartTitle")}</h2>
          <div className="flex items-center gap-4 text-xs text-dim">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-forge" /> {t(locale, "metric.revenue")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan" /> {t(locale, "metric.spend")}</span>
          </div>
        </div>
        <PerformanceChart data={series} />
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium flex items-center gap-2"><Leaf className="h-4 w-4 text-pos" /> {t(locale, "dash.sustainability")}</h2>
            <p className="text-dim text-sm mt-1">{t(locale, "dash.sustainabilityDesc")}</p>
          </div>
          <div className="text-right">
            <div className="tnum text-2xl font-semibold">{sus.rating}</div>
            <div className="text-xs text-dim">{sus.gPerConversion} {t(locale, "dash.perConversion")}</div>
          </div>
        </div>
        <p className="text-xs text-forge mt-3">{sus.suggestions[0]}</p>
      </Card>

      <Card className="p-5">
        <h2 className="font-medium mb-4">{t(locale, "dash.topCampaigns")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dim text-left border-b border-line">
                <th className="font-medium py-2">{t(locale, "dash.campaign")}</th>
                <th className="font-medium py-2">{t(locale, "dash.channel")}</th>
                <th className="font-medium py-2">{t(locale, "dash.status")}</th>
                <th className="font-medium py-2 text-right">{t(locale, "metric.spend")}</th>
                <th className="font-medium py-2 text-right">{t(locale, "metric.revenue")}</th>
                <th className="font-medium py-2 text-right">{t(locale, "metric.roas")}</th>
              </tr>
            </thead>
            <tbody>
              {demoCampaigns.map((c) => (
                <tr key={c.name} className="border-b border-line/60 last:border-0">
                  <td className="py-3 pe-4">{c.name}</td>
                  <td className="py-3 capitalize text-dim">{c.channel}</td>
                  <td className="py-3"><Badge tone={c.status}>{t(locale, `status.${c.status}`)}</Badge></td>
                  <td className="py-3 text-right tnum">{formatMoney(c.spend)}</td>
                  <td className="py-3 text-right tnum">{formatMoney(c.revenue)}</td>
                  <td className={`py-3 text-right tnum font-medium ${c.roas >= 4 ? "text-pos" : c.roas >= 3 ? "text-ink" : "text-neg"}`}>{c.roas}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
