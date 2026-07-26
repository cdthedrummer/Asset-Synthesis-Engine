import { desc, eq } from "drizzle-orm";
import { db, projects, checkins } from "@workspace/db";

/**
 * Builds a compact plain-text snapshot of the entire portfolio plus recent
 * check-ins, used as grounding context for the daily brief and advisor chat.
 */
export async function buildPortfolioContext(): Promise<string> {
  const allProjects = await db.select().from(projects).orderBy(projects.name);
  const recent = await db
    .select({ checkin: checkins, projectName: projects.name })
    .from(checkins)
    .innerJoin(projects, eq(checkins.projectId, projects.id))
    .orderBy(desc(checkins.createdAt))
    .limit(40);

  const now = Date.now();
  const lines: string[] = [];
  lines.push("PORTFOLIO SNAPSHOT (" + new Date().toDateString() + ")");
  lines.push("");
  for (const p of allProjects) {
    const last = p.lastCheckinAt ?? null;
    const staleDays = last
      ? Math.floor((now - last.getTime()) / 86400000)
      : null;
    lines.push(
      `- ${p.name} [${p.category}] verdict=${p.verdict.toUpperCase()} status="${p.status}" difficulty=${p.difficulty}/10 upside=${p.upside}/10 traction=${p.traction}/5 energy=${p.energy}${p.isActiveBet ? " ACTIVE-BET" : ""}${staleDays !== null ? ` last-checkin=${staleDays}d-ago` : " never-checked-in"}`,
    );
    lines.push(`  truth: ${p.oneLineTruth}`);
    lines.push(`  next proof point: ${p.nextProofPoint}`);
  }
  lines.push("");
  lines.push("RECENT CHECK-INS (newest first):");
  if (recent.length === 0) {
    lines.push("(none yet)");
  } else {
    for (const r of recent) {
      lines.push(
        `- [${r.checkin.createdAt.toISOString().slice(0, 10)}] ${r.projectName} (${r.checkin.mood}): ${r.checkin.note}`,
      );
    }
  }
  return lines.join("\n");
}

export const CHARLIE_PROFILE = `About the owner of this portfolio (Charlie):
- Strategist/marketer at a large media agency; currently ~$245K, targeting $300K+ and an exec seat.
- ~10 hours/week of side-project capacity and a $10K "unstick" budget.
- Known fade pattern: does the fun 80% (branding, design, building) then stalls on the hard 20% (distribution, selling, finishing). Call this out when you see it.
- Rules he set for himself: max 3 active bets at a time; no ad agency; delegation and accountability over heroics.
- Wants direct, committed advice — "Hemingway not McKinsey." Short sentences. Take positions. No hedging, no corporate filler, no bullet-point soup.`;
