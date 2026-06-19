"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { signIn, signUp } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { getPlan } from "@/lib/billing/plans";
import { t, type Locale } from "@/lib/i18n";

export function AuthForm({ checkEmail, plan, locale }: { checkEmail?: boolean; plan?: string; locale: Locale }) {
  const planId = plan === "starter" || plan === "growth" || plan === "enterprise" || plan === "free" ? plan : undefined;
  const selected = planId ? getPlan(planId) : undefined;
  const [mode, setMode] = useState<"in" | "up">(planId ? "up" : "in");
  const action = mode === "in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <span className="grid place-items-center h-7 w-7 rounded-lg bg-forge text-white font-bold text-sm">F</span>
        <span className="font-semibold tracking-tight">Forge<span className="text-forge">EC</span></span>
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        {mode === "in" ? t(locale, "auth.welcomeBack") : t(locale, "auth.createWorkspace")}
      </h1>
      <p className="text-dim text-sm mb-8">
        {mode === "in" ? t(locale, "auth.signInSub") : t(locale, "auth.signUpSub")}
      </p>

      {selected && selected.id !== "free" && (
        <p className="mb-6 text-sm rounded-xl bg-forge/10 text-forge border border-forge/20 px-4 py-3">
          {t(locale, "auth.pickedPre")}<strong>{selected.name}</strong>{t(locale, "auth.pickedPost")}
        </p>
      )}

      {checkEmail && (
        <p className="mb-6 text-sm rounded-xl bg-cyan/10 text-cyan border border-cyan/20 px-4 py-3">
          {t(locale, "auth.checkEmail")}
        </p>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="plan" value={planId ?? ""} />
        {mode === "up" && (
          <>
            <input name="fullName" placeholder={t(locale, "auth.fullName")} autoComplete="name" className={input} />
            <input name="orgName" placeholder={t(locale, "auth.orgName")} className={input} />
          </>
        )}
        <input name="email" type="email" required placeholder={t(locale, "auth.email")} autoComplete="email" className={input} />
        <input name="password" type="password" required placeholder={t(locale, "auth.password")} autoComplete={mode === "in" ? "current-password" : "new-password"} className={input} />
        {state?.error && <p className="text-neg text-xs">{state.error}</p>}
        <Button type="submit" className="w-full">{pending ? "…" : mode === "in" ? t(locale, "landing.signIn") : t(locale, "auth.createAccount")}</Button>
      </form>

      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-dim hover:text-ink transition-colors">
        {mode === "in" ? t(locale, "auth.noAccount") : t(locale, "auth.haveAccount")}
      </button>
    </div>
  );
}

const input = "w-full rounded-xl bg-surface-2 border border-line px-3 py-2.5 text-sm outline-none focus:border-forge";
