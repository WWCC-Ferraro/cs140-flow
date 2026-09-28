// Task 2 — decide(rules, message)
import test from "node:test";
import assert from "node:assert/strict";
import { decide } from "../src/rules.js";

const show = (v) => (v === undefined ? "undefined" : JSON.stringify(v));

const message = { id: "m1", from: "shop@example.com", subject: "Your receipt", size: 48_000 };

const fromShop = { name: "Shop", field: "from", value: "shop@example.com", action: "label:shopping" };
const receipts = { name: "Receipts", field: "subject", value: "receipt", action: "label:receipts" };
const everything = { name: "Flag all", field: "any", action: "flag" };
const huge = { name: "Huge", field: "larger-than", value: 1_000_000, action: "archive" };
// A rule saved by a newer version of the app. Looking at its field throws.
const fromTheFuture = { name: "Attachments", field: "has-attachment", value: true, action: "flag" };

test("decide: gives the action of every matching rule, in rule order", () => {
  const got = decide([fromShop, huge, receipts, everything], message);
  assert.deepEqual(got, ["label:shopping", "label:receipts", "flag"],
    `Three of the four rules match (not "Huge"), so decide() should give their actions in rule order. It gave ${show(got)}.`);
});

test("decide: no rules, or no matching rule, gives an empty list", () => {
  assert.deepEqual(decide([], message), [], `decide() with no rules should give [].`);
  const got = decide([huge], message);
  assert.deepEqual(got, [], `No rule matches, so decide() should give []. It gave ${show(got)}.`);
});

test("decide: a rule with enabled: false is skipped", () => {
  const got = decide([{ ...receipts, enabled: false }, everything], message);
  assert.deepEqual(got, ["flag"],
    `The "Receipts" rule is switched off (enabled: false), so only "flag" should come back. decide() gave ${show(got)}. If a false \`enabled\` became true, look at which operator supplied the default.`);
});

test("decide: a rule with no enabled property is on", () => {
  const got = decide([receipts, everything], message);
  assert.deepEqual(got, ["label:receipts", "flag"],
    `Neither rule says anything about \`enabled\`, so both are on. decide() gave ${show(got)}. A missing \`enabled\` is undefined — falsy, but it means "not switched off". Ask whether it is absent, not whether it is falsy ("What &&, || and ?? return").`);
});

test("decide: a disabled rule's field is never looked at", () => {
  let got;
  try {
    got = decide([{ ...fromTheFuture, enabled: false }, everything], message);
  } catch (error) {
    assert.fail(`decide() threw "${error.message}" on a rule that is switched off. A disabled rule is skipped before anything tests it — leave the pass first, then match ("Choosing a loop, and leaving early", continue).`);
  }
  assert.deepEqual(got, ["flag"], `decide() gave ${show(got)}; only "flag" should come back.`);
});

test("decide: a matching rule with stop: true ends the list", () => {
  const got = decide([{ ...receipts, stop: true }, everything], message);
  assert.deepEqual(got, ["label:receipts"],
    `"Receipts" matched and says stop, so "flag" should not be added. decide() gave ${show(got)}. What leaves a loop, rather than just this pass? If you used forEach, \`return\` ends only one call.`);
});

test("decide: after a stop, later rules are not even looked at", () => {
  let got;
  try {
    got = decide([{ ...receipts, stop: true }, fromTheFuture], message);
  } catch (error) {
    assert.fail(`decide() threw "${error.message}" from a rule after one that said stop. Once a rule stops the list, no later rule is tested at all.`);
  }
  assert.deepEqual(got, ["label:receipts"], `decide() gave ${show(got)}.`);
});

test("decide: a stop rule that does not match stops nothing", () => {
  const got = decide([{ ...huge, stop: true }, receipts], message);
  assert.deepEqual(got, ["label:receipts"],
    `"Huge" says stop, but it did not match this message, so "Receipts" still gets its turn. decide() gave ${show(got)}.`);
});
