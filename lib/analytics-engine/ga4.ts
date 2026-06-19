// GA4-style source. Mock returns sessions/engagement; real hook documented.
// Real: GA4 Data API (set GA4_PROPERTY_ID + service-account creds) — see docs/INTEGRATIONS.md.
export interface GA4Summary { sessions: number; engagedSessions: number; engagementRate: number; conversions: number; source: string; }

export function isGA4Configured(): boolean {
  return Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_CREDENTIALS_JSON);
}

export async function getGA4Summary(): Promise<GA4Summary> {
  if (isGA4Configured()) {
    // TODO: call GA4 Data API runReport; map to GA4Summary.
    throw new Error("GA4 live integration not implemented — see docs/INTEGRATIONS.md");
  }
  return { sessions: 48230, engagedSessions: 31420, engagementRate: 0.651, conversions: 1840, source: "mock" };
}
