// Applying the rules to the inbox the app is showing.

import { decide } from "./rules.js";

/**
 * Apply every rule's action to the messages in `inbox`, in place.  (Task 5)
 *
 * decide(rules, message) gives each message its actions. Each action is one of:
 *   "archive"        — remove the message from `inbox`
 *   "flag"           — set message.flagged to true
 *   "label:<name>"   — add <name> to message.labels, creating the array if
 *                      it is missing, and not adding a label that is already there
 *   anything else    — a mistake: throw an Error that names the action
 * An archived message still gets its other actions.
 *
 * `inbox` is the array the app's screen is showing, and other code holds it
 * too. Change that array; do not build a new one and reassign the name.
 *
 * @param {object[]} inbox
 * @param {Array<object>} rules
 * @returns {object[]} the archived messages, in the order they were in the inbox
 */
export function applyToInbox(inbox, rules) {
  throw new Error("not implemented");
}
