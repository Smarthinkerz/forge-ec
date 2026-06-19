"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { simulateFlowAction, generateLandingAction } from "@/app/(app)/orchestration/actions";
import { FLOW_TEMPLATES } from "@/lib/funnel/flows";
import { personalize, type Segment } from "@/lib/funnel/personalize";
import type { MessagingProvider } from "@/lib/messaging/types";
import type { FlowProjection, FlowTemplate } from "@/lib/funnel/flows";
import type { LandingResult } from "@/lib/funnel/landing";
import { formatMoney, formatCompact } from "@/lib/utils/format";
import { Mail, MessageSquare, Loader2, Workflow, UserCircle, Layout, Sparkles } from "lucide-react";

const PROVIDERS: { id: MessagingProvider; label: string }[] = [
  { id: "klaviyo", label: "Klaviyo" }, { id: "mailchimp", label: "Mailchimp" }, { id: "twilio", label: "Twilio (SMS)" },
];
const SEGMENT_IDS: Segment[] = ["new", "returning", "cart_abandoner", "vip"];

export function OrchestrationClient() {
  const t = useT();
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("orch.title")}</h1>
        <p className="text-dim text-sm mt-1">{t("orch.subtitle")}</p>
      </div>
      <FlowsPanel />
      <div className="grid lg:grid-cols-2 gap-5">
        <PersonalizationPanel />
        <LandingPanel />
      </div>
    </div>
  );
}

function FlowsPanel() {
  const t = useT();
  const [flowId, setFlowId] = useState("abandoned_cart");
  const [provider, setProvider] = useState<MessagingProvider>("klaviyo");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ template: FlowTemplate; projection: FlowProjection; provider: string } | null>(null);

  function run() { start(async () => setResult(await simulateFlowAction(flowId, provider))); }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium"><Workflow className="h-4 w-4 text-forge" /> {t("orch.lifecycleFlows")}</div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-xs text-dim">{t("orch.flow")}
          <select value={flowId} onChange={(e) => setFlowId(e.target.value)} className="block mt-1 rounded-lg bg-surface-2 border border-line text-sm px-3 py-2 outline-none">
            {FLOW_TEMPLATES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-dim">{t("orch.provider")}
          <select value={provider} onChange={(e) => setProvider(e.target.value as MessagingProvider)} className="block mt-1 rounded-lg bg-surface-2 border border-line text-sm px-3 py-2 outline-none">
            {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <Button onClick={run}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Workflow className="h-4 w-4" />} {t("orch.simulateFlow")}</Button>
      </div>

      {result && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-sm text-dim">{t("orch.trigger")} {result.template.trigger} · {formatCompact(result.projection.enrolled)} {t("orch.enrolled")} · {t("orch.via")} {result.provider}</span>
            <span className="text-sm">{t("orch.projectedRevenue")} <span className="text-forge font-medium">{formatMoney(result.projection.revenue)}</span> ({result.projection.conversions} {t("orch.conv")})</span>
          </div>
          <div className="space-y-2">
            {result.projection.steps.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-t border-line pt-2">
                <span className="flex items-center gap-2">
                  {s.kind === "email" ? <Mail className="h-3.5 w-3.5 text-dim" /> : <MessageSquare className="h-3.5 w-3.5 text-dim" />}
                  {s.label}
                </span>
                <span className="text-dim tnum text-xs">{formatCompact(s.sent)} {t("orch.sent")} · {formatCompact(s.opens)} {t("orch.opens")} · {formatCompact(s.clicks)} {t("orch.clicks")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function PersonalizationPanel() {
  const t = useT();
  const [segment, setSegment] = useState<Segment>("cart_abandoner");
  const p = personalize(segment);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium"><UserCircle className="h-4 w-4 text-forge" /> {t("orch.personalization")}</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENT_IDS.map((s) => (
          <button key={s} onClick={() => setSegment(s)}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors ${segment === s ? "bg-forge text-white" : "bg-surface-2 text-dim hover:text-ink"}`}>{t(`orch.seg.${s}`)}</button>
        ))}
      </div>
      <div className="rounded-xl border border-line overflow-hidden">
        <div className="bg-surface-2 p-4 text-center">
          <div className="text-xs text-dim mb-1">{t("orch.bannerPreview")}</div>
          <div className="font-medium">{p.headline}</div>
          <div className="text-xs text-forge mt-1">{p.offer}</div>
          <span className="inline-block mt-3 rounded-full bg-forge px-4 py-1.5 text-xs text-white">{p.cta}</span>
        </div>
      </div>
      <p className="text-xs text-dim mt-3"><span className="text-ink">{t("analytics.why")}</span> {p.reasoning}</p>
    </Card>
  );
}

function LandingPanel() {
  const t = useT();
  const PRODUCTS = [
    { title: "Merino Wool Crew Sweater", description: "Soft, breathable everyday knit." },
    { title: "Trailrunner GTX Shoes", description: "All-terrain waterproof running shoe." },
  ];
  const [pi, setPi] = useState(0);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<LandingResult | null>(null);

  function gen() { const p = PRODUCTS[pi]; start(async () => setResult(await generateLandingAction(p.title, p.description))); }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium"><Layout className="h-4 w-4 text-forge" /> {t("orch.landingTitle")}</div>
      <div className="flex items-end gap-3 mb-4">
        <label className="text-xs text-dim">{t("creative.product")}
          <select value={pi} onChange={(e) => setPi(Number(e.target.value))} className="block mt-1 rounded-lg bg-surface-2 border border-line text-sm px-3 py-2 outline-none">
            {PRODUCTS.map((p, i) => <option key={p.title} value={i}>{p.title}</option>)}
          </select>
        </label>
        <Button onClick={gen}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {t("orch.generate")}</Button>
      </div>
      {result && (
        <div className="space-y-3">
          {result.variants.map((v, i) => (
            <div key={i} className={`rounded-xl border p-3 ${i === result.winnerIndex ? "border-forge bg-forge/5" : "border-line"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dim">{t("creative.variant")} {String.fromCharCode(65 + i)}{i === result.winnerIndex ? ` · ${t("creative.winner")}` : ""}</span>
                <Badge tone={v.prediction.score >= 70 ? "active" : v.prediction.score >= 50 ? "draft" : "paused"}>{t("orch.score")} {v.prediction.score}</Badge>
              </div>
              <div className="text-sm font-medium mt-1">{v.headline}</div>
              <p className="text-xs text-dim mt-1">{v.subhead}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
