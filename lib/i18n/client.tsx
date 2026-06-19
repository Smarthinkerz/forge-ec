"use client";

import { createContext, useContext } from "react";
import { t as translate, isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: string; children: React.ReactNode }) {
  const safe: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return <LocaleContext.Provider value={safe}>{children}</LocaleContext.Provider>;
}

/** Hook for client components: returns a translate fn bound to the current locale. */
export function useT() {
  const locale = useContext(LocaleContext);
  return (key: string) => translate(locale, key);
}
