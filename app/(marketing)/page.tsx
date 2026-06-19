import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LangSwitch } from "@/components/marketing/LangSwitch";
import { t, isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { Zap, Brain, Bot, Globe, ShieldCheck, LineChart, ArrowRight, Check } from "lucide-react";
import { PLANS, displayPrice } from "@/lib/billing/plans";

const FEATURES = [
  { icon: Zap, titleKey: "landing.feat1Title", descKey: "landing.feat1Desc" },
  { icon: Bot, titleKey: "landing.feat2Title", descKey: "landing.feat2Desc" },
  { icon: Brain, titleKey: "landing.feat3Title", descKey: "landing.feat3Desc" },
  { icon: LineChart, titleKey: "landing.feat4Title", descKey: "landing.feat4Desc" },
  { icon: Globe, titleKey: "landing.feat5Title", descKey: "landing.feat5Desc" },
  { icon: ShieldCheck, titleKey: "landing.feat6Title", descKey: "landing.feat6Desc" },
];

export default async function Landing() {
  const jar = await cookies();
  const lc = jar.get("locale")?.value;
  const locale: Locale = isLocale(lc) ? lc : DEFAULT_LOCALE;

  return (
    <main className="min-h-screen">
      <nav className="h-16 border-b border-line flex items-center">
        <div className="mx-auto max-w-6xl w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-forge text-white font-bold text-sm">F</span>
            <span className="font-semibold tracking-tight">Forge<span className="text-forge">EC</span></span>
          </div>
          <div className="flex items-center gap-3">
            <LangSwitch locale={locale} />
            <Link href="/login" className="text-sm text-dim hover:text-ink transition-colors">{t(locale, "landing.signIn")}</Link>
            <Button href="/login?plan=free">{t(locale, "marketing.cta")} <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </nav>

      <section className="relative px-6 py-28 text-center overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-forge/20 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs text-dim mb-6">
            {t(locale, "landing.badge")}
          </span>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            {t(locale, "marketing.tagline")}
          </h1>
          <p className="mt-6 text-lg text-dim max-w-2xl mx-auto text-balance">
            {t(locale, "landing.heroSub")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button href="/login?plan=free">{t(locale, "marketing.cta")} <ArrowRight className="h-4 w-4" /></Button>
            <Button href="/dashboard" variant="ghost">{t(locale, "landing.viewDemo")}</Button>
          </div>
          <p className="mt-4 text-xs text-dim">{t(locale, "landing.demoNote")}</p>
        </div>
      </section>

      <section id="features" className="px-6 py-20 bg-surface/40 border-y border-line">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-12 text-center">{t(locale, "landing.featuresTitle")}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.titleKey} className="p-6">
                <f.icon className="h-6 w-6 text-forge mb-4" />
                <h3 className="font-medium mb-2">{t(locale, f.titleKey)}</h3>
                <p className="text-sm text-dim leading-relaxed">{t(locale, f.descKey)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-20 border-t border-line">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">{t(locale, "landing.pricingTitle")}</h2>
            <p className="text-dim">{t(locale, "landing.pricingSub")}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {PLANS.map((plan) => {
              const popular = plan.id === "growth";
              const isEnterprise = plan.priceUSD === null;
              const sub =
                plan.id === "free" ? t(locale, "landing.planSubFree")
                : isEnterprise ? t(locale, "landing.planSubEnterprise")
                : t(locale, "landing.planSubMonthly");
              const cta =
                plan.id === "free" ? t(locale, "marketing.cta")
                : isEnterprise ? t(locale, "billing.contactSales")
                : `${t(locale, "landing.choosePrefix")}${plan.name}${t(locale, "landing.chooseSuffix")}`;
              return (
                <Card key={plan.id} className={`relative p-6 flex flex-col ${popular ? "border-forge ring-1 ring-forge/40" : ""}`}>
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-forge text-white text-xs font-medium px-3 py-1">
                      {t(locale, "billing.mostPopular")}
                    </span>
                  )}
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="mt-2 text-3xl font-bold tracking-tight">{displayPrice(plan)}</div>
                  <p className="text-sm text-dim mt-1 mb-5 min-h-[1.25rem]">{sub}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-forge mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button href={`/login?plan=${plan.id}`} variant={popular ? "primary" : "ghost"} className="w-full">
                    {cta} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              );
            })}
          </div>
          <p className="text-center text-xs text-dim mt-6">
            {t(locale, "landing.priceNote")}
          </p>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-10">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-dim">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-6 w-6 rounded-md bg-forge text-white font-bold text-xs">F</span>
            ForgeEC
          </div>
          <span>© {new Date().getFullYear()} ForgeEC · {t(locale, "landing.footerNote")}</span>
        </div>
      </footer>
    </main>
  );
}
