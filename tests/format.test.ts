import { test } from "node:test";
import assert from "node:assert/strict";
import { roas, pct, formatMoney } from "../lib/utils/format";

test("roas computes and guards divide-by-zero", () => {
  assert.equal(roas(10000, 2000), 5);
  assert.equal(roas(100, 0), 0);
});
test("pct adds sign", () => {
  assert.equal(pct(12.4), "+12.4%");
  assert.equal(pct(-3.1), "-3.1%");
});
test("money formats as currency", () => {
  assert.ok(formatMoney(1234, "USD").includes("1,234"));
});
