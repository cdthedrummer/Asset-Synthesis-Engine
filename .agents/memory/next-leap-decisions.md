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
