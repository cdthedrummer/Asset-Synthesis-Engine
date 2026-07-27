import type {
  NlBoard,
  NlCheckin,
  NlMessage,
  NlMove,
  NlPin,
} from "@workspace/db";

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
    createdAt: m.createdAt.toISOString(),
  };
}

export function serializeNlMessage(m: NlMessage) {
  return {
    id: m.id,
    boardId: m.boardId,
    pinId: m.pinId ?? null,
    moveId: m.moveId ?? null,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
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
