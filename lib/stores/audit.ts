// lib/stores/audit.ts
import { z } from "zod";
import { selectProvider } from "@/lib/ai/router";

const auditSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  findings: z
    .array(
      z.object({
        area: z.string(),
        severity: z.enum(["high", "medium", "low"]),
        finding: z.string(),
        recommendation: z.string(),
      }),
    )
    .default([]),
});
export type SiteAudit = z.infer<typeof auditSchema>;

/** Generate a conversion-focused site audit for a store domain. */
export async function runSiteAudit(domain: string, context = ""): Promise<SiteAudit> {
  const provider = selectProvider();
  const res = await provider.complete({
    task: "site_audit",
    json: true,
    system:
      "You are a conversion-rate-optimization auditor for e-commerce stores. Produce a prioritized, specific, actionable audit. Output strict JSON {score, summary, findings:[{area,severity,finding,recommendation}]}.",
    prompt: `Audit the store at ${domain}. ${context}\nReturn an overall 0-100 conversion-readiness score and 3-6 prioritized findings.`,
    maxTokens: 900,
  });
  const match = res.text.match(/\{[\s\S]*\}/);
  return auditSchema.parse(JSON.parse(match ? match[0] : res.text));
}
