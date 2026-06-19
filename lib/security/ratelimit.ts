// Rate limiter: in-memory sliding window by default; structured to swap in
// Upstash Redis (UPSTASH_REDIS_REST_URL/TOKEN) for multi-instance deployments.
interface Bucket { hits: number[]; }
const store = new Map<string, Bucket>();

export interface RateResult { allowed: boolean; remaining: number; resetMs: number; }

export function rateLimit(key: string, limit = 60, windowMs = 60_000): RateResult {
  const now = Date.now();
  const b = store.get(key) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) {
    store.set(key, b);
    return { allowed: false, remaining: 0, resetMs: windowMs - (now - b.hits[0]) };
  }
  b.hits.push(now);
  store.set(key, b);
  return { allowed: true, remaining: limit - b.hits.length, resetMs: windowMs };
}

export function _resetRateLimit() { store.clear(); } // test helper
