// Renders a branded SVG ad banner (sandbox creative — real, viewable, no API).
import type { BrandProfile, CreativeCopy } from "@/lib/creative/types";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function wrap(text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.slice(0, maxLines);
}

export function bannerSVG(opts: {
  brand: BrandProfile; copy: CreativeCopy; productTitle: string; price?: string; w?: number; h?: number;
}): string {
  const { brand, copy, productTitle, price } = opts;
  const w = opts.w ?? 600, h = opts.h ?? 500;
  const headlineLines = wrap(copy.headline, 22, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${brand.primaryColor}"/>
      <stop offset="100%" stop-color="${brand.accentColor}" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#ffffff" stroke-opacity="0.15" rx="14"/>
  <text x="44" y="70" fill="#ffffff" opacity="0.7" font-family="system-ui,sans-serif" font-size="14" letter-spacing="2">${esc(brand.name.toUpperCase())}</text>
  ${headlineLines.map((ln, i) => `<text x="44" y="${150 + i * 46}" fill="#ffffff" font-family="system-ui,sans-serif" font-size="38" font-weight="700">${esc(ln)}</text>`).join("\n  ")}
  <text x="44" y="${h - 150}" fill="#ffffff" opacity="0.85" font-family="system-ui,sans-serif" font-size="17">${esc(productTitle)}</text>
  ${price ? `<text x="44" y="${h - 118}" fill="${brand.accentColor}" font-family="system-ui,sans-serif" font-size="26" font-weight="700">${esc(price)}</text>` : ""}
  <rect x="44" y="${h - 90}" width="200" height="46" rx="23" fill="${brand.accentColor}"/>
  <text x="144" y="${h - 60}" fill="#ffffff" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" font-weight="600">${esc(copy.cta)}</text>
</svg>`;
}
