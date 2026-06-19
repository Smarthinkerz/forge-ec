// Creative Studio domain types.
export type CreativeFormat = "static" | "carousel" | "video" | "ugc";

export interface BrandProfile {
  name: string;
  primaryColor: string;   // hex
  accentColor: string;    // hex
  tone: string;           // e.g. "premium, confident"
  bannedWords: string[];  // never appear in copy
  maxHeadlineLen: number;
}

export interface CreativeCopy {
  headline: string;
  body: string;
  cta: string;
}

export interface Creative {
  id: string;
  format: CreativeFormat;
  channel: string;
  productTitle: string;
  copy: CreativeCopy;
  /** Inline SVG markup for the rendered banner (sandbox) or a hosted asset URL. */
  previewSvg?: string;
  assetUrl?: string;
  provider: string;
}

export interface GuardrailResult {
  copy: CreativeCopy;
  violations: string[];
}

export interface PerformancePrediction {
  score: number;        // 0–100 predicted strength
  predictedCtr: number; // decimal, e.g. 0.021
  reasoning: string[];  // explainable factors
}

export interface ABVariant { id: string; label: string; copy: CreativeCopy; prediction: PerformancePrediction; }
export interface ABResult {
  variants: { id: string; label: string; impressions: number; clicks: number; conversions: number; ctr: number; cvr: number }[];
  winnerId: string;
  liftPct: number;       // winner vs runner-up conversion-rate lift
  confidence: "high" | "medium" | "low";
  recommendation: string;
}
