import type {
  NlBoard,
  NlCheckin,
  NlMessage,
  NlMove,
  NlPin,
  NlTask,
} from "@workspace/db";
import type { Progress } from "./progress";

export function serializeNlBoard(b: NlBoard) {
  return {
    id: b.id,
    token: b.token,
    kind: b.kind,
    name: b.name,
    door: b.door,
    goalText: b.goalText,
    aiFamiliarity: b.aiFamiliarity ?? null,
    craftComfort: b.craftComfort ?? null,
    stage: b.stage,
    statChips: (b.statChips as unknown[]) ?? null,
    trajectory: (b.trajectory as Record<string, unknown>) ?? null,
    bet: (b.bet as Record<string, unknown>) ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export function serializeNlPin(p: NlPin) {
  return {
    id: p.id,
    boardId: p.boardId,
    title: p.title,
    verdict: p.verdict,
    verdictWhy: p.verdictWhy,
    difficulty: p.difficulty,
    impact: p.impact,
    kind: p.kind,
    vizData: (p.vizData as Record<string, unknown>) ?? {},
    detail: (p.detail as Record<string, unknown>) ?? null,
    verifyYourself: p.verifyYourself,
    relatedPinIds: (p.relatedPinIds as number[]) ?? [],
    lastTouchedAt: p.lastTouchedAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeNlMove(m: NlMove) {
  return {
    id: m.id,
    boardId: m.boardId,
    pinId: m.pinId ?? null,
    title: m.title,
    first48: m.first48,
    orderIndex: m.orderIndex,
    state: m.state,
    repKind: m.repKind,
    repDraft: m.repDraft ?? null,
    cycleIndex: m.cycleIndex,
    doneAt: m.doneAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

export function serializeNlMessage(m: NlMessage) {
  // `ask` is optional in the contract, not nullable — so OMIT the key when
  // there is no ask. Sending an explicit null would typecheck fine here and
  // then break narrowing on the client.
  const ask = (m.ask as Record<string, unknown> | null) ?? null;
  return {
    id: m.id,
    boardId: m.boardId,
    pinId: m.pinId ?? null,
    moveId: m.moveId ?? null,
    role: m.role,
    content: m.content,
    options: (m.options as string[] | null) ?? null,
    ...(ask ? { ask } : {}),
    createdAt: m.createdAt.toISOString(),
  };
}

export function serializeNlTask(t: NlTask) {
  return {
    id: t.id,
    boardId: t.boardId,
    pinId: t.pinId,
    label: t.label,
    done: t.done,
    doneAt: t.doneAt?.toISOString() ?? null,
    orderIndex: t.orderIndex,
    createdAt: t.createdAt.toISOString(),
  };
}

export function serializeNlCheckin(c: NlCheckin) {
  return {
    id: c.id,
    boardId: c.boardId,
    note: c.note,
    summary: c.summary,
    changes: (c.changes as unknown[]) ?? [],
    dodged: c.dodged ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

/** Already ISO strings and plain numbers — pass through unchanged. */
export function serializeNlProgress(p: Progress) {
  return p;
}
