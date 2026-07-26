import type { Project, Checkin, Brief } from "@workspace/db";

export function serializeProject(p: Project) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    verdict: p.verdict,
    status: p.status,
    difficulty: p.difficulty,
    upside: p.upside,
    traction: p.traction,
    energy: p.energy,
    oneLineTruth: p.oneLineTruth,
    nextProofPoint: p.nextProofPoint,
    aiRuling: p.aiRuling,
    isActiveBet: p.isActiveBet,
    lastCheckinAt: p.lastCheckinAt ? p.lastCheckinAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeCheckin(c: Checkin) {
  return {
    id: c.id,
    projectId: c.projectId,
    mood: c.mood,
    note: c.note,
    createdAt: c.createdAt.toISOString(),
  };
}

export function serializeBrief(b: Brief) {
  return {
    id: b.id,
    briefDate: b.briefDate,
    headline: b.headline,
    content: b.content,
    hasAudio: b.audio != null && b.audio.length > 0,
    createdAt: b.createdAt.toISOString(),
  };
}
