"use client";

import { LOCALES } from "@/lib/i18n";

const LABELS: Record<string, string> = { en: "EN", ar: "عربي", ja: "日本語" };

function setLocale(next: string) {
  document.cookie = `locale=${next};path=/;max-age=31536000;samesite=lax`;
  window.location.reload();
}

export function LangSwitch({ locale }: { locale: string }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-1 text-xs">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === l ? "bg-forge text-white" : "text-dim hover:text-ink"
          }`}
        >
          {LABELS[l] ?? l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
