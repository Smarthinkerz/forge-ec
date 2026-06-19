// Brand profile + guardrails. Guardrails strip banned words and enforce limits
// on generated copy so creatives stay on-brand and safe.
import type { BrandProfile, CreativeCopy, GuardrailResult } from "@/lib/creative/types";

export const DEFAULT_BRAND: BrandProfile = {
  name: "Acme",
  primaryColor: "#0b0e14",
  accentColor: "#ff6b2c",
  tone: "premium, confident, concise",
  bannedWords: ["guaranteed", "miracle", "cheapest", "free money", "100% safe"],
  maxHeadlineLen: 60,
};

function scrub(text: string, banned: string[]): { text: string; hits: string[] } {
  let out = text;
  const hits: string[] = [];
  for (const w of banned) {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "ig");
    if (re.test(out)) { hits.push(w); out = out.replace(re, "").replace(/\s{2,}/g, " ").trim(); }
  }
  return { text: out, hits };
}

export function applyGuardrails(copy: CreativeCopy, brand: BrandProfile): GuardrailResult {
  const violations: string[] = [];
  const h = scrub(copy.headline, brand.bannedWords);
  const b = scrub(copy.body, brand.bannedWords);
  const c = scrub(copy.cta, brand.bannedWords);
  violations.push(...[...h.hits, ...b.hits, ...c.hits].map((w) => `banned word removed: "${w}"`));

  let headline = h.text;
  if (headline.length > brand.maxHeadlineLen) {
    headline = headline.slice(0, brand.maxHeadlineLen).trim();
    violations.push(`headline truncated to ${brand.maxHeadlineLen} chars`);
  }
  return { copy: { headline, body: b.text, cta: c.text || "Shop now" }, violations };
}
