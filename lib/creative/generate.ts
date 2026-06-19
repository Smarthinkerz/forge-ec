// Orchestrates a creative: AI copy → brand guardrails → banner (SVG sandbox, or
// real image provider if configured) → performance prediction.
import { selectProvider } from "@/lib/ai/router";
import { applyGuardrails, DEFAULT_BRAND } from "@/lib/creative/brand";
import { bannerSVG } from "@/lib/creative/svg";
import { predictPerformance } from "@/lib/creative/predict";
import { getImageProvider } from "@/lib/creative/providers/image";
import type { BrandProfile, Creative, CreativeCopy, CreativeFormat, PerformancePrediction } from "@/lib/creative/types";

function deriveCta(channel: string): string {
  return channel === "amazon" ? "Buy now" : channel === "pinterest" ? "Get the look" : "Shop now";
}

export interface GenerateInput {
  productTitle: string; productDescription: string; price?: string;
  channel: string; format: CreativeFormat; brand?: BrandProfile;
}

export async function generateCreative(input: GenerateInput): Promise<Creative & { prediction: PerformancePrediction }> {
  const brand = input.brand ?? DEFAULT_BRAND;
  const provider = selectProvider();
  const res = await provider.complete({
    task: "product_optimization",
    json: true,
    system: `You write ad creative copy in a ${brand.tone} tone. Output strict JSON {title, description, bullets[]}.`,
    prompt: `CHANNEL: ${input.channel}\nFORMAT: ${input.format}\nTITLE: ${input.productTitle}\nDESCRIPTION: ${input.productDescription}`,
    maxTokens: 400,
  });
  let raw: { title?: string; description?: string };
  try { raw = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); } catch { raw = {}; }

  const rawCopy: CreativeCopy = {
    headline: raw.title ?? input.productTitle,
    body: raw.description ?? input.productDescription,
    cta: deriveCta(input.channel),
  };
  const { copy } = applyGuardrails(rawCopy, brand);

  const creative: Creative & { prediction: PerformancePrediction } = {
    id: `cr-${Math.random().toString(36).slice(2, 9)}`,
    format: input.format,
    channel: input.channel,
    productTitle: input.productTitle,
    copy,
    provider: provider.name,
    prediction: predictPerformance(copy),
  };

  const img = getImageProvider();
  if (img) {
    try {
      const { assetUrl } = await img.generate(`${copy.headline} — ${input.productTitle}, ${brand.tone}`);
      creative.assetUrl = assetUrl;
      creative.provider = img.name;
    } catch {
      creative.previewSvg = bannerSVG({ brand, copy, productTitle: input.productTitle, price: input.price });
    }
  } else {
    creative.previewSvg = bannerSVG({ brand, copy, productTitle: input.productTitle, price: input.price });
  }
  return creative;
}
