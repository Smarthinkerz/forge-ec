"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { startCheckout } from "@/app/(app)/settings/actions";
import { PLANS, getPlan, displayPrice, CURRENCIES, type PlanId, type Resource } from "@/lib/billing/plans";
import type { Usage } from "@/lib/billing/entitlements";
import { Check, Loader2, Zap } from "lucide-react";

const METER_KEYS: { key: Resource; labelKey: string }[] = [
  { key: "stores", labelKey: "billing.stores" }, { key: "campaigns", labelKey: "billing.campaigns" },
  { key: "aiCredits", labelKey: "billing.aiCredits" }, { key: "seats", labelKey: "billing.seats" },
];

export function BillingClient({ plan, usage, isReal }: { plan: PlanId; usage: Usage; isReal: boolean }) {
  const t = useT();
  const current = getPlan(plan);
  const [currency, setCurrency] = useState("USD");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [localPlan, setLocalPlan] = useState<PlanId>(plan);

  function upgrade(target: PlanId) {
    setStatus(null);
    start(async () => {
      const r = await startCheckout(target, currency);
      if (r.ok && r.url) { window.location.href = r.url; return; }
      if (r.ok && r.simulated) { setLocalPlan(target); setStatus(`${t("billing.sandboxPrefix")}${getPlan(target).name}${t("billing.sandboxSuffix")}`); return; }
      setStatus(!r.ok ? r.error : t("billing.checkoutUnavailable"));
    });
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t("billing.title")}</h1>
          <Badge tone={isReal ? "active" : "default"}>{isReal ? t("agents.liveData") : t("agents.sampleData")}</Badge>
        </div>
        <p className="text-dim text-sm mt-1">{t("billing.subtitle")}</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <div className="text-sm text-dim">{t("billing.currentPlan")}</div>
            <div className="text-xl font-semibold">{getPlan(localPlan).name}</div>
          </div>
          <div className="text-sm text-dim">{displayPrice(getPlan(localPlan), currency)}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METER_KEYS.map((m) => {
            const used = usage[m.key]; const limit = getPlan(localPlan).limits[m.key];
            const pct = limit === Infinity ? 6 : Math.min(100, Math.round((used / limit) * 100));
            const over = limit !== Infinity && used >= limit;
            return (
              <div key={m.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-dim">{t(m.labelKey)}</span>
                  <span className={`tnum ${over ? "text-neg" : ""}`}>{used}{limit === Infinity ? "" : ` / ${limit}`}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className={`h-full ${over ? "bg-neg" : "bg-forge"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {status && <div className="text-sm rounded-xl bg-forge/10 text-forge border border-forge/20 px-4 py-3">{status}</div>}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-medium">{t("billing.plans")}</h2>
        <label className="text-xs text-dim">{t("billing.currency")}
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="ms-2 rounded-lg bg-surface-2 border border-line text-sm px-2 py-1 outline-none">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const isCurrent = p.id === localPlan;
          return (
            <Card key={p.id} className={`p-5 flex flex-col ${p.id === "growth" ? "border-forge" : ""}`}>
              {p.id === "growth" && <span className="text-[10px] uppercase tracking-wide text-forge mb-1">{t("billing.mostPopular")}</span>}
              <div className="font-semibold">{p.name}</div>
              <div className="text-2xl font-semibold tnum my-2">{displayPrice(p, currency)}</div>
              <ul className="space-y-1.5 text-xs text-dim flex-1 mt-2">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-3.5 w-3.5 text-pos shrink-0 mt-0.5" />{f}</li>)}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <Button variant="ghost" className="w-full">{t("billing.currentPlan")}</Button>
                ) : p.id === "enterprise" ? (
                  <Button variant="ghost" href="/" className="w-full">{t("billing.contactSales")}</Button>
                ) : (
                  <Button className="w-full" onClick={() => upgrade(p.id)}>
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} {t("billing.upgrade")}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
