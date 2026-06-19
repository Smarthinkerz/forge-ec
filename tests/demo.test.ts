import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeries, demoTotals } from "../lib/demo";

test("demo series is deterministic and well-formed", () => {
  const a = demoSeries(30), b = demoSeries(30);
  assert.equal(a.length, 30);
  assert.deepEqual(a[0], b[0]); // deterministic
  const totals = demoTotals(a);
  assert.ok(totals.revenue > totals.spend); // profitable demo
  assert.ok(totals.roas > 1);
});
