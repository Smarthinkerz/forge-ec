"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/client";
import { attribute, type Journey, type AttributionModel } from "@/lib/analytics-engine/attribution";
import type { ForecastPoint } from "@/lib/analytics-engine/forecast";
import type { Insight } from "@/lib/analytics-engine/insights";
import { formatMoney } from "@/lib/utils/format";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const MODEL_IDS: AttributionModel[] = ["last", "first", "linear", "position", "time_decay"];

export function AnalyticsClient({
  journeys, forecast, ltv, cac, ltvCac, ga4, insights, isReal,
}: {
  journeys: Journey[]; forecast: ForecastPoint[]; ltv: number; cac: number; ltvCac: number;
  ga4: { sessions: number; engagementRate: number; source: string }; insights: Insight[]; isReal: boolean;
}) {
  const t = useT();
  const [model, setModel] = useState<AttributionModel>("position");
  const attribution = useMemo(() => attribute(journeys, model), [journeys, model]);
  const maxCredit = Math.max(...attribution.channels.map((c) => c.creditedRevenue), 1);
  const firstProjected = forecast.find((f) => f.projected)?.date;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t("analytics.title")}</h1>
          <Badge tone={isReal ? "active" : "default"}>{isReal ? t("agents.liveData") : t("agents.sampleData")}</Badge>
        </div>
        <p className="text-dim text-sm mt-1">{isReal ? t("analytics.subtitleReal") : t("analytics.subtitleSample")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t("analytics.predictedLtv")} value={formatMoney(ltv)} />
        <Kpi label={t("analytics.cac")} value={formatMoney(cac)} />
        <Kpi label={t("analytics.ltvCac")} value={`${ltvCac}x`} accent={ltvCac >= 3} />
        <Kpi label={t("analytics.ga4Engagement")} value={`${Math.round(ga4.engagementRate * 100)}%`} sub={`${ga4.sessions.toLocaleString()} ${t("analytics.sessions")} · ${ga4.source}`} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-medium">{t("analytics.forecastTitle")}</h2>
          <span className="text-xs text-dim">{t("analytics.forecastLegend")}</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(139 147 167)" }} tickFormatter={(d) => String(d).slice(5)} minTickGap={28} />
              <YAxis tick={{ fontSize: 11, fill: "rgb(139 147 167)" }} tickFormatter={(v) => `${v}x`} />
              <Tooltip contentStyle={{ background: "rgb(18 22 32)", border: "1px solid rgb(38 44 58)", borderRadius: 12, fontSize: 12 }} />
              {firstProjected && <ReferenceLine x={firstProjected} stroke="rgb(255 107 44 / 0.5)" strokeDasharray="4 4" />}
              <Line type="monotone" dataKey="roas" stroke="rgb(255 107 44)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-medium">{t("analytics.attribution")}</h2>
            <select value={model} onChange={(e) => setModel(e.target.value as AttributionModel)}
              className="rounded-lg bg-surface-2 border border-line text-sm px-3 py-1.5 outline-none">
              {MODEL_IDS.map((m) => <option key={m} value={m}>{t(`analytics.model.${m}`)}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {attribution.channels.map((c) => (
              <div key={c.channel}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{c.channel}</span>
                  <span className="tnum text-dim">{formatMoney(c.creditedRevenue)} · {c.creditedConversions} {t("analytics.conv")}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-forge" style={{ width: `${(c.creditedRevenue / maxCredit) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-dim mt-4">{t("analytics.totalAttributedPrefix")} {formatMoney(attribution.totalRevenue)} · {journeys.filter((j) => j.converted).length} {t("analytics.conversions")}</p>
        </Card>

        <Card className="p-5">
          <h2 className="font-medium mb-4">{t("analytics.insightsTitle")}</h2>
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div key={i} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-2">
                  {ins.direction === "up" ? <ArrowUpRight className="h-4 w-4 text-pos" /> : ins.direction === "down" ? <ArrowDownRight className="h-4 w-4 text-neg" /> : <Minus className="h-4 w-4 text-dim" />}
                  <span className="text-sm font-medium">{ins.title}</span>
                  <Badge tone={ins.severity === "high" ? "error" : ins.severity === "medium" ? "draft" : "default"}>{t(`sev.${ins.severity}`)}</Badge>
                </div>
                <p className="text-xs text-dim mt-1">{ins.detail}</p>
                <p className="text-xs text-dim mt-1"><span className="text-dim/80">{t("analytics.why")}</span> {ins.reasoning}</p>
                <p className="text-xs text-forge mt-1">→ {ins.action}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-dim mb-2">{label}</div>
      <div className={`text-2xl font-semibold tnum ${accent ? "text-pos" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-dim mt-1">{sub}</div>}
    </Card>
  );
}
