import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import dashboardRouter from "./dashboard";
import briefsRouter from "./briefs";
import openaiRouter from "./openai";
import nextleapRouter from "./nextleap";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(dashboardRouter);
router.use(briefsRouter);
router.use(openaiRouter);
router.use(nextleapRouter);

export default router;
