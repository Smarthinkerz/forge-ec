import { test } from "node:test";
import assert from "node:assert/strict";
import { getAdapter } from "../lib/stores/registry";
import { MockStoreAdapter } from "../lib/stores/mock";
import { syncProducts, optimizeForChannel } from "../lib/stores/sync";
import { runSiteAudit } from "../lib/stores/audit";

test("mock adapter returns a catalog with stable external ids", async () => {
  const a = new MockStoreAdapter("shopify");
  const products = await a.listProducts({}, 5);
  assert.equal(products.length, 5);
  assert.ok(products[0].externalId.startsWith("shopify-"));
  assert.ok(products[0].price > 0);
});

test("registry uses sandbox without creds, real adapter when creds present", () => {
  assert.equal(getAdapter("shopify", {}).constructor.name, "MockStoreAdapter");
  const real = getAdapter("shopify", { shop: "x.myshopify.com", accessToken: "t" });
  assert.equal(real.constructor.name, "ShopifyAdapter");
  assert.equal(real.isConfigured({ shop: "x", accessToken: "t" }), true);
  assert.equal(real.isConfigured({ shop: "x" }), false);
});

test("syncProducts returns store info + catalog", async () => {
  const r = await syncProducts("custom", {}, 8);
  assert.ok(r.store.domain.length > 0);
  assert.equal(r.products.length, 8);
  assert.ok(r.syncedAt);
});

test("optimizeForChannel returns structured copy (mock AI)", async () => {
  const r = await syncProducts("custom", {}, 1);
  const copy = await optimizeForChannel(r.products[0], "meta");
  assert.ok(copy.title.length > 0);
  assert.ok(Array.isArray(copy.bullets));
});

test("runSiteAudit returns a valid score and findings (mock AI)", async () => {
  const audit = await runSiteAudit("demo.myshop.example");
  assert.ok(audit.score >= 0 && audit.score <= 100);
  assert.ok(audit.findings.length >= 1);
  assert.ok(["high", "medium", "low"].includes(audit.findings[0].severity));
});
