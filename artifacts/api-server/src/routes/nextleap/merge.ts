/**
 * Merging two pins into one, without destroying anything the owner typed.
 *
 * THE BUG THIS FIXES. `chatSystem` tells the model to clean up duplicates by
 * upserting a survivor and then `deletePin`-ing each copy. But `nl_tasks.pinId`
 * and `nl_messages.pinId` are both `onDelete: "cascade"`, so every one of those
 * merges silently took with it the checklist items the owner wrote in their own
 * words and the entire chat thread they had on that pin. `nl_moves.pinId` is
 * `set null`, so committed moves quietly orphaned too. The board looked tidier
 * and the owner's work was gone.
 *
 * So merging becomes a real server primitive: re-parent first, delete second,
 * all inside one transaction. Seven statements that must not half-apply — a
 * mid-sequence failure would leave messages pointing at a row about to vanish.
 */

import { and, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  nlBoards,
  nlMessages,
  nlMoves,
  nlPins,
  nlTasks,
  type NlBoard,
} from "@workspace/db";
import { logger } from "../../lib/logger";

export interface MergeResult {
  survivorId: number;
  absorbedIds: number[];
}

/**
 * Fold `absorbedIds` into `survivorId`. Both must be on `board`.
 *
 * `survivorPatch` is the already-normalized survivor pin (run it through
 * normalizePin before calling) — pass null to keep the survivor's own fields
 * and only inherit the absorbed pins' attachments.
 */
export async function mergePins(
  board: NlBoard,
  survivorId: number,
  absorbedIdsRaw: number[],
  survivorPatch: Record<string, unknown> | null,
): Promise<MergeResult | null> {
  const absorbedIds = [...new Set(absorbedIdsRaw)].filter(
    (id) => Number.isInteger(id) && id !== survivorId,
  );
  if (absorbedIds.length === 0) return null;

  return db.transaction(async (tx) => {
    const boardPins = await tx
      .select()
      .from(nlPins)
      .where(eq(nlPins.boardId, board.id));
    const survivor = boardPins.find((p) => p.id === survivorId);
    if (!survivor) return null;
    const absorbed = boardPins.filter((p) => absorbedIds.includes(p.id));
    if (absorbed.length === 0) return null;
    const absorbedRealIds = absorbed.map((p) => p.id);

    // 1. Checklist items move across, then de-dup by label within the survivor.
    //    "Call the inspector" ticked on one copy and open on the other survives
    //    as ticked — never lose a completion to housekeeping.
    const survivorTasks = await tx
      .select()
      .from(nlTasks)
      .where(eq(nlTasks.pinId, survivorId));
    const incomingTasks = await tx
      .select()
      .from(nlTasks)
      .where(inArray(nlTasks.pinId, absorbedRealIds));
    let nextOrder =
      survivorTasks.reduce((max, t) => Math.max(max, t.orderIndex), -1) + 1;
    const byLabel = new Map(
      survivorTasks.map((t) => [t.label.trim().toLowerCase(), t]),
    );
    for (const task of incomingTasks) {
      const existing = byLabel.get(task.label.trim().toLowerCase());
      if (existing) {
        if (task.done && !existing.done) {
          await tx
            .update(nlTasks)
            .set({ done: true, doneAt: task.doneAt ?? new Date() })
            .where(eq(nlTasks.id, existing.id));
        }
        await tx.delete(nlTasks).where(eq(nlTasks.id, task.id));
        continue;
      }
      await tx
        .update(nlTasks)
        .set({ pinId: survivorId, orderIndex: nextOrder++ })
        .where(eq(nlTasks.id, task.id));
      byLabel.set(task.label.trim().toLowerCase(), { ...task, pinId: survivorId });
    }

    // 2. Chat threads move across and interleave by createdAt. One sentence at
    //    the seam so the owner can see what happened — words belong in the
    //    chat, never on the pin.
    await tx
      .update(nlMessages)
      .set({ pinId: survivorId })
      .where(inArray(nlMessages.pinId, absorbedRealIds));
    const absorbedTitles = absorbed.map((p) => p.title).join(", ");
    await tx.insert(nlMessages).values({
      boardId: board.id,
      pinId: survivorId,
      role: "assistant",
      content:
        absorbed.length === 1
          ? `Folded ${absorbedTitles} into this one — same thing, two cards. Its history is above.`
          : `Folded ${absorbedTitles} into this one — all the same thing. Their history is above.`,
    });

    // 3. Committed moves follow the pin they serve. They're `set null` on
    //    delete, so skipping this orphans them from the board they belong to.
    await tx
      .update(nlMoves)
      .set({ pinId: survivorId })
      .where(inArray(nlMoves.pinId, absorbedRealIds));

    // 4. Related-pin links: union onto the survivor, then rewrite every other
    //    pin's list so nothing still points at an id that's about to go.
    const survivorRelated = new Set<number>(
      ((survivor.relatedPinIds as number[] | null) ?? []).filter(
        (id) => id !== survivorId && !absorbedRealIds.includes(id),
      ),
    );
    for (const p of absorbed) {
      for (const id of ((p.relatedPinIds as number[] | null) ?? [])) {
        if (id !== survivorId && !absorbedRealIds.includes(id)) survivorRelated.add(id);
      }
    }
    await tx
      .update(nlPins)
      .set({ relatedPinIds: [...survivorRelated] })
      .where(eq(nlPins.id, survivorId));
    for (const p of boardPins) {
      if (p.id === survivorId || absorbedRealIds.includes(p.id)) continue;
      const rel = (p.relatedPinIds as number[] | null) ?? [];
      if (!rel.some((id) => absorbedRealIds.includes(id))) continue;
      const rewritten = [
        ...new Set(
          rel.map((id) => (absorbedRealIds.includes(id) ? survivorId : id)),
        ),
      ].filter((id) => id !== p.id);
      await tx
        .update(nlPins)
        .set({ relatedPinIds: rewritten })
        .where(eq(nlPins.id, p.id));
    }

    // 5. The abandon-bet keeps its target. deletePinAndScrub drops the link;
    //    a merge must move it, because the bet is the product's payoff line and
    //    an unlinked bet can't be tapped through to its pin.
    const bet = (board.bet ?? null) as Record<string, unknown> | null;
    if (bet && absorbedRealIds.includes(Number(bet["pinId"]))) {
      await tx
        .update(nlBoards)
        .set({
          bet: { ...bet, pinId: survivorId, pinTitle: survivor.title },
          updatedAt: new Date(),
        })
        .where(eq(nlBoards.id, board.id));
    }

    // 6. Now nothing points at them, so the cascade has nothing to take.
    await tx
      .delete(nlPins)
      .where(
        and(eq(nlPins.boardId, board.id), inArray(nlPins.id, absorbedRealIds)),
      );

    // 7. The survivor becomes the merged pin.
    if (survivorPatch) {
      await tx
        .update(nlPins)
        .set({
          ...survivorPatch,
          // Verify-yourself is sticky: a permit pin folded into a non-permit
          // pin must never lose the flag that says "don't take our word".
          verifyYourself:
            survivor.verifyYourself ||
            absorbed.some((p) => p.verifyYourself) ||
            survivorPatch["verifyYourself"] === true,
          lastTouchedAt: new Date(),
        })
        .where(eq(nlPins.id, survivorId));
    } else if (absorbed.some((p) => p.verifyYourself) && !survivor.verifyYourself) {
      await tx
        .update(nlPins)
        .set({ verifyYourself: true, lastTouchedAt: new Date() })
        .where(eq(nlPins.id, survivorId));
    } else {
      await tx
        .update(nlPins)
        .set({ lastTouchedAt: new Date() })
        .where(eq(nlPins.id, survivorId));
    }

    logger.info(
      { boardId: board.id, survivorId, absorbedIds: absorbedRealIds },
      "leap pins merged",
    );
    return { survivorId, absorbedIds: absorbedRealIds };
  });
}

/**
 * Task and message counts per pin — feeds `pickSurvivor` so the deterministic
 * fallback keeps whichever copy the owner has actually invested in.
 */
export async function pinInvestment(
  boardId: number,
): Promise<Map<number, { tasks: number; messages: number }>> {
  const [taskRows, messageRows] = await Promise.all([
    db
      .select({ pinId: nlTasks.pinId, n: sql<number>`count(*)::int` })
      .from(nlTasks)
      .where(eq(nlTasks.boardId, boardId))
      .groupBy(nlTasks.pinId),
    db
      .select({ pinId: nlMessages.pinId, n: sql<number>`count(*)::int` })
      .from(nlMessages)
      .where(eq(nlMessages.boardId, boardId))
      .groupBy(nlMessages.pinId),
  ]);
  const out = new Map<number, { tasks: number; messages: number }>();
  for (const r of taskRows) {
    out.set(r.pinId, { tasks: r.n, messages: 0 });
  }
  for (const r of messageRows) {
    if (r.pinId == null) continue;
    const cur = out.get(r.pinId) ?? { tasks: 0, messages: 0 };
    out.set(r.pinId, { ...cur, messages: r.n });
  }
  return out;
}
