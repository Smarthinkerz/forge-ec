// lib/ai/providers/mock.ts
// Keyless provider so the full product journey runs with no AI credentials.
// Returns structured JSON shaped like the real providers for each task.

import type { AIProvider, CompletionRequest, CompletionResponse } from "@/lib/ai/types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
const pick = <T,>(a: T[], s: number) => a[s % a.length];

export class MockAIProvider implements AIProvider {
  name = "mock";
  isConfigured() { return true; }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const seed = hash(req.prompt + req.task);
    await new Promise((r) => setTimeout(r, 250 + (seed % 350)));
    const body =
      req.task === "site_audit" ? this.audit(seed)
      : req.task === "product_optimization" ? this.optimize(seed, req.prompt)
      : req.task === "campaign_draft" ? this.campaign(seed)
      : { text: "ok" };
    return { text: JSON.stringify(body), provider: this.name, model: "mock-forge-1" };
  }

  private audit(seed: number) {
    const areas = ["Conversion rate", "Page speed", "Product imagery", "Checkout flow", "Mobile UX", "Trust signals", "SEO metadata"];
    const sev = ["high", "medium", "low"] as const;
    const findings = [0, 1, 2, 3].map((i) => ({
      area: pick(areas, seed + i),
      severity: pick([...sev], seed + i),
      finding: "Detected an issue that likely suppresses conversion in this area.",
      recommendation: "A specific, prioritized fix the merchant can ship this week.",
    }));
    return { score: 58 + (seed % 30), summary: "Solid foundation with a few high-leverage conversion fixes available.", findings };
  }

  private optimize(seed: number, prompt: string) {
    const base = (prompt.match(/TITLE:\s*(.+)/)?.[1] ?? "Product").trim().slice(0, 60);
    const hooks = ["Premium", "Best-selling", "Limited-edition", "Editor's pick", "New season"];
    return {
      title: `${pick(hooks, seed)} ${base}`,
      description: `${base} — reframed for this channel with a benefit-led hook, social proof, and a clear call to action.`,
      bullets: ["Benefit-led opening line", "Concrete differentiator", "Urgency / scarcity cue", "Channel-appropriate CTA"],
    };
  }

  private campaign(seed: number) {
    return {
      name: pick(["Prospecting — Core Audience", "Retargeting — Warm", "Lookalike Expansion"], seed),
      objective: "conversions",
      budgetDaily: 50 + (seed % 150),
      audience: "Inferred from your catalog and past buyers.",
      rationale: "Allocates to the channel/objective with the best modeled marginal ROAS.",
    };
  }
}
