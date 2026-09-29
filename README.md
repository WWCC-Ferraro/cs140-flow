# Mail rules

Most mail apps let you write rules: *if the subject contains "receipt", label it
and stop*. You are going to build the part of a mail app that runs those rules.

It needs this whole module at once. Picking what a rule tests is choosing among
many paths. A rule saved by an older version of the app is missing fields, so
defaults have to tell `0` and `false` from "not given". A rule that says *stop*
means leaving a loop early. The server hands the mailbox out a page at a time, so
you make something a `for…of` loop can walk. And archiving removes messages from
the inbox while you are walking it.

## Getting started

1. Create your own repository from this template. On the template's GitHub page,
   choose **Use this template**, then **Create a new repository**.
2. Open it where you write code. Either works; *Set up where your code runs* in
   Start Here covers both.
   - **In a Codespace:** on your new repository, choose **Code**, then
     **Codespaces**, then create one. Node is already installed.
   - **On your own machine:** clone your repository, and check that
     `node --version` prints 22 or later.
3. Run the tests:

   ```
   npm test
   ```

   Almost everything fails. That is the starting point. The tests also run on
   every push, in your repository's **Actions** tab.

To run one file's tests while you work on one task:

```
node --test test/matches.test.js
```

The tests are part of the spec. Each one's name says what it checks, and a
failure message says what came back and which lesson to look at. Read them.

### What you are working with

A **message** is an object like this. `from` and `subject` may be missing.

```js
{ id: "m1", from: "shop@example.com", subject: "Your receipt", size: 48000, read: false }
```

A **rule** looks like this. Older saved rules may have no `enabled` or `stop`.

```js
{ name: "Receipts", field: "subject", value: "receipt", action: "label:receipts", stop: true }
```

The code is in `src/`. Each function has a comment above it that is its full
contract. The `export` in front of each function lets the tests import it; leave
it there.

## Using an AI assistant

`AGENTS.md` in this repository tells AI coding assistants how this course wants
them to help: as a tutor who explains errors, asks questions and gives hints,
not by writing your answers. Most assistants read it automatically. It is in
the open, so read it too. It says what good AI help looks like.

## The tasks

Do them in order. Later tasks call the functions from earlier ones.

### 1. Does this rule match? — `matches` in `src/rules.js`

`matches(rule, message)` works for `"from"` and `"subject"` rules, and it is five
levels deep. Its comment gives the full contract.

1. **Flatten it** with guard clauses. Every input must give the same answer it
   gives now. Run `node --test test/matches.test.js` before and after: the same
   tests should pass.
2. **Extend it.** Add `"larger-than"` and `"any"`. Make a field nobody planned
   for throw an error that names the field. Right now it quietly returns
   `false`, so a broken rule looks like a rule that never matches.

For the fields, choose an `if`/`else if` chain, a `switch` or a lookup table.
Say which, and why, in your answers below.

Tests: `test/matches.test.js`.

### 2. What happens to one message? — `decide` in `src/rules.js`

`decide(rules, message)` tries each rule in order and collects the actions of the
ones that match. A rule with `enabled: false` is skipped. A rule with no
`enabled` is on. A matching rule with `stop: true` ends the list.

```js
const rules = [
  { name: "Receipts", field: "subject", value: "receipt", action: "label:receipts", stop: true },
  { name: "Boss", field: "from", value: "boss@work.example", action: "flag" },
];
decide(rules, { id: "m1", from: "boss@work.example", subject: "Receipt for lunch" });
// ["label:receipts"] — Receipts matched and said stop, so Boss was never tried
```

Two of the tests check what is *not* looked at. A switched-off rule, and every
rule after a stop, must not be tested at all.

Tests: `test/decide.test.js`.

### 3. A mailbox you can loop over — `mailbox` in `src/mailbox.js`

The server does not hand over the whole mailbox. `server.fetchPage(cursor)`
returns one page:

```js
server.fetchPage(null);   // { messages: [m1, m2], next: "p2" }
server.fetchPage("p2");   // { messages: [m3],     next: null }  — the last page
```

`mailbox(server)` returns something `for…of`, spread and destructuring can all
walk, one message at a time, across every page. It fetches a page only when
the messages before it are used up. The same mailbox can be walked twice, and
each walk starts again from the first page.

Tests: `test/mailbox.test.js`. They use a fake server that records every page
you ask for.

### 4. Triage, and stop when you have enough — `triage` in `src/mailbox.js`

`triage(server, rules, options)` walks the mailbox and lists the unread messages
that some rule acts on, with their actions. `options.limit` caps the list, and
once the limit is reached `triage` reads no further. A limit of `0` means none.
No limit means no limit.

The tests count the pages fetched. A version that gets the right answer by
reading the whole mailbox does not pass.

Tests: `test/triage.test.js`.

### 5. Apply the rules to the inbox — `applyToInbox` in `src/inbox.js`

`applyToInbox(inbox, rules)` carries out each message's actions: `"flag"`,
`"label:<name>"` and `"archive"`. Archiving removes the message from `inbox`
itself. The app's screen holds that same array, so change it; do not replace
it. An action nobody planned for throws.

Say how you removed messages in place. Then give an inbox that a plain forward
loop with `splice` gets wrong, and say what it leaves behind.

Tests: `test/inbox.test.js`.

### 6. A design choice — no tests

A user's rules were saved by a newer version of the app. One of them tests a
field this version has never heard of, `"has-attachment"`. Your `matches`
throws, so `decide` throws, and so `triage` stops partway through the mailbox.
Nothing after that message is triaged.

Is that right? Or should `decide` skip a rule it cannot understand and carry on?
Choose one and defend it in two or three sentences. Say what the user sees
either way, and how anyone finds out the rule is being ignored or is failing.
There is no single right answer. There is a wrong one: a choice that does not
say what it costs.

## The review

`review/digest.js` builds a morning digest of unread messages. An AI assistant
wrote it from the spec at the top of the file, and it passed the one check its
author ran. It has **four defects**. Most are about this module; at least one
is about something earlier in the course.

Write your review in `REVIEW.md`. For each defect:

- **Where** — the line or lines.
- **What goes wrong** — in a sentence, and why.
- **An input that shows it** — a concrete call, what it returns, and what the
  spec says it should return.
- **The fix** — the corrected code.

Do not change `review/digest.js`. The review is in `REVIEW.md`. A person reads
it; the tests do not check it.

## Your answers

Fill these in. A sentence or two each.

**Task 1 — chain, `switch` or table for the fields, and why:**

**Task 5 — how you removed messages in place, and an inbox a forward loop gets wrong:**

**Task 6 — throw, or skip the rule, and what it costs:**

## Done means

- `npm test` passes: every test, on the latest push.
- `REVIEW.md` has all four defects, each with its lines, an input and a fix.
- The three answers above are filled in.
