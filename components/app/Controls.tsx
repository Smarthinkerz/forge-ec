"use client";

import { useRouter } from "next/navigation";
import { Sun, Moon, Languages } from "lucide-react";
import { useState, useEffect } from "react";
import { LOCALES } from "@/lib/i18n";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=31536000;samesite=lax`;
}

export function Controls({ locale }: { locale: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    setCookie("theme", next);
  }

  function switchLocale() {
    const order = LOCALES as readonly string[];
    const idx = order.indexOf(locale);
    const next = order[(idx + 1) % order.length] ?? "en";
    setCookie("locale", next);
    router.refresh();
    // direction is applied server-side on refresh; force a reload to re-mirror layout
    setTimeout(() => window.location.reload(), 50);
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={switchLocale} title="Language"
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 me-3 text-sm text-dim hover:bg-surface-2 hover:text-ink transition-colors">
        <Languages className="h-4 w-4" /> {locale.toUpperCase()}
      </button>
      <button onClick={toggleTheme} title="Theme"
        className="rounded-full p-2 text-dim hover:bg-surface-2 hover:text-ink transition-colors">
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
    </div>
  );
}
