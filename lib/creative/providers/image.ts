// Image-generation provider skeletons. Activate when their API key is set;
// until then the studio renders branded SVG banners (always works).
// Swap-in notes in docs/INTEGRATIONS.md.
export interface ImageProvider {
  name: string;
  isConfigured(): boolean;
  generate(prompt: string, opts?: { width?: number; height?: number }): Promise<{ assetUrl: string }>;
}

class NotImplemented extends Error {
  constructor(n: string) { super(`${n} image generation not implemented — add API key and implement generate(). See docs/INTEGRATIONS.md`); }
}

/** Replicate — set REPLICATE_API_TOKEN. POST https://api.replicate.com/v1/predictions */
export class ReplicateImageProvider implements ImageProvider {
  name = "replicate";
  isConfigured() { return Boolean(process.env.REPLICATE_API_TOKEN); }
  async generate(): Promise<{ assetUrl: string }> { throw new NotImplemented("Replicate"); }
}

/** OpenAI Images — set OPENAI_API_KEY. POST https://api.openai.com/v1/images/generations */
export class OpenAIImageProvider implements ImageProvider {
  name = "openai-images";
  isConfigured() { return Boolean(process.env.OPENAI_API_KEY) && process.env.ENABLE_OPENAI_IMAGES === "1"; }
  async generate(): Promise<{ assetUrl: string }> { throw new NotImplemented("OpenAI Images"); }
}

/** Returns a configured real image provider, or null to use the SVG renderer. */
export function getImageProvider(): ImageProvider | null {
  const candidates = [new ReplicateImageProvider(), new OpenAIImageProvider()];
  return candidates.find((p) => p.isConfigured()) ?? null;
}
