// Reading a mailbox from a server that hands it out one page at a time.

import { decide } from "./rules.js";

/**
 * Every message on the server, in order, as something for…of can walk.  (Task 3)
 *
 * server.fetchPage(cursor) returns one page: { messages: [...], next }.
 *   - Ask for the first page with fetchPage(null).
 *   - `next` is the cursor for the page after this one, or null on the last page.
 *   - A page can be empty and still have a `next`. That is not the end.
 *
 * Fetch a page only when the messages before it have been used up — nothing
 * is fetched until someone starts walking. Every walk starts again from the
 * first page, so the same mailbox can be spread twice.
 *
 * @param {{ fetchPage(cursor: string | null): { messages: object[], next: string | null } }} server
 * @returns {Iterable<object>}
 */
export function mailbox(server) {
  throw new Error("not implemented");
}

/**
 * The unread messages some rule acts on, with their actions.  (Task 4)
 *
 * Walk mailbox(server) in order. Skip messages whose `read` is true. Run
 * decide(rules, message); a message that gets no actions is not listed.
 * Each result is { id: message.id, actions }.
 *
 * options.limit — stop once this many results are found, and read no
 *   further: never fetch a page you do not need. No limit given means no
 *   limit. A limit of 0 means none: return []. `options` may be missing.
 *
 * @param {object} server
 * @param {Array<object>} rules
 * @param {{ limit?: number }} [options]
 * @returns {Array<{ id: string, actions: string[] }>}
 */
export function triage(server, rules, options) {
  throw new Error("not implemented");
}
