import { test } from "node:test";
import assert from "node:assert/strict";
import { generateApiKey, hashKey, extractKey } from "../lib/api/keys";
import { rateLimit, _resetRateLimit } from "../lib/security/ratelimit";
import { sustainabilityScore } from "../lib/sustainability";
import { log, captureError } from "../lib/observability/logger";

test("api keys: prefixed, hashed, verifiable", () => {
  const k = generateApiKey();
  assert.ok(k.key.startsWith("fec_live_"));
  assert.equal(k.prefix, k.key.slice(0, 12));
  assert.equal(hashKey(k.key), k.hash);
  assert.notEqual(k.key, k.hash); // raw never equals stored hash
});

test("extractKey reads Bearer and x-api-key", () => {
  assert.equal(extractKey(new Request("https://x", { headers: { authorization: "Bearer abc" } })), "abc");
  assert.equal(extractKey(new Request("https://x", { headers: { "x-api-key": "xyz" } })), "xyz");
  assert.equal(extractKey(new Request("https://x")), null);
});

test("rate limiter allows up to the limit then blocks", () => {
  _resetRateLimit();
  let last;
  for (let i = 0; i < 5; i++) last = rateLimit("t", 5, 60000);
  assert.equal(last!.allowed, true);
  const blocked = rateLimit("t", 5, 60000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
});

test("sustainability scoring: grades and gives carbon-aware tips", () => {
  const clean = sustainabilityScore({ channel: "google", impressions: 100000, conversions: 500 });
  const dirty = sustainabilityScore({ channel: "tiktok", impressions: 1000000, conversions: 50 });
  assert.ok(clean.score > dirty.score);
  assert.ok(["A", "B", "C", "D", "E"].includes(clean.rating));
  assert.ok(dirty.suggestions.length >= 1);
  assert.ok(dirty.gramsCO2e > clean.gramsCO2e);
});

test("logger emits structured entries", () => {
  const e = log("info", "hello", { a: 1 });
  assert.equal(e.level, "info");
  assert.equal(e.msg, "hello");
  assert.equal(e.a, 1);
  assert.ok(e.ts);
  captureError(new Error("boom"), { where: "test" }); // should not throw
});
