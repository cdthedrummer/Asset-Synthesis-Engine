import { NlMove, NlProgress } from '@workspace/api-client-react';

/**
 * Every line shown when the owner finishes something.
 *
 * Deterministic and composed on the client — no model call. Two reasons: a
 * button press can't wait on a round trip, and a model asked to celebrate will
 * gush, which is the one thing the voice forbids.
 *
 * RULES FOR EDITING THIS FILE (from the voice spec — don't relax them):
 *   no emoji, ever
 *   exclamation points almost never — in practice, never here
 *   no gushing: warmth is carried by being SPECIFIC, not by adjectives
 *   one idea per line, short sentences, contractions fine
 *   never congratulate them for opening the board or for talking to us
 */

const REP_NOUN: Record<string, string> = {
  email: 'email',
  post: 'post',
  pitch: 'pitch',
  plan: 'plan',
  message: 'message',
  none: 'draft',
};

export function moveDoneLine({
  move,
  progress,
  pinTitle,
  dodgedText,
}: {
  move: NlMove;
  progress: NlProgress;
  pinTitle?: string;
  dodgedText?: string | null;
}): string {
  // The best line available, and it costs one string match: the last check-in
  // already named what they were avoiding. If they just did that thing, say so.
  if (pinTitle && dodgedText && dodgedText.toLowerCase().includes(pinTitle.toLowerCase())) {
    return "That's the one you kept walking past. It's done.";
  }
  if (progress.cycle.open === 0) {
    return 'All three, closed. The next check-in gets you three more.';
  }
  if (move.repDraft) {
    return `The ${REP_NOUN[move.repKind] ?? 'draft'} is written and the move's closed. That's the part people stall on.`;
  }
  if (progress.done === 1) {
    return 'That\'s one. The board has something real on it now.';
  }
  if (pinTitle) {
    return `Done. ${pinTitle} moves because of that one.`;
  }
  return `${progress.cycle.done} of 3 this round. ${progress.cycle.open} left.`;
}

/**
 * Dropping a move is a legitimate completion, not a gap — the whole product is
 * triage relief. Acknowledged in muted type, never in the accent colour.
 */
export function moveSkippedLine(): string {
  return "Dropped. That's a decision, not a gap.";
}
