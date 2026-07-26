import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import dashboardRouter from "./dashboard";
import briefsRouter from "./briefs";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(dashboardRouter);
router.use(briefsRouter);
router.use(openaiRouter);

export default router;
