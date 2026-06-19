import { cn } from "@/lib/utils/cn";
const tones: Record<string, string> = {
  active: "bg-pos/15 text-pos", paused: "bg-dim/15 text-dim",
  draft: "bg-cyan/15 text-cyan", error: "bg-neg/15 text-neg", default: "bg-surface-2 text-dim",
};
export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: string }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone] ?? tones.default)}>{children}</span>;
}
