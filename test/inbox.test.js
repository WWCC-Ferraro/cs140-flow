// Task 5 — applyToInbox(inbox, rules)
// applyToInbox uses decide() from Task 2; if it fails its own tests, fix it first.
import test from "node:test";
import assert from "node:assert/strict";
import { applyToInbox } from "../src/inbox.js";

const show = (v) => (v === undefined ? "undefined" : JSON.stringify(v));
const ids = (messages) => messages.map((m) => m.id);

// Subjects decide what happens: "spam" is archived, "urgent" is flagged,
// "invoice" is labelled.
const rules = [
  { name: "Spam", field: "subject", value: "spam", action: "archive" },
  { name: "Urgent", field: "subject", value: "urgent", action: "flag" },
  { name: "Invoices", field: "subject", value: "invoice", action: "label:money" },
];
const msg = (id, subject, extra = {}) => ({ id, from: "x@example.com", subject, ...extra });

test("applyToInbox: 'flag' sets flagged on the message", () => {
  const m = msg("a", "urgent: call back");
  applyToInbox([m], rules);
  assert.equal(m.flagged, true, `An "urgent" message should have flagged: true. It has ${show(m.flagged)}.`);
});

test("applyToInbox: 'label:<name>' adds the label, creating the list if needed", () => {
  const m = msg("a", "invoice 7");
  applyToInbox([m], rules);
  assert.deepEqual(m.labels, ["money"], `A message with no labels should end with ["money"]. It has ${show(m.labels)}.`);
});

test("applyToInbox: a label is added to the labels already there, once", () => {
  const m = msg("a", "invoice 8", { labels: ["work", "money"] });
  const n = msg("b", "invoice 9", { labels: ["work"] });
  applyToInbox([m, n], rules);
  assert.deepEqual(m.labels, ["work", "money"], `A message already labelled "money" should not get it twice. It has ${show(m.labels)}.`);
  assert.deepEqual(n.labels, ["work", "money"], `The existing label should be kept. The message has ${show(n.labels)}.`);
});

test("applyToInbox: 'archive' removes the message from the inbox", () => {
  const inbox = [msg("a", "hi"), msg("b", "spam!"), msg("c", "hello")];
  applyToInbox(inbox, rules);
  assert.deepEqual(ids(inbox), ["a", "c"], `After archiving "b", the inbox holds ${show(ids(inbox))}.`);
});

test("applyToInbox: two archived messages side by side are both removed", () => {
  const inbox = [msg("a", "hi"), msg("b", "spam 1"), msg("c", "spam 2"), msg("d", "hello")];
  applyToInbox(inbox, rules);
  assert.deepEqual(ids(inbox), ["a", "d"],
    `b and c are both spam, but the inbox ends as ${show(ids(inbox))}. Removing b slid c into the place the loop had just finished with, and the loop moved past it. Step through it by hand, index against array ("Mutating while traversing").`);
});

test("applyToInbox: archiving the last message works", () => {
  const inbox = [msg("a", "hi"), msg("b", "spam")];
  let error = null;
  try { applyToInbox(inbox, rules); } catch (e) { error = e; }
  assert.equal(error, null, `applyToInbox() threw "${error?.message}" when the last message was archived. After a removal, does the loop read a position that no longer holds a message?`);
  assert.deepEqual(ids(inbox), ["a"], `The inbox ends as ${show(ids(inbox))}.`);
});

test("applyToInbox: when every message is archived, the inbox ends empty", () => {
  const inbox = [msg("a", "spam"), msg("b", "spam"), msg("c", "spam")];
  applyToInbox(inbox, rules);
  assert.deepEqual(ids(inbox), [], `Every message is spam, but the inbox still holds ${show(ids(inbox))}. Count how many a forward loop skips.`);
});

test("applyToInbox: the inbox array itself is changed, not replaced", () => {
  const inbox = [msg("a", "spam"), msg("b", "hi")];
  const screen = inbox; // the app's screen holds the same array
  applyToInbox(inbox, rules);
  assert.equal(screen, inbox, "the test's own two names should still be one array");
  assert.deepEqual(ids(screen), ["b"],
    `The screen's array still holds ${show(ids(screen))}. Assigning a new array to the parameter changes only your function's name for it; the caller's array is untouched ("Copying versus aliasing"). Remove from the array you were given.`);
});

test("applyToInbox: returns the archived messages, in inbox order", () => {
  const a = msg("a", "spam 1"), b = msg("b", "hi"), c = msg("c", "spam 2");
  const got = applyToInbox([a, b, c], rules);
  assert.ok(Array.isArray(got), `applyToInbox() returned ${show(got)}, not an array.`);
  assert.deepEqual(ids(got), ["a", "c"], `The archived messages came back as ${show(ids(got))}.`);
  assert.equal(got[0], a, "Return the message objects themselves, not copies.");
});

test("applyToInbox: an archived message still gets its other actions", () => {
  const m = msg("a", "urgent spam");
  applyToInbox([m], rules);
  assert.equal(m.flagged, true,
    `"urgent spam" is archived and flagged. It was archived, but flagged is ${show(m.flagged)}. Archiving one action should not stop the others.`);
});

test("applyToInbox: an action nobody planned for throws, naming it", () => {
  const odd = [{ name: "Snooze", field: "any", action: "snooze:2h" }];
  let error = null;
  try { applyToInbox([msg("a", "hi")], odd); } catch (e) { error = e; }
  assert.ok(error, `The action "snooze:2h" was accepted without complaint. An action nobody planned for is a mistake: what does your default do?`);
  assert.match(String(error.message), /snooze:2h/,
    `applyToInbox() threw "${error.message}", which does not name the action "snooze:2h".`);
});
