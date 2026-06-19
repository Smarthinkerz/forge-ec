// AI-generated landing-page variants, scored with the creative performance model.
import { selectProvider } from "@/lib/ai/router";
import { predictPerformance } from "@/lib/creative/predict";
import type { PerformancePrediction } from "@/lib/creative/types";

export interface LandingVariant { headline: string; subhead: string; cta: string; bullets: string[]; prediction: PerformancePrediction; }
export interface LandingResult { variants: LandingVariant[]; winnerIndex: number; }

const ANGLES = ["benefit-led", "social-proof-led", "urgency-led", "problem-solution"];

export async function generateLandingVariants(input: { productTitle: string; productDescription: string }, count = 2): Promise<LandingResult> {
  const provider = selectProvider();
  const variants: LandingVariant[] = [];
  for (let i = 0; i < count; i++) {
    const angle = ANGLES[i % ANGLES.length];
    const res = await provider.complete({
      task: "product_optimization", json: true,
      system: "You write landing-page hero copy. Output strict JSON {title, description, bullets[]}.",
      prompt: `ANGLE: ${angle}\nTITLE: ${input.productTitle}\nDESCRIPTION: ${input.productDescription}`,
      maxTokens: 400,
    });
    let raw: { title?: string; description?: string; bullets?: string[] } = {};
    try { raw = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); } catch { /* keep defaults */ }
    const headline = raw.title ?? input.productTitle;
    const subhead = raw.description ?? input.productDescription;
    const cta = "Shop now";
    variants.push({ headline, subhead, cta, bullets: raw.bullets ?? [], prediction: predictPerformance({ headline, body: subhead, cta }) });
  }
  let winnerIndex = 0;
  variants.forEach((v, i) => { if (v.prediction.score > variants[winnerIndex].prediction.score) winnerIndex = i; });
  return { variants, winnerIndex };
}
