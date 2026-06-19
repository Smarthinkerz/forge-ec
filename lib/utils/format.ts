// Money / number / ROAS formatting — pure + testable.
export function formatMoney(amount: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
export function formatCompact(n: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
/** ROAS = revenue / spend. Returns 0 when spend is 0 to avoid Infinity. */
export function roas(revenue: number, spend: number): number {
  if (spend <= 0) return 0;
  return Math.round((revenue / spend) * 100) / 100;
}
export function pct(n: number): string {
  const s = n > 0 ? "+" : "";
  return `${s}${Math.round(n * 10) / 10}%`;
}
