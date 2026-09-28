// The morning digest: one line per unread message, most important first.
//
// Written by an AI assistant from the spec below, and handed to you for
// review. (An illustration made for this course, not a real transcript.)
// It passed the one check its author ran: three unread messages, default
// options. Nothing runs this file — read it the way you would read a
// teammate's pull request.
//
// Spec
//   messages          — the app's inbox array. Other code holds it too.
//   options.maxLines  — how many lines the digest may hold. Missing means 10.
//                       0 means the user has switched the digest off: no lines.
//   A message's priority is "urgent", "high", "normal" or "low", and ranks
//   in that order. Anything else is a mistake in the data.

export function digest(messages, options = {}) {
  const maxLines = options.maxLines || 10;

  // Drop the ones already read.
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].read) {
      messages.splice(i, 1);
    }
  }

  const ranked = messages.map((m) => ({ m, score: scoreFor(m) }));
  ranked.sort((a, b) => b.score - a.score);

  const lines = [];
  for (const { m } of ranked) {
    if (lines.length === maxLines) break;
    lines.push(m.from + ": " + m.subject);
  }
  return lines;
}

function scoreFor(message) {
  let score = 0;
  switch (message.priority) {
    case "urgent":
      score = 3;
    case "high":
      score = 2;
      break;
    case "normal":
      score = 1;
      break;
    case "low":
      score = 0;
      break;
  }
  return score;
}
