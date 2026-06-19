// Selects the best configured AI provider; falls back to mock so nothing breaks.
import type { AIProvider } from "@/lib/ai/types";
import { MockAIProvider } from "@/lib/ai/providers/mock";
import { OpenAIProvider, AnthropicProvider, GeminiProvider } from "@/lib/ai/providers/cloud";

let cache: AIProvider[] | null = null;
function all(): AIProvider[] {
  if (!cache) cache = [new AnthropicProvider(), new OpenAIProvider(), new GeminiProvider(), new MockAIProvider()];
  return cache;
}
export function selectProvider(): AIProvider {
  const forced = process.env.AI_DEFAULT_PROVIDER;
  const configured = all().filter((p) => p.isConfigured());
  if (forced) { const m = configured.find((p) => p.name === forced); if (m) return m; }
  // Prefer a real provider when present, else mock.
  return configured.find((p) => p.name !== "mock") ?? new MockAIProvider();
}
