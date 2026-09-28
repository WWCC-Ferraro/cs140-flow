// Task 1 — matches(rule, message)
import test from "node:test";
import assert from "node:assert/strict";
import { matches } from "../src/rules.js";

const show = (v) => (v === undefined ? "undefined" : JSON.stringify(v));

const receipt = { id: "m1", from: "Shop@Example.com", subject: "Your RECEIPT for order 12", size: 48_000 };
const video = { id: "m2", from: "cam@example.com", subject: "Clip", size: 9_000_000 };

function thrown(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return null;
}

test("matches: a 'from' rule matches the sender's address, ignoring case", () => {
  const got = matches({ field: "from", value: "shop@example.com" }, receipt);
  assert.equal(got, true,
    `A "from" rule for shop@example.com should match a message from Shop@Example.com, but matches() returned ${show(got)}. Compare the two addresses in the same case.`);
  const other = matches({ field: "from", value: "shop@example.com" }, video);
  assert.equal(other, false,
    `A "from" rule for shop@example.com matched a message from cam@example.com (returned ${show(other)}).`);
});

test("matches: a 'subject' rule matches text anywhere in the subject, ignoring case", () => {
  const got = matches({ field: "subject", value: "receipt" }, receipt);
  assert.equal(got, true,
    `A "subject" rule for "receipt" should match the subject "Your RECEIPT for order 12", but matches() returned ${show(got)}.`);
  assert.equal(matches({ field: "subject", value: "invoice" }, receipt), false,
    `A "subject" rule for "invoice" matched "Your RECEIPT for order 12".`);
});

test("matches: a message with no subject or no sender does not match a rule on it, and does not throw", () => {
  const bare = { id: "m3", size: 10 };
  const error = thrown(() => {
    assert.equal(matches({ field: "subject", value: "x" }, bare), false,
      `A message with no subject should not match a "subject" rule.`);
    assert.equal(matches({ field: "from", value: "x" }, bare), false,
      `A message with no sender should not match a "from" rule.`);
  });
  if (error instanceof assert.AssertionError) throw error;
  assert.equal(error, null,
    `matches() threw on a message with no subject or sender: ${error?.message}. Something read a property of a missing value — a guard has to come first ("Flattening with guard clauses", ordering the guards).`);
});

test("matches: a missing message matches nothing — even an 'any' rule", () => {
  for (const field of ["from", "subject", "larger-than", "any"]) {
    let got;
    const error = thrown(() => { got = matches({ field, value: "x" }, null); });
    assert.equal(error, null,
      `matches({ field: "${field}" }, null) threw: ${error?.message}. The missing-message guard has to run before anything reads the message.`);
    assert.equal(got, false,
      `matches({ field: "${field}" }, null) returned ${show(got)}, not false. The guards run top to bottom and the first match wins — is the missing-message guard above the one that answers "any"?`);
  }
});

test("matches: a 'larger-than' rule compares the message's size", () => {
  const got = matches({ field: "larger-than", value: 1_000_000 }, video);
  assert.equal(got, true,
    `A 9,000,000-byte message should match "larger-than" 1,000,000, but matches() returned ${show(got)}.`);
  assert.equal(matches({ field: "larger-than", value: 1_000_000 }, receipt), false,
    `A 48,000-byte message matched "larger-than" 1,000,000.`);
});

test("matches: a 'larger-than' rule with no value uses 5,000,000", () => {
  const big = matches({ field: "larger-than" }, video);
  const small = matches({ field: "larger-than" }, receipt);
  assert.equal(big, true,
    `With no value, "larger-than" means 5,000,000 bytes, so a 9,000,000-byte message should match. matches() returned ${show(big)}.`);
  assert.equal(small, false,
    `With no value, "larger-than" means 5,000,000 bytes, so a 48,000-byte message should not match. matches() returned ${show(small)}.`);
});

test("matches: a 'larger-than' value of 0 is a real value, not a missing one", () => {
  const got = matches({ field: "larger-than", value: 0 }, receipt);
  assert.equal(got, true,
    `"larger-than" 0 should match any message with a size, but a 48,000-byte message gave ${show(got)}. A 0 was replaced by the 5,000,000 default: which operator falls back only when the value is missing? ("What &&, || and ?? return")`);
});

test("matches: an 'any' rule matches every message", () => {
  assert.equal(matches({ field: "any" }, receipt), true, `An "any" rule did not match a message.`);
  assert.equal(matches({ field: "any" }, { id: "m9" }), true, `An "any" rule did not match a message with no sender, subject or size.`);
});

test("matches: a field nobody planned for throws, naming the field", () => {
  let got;
  const error = thrown(() => { got = matches({ field: "has-attachment", value: true }, receipt); });
  assert.ok(error,
    `matches() with the field "has-attachment" returned ${show(got)} instead of throwing. A quiet false makes a broken rule look like a rule that never matches. What does your default do? ("Choosing among many paths", what the default catches)`);
  assert.match(String(error.message), /has-attachment/,
    `matches() threw, but its message — "${error.message}" — does not name the field. Put the field in the message so the rule can be found.`);
});

test("matches: a field named like a built-in object property is still unknown", () => {
  for (const field of ["constructor", "toString"]) {
    let got;
    const error = thrown(() => { got = matches({ field, value: "x" }, receipt); });
    assert.ok(error,
      `matches() with the field "${field}" returned ${show(got)} instead of throwing. A plain object answers for names you never wrote, like "${field}". Check with a Map, or Object.hasOwn — not with \`in\` or a truthiness test ("Choosing among many paths", lookup tables).`);
    assert.match(String(error.message), new RegExp(field),
      `matches() threw for the field "${field}", but the message "${error.message}" does not name it.`);
  }
});
