// Mail rules: does one rule match one message, and what happens to a message
// when every rule has had its turn.
//
// The `export` in front of each function lets the tests import it. Modules are
// a later part of the course; leave those words where they are.

/**
 * Does `rule` match `message`?  (Task 1)
 *
 * A missing message (null or undefined) matches nothing.
 * rule.field decides what is tested:
 *   "from"        — message.from equals rule.value, ignoring case
 *   "subject"     — message.subject contains rule.value, ignoring case
 *   "larger-than" — message.size is greater than rule.value;
 *                   no value means 5_000_000. A value of 0 is a real value.
 *   "any"         — every message
 * A message with no `from` or no `subject` does not match a rule on it.
 * Any other field is a mistake in the rule: throw an Error whose message
 * names the field.
 *
 * This version works for "from" and "subject" and nothing else. Flatten it
 * first, then extend it.
 *
 * @param {{ field: string, value?: any }} rule
 * @param {object | null | undefined} message
 * @returns {boolean}
 */
export function matches(rule, message) {
  if (message) {
    if (rule.field === "from") {
      if (message.from) {
        return message.from.toLowerCase() === rule.value.toLowerCase();
      } else {
        return false;
      }
    } else {
      if (rule.field === "subject") {
        if (message.subject) {
          return message.subject.toLowerCase().includes(rule.value.toLowerCase());
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}

/**
 * The actions the rules give one message, in rule order.  (Task 2)
 *
 * Rules are tried in the order given. For each rule:
 *   - enabled: false  — skip it; do not even look at its field.
 *                       A rule with no `enabled` property is on.
 *   - if it matches, add its `action` to the list.
 *   - stop: true on a rule that matched — no later rule is looked at.
 *
 * @param {Array<{ field: string, value?: any, action: string, enabled?: boolean, stop?: boolean }>} rules
 * @param {object} message
 * @returns {string[]} e.g. ["flag", "label:receipts"]
 */
export function decide(rules, message) {
  throw new Error("not implemented");
}
