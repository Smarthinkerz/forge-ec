"use server";
import { simulateFlow, FLOW_TEMPLATES } from "@/lib/funnel/flows";
import { getMessagingAdapter } from "@/lib/messaging/registry";
import { generateLandingVariants } from "@/lib/funnel/landing";
import type { MessagingProvider } from "@/lib/messaging/types";

export async function simulateFlowAction(flowId: string, provider: MessagingProvider) {
  const template = FLOW_TEMPLATES.find((f) => f.id === flowId) ?? FLOW_TEMPLATES[0];
  const adapter = getMessagingAdapter(provider);
  const audience = await adapter.getAudienceSize({});
  // Enroll a realistic slice of the audience based on the trigger.
  const enrolled = Math.round(audience * (flowId === "welcome" ? 0.6 : flowId === "abandoned_cart" ? 0.12 : 0.3));
  return { template, projection: simulateFlow(template, enrolled), provider: adapter.provider };
}

export async function generateLandingAction(productTitle: string, productDescription: string) {
  return generateLandingVariants({ productTitle, productDescription }, 2);
}
