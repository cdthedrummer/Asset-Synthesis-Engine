import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, projects, checkins } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
  CreateCheckinBody,
  ListRecentCheckinsQueryParams,
} from "@workspace/api-zod";
import { serializeProject, serializeCheckin } from "../lib/serialize";

const router: IRouter = Router();

router.get("/projects", async (_req, res) => {
  const rows = await db.select().from(projects).orderBy(projects.name);
  res.json(rows.map(serializeProject));
});

router.post("/projects", async (req, res) => {
  const body = CreateProjectBody.parse(req.body);
  const [row] = await db
    .insert(projects)
    .values({ aiRuling: "", isActiveBet: false, ...body })
    .returning();
  res.status(201).json(serializeProject(row!));
});

router.get("/projects/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const projectCheckins = await db
    .select()
    .from(checkins)
    .where(eq(checkins.projectId, id))
    .orderBy(desc(checkins.createdAt))
    .limit(20);
  res.json({
    ...serializeProject(project),
    checkins: projectCheckins.map(serializeCheckin),
  });
});

router.patch("/projects/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = UpdateProjectBody.parse(req.body);
  const [row] = await db
    .update(projects)
    .set(body)
    .where(eq(projects.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(serializeProject(row));
});

router.delete("/projects/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [row] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.status(204).end();
});

router.post("/projects/:id/checkins", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = CreateCheckinBody.parse(req.body);
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [row] = await db
    .insert(checkins)
    .values({ projectId: id, ...body })
    .returning();
  await db
    .update(projects)
    .set({ lastCheckinAt: row!.createdAt })
    .where(eq(projects.id, id));
  res.status(201).json(serializeCheckin(row!));
});

router.get("/checkins/recent", async (req, res) => {
  const query = ListRecentCheckinsQueryParams.parse(req.query);
  const limit = query.limit ?? 30;
  const rows = await db
    .select({
      checkin: checkins,
      projectName: projects.name,
    })
    .from(checkins)
    .innerJoin(projects, eq(checkins.projectId, projects.id))
    .orderBy(desc(checkins.createdAt))
    .limit(limit);
  res.json(
    rows.map((r) => ({
      ...serializeCheckin(r.checkin),
      projectName: r.projectName,
    })),
  );
});

export default router;
