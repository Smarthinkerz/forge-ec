"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { runAgentAction } from "@/app/(app)/agents/actions";
import type { AutonomyLevel, AgentRun, DecidedAction, Risk } from "@/lib/agents/types";
import { Bot, Loader2, Pause, TrendingUp, TrendingDown, Shuffle, AlertTriangle, Check, X, ShieldCheck } from "lucide-react";

const LEVELS: { id: AutonomyLevel; labelKey: string; descKey: string }[] = [
  { id: "suggest", labelKey: "agents.levelSuggest", descKey: "agents.levelSuggestDesc" },
  { id: "supervised", labelKey: "agents.levelSupervised", descKey: "agents.levelSupervisedDesc" },
  { id: "autonomous", labelKey: "agents.levelAutonomous", descKey: "agents.levelAutonomousDesc" },
];
const riskTone: Record<Risk, string> = { none: "default", low: "active", medium: "draft", high: "error" };
const icons = { pause: Pause, scale_up: TrendingUp, scale_down: TrendingDown, reallocate: Shuffle, alert: AlertTriangle };

export function AgentsClient() {
  const t = useT();
  const [level, setLevel] = useState<AutonomyLevel>("supervised");
  const [pending, start] = useTransition();
  const [run, setRun] = useState<AgentRun | null>(null);
  const [isReal, setIsReal] = useState(false);
  const [approved, setApproved] = useState<DecidedAction[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  function go() {
    setApproved([]); setDismissed(new Set());
    start(async () => {
      const r = await runAgentAction(level);
      setRun(r.run); setIsReal(r.isReal);
    });
  }
  const key = (a: DecidedAction) => `${a.type}:${a.campaignId}`;
  const pendingProposed = run?.proposed.filter((a) => !dismissed.has(key(a)) && !approved.some((x) => key(x) === key(a))) ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t("agents.title")}</h1>
          {run && <Badge tone={isReal ? "active" : "default"}>{isReal ? t("agents.liveData") : t("agents.sampleData")}</Badge>}
        </div>
        <p className="text-dim text-sm mt-1">{t("agents.subtitle")}</p>
      </div>

      <Card className="p-5">
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {LEVELS.map((l) => (
            <button key={l.id} onClick={() => setLevel(l.id)}
              className={`text-left rounded-xl border p-3 transition-colors ${level === l.id ? "border-forge bg-forge/5" : "border-line hover:bg-surface-2"}`}>
              <div className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {t(l.labelKey)}</div>
              <div className="text-xs text-dim mt-1">{t(l.descKey)}</div>
            </button>
          ))}
        </div>
        <Button onClick={go}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />} {t("agents.runAgent")}</Button>
      </Card>

      {run && (
        <>
          <p className="text-sm text-dim">{run.summary}</p>

          {pendingProposed.length > 0 && (
            <Card className="p-5">
              <h2 className="font-medium mb-3">{t("agents.awaitingApproval")}</h2>
              <div className="space-y-2">
                {pendingProposed.map((a) => (
                  <ActionRow key={key(a)} a={a}
                    onApprove={() => setApproved((p) => [...p, { ...a, decision: "applied" }])}
                    onDismiss={() => setDismissed((p) => new Set(p).add(key(a)))} />
                ))}
              </div>
            </Card>
          )}

          {(run.applied.length > 0 || approved.length > 0) && (
            <Card className="p-5">
              <h2 className="font-medium mb-3">{t("agents.applied")} {approved.length > 0 && <span className="text-dim text-sm">({run.applied.length} {t("agents.auto")} + {approved.length} {t("agents.approvedWord")})</span>}</h2>
              <div className="space-y-2">
                {[...run.applied, ...approved].map((a, i) => <ActionRow key={`${key(a)}-${i}`} a={a} applied />)}
              </div>
            </Card>
          )}

          {run.skipped.length > 0 && (
            <Card className="p-5">
              <h2 className="font-medium mb-3">{t("agents.skipped")}</h2>
              <div className="space-y-2">
                {run.skipped.map((a, i) => <ActionRow key={`${key(a)}-${i}`} a={a} />)}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ActionRow({ a, applied, onApprove, onDismiss }: { a: DecidedAction; applied?: boolean; onApprove?: () => void; onDismiss?: () => void }) {
  const t = useT();
  const Icon = icons[a.type];
  return (
    <div className="rounded-xl border border-line p-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className="h-4 w-4 mt-0.5 text-dim shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{t(`action.${a.type}`)}</span>
            <span className="text-xs text-dim">{a.campaignName}</span>
            <Badge tone={riskTone[a.risk]}>{t(`risk.${a.risk}`)} {t("agents.riskWord")}</Badge>
            <span className="text-xs text-dim">{t("agents.conf")} {Math.round(a.confidence * 100)}%</span>
          </div>
          <p className="text-xs text-dim mt-1">{a.rationale}</p>
          {a.fromBudget !== undefined && a.toBudget !== undefined && (
            <p className="text-xs mt-1">{t("agents.budget")} <span className="tnum">${a.fromBudget}</span> → <span className="tnum text-forge">${a.toBudget}</span>{t("agents.perDay")}</p>
          )}
          {a.notes && a.notes.length > 0 && <p className="text-xs text-dim mt-1">⚠ {a.notes.join(" · ")}</p>}
          {a.skipReason && <p className="text-xs text-neg mt-1">{t("agents.skippedColon")} {a.skipReason}</p>}
          <p className="text-[10px] uppercase tracking-wide text-dim/70 mt-1">{t("agents.rule")} {a.rule}</p>
        </div>
      </div>
      {onApprove ? (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onApprove} title={t("agents.approve")} className="rounded-lg p-1.5 text-pos hover:bg-pos/10"><Check className="h-4 w-4" /></button>
          <button onClick={onDismiss} title={t("agents.dismiss")} className="rounded-lg p-1.5 text-dim hover:bg-surface-2"><X className="h-4 w-4" /></button>
        </div>
      ) : applied ? <Check className="h-4 w-4 text-pos shrink-0" /> : null}
    </div>
  );
}
