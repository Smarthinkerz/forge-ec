// Sustainability scoring: estimates campaign delivery carbon and grades it, with
// carbon-aware recommendations. Heuristic + deterministic (real ad-emissions
// methodologies like Scope3/GMSF can replace the coefficients later).

// Indicative gCO2e per 1,000 impressions by channel/format (rough industry order).
const GCO2E_PER_KIMP: Record<string, number> = {
  google: 0.9, meta: 1.1, pinterest: 1.0, tiktok: 3.6, amazon: 1.4, video: 5.0, display: 1.0,
};

export interface SustainabilityInput { channel: string; impressions: number; conversions: number; }
export interface SustainabilityScore {
  gramsCO2e: number; gPerConversion: number; score: number; rating: "A" | "B" | "C" | "D" | "E"; suggestions: string[];
}

export function sustainabilityScore(i: SustainabilityInput): SustainabilityScore {
  const coeff = GCO2E_PER_KIMP[i.channel] ?? 1.5;
  const gramsCO2e = Math.round((i.impressions / 1000) * coeff);
  const gPerConversion = i.conversions > 0 ? Math.round(gramsCO2e / i.conversions) : gramsCO2e;
  // Lower carbon-per-conversion → higher score. ~5 g/conv ≈ great, ~200 ≈ poor.
  const score = Math.max(1, Math.min(100, Math.round(100 - (gPerConversion / 2))));
  const rating = score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "E";
  const suggestions: string[] = [];
  if (coeff >= 3) suggestions.push("Shift some budget to lower-carbon channels (search/display) for prospecting.");
  if (gPerConversion > 60) suggestions.push("Tighten targeting to cut wasted impressions per conversion.");
  suggestions.push("Enable carbon-aware scheduling: deliver more in low-grid-intensity hours/regions.");
  return { gramsCO2e, gPerConversion, score, rating, suggestions };
}
