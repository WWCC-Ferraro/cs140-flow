// Task 3 — mailbox(server)
import test from "node:test";
import assert from "node:assert/strict";
import { mailbox } from "../src/mailbox.js";

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
      return { messages: pages[i].map((id) => ({ id })), next };
    },
  };
}

const ids = (messages) => messages.map((m) => m.id);

test("mailbox: yields every message, across pages, in order", () => {
  const server = fakeServer([["a", "b"], ["c"], ["d", "e"]]);
  let got;
  try {
    got = ids([...mailbox(server)]);
  } catch (error) {
    assert.fail(`Spreading mailbox(server) threw "${error.message}". Spread works on anything with a [Symbol.iterator] method that returns an iterator ("How a loop gets its next value").`);
  }
  assert.deepEqual(got, ["a", "b", "c", "d", "e"], `Spreading the mailbox gave ${show(got)}.`);
});

test("mailbox: follows each page's next cursor, starting from null", () => {
  const server = fakeServer([["a"], ["b"], ["c"]]);
  for (const message of mailbox(server)) { /* walk it all */ }
  assert.deepEqual(server.fetched, [null, "p2", "p3"],
    `The pages should be fetched with null, then each page's \`next\`. The server was asked for ${show(server.fetched)}.`);
});

test("mailbox: fetches nothing until someone starts walking", () => {
  const server = fakeServer([["a"], ["b"]]);
  mailbox(server);
  assert.deepEqual(server.fetched, [],
    `Just calling mailbox(server) fetched ${show(server.fetched)}. Fetch inside the walk — when the first value is asked for — not when the mailbox is made.`);
});

test("mailbox: taking the first message fetches only the first page", () => {
  const server = fakeServer([["a", "b"], ["c"]]);
  const [first] = mailbox(server);
  assert.equal(first?.id, "a", `Destructuring the first message gave ${show(first)}.`);
  assert.deepEqual(server.fetched, [null],
    `Taking one message fetched ${show(server.fetched)}. A page should be fetched only when the messages before it are used up. Reading every page into an array first is the eager version the task rules out.`);
});

test("mailbox: the same mailbox can be walked twice", () => {
  const server = fakeServer([["a", "b"], ["c"]]);
  const box = mailbox(server);
  const first = ids([...box]);
  const second = ids([...box]);
  assert.deepEqual(first, ["a", "b", "c"], `The first walk gave ${show(first)}.`);
  assert.deepEqual(second, ["a", "b", "c"],
    `The second walk gave ${show(second)}. Each walk asks for a fresh iterator, so the state of a walk — which page you are on — has to be made inside [Symbol.iterator], not once outside it. And an iterator (or a generator object) is used up after one walk: mailbox() has to return something that makes a new one each time.`);
  assert.deepEqual(server.fetched, [null, "p2", null, "p2"],
    `Both walks should start again from the first page. The server was asked for ${show(server.fetched)}.`);
});

test("mailbox: an empty page in the middle is not the end", () => {
  const server = fakeServer([["a"], [], ["b"]]);
  const got = ids([...mailbox(server)]);
  assert.deepEqual(got, ["a", "b"],
    `Page 2 is empty but has a \`next\`, so the walk should carry on to page 3. It gave ${show(got)}. The end is when \`next\` is null — not when a page has no messages.`);
});

test("mailbox: an empty mailbox yields nothing", () => {
  const server = fakeServer([[]]);
  const got = [...mailbox(server)];
  assert.deepEqual(got, [], `A mailbox whose only page is empty gave ${show(got)}.`);
  assert.deepEqual(server.fetched, [null], `The server was asked for ${show(server.fetched)}.`);
});
