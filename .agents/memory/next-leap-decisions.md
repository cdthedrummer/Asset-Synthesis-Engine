---
name: Next Leap design decisions
description: Chat board-edit protocol and other Next Leap architecture decisions
---

## Chat board edits (ACTIONS marker)
Board/pin chat can edit the board via a second hidden trailing marker line `ACTIONS: [...]` (same holdback filter as `OPTIONS:`, generalized to a prefix list). Rules:
- **Server-side allowlist**: chat may only apply `upsertPin` *with a valid ref*, `deletePin`, `touchPin`. All other ops in the shared op vocabulary (new pins, moves, bet, statChips, trajectory, intake) are filtered out before applyOps — prompt injection can make the model emit them, so the prompt alone is not the boundary.
- **Apply ops AFTER persisting the assistant message.** In pin-scoped chat the model may delete the very pin the thread hangs off; persisting first lets the FK cascade take the thread with the pin instead of the insert hitting a dead pinId.
- **Persist the filtered stream output** (what the user actually saw), not raw-minus-trailing-markers — keeps stored history identical to displayed and marker-free even in malformed orderings.
- Demo boards: prompt tells the model to decline AND the server skips applying — both layers required.
- Client refetches the board on a `boardChanged` SSE event sent before `done`.

**Why:** an LLM with write access to user data needs the mutation boundary enforced server-side; ordering matters because chat actions can destroy their own thread's parent row.

## Merging pins (the data-loss fix)
`nl_tasks.pinId` and `nl_messages.pinId` are both `onDelete: "cascade"`, and `chatSystem` used to tell the model to clean up duplicates by upserting a survivor then `deletePin`-ing the copies. Every one of those merges silently destroyed the checklist items the owner typed and the pin's whole chat thread; `nl_moves.pinId` is `set null`, so committed moves orphaned as well.

So merging is a server primitive, not two ops:
- `mergePins()` (`merge.ts`) runs in **one transaction** — seven statements that must not half-apply. Re-parent tasks (de-duping by label, keeping a tick if either side had it), re-parent messages and insert one seam line, re-parent moves, union and rewrite `relatedPinIds` across the whole board, **re-point `nl_boards.bet.pinId`** (deletePinAndScrub drops it; a merge must keep it), and only then delete.
- `{"op":"mergePin","survivorRef","absorbRefs","pin"}` is in the chat ACTIONS allowlist alongside `deletePin`/`touchPin`/`upsertPin`-with-ref. The prompt now says to use it *because* deletePin destroys user-typed data.
- `verifyYourself` is sticky through a merge (OR of both sides), and `normalizePin` forces a verify-yourself pin off a `start` verdict — `OPS_SPEC` calls that rail non-negotiable, and a prompt cannot be non-negotiable.

## Tightness is enforced, not requested
`MAX_PINS = 9` in `applyOps`: an insert past the ceiling is queued as `overflow` and handed to one `consolidateSystem` pass, never silently inserted and never silently dropped. Near-duplicate titles fold into the matched pin instead of creating a twin (`dedup.ts`: normalized token-set Jaccard ≥ 0.6, or ≥ 0.4 with a matching `kind`, plus an identical-vizData fingerprint). `groomBoard()` runs at the interview reveal, on check-in, and on overflow, and finishes with a **deterministic fallback** (`pickSurvivor`: highest impact, then most tasks, then most messages, then most recent) so duplicates get resolved even with a dead model. Known accepted miss: abbreviations ("Instagram preorders" vs "IG preorder posts") — token overlap can't catch those, and the groom pass or a chat cleanup does.

## Interview budget
`MAX_INTERVIEW_QUESTIONS = 5`, stated in the prompt **and** force-finished in `/answers` when `questionsAsked` reaches it. A chatty model would otherwise outlive the cap, and the entire point of the shorter interview is that it ends. The client mirrors the constant in `interview-constants.ts` purely to draw honest progress dots.

