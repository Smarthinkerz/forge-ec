import Link from "next/link";
import { cn } from "@/lib/utils/cn";
type Props = {
  href?: string; onClick?: () => void; children: React.ReactNode;
  variant?: "primary" | "ghost"; className?: string; type?: "button" | "submit";
  disabled?: boolean;
};
export function Button({ href, onClick, children, variant = "primary", className, type = "button", disabled = false }: Props) {
  const styles = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
    variant === "primary" ? "bg-forge text-white hover:bg-forge-bright" : "border border-line text-ink hover:bg-surface-2",
    disabled && "opacity-50 pointer-events-none",
    className,
  );
  if (href) return <Link href={href} className={styles} aria-disabled={disabled}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={styles}>{children}</button>;
}
