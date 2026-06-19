"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { generateKeyAction, saveBrandingAction } from "@/app/(app)/settings/actions";
import { Key, Loader2, Copy, Check, Palette, ExternalLink } from "lucide-react";

export function ApiBrandingClient() {
  return (
    <div className="space-y-6">
      <ApiKeys />
      <Branding />
    </div>
  );
}

function ApiKeys() {
  const t = useT();
  const [pending, start] = useTransition();
  const [keys, setKeys] = useState<{ prefix: string; persisted: boolean }[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function gen() {
    start(async () => {
      const r = await generateKeyAction("API key");
      setFresh(r.key);
      setKeys((p) => [{ prefix: r.prefix, persisted: r.persisted }, ...p]);
    });
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium flex items-center gap-2"><Key className="h-4 w-4 text-forge" /> {t("settings.apiKeys")}</h2>
        <a href="/api-docs" target="_blank" className="text-xs text-dim hover:text-ink inline-flex items-center gap-1">{t("settings.apiDocs")} <ExternalLink className="h-3 w-3" /></a>
      </div>
      <p className="text-xs text-dim mb-3">{t("settings.apiKeyHelpPre")}<code className="text-ink">/api/v1</code>{t("settings.apiKeyHelpPost")}</p>
      <Button onClick={gen}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} {t("settings.generateKey")}</Button>

      {fresh && (
        <div className="mt-3 rounded-xl border border-forge/30 bg-forge/5 p-3">
          <div className="text-xs text-dim mb-1">{t("settings.copyNow")}</div>
          <div className="flex items-center gap-2">
            <code className="text-xs break-all flex-1">{fresh}</code>
            <button onClick={() => { navigator.clipboard?.writeText(fresh); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="rounded-lg p-1.5 text-dim hover:bg-surface-2">{copied ? <Check className="h-4 w-4 text-pos" /> : <Copy className="h-4 w-4" />}</button>
          </div>
        </div>
      )}

      {keys.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {keys.map((k, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-t border-line pt-2">
              <code className="text-xs">{k.prefix}…</code>
              <Badge tone={k.persisted ? "active" : "default"}>{k.persisted ? t("campaigns.saved") : t("settings.sandbox")}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Branding() {
  const t = useT();
  const [name, setName] = useState("Acme Growth");
  const [accent, setAccent] = useState("#ff6b2c");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    start(async () => {
      const r = await saveBrandingAction(name, accent);
      setStatus(r.ok ? t("settings.brandingSaved") : t("settings.brandingSandbox"));
    });
  }

  return (
    <Card className="p-5">
      <h2 className="font-medium flex items-center gap-2 mb-3"><Palette className="h-4 w-4 text-forge" /> {t("settings.whiteLabel")}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-xs text-dim">{t("settings.brandName")}
            <input value={name} onChange={(e) => setName(e.target.value)} className="block mt-1 w-full rounded-lg bg-surface-2 border border-line px-3 py-2 text-sm outline-none" />
          </label>
          <label className="block text-xs text-dim">{t("settings.accentColor")}
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="block mt-1 h-9 w-16 rounded-lg bg-surface-2 border border-line" />
          </label>
          <Button onClick={save}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t("settings.saveBranding")}</Button>
          {status && <p className="text-xs text-dim">{status}</p>}
        </div>
        <div className="rounded-xl border border-line p-4 flex flex-col items-center justify-center gap-3">
          <div className="text-xs text-dim">{t("settings.preview")}</div>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 rounded-lg text-white font-bold text-sm" style={{ background: accent }}>{name.slice(0, 1)}</span>
            <span className="font-semibold tracking-tight">{name}</span>
          </div>
          <span className="rounded-full px-4 py-1.5 text-xs text-white" style={{ background: accent }}>{t("settings.primaryAction")}</span>
        </div>
      </div>
    </Card>
  );
}
