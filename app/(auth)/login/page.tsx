import { cookies } from "next/headers";
import { AuthForm } from "./AuthForm";
import { LangSwitch } from "@/components/marketing/LangSwitch";
import { t, isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
export const metadata = { title: "Sign in · ForgeEC" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ checkEmail?: string; plan?: string }> }) {
  const { checkEmail, plan } = await searchParams;
  const jar = await cookies();
  const lc = jar.get("locale")?.value;
  const locale: Locale = isLocale(lc) ? lc : DEFAULT_LOCALE;
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <div className="absolute top-5 end-5 z-10">
        <LangSwitch locale={locale} />
      </div>
      <div className="flex items-center justify-center p-8">
        <AuthForm checkEmail={Boolean(checkEmail)} plan={plan} locale={locale} />
      </div>
      <div className="hidden lg:flex relative items-center justify-center overflow-hidden border-s border-line bg-surface">
        <div className="absolute h-96 w-96 rounded-full bg-forge/20 blur-[130px]" />
        <blockquote className="relative max-w-md px-12">
          <p className="text-3xl font-semibold leading-snug tracking-tight">
            {t(locale, "auth.quote1")}<span className="text-forge">{t(locale, "auth.quote2")}</span>
          </p>
          <p className="text-sm text-dim mt-5">{t(locale, "marketing.tagline")}</p>
        </blockquote>
      </div>
    </main>
  );
}
