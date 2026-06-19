"use client";

import { useState, useEffect, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import {
  connectStore, optimizeProduct, listSavedStores, resyncStore, deleteStore,
  type ConnectResult, type SavedStore,
} from "@/app/(app)/stores/actions";
import { CREDENTIAL_FIELDS, PLATFORMS } from "@/lib/stores/registry";
import type { Platform, AdapterProduct, StoreCredentials } from "@/lib/stores/types";
import { formatMoney } from "@/lib/utils/format";
import { Store, Sparkles, CheckCircle2, AlertTriangle, Loader2, KeyRound, RefreshCw, Trash2, X } from "lucide-react";

const CHANNELS = ["google", "meta", "tiktok", "pinterest", "amazon"];
const sevTone: Record<string, string> = { high: "error", medium: "draft", low: "default" };

export function StoresClient() {
  const t = useT();
  const [selected, setSelected] = useState<Platform | null>(null);
  const [creds, setCreds] = useState<StoreCredentials>({});
  const [saveCreds, setSaveCreds] = useState(true);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ConnectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedStore[]>([]);

  useEffect(() => { listSavedStores().then(setSaved).catch(() => {}); }, []);
  function refreshSaved() { listSavedStores().then(setSaved).catch(() => {}); }

  function pick(p: Platform) {
    setSelected(p); setCreds({}); setError(null); setResult(null);
    if (p === "custom") connect(p, "sandbox"); // custom has no creds → demo
  }

  function connect(platform: Platform, mode: "live" | "sandbox") {
    setError(null);
    start(async () => {
      const out = await connectStore(platform, creds, { mode, save: saveCreds });
      if (out.ok) { setResult(out.result); setSelected(null); refreshSaved(); }
      else setError(out.error);
    });
  }

  const fields = selected ? CREDENTIAL_FIELDS[selected] : [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("stores.title")}</h1>
        <p className="text-dim text-sm mt-1">{t("stores.subtitle")}</p>
      </div>

      {/* Platform picker */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {PLATFORMS.map((p) => (
          <button key={p.id} onClick={() => pick(p.id)} disabled={pending}
            className={`rounded-xl border bg-surface p-4 text-center transition-colors disabled:opacity-50 ${selected === p.id ? "border-forge bg-surface-2" : "border-line hover:border-forge hover:bg-surface-2"}`}>
            <Store className="h-5 w-5 mx-auto mb-2 text-dim" />
            <div className="text-sm font-medium">{p.label}</div>
          </button>
        ))}
      </div>

      {/* Credentials form */}
      {selected && fields.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium flex items-center gap-2"><KeyRound className="h-4 w-4 text-forge" /> {t("stores.enterCreds")}</h2>
            <button onClick={() => { setSelected(null); setError(null); }} className="text-dim hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <label key={f.key} className="text-xs text-dim block">
                {f.label}
                <input
                  type={f.secret ? "password" : "text"}
                  value={creds[f.key] ?? ""}
                  onChange={(e) => setCreds((c) => ({ ...c, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  autoComplete="off"
                  className="block mt-1 w-full rounded-lg bg-surface-2 border border-line px-3 py-2 text-sm outline-none focus:border-forge"
                />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 mt-4 text-xs text-dim">
            <input type="checkbox" checked={saveCreds} onChange={(e) => setSaveCreds(e.target.checked)} className="accent-forge" />
            {t("stores.saveCreds")}
          </label>
          {error && <p className="mt-3 text-sm text-neg">{t("stores.connectFailed")}: {error}</p>}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Button onClick={() => connect(selected, "live")} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {t("stores.connect")}
            </Button>
            <Button variant="ghost" onClick={() => connect(selected, "sandbox")} disabled={pending}>{t("stores.useSample")}</Button>
          </div>
        </Card>
      )}

      {error && !selected && <p className="text-sm text-neg">{t("stores.connectFailed")}: {error}</p>}

      {/* Saved stores */}
      {saved.length > 0 && <SavedStores saved={saved} onChange={refreshSaved} onResult={setResult} />}

      {/* Connect result */}
      {result && (
        <>
          <Card className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-pos" />
                <div>
                  <div className="font-medium capitalize flex items-center gap-2">
                    {result.store.name}
                    <Badge tone={result.mode === "live" ? "active" : "default"}>{result.mode === "live" ? t("stores.liveBadge") : t("stores.sandboxBadge")}</Badge>
                  </div>
                  <div className="text-xs text-dim">{result.store.domain} · {result.products.length} {t("stores.productsSynced")}</div>
                </div>
              </div>
              <Badge tone={result.persisted ? "active" : "default"}>{result.persisted ? t("stores.savedToOrg") : t("stores.sandboxNotPersisted")}</Badge>
            </div>
            {result.mode === "live" && (
              <p className={`text-xs mt-3 ${result.credentialsSaved ? "text-pos" : "text-dim"}`}>
                {result.credentialsSaved ? t("stores.credsSaved") : t("stores.credsNotSaved")}
              </p>
            )}
          </Card>
          <AuditPanel audit={result.audit} />
          <ProductsPanel products={result.products} currency={result.store.currency} />
        </>
      )}
    </div>
  );
}

function SavedStores({ saved, onChange, onResult }: { saved: SavedStore[]; onChange: () => void; onResult: (r: ConnectResult) => void }) {
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);

  async function doResync(id: string) {
    setBusy(id);
    const out = await resyncStore(id);
    setBusy(null);
    if (out.ok) { onResult(out.result); onChange(); }
  }
  async function doDelete(id: string) {
    setBusy(id);
    await deleteStore(id);
    setBusy(null);
    onChange();
  }

  return (
    <Card className="p-5">
      <h2 className="font-medium mb-4">{t("stores.savedStores")}</h2>
      <div className="space-y-2">
        {saved.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate flex items-center gap-2">
                {s.name} <span className="text-xs text-dim capitalize">{s.platform}</span>
              </div>
              <div className="text-xs text-dim">
                {t("stores.lastSynced")}: {s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleString() : t("stores.never")}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {s.hasCredentials && (
                <Button variant="ghost" className="text-xs py-1.5" onClick={() => doResync(s.id)} disabled={busy === s.id}>
                  {busy === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} {t("stores.resync")}
                </Button>
              )}
              <button onClick={() => doDelete(s.id)} disabled={busy === s.id} title={t("stores.remove")} className="rounded-lg p-1.5 text-dim hover:bg-surface-2 hover:text-neg">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AuditPanel({ audit }: { audit: ConnectResult["audit"] }) {
  const t = useT();
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">{t("stores.audit")}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dim">{t("stores.conversionReadiness")}</span>
          <span className={`tnum text-lg font-semibold ${audit.score >= 75 ? "text-pos" : audit.score >= 55 ? "text-ink" : "text-neg"}`}>{audit.score}</span>
        </div>
      </div>
      <p className="text-sm text-dim mb-4">{audit.summary}</p>
      <div className="space-y-2">
        {audit.findings.map((f, i) => (
          <div key={i} className="flex gap-3 items-start border-t border-line pt-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-dim shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{f.area}</span>
                <Badge tone={sevTone[f.severity]}>{t(`sev.${f.severity}`)}</Badge>
              </div>
              <p className="text-xs text-dim mt-1">{f.finding}</p>
              <p className="text-xs text-forge mt-1">→ {f.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProductsPanel({ products, currency }: { products: AdapterProduct[]; currency: string }) {
  const t = useT();
  return (
    <Card className="p-5">
      <h2 className="font-medium mb-4">{t("stores.syncedCatalog")}</h2>
      <div className="space-y-2">
        {products.map((p) => <ProductRow key={p.externalId} product={p} currency={currency} />)}
      </div>
    </Card>
  );
}

function ProductRow({ product, currency }: { product: AdapterProduct; currency: string }) {
  const t = useT();
  const [channel, setChannel] = useState("meta");
  const [pending, start] = useTransition();
  const [copy, setCopy] = useState<{ title: string; description: string; bullets: string[] } | null>(null);
  function optimize() { start(async () => setCopy(await optimizeProduct(product, channel))); }
  return (
    <div className="border-t border-line pt-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{product.title}</div>
          <div className="text-xs text-dim truncate">{product.description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="tnum text-sm">{formatMoney(product.price, currency)}</span>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-lg bg-surface-2 border border-line text-xs px-2 py-1.5 outline-none">
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button variant="ghost" onClick={optimize} className="text-xs py-1.5">
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} {t("stores.optimize")}
          </Button>
        </div>
      </div>
      {copy && (
        <div className="mt-2 rounded-lg bg-surface-2 p-3 text-xs">
          <div className="font-medium text-forge">{copy.title}</div>
          <p className="text-dim mt-1">{copy.description}</p>
          <ul className="mt-2 grid sm:grid-cols-2 gap-1 text-dim">
            {copy.bullets.map((b, i) => <li key={i}>• {b}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
