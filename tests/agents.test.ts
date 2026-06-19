import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCampaign } from "../lib/agents/rules";
import { applyGuardrails } from "../lib/agents/guardrails";
import { runAgent } from "../lib/agents/engine";
import { DEFAULT_POLICY, DEFAULT_GUARDRAILS, type CampaignSnapshot } from "../lib/agents/types";

const loser: CampaignSnapshot = { id: "a", name: "A", channel: "meta", roas: 0.9, prevRoas: 1.0, spend: 1000, conversions: 8, clicks: 1200, budgetDaily: 100, status: "active" };
const winner: CampaignSnapshot = { id: "b", name: "B", channel: "google", roas: 6.2, prevRoas: 6.0, spend: 1500, conversions: 200, clicks: 2000, budgetDaily: 100, status: "active" };
const anomaly: CampaignSnapshot = { id: "c", name: "C", channel: "tiktok", roas: 0, prevRoas: 2, spend: 400, conversions: 0, clicks: 500, budgetDaily: 80, status: "active" };
const thin: CampaignSnapshot = { id: "d", name: "D", channel: "pinterest", roas: 0.5, prevRoas: 0.5, spend: 50, conversions: 0, clicks: 20, budgetDaily: 40, status: "active" };

test("rules: pause losers, scale winners, flag anomalies, hold thin-data", () => {
  assert.equal(evaluateCampaign(loser, DEFAULT_POLICY)[0].type, "pause");
  assert.equal(evaluateCampaign(winner, DEFAULT_POLICY)[0].type, "scale_up");
  assert.ok(evaluateCampaign(anomaly, DEFAULT_POLICY).some((a) => a.type === "alert"));
  // thin data: below minSpend → no budget action (maybe alert only, but no pause/scale)
  const thinActions = evaluateCampaign(thin, DEFAULT_POLICY);
  assert.ok(!thinActions.some((a) => a.type === "pause" || a.type === "scale_up"));
});

test("guardrails clamp scale-up to max change and veto cooldown", () => {
  const action = evaluateCampaign(winner, DEFAULT_POLICY)[0]; // scale_up to 125
  const clamped = applyGuardrails(action, winner, { ...DEFAULT_GUARDRAILS, maxChangePct: 0.1 });
  assert.equal(clamped.vetoed, false);
  assert.equal(clamped.action.toBudget, 110); // +10% cap on 100
  const vetoed = applyGuardrails(action, winner, { ...DEFAULT_GUARDRAILS, cooldownActedIds: ["b"] });
  assert.equal(vetoed.vetoed, true);
});

test("autonomy: suggest proposes everything, autonomous applies within guardrails", () => {
  const snaps = [loser, winner];
  const suggest = runAgent(snaps, "suggest");
  assert.equal(suggest.applied.filter((a) => a.risk !== "none").length, 0); // nothing risky auto-applied
  assert.ok(suggest.proposed.length >= 2);

  const auto = runAgent(snaps, "autonomous");
  assert.ok(auto.applied.some((a) => a.type === "pause"));
  assert.ok(auto.applied.some((a) => a.type === "scale_up"));
  assert.equal(auto.proposed.length, 0); // all auto-applied at autonomous level
});

test("supervised auto-applies low-risk only", () => {
  const decliner: CampaignSnapshot = { id: "e", name: "E", channel: "meta", roas: 2.0, prevRoas: 2.8, spend: 800, conversions: 30, clicks: 900, budgetDaily: 100, status: "active" };
  const sup = runAgent([decliner], "supervised");
  // scale_down is low risk → auto-applied; nothing proposed for this one
  assert.ok(sup.applied.some((a) => a.type === "scale_down"));
});
