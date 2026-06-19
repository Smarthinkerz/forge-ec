// Predictive analytics: ROAS forecast (least-squares trend), LTV, CAC. Pure.

export interface DayPoint { date: string; spend: number; revenue: number; }
export interface ForecastPoint { date: string; roas: number; projected: boolean; }

/** Project daily ROAS `horizon` days forward using a linear trend on history. */
export function forecastROAS(series: DayPoint[], horizon = 14): ForecastPoint[] {
  const hist = series.map((d) => ({ date: d.date, roas: d.spend > 0 ? d.revenue / d.spend : 0 }));
  const n = hist.length;
  if (n === 0) return [];
  // Least-squares slope/intercept over index.
  const xs = hist.map((_, i) => i);
  const ys = hist.map((h) => h.roas);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den ? num / den : 0;
  const intercept = my - slope * mx;

  const out: ForecastPoint[] = hist.map((h) => ({ date: h.date, roas: Math.round(h.roas * 100) / 100, projected: false }));
  const last = new Date(series[n - 1].date);
  for (let k = 1; k <= horizon; k++) {
    const d = new Date(last); d.setDate(last.getDate() + k);
    const val = Math.max(0, intercept + slope * (n - 1 + k));
    out.push({ date: d.toISOString().slice(0, 10), roas: Math.round(val * 100) / 100, projected: true });
  }
  return out;
}

export interface LTVInput { aov: number; purchasesPerYear: number; grossMarginPct: number; retentionRate: number; }
/** Customer LTV via geometric expected lifetime (retention < 1). */
export function predictLTV(i: LTVInput): number {
  const retention = Math.min(0.99, Math.max(0, i.retentionRate));
  const expectedYears = 1 / (1 - retention);
  const ltv = i.aov * i.purchasesPerYear * (i.grossMarginPct / 100) * expectedYears;
  return Math.round(ltv);
}

export function cac(spend: number, newCustomers: number): number {
  return Math.round((spend / Math.max(1, newCustomers)) * 100) / 100;
}
export function ltvCacRatio(ltv: number, c: number): number {
  return c > 0 ? Math.round((ltv / c) * 100) / 100 : 0;
}
