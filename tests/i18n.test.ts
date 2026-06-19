import { test } from "node:test";
import assert from "node:assert/strict";
import { t, dir } from "../lib/i18n";

test("translations resolve with fallback", () => {
  assert.equal(t("en", "nav.dashboard"), "Dashboard");
  assert.equal(t("ar", "nav.dashboard"), "لوحة التحكم");
  assert.equal(t("en", "missing.key"), "missing.key");
});
test("arabic is RTL", () => {
  assert.equal(dir("ar"), "rtl");
  assert.equal(dir("en"), "ltr");
});
