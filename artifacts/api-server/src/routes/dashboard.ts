import { Router, type IRouter } from "express";
import { gte } from "drizzle-orm";
import { db, projects, checkins } from "@workspace/db";
import { serializeProject } from "../lib/serialize";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const allProjects = await db.select().from(projects);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCheckins = await db
    .select({ id: checkins.id })
    .from(checkins)
    .where(gte(checkins.createdAt, weekAgo));

  const verdictCounts = {
    lead: 0,
    delegate: 0,
    partner: 0,
    publish: 0,
    park: 0,
    kill: 0,
  };
  for (const p of allProjects) {
    if (p.verdict in verdictCounts) {
      verdictCounts[p.verdict as keyof typeof verdictCounts] += 1;
    }
  }

  const activeBets = allProjects.filter((p) => p.isActiveBet);
  const staleProjects = allProjects.filter((p) => {
    if (p.verdict === "park" || p.verdict === "kill") return false;
    const last = p.lastCheckinAt ?? p.createdAt;
    return last < weekAgo;
  });
  const energyDrains = allProjects.filter(
    (p) => p.energy === "drains" && p.verdict !== "kill",
  ).length;

  res.json({
    totalProjects: allProjects.length,
    verdictCounts,
    activeBets: activeBets.map(serializeProject),
    staleProjects: staleProjects.map(serializeProject),
    checkinsThisWeek: recentCheckins.length,
    energyDrains,
  });
});

export default router;
