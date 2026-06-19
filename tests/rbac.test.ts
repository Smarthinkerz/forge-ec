import { test } from "node:test";
import assert from "node:assert/strict";
import { can } from "../lib/rbac";

test("role hierarchy enforces permissions", () => {
  assert.equal(can("owner", "billing.manage"), true);
  assert.equal(can("editor", "campaign.launch"), true);
  assert.equal(can("analyst", "campaign.launch"), false);
  assert.equal(can("viewer", "analytics.view"), true);
  assert.equal(can("viewer", "store.connect"), false);
});
