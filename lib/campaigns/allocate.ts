// Smart budget allocation. Distributes a total daily budget across campaigns in
// proportion to a marginal-efficiency score (ROAS with diminishing returns),
// nudged toward winners but never starving others below a floor. Pure + testable.
export interface AllocItem { id: string; name: string; roas: number; currentDaily: number; }
export interface Allocation { id: string; name: string; recommendedDaily: number; delta: number; }

export function allocateBudget(total: number, items: AllocItem[], floorPct = 0.05): Allocation[] {
  if (items.length === 0 || total <= 0) return [];
  // Diminishing-returns score: sqrt(roas) dampens runaway concentration.
  const scores = items.map((i) => Math.max(0.01, Math.sqrt(Math.max(0, i.roas))));
  const sum = scores.reduce((a, b) => a + b, 0);
  const floor = total * floorPct;
  const distributable = Math.max(0, total - floor * items.length);
  return items.map((i, idx) => {
    const recommendedDaily = Math.round(floor + distributable * (scores[idx] / sum));
    return { id: i.id, name: i.name, recommendedDaily, delta: recommendedDaily - i.currentDaily };
  });
}
