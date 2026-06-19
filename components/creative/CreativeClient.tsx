"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { generateCreativeAction } from "@/app/(app)/creative/actions";
import { runABTest } from "@/lib/creative/abtest";
import type { Creative, CreativeFormat, PerformancePrediction, ABResult } from "@/lib/creative/types";
import { Sparkles, Loader2, FlaskConical } from "lucide-react";

type GenCreative = Creative & { prediction: PerformancePrediction };

const PRODUCTS = [
  { title: "Merino Wool Crew Sweater", description: "Soft, breathable everyday knit.", price: "$89" },
  { title: "Trailrunner GTX Shoes", description: "All-terrain waterproof running shoe.", price: "$145" },
  { title: "Ceramic Pour-Over Set", description: "Single-origin brewing, café at home.", price: "$54" },
];
const CHANNELS = ["meta", "google", "tiktok", "pinterest", "amazon"];
const FORMATS: CreativeFormat[] = ["static", "carousel", "video", "ugc"];

export function CreativeClient() {
  const t = useT();
  const [pi, setPi] = useState(0);
  const [channel, setChannel] = useState("meta");
  const [format, setFormat] = useState<CreativeFormat>("static");
  const [pending, start] = useTransition();
  const [creatives, setCreatives] = useState<GenCreative[]>([]);
  const [ab, setAb] = useState<ABResult | null>(null);

  function generate() {
    const p = PRODUCTS[pi];
    start(async () => {
      const c = await generateCreativeAction({ productTitle: p.title, productDescription: p.description, price: p.price, channel, format });
      setCreatives((prev) => [c, ...prev].slice(0, 4));
      setAb(null);
    });
  }

  function runTest() {
    if (creatives.length < 2) return;
    setAb(runABTest(creatives.slice(0, 3).map((c, i) => ({
      id: c.id, label: `${t("creative.variant")} ${String.fromCharCode(65 + i)}`, copy: c.copy, prediction: c.prediction,
    }))));
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("creative.title")}</h1>
        <p className="text-dim text-sm mt-1">{t("creative.subtitle")}</p>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-dim">{t("creative.product")}
            <select value={pi} onChange={(e) => setPi(Number(e.target.value))} className="block mt-1 rounded-lg bg-surface-2 border border-line text-sm px-3 py-2 outline-none">
              {PRODUCTS.map((p, i) => <option key={p.title} value={i}>{p.title}</option>)}
            </select>
          </label>
          <label className="text-xs text-dim">{t("creative.channel")}
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="block mt-1 rounded-lg bg-surface-2 border border-line text-sm px-3 py-2 outline-none capitalize">
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs text-dim">{t("creative.format")}
            <select value={format} onChange={(e) => setFormat(e.target.value as CreativeFormat)} className="block mt-1 rounded-lg bg-surface-2 border border-line text-sm px-3 py-2 outline-none capitalize">
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <Button onClick={generate}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {t("creative.generate")}</Button>
          {creatives.length >= 2 && (
            <Button variant="ghost" onClick={runTest}><FlaskConical className="h-4 w-4" /> {t("creative.runAb")}</Button>
          )}
        </div>
      </Card>

      {ab && <ABPanel ab={ab} />}

      {creatives.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5">
          {creatives.map((c) => <CreativeCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}

function CreativeCard({ c }: { c: GenCreative }) {
  const t = useT();
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium capitalize">{c.channel} · {c.format}</span>
        <Badge tone={c.prediction.score >= 70 ? "active" : c.prediction.score >= 50 ? "draft" : "paused"}>
          {t("creative.predicted")} {c.prediction.score}
        </Badge>
      </div>
      {c.previewSvg ? (
        <div className="rounded-xl overflow-hidden border border-line mb-3" dangerouslySetInnerHTML={{ __html: c.previewSvg }} />
      ) : c.assetUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.assetUrl} alt={c.copy.headline} className="rounded-xl border border-line mb-3 w-full" />
      ) : null}
      <div className="text-sm font-medium">{c.copy.headline}</div>
      <p className="text-xs text-dim mt-1">{c.copy.body}</p>
      <div className="mt-3 pt-3 border-t border-line">
        <div className="text-xs text-dim mb-1">{t("creative.predictedCtr")} <span className="tnum text-ink">{(c.prediction.predictedCtr * 100).toFixed(2)}%</span></div>
        <ul className="text-xs text-dim space-y-0.5">
          {c.prediction.reasoning.slice(0, 4).map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
      </div>
    </Card>
  );
}

function ABPanel({ ab }: { ab: ABResult }) {
  const t = useT();
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium flex items-center gap-2"><FlaskConical className="h-4 w-4 text-forge" /> {t("creative.abResults")}</h2>
        <Badge tone={ab.confidence === "high" ? "active" : ab.confidence === "medium" ? "draft" : "paused"}>{t(`conf.${ab.confidence}`)} {t("creative.confidence")}</Badge>
      </div>
      <table className="w-full text-sm mb-4">
        <thead><tr className="text-dim text-left border-b border-line">
          <th className="font-medium py-2">{t("creative.variant")}</th><th className="font-medium py-2 text-right">{t("metric.impr")}</th>
          <th className="font-medium py-2 text-right">{t("metric.clicks")}</th><th className="font-medium py-2 text-right">{t("metric.conv")}</th>
          <th className="font-medium py-2 text-right">{t("creative.ctr")}</th><th className="font-medium py-2 text-right">{t("creative.cvr")}</th>
        </tr></thead>
        <tbody>
          {ab.variants.map((v) => (
            <tr key={v.id} className={`border-b border-line/60 last:border-0 ${v.id === ab.winnerId ? "text-pos" : ""}`}>
              <td className="py-2">{v.label}{v.id === ab.winnerId ? ` · ${t("creative.winner")}` : ""}</td>
              <td className="py-2 text-right tnum">{v.impressions.toLocaleString()}</td>
              <td className="py-2 text-right tnum">{v.clicks.toLocaleString()}</td>
              <td className="py-2 text-right tnum">{v.conversions.toLocaleString()}</td>
              <td className="py-2 text-right tnum">{(v.ctr * 100).toFixed(2)}%</td>
              <td className="py-2 text-right tnum">{(v.cvr * 100).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm"><span className="text-forge font-medium">+{ab.liftPct}% {t("creative.lift")}</span> <span className="text-dim">{ab.recommendation}</span></p>
    </Card>
  );
}
