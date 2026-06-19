"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { draftCampaignAction, launchCampaignAction } from "@/app/(app)/campaigns/actions";
import { allocateBudget, type Allocation } from "@/lib/campaigns/allocate";
import type { AdChannel, CampaignDraft } from "@/lib/channels/types";
import type { LaunchedCampaign } from "@/lib/campaigns/service";
import { formatMoney, formatCompact } from "@/lib/utils/format";
import { Sparkles, Rocket, Loader2, Wand2, Pause, Play, TrendingUp } from "lucide-react";

const CHANNELS: { id: AdChannel; label: string }[] = [
  { id: "google", label: "Google Ads" }, { id: "meta", label: "Meta" }, { id: "tiktok", label: "TikTok" },
  { id: "pinterest", label: "Pinterest" }, { id: "amazon", label: "Amazon" },
];

type LiveCampaign = LaunchedCampaign & { persisted?: boolean; paused?: boolean };

export function CampaignsClient() {
  const t = useT();
  const [text, setText] = useState(t("campaigns.defaultPrompt"));
  const [channel, setChannel] = useState<AdChannel>("meta");
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [campaigns, setCampaigns] = useState<LiveCampaign[]>([]);
  const [drafting, startDraft] = useTransition();
  const [launching, startLaunch] = useTransition();

  function doDraft() {
    setDraft(null);
    startDraft(async () => setDraft(await draftCampaignAction(text, channel)));
  }
  function doLaunch() {
    if (!draft) return;
    startLaunch(async () => {
      const c = await launchCampaignAction(draft);
      setCampaigns((prev) => [c, ...prev]);
      setDraft(null);
    });
  }
  function togglePause(id: string) {
    setCampaigns((prev) => prev.map((c) => (c.externalId === id ? { ...c, paused: !c.paused } : c)));
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("campaigns.title")}</h1>
        <p className="text-dim text-sm mt-1">{t("campaigns.subtitle")}</p>
      </div>

      {/* NL builder */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium"><Wand2 className="h-4 w-4 text-forge" /> {t("campaigns.nlBuilder")}</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
          className="w-full rounded-xl bg-surface-2 border border-line p-3 text-sm outline-none focus:border-forge mb-3" />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={channel} onChange={(e) => setChannel(e.target.value as AdChannel)}
            className="rounded-lg bg-surface-2 border border-line text-sm px-3 py-2 outline-none">
            {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <Button onClick={doDraft}>{drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {t("campaigns.draftWithAi")}</Button>
        </div>

        {draft && (
          <div className="mt-4 rounded-xl border border-forge/30 bg-forge/5 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium">{draft.name}</div>
                <div className="text-xs text-dim mt-0.5 capitalize">{draft.channel} · {draft.objective} · {draft.audience}</div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-dim">{t("campaigns.dailyBudget")}
                  <input type="number" value={draft.budgetDaily} min={1}
                    onChange={(e) => setDraft({ ...draft, budgetDaily: Number(e.target.value) })}
                    className="ms-2 w-20 rounded-lg bg-surface-2 border border-line px-2 py-1 text-sm tnum outline-none" />
                </label>
                <Button onClick={doLaunch}>{launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} {t("campaigns.launchSandbox")}</Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {campaigns.length > 0 && <BudgetAllocator campaigns={campaigns} />}

      {/* Launched campaigns */}
      {campaigns.length > 0 && (
        <Card className="p-5">
          <h2 className="font-medium mb-4">{t("campaigns.launched")}</h2>
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.externalId} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.draft.name}</span>
                    <Badge tone={c.paused ? "paused" : "active"}>{c.paused ? t("status.paused") : t("status.active")}</Badge>
                    <span className="text-xs text-dim capitalize">{c.draft.channel}</span>
                    {c.persisted && <Badge tone="active">{t("campaigns.saved")}</Badge>}
                  </div>
                  <button onClick={() => togglePause(c.externalId)} className="text-xs text-dim hover:text-ink inline-flex items-center gap-1">
                    {c.paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />} {c.paused ? t("campaigns.resume") : t("campaigns.pause")}
                  </button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  <Metric label={t("metric.impr")} value={formatCompact(c.result.impressions)} />
                  <Metric label={t("metric.clicks")} value={formatCompact(c.result.clicks)} />
                  <Metric label={t("metric.spend")} value={formatMoney(c.result.spend, c.draft.currency)} />
                  <Metric label={t("metric.conv")} value={formatCompact(c.result.conversions)} />
                  <Metric label={t("metric.revenue")} value={formatMoney(c.result.revenue, c.draft.currency)} />
                  <Metric label={t("metric.roas")} value={`${c.result.roas}x`} highlight={c.result.roas >= 3} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className={`tnum text-sm font-semibold ${highlight ? "text-pos" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-dim mt-0.5">{label}</div>
    </div>
  );
}

function BudgetAllocator({ campaigns }: { campaigns: LiveCampaign[] }) {
  const t = useT();
  const totalCurrent = campaigns.reduce((s, c) => s + c.draft.budgetDaily, 0);
  const [total, setTotal] = useState(totalCurrent);
  const [alloc, setAlloc] = useState<Allocation[] | null>(null);

  function recommend() {
    setAlloc(allocateBudget(total, campaigns.map((c) => ({
      id: c.externalId, name: c.draft.name, roas: c.result.roas, currentDaily: c.draft.budgetDaily,
    }))));
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-forge" /> {t("campaigns.smartBudget")}</div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-dim">{t("campaigns.totalDaily")}
            <input type="number" value={total} min={0} onChange={(e) => setTotal(Number(e.target.value))}
              className="ms-2 w-24 rounded-lg bg-surface-2 border border-line px-2 py-1 text-sm tnum outline-none" />
          </label>
          <Button variant="ghost" onClick={recommend} className="text-xs py-1.5">{t("campaigns.recommendSplit")}</Button>
        </div>
      </div>
      <p className="text-xs text-dim mb-3">{t("campaigns.allocNote")}</p>
      {alloc && (
        <div className="space-y-1.5">
          {alloc.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm border-t border-line pt-2">
              <span className="truncate pe-4">{a.name}</span>
              <span className="flex items-center gap-3">
                <span className="tnum">{formatMoney(a.recommendedDaily)}</span>
                <span className={`tnum text-xs ${a.delta > 0 ? "text-pos" : a.delta < 0 ? "text-neg" : "text-dim"}`}>
                  {a.delta > 0 ? "+" : ""}{a.delta}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
