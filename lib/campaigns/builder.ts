// Natural-language campaign builder. Turns a free-text brief into a structured
// CampaignDraft via the AI layer (mock provider works with no keys).
import { z } from "zod";
import { selectProvider } from "@/lib/ai/router";
import type { AdChannel, CampaignDraft } from "@/lib/channels/types";

const draftSchema = z.object({
  name: z.string(),
  objective: z.enum(["conversions", "traffic", "awareness", "catalog_sales"]).default("conversions"),
  budgetDaily: z.number().min(1).default(50),
  audience: z.string().default(""),
});

export async function draftCampaign(text: string, channel: AdChannel, currency = "USD"): Promise<CampaignDraft> {
  const provider = selectProvider();
  const res = await provider.complete({
    task: "campaign_draft",
    json: true,
    system: "You are a paid-media strategist. Convert the brief into a structured campaign. Output strict JSON {name, objective, budgetDaily, audience}.",
    prompt: `BRIEF: ${text}\nCHANNEL: ${channel}\nReturn a concise campaign name, an objective, a sensible daily budget (number), and a one-line audience definition.`,
    maxTokens: 400,
  });
  const match = res.text.match(/\{[\s\S]*\}/);
  const parsed = draftSchema.parse(JSON.parse(match ? match[0] : res.text));
  return { ...parsed, channel, currency };
}
