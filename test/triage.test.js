// Task 4 — triage(server, rules, options)
// triage uses mailbox() from Task 3 and decide() from Task 2; if those fail
// their own tests, fix them first.
import test from "node:test";
import assert from "node:assert/strict";
import { triage } from "../src/mailbox.js";

const show = (v) => (v === undefined ? "undefined" : JSON.stringify(v));

/** A stand-in for the mail server. `fetched` records every cursor asked for. */
function fakeServer(pages) {
  const fetched = [];
  return {
    fetched,
    fetchPage(cursor) {
      fetched.push(cursor);
      const i = cursor === null ? 0 : Number(cursor.slice(1)) - 1;
      if (!pages[i]) throw new Error(`fake server: no page for cursor ${show(cursor)}`);
      const next = i + 1 < pages.length ? "p" + (i + 2) : null;
      return { messages: pages[i], next };
    },
  };
}

const rules = [
  { name: "Receipts", field: "subject", value: "receipt", action: "label:receipts", stop: true },
  { name: "Boss", field: "from", value: "boss@work.example", action: "flag" },
];

const msg = (id, subject, extra = {}) => ({ id, from: "x@example.com", subject, ...extra });

const pages = () => [
  [msg("m1", "Receipt #1"), msg("m2", "lunch?"), msg("m3", "hello", { from: "boss@work.example" })],
  [msg("m4", "old receipt", { read: true }), msg("m5", "Receipt #2")],
  [msg("m6", "Receipt #3")],
];

test("triage: lists each unread message a rule acts on, with its actions, in order", () => {
  const got = triage(fakeServer(pages()), rules, {});
  assert.deepEqual(got, [
    { id: "m1", actions: ["label:receipts"] },
    { id: "m3", actions: ["flag"] },
    { id: "m5", actions: ["label:receipts"] },
    { id: "m6", actions: ["label:receipts"] },
  ], `triage() gave ${show(got)}.`);
});

test("triage: a message already read is skipped, even when a rule matches it", () => {
  const got = triage(fakeServer(pages()), rules, {}).map((r) => r.id);
  assert.ok(!got.includes("m4"),
    `m4 is read, but triage() listed it: ${show(got)}. Skip a read message and go on to the next one.`);
});

test("triage: a message no rule acts on is not listed", () => {
  const got = triage(fakeServer(pages()), rules, {}).map((r) => r.id);
  assert.ok(!got.includes("m2"), `No rule acts on m2 ("lunch?"), but triage() listed it: ${show(got)}.`);
});

test("triage: a limit stops the list at that many results", () => {
  const got = triage(fakeServer(pages()), rules, { limit: 3 }).map((r) => r.id);
  assert.deepEqual(got, ["m1", "m3", "m5"], `With limit 3, triage() gave ${show(got)}.`);
});

test("triage: once the limit is reached, no further page is fetched", () => {
  const server = fakeServer(pages());
  const got = triage(server, rules, { limit: 2 }).map((r) => r.id);
  assert.deepEqual(got, ["m1", "m3"], `With limit 2, triage() gave ${show(got)}.`);
  assert.deepEqual(server.fetched, [null],
    `Both results are on page 1, and m3 is its last message, yet the server was asked for ${show(server.fetched)}. Leave the loop the moment the limit is reached — not at the top of the next pass, which asks the mailbox for one more message. If triage() spreads the whole mailbox into an array first, it reads everything. And check that mailbox() itself fetches lazily (Task 3).`);
});

test("triage: a limit of 0 means none", () => {
  const got = triage(fakeServer(pages()), rules, { limit: 0 });
  assert.deepEqual(got, [],
    `With limit 0, triage() gave ${show(got)}. A 0 was treated as "no limit given". Which operator falls back only when the value is missing? ("What &&, || and ?? return")`);
});

test("triage: no limit given means no limit", () => {
  const withEmpty = triage(fakeServer(pages()), rules, {});
  const withNone = triage(fakeServer(pages()), rules);
  assert.equal(withEmpty.length, 4, `With options {}, triage() gave ${withEmpty.length} results, not all 4.`);
  assert.equal(withNone.length, 4,
    `With no options at all, triage() gave ${withNone.length} results, not all 4. \`options\` may be undefined — reading a property of it throws unless something stops the chain first.`);
});
