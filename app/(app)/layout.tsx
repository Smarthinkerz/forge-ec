import { cookies } from "next/headers";
import { Sidebar } from "@/components/app/Sidebar";
import { Controls } from "@/components/app/Controls";
import { LocaleProvider } from "@/lib/i18n/client";
import { t, isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getOrgContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const NAV_KEYS = ["nav.dashboard", "nav.stores", "nav.campaigns", "nav.creative", "nav.analytics", "nav.agents", "nav.orchestration", "nav.settings"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const lc = jar.get("locale")?.value;
  const locale: Locale = isLocale(lc) ? lc : DEFAULT_LOCALE;
  const labels = Object.fromEntries(NAV_KEYS.map((k) => [k, t(locale, k)]));

  const org = await getOrgContext();
  const orgLabel = org?.orgName ?? (isSupabaseConfigured() ? "—" : "Demo workspace");

  return (
    <LocaleProvider locale={locale}>
      <div className="flex">
        <Sidebar labels={labels} />
        <div className="flex-1 min-w-0">
          <header className="h-16 border-b border-line bg-surface/70 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dim">{t(locale, "app.workspace")}</span>
              <span className="font-medium">{orgLabel}</span>
              {org && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-dim">{org.role}</span>}
            </div>
            <div className="flex items-center gap-3">
              <Controls locale={locale} />
              <span className="h-8 w-8 rounded-full bg-surface-2 grid place-items-center text-xs text-dim">
                {isSupabaseConfigured() ? "U" : "D"}
              </span>
            </div>
          </header>
          {!isSupabaseConfigured() && (
            <div className="bg-forge/10 text-forge text-sm px-6 py-2 border-b border-forge/20">
              {t(locale, "app.demoBanner")}
            </div>
          )}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </LocaleProvider>
  );
}
