"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Megaphone, Sparkles, BarChart3, Bot, Workflow, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/stores", key: "nav.stores", icon: Store },
  { href: "/campaigns", key: "nav.campaigns", icon: Megaphone },
  { href: "/creative", key: "nav.creative", icon: Sparkles },
  { href: "/analytics", key: "nav.analytics", icon: BarChart3 },
  { href: "/agents", key: "nav.agents", icon: Bot },
  { href: "/orchestration", key: "nav.orchestration", icon: Workflow },
  { href: "/settings", key: "nav.settings", icon: Settings },
];

export function Sidebar({ labels }: { labels: Record<string, string> }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-e border-line bg-surface min-h-screen sticky top-0 hidden md:flex flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 px-5 h-16 border-b border-line">
        <span className="grid place-items-center h-7 w-7 rounded-lg bg-forge text-white font-bold text-sm">F</span>
        <span className="font-semibold tracking-tight">Forge<span className="text-forge">EC</span></span>
      </Link>
      <nav className="p-3 flex flex-col gap-1">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active ? "bg-forge/12 text-forge" : "text-dim hover:bg-surface-2 hover:text-ink",
              )}>
              <it.icon className="h-[18px] w-[18px]" /> {labels[it.key]}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
