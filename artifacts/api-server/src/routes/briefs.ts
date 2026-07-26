import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, briefs } from "@workspace/db";
import { ListBriefsQueryParams } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";
import { serializeBrief } from "../lib/serialize";
import {
  buildPortfolioContext,
  CHARLIE_PROFILE,
} from "../lib/portfolio-context";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/briefs", async (req, res) => {
  const query = ListBriefsQueryParams.parse(req.query);
  const limit = query.limit ?? 30;
  const rows = await db
    .select()
    .from(briefs)
    .orderBy(desc(briefs.briefDate))
    .limit(limit);
  res.json(rows.map(serializeBrief));
});

router.get("/briefs/today", async (_req, res) => {
  const row = await db.query.briefs.findFirst({
    where: eq(briefs.briefDate, todayDate()),
  });
  if (!row) {
    res.status(404).json({ error: "No brief generated today yet" });
    return;
  }
  res.json(serializeBrief(row));
});

router.post("/briefs/generate", async (_req, res) => {
  const date = todayDate();
  const context = await buildPortfolioContext();

  const response = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You write "The Pulse" — a daily podcast-style portfolio brief for one listener. ${CHARLIE_PROFILE}

Produce JSON with exactly these keys:
- "headline": one punchy sentence (max 12 words) naming today's single most important truth.
- "content": the written brief in markdown, 300-500 words, with these beats woven in naturally (no rigid template): what moved, what's stalling, one bold recommendation, one hidden bridge between two projects he hasn't connected, and TODAY'S #1 MOVE (one concrete action, under 30 minutes to start).
- "script": a spoken version of the brief, 250-400 words, written for the ear like a one-host podcast segment. Conversational, punchy, no markdown, no headings, no lists. Open with the date and a hook, close with the #1 move.

Be opinionated. Name projects by name. If nothing moved, say so bluntly.`,
      },
      {
        role: "user",
        content: `Today is ${date}. Here is the current portfolio:\n\n${context}\n\nGenerate today's Pulse.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed: { headline?: string; content?: string; script?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const headline = parsed.headline?.trim() || "Your daily pulse is ready";
  const content = parsed.content?.trim() || raw;
  const script = parsed.script?.trim() || content;

  let audio: Buffer | null = null;
  try {
    audio = await textToSpeech(script, "onyx", "mp3");
  } catch (err) {
    logger.error({ err }, "TTS generation failed; saving brief without audio");
  }

  const existing = await db.query.briefs.findFirst({
    where: eq(briefs.briefDate, date),
  });
  let row;
  if (existing) {
    [row] = await db
      .update(briefs)
      .set({ headline, content, audio })
      .where(eq(briefs.id, existing.id))
      .returning();
  } else {
    [row] = await db
      .insert(briefs)
      .values({ briefDate: date, headline, content, audio })
      .returning();
  }
  res.json(serializeBrief(row!));
});

router.get("/briefs/:id/audio", async (req, res) => {
  const id = Number(req.params["id"]);
  const row = await db.query.briefs.findFirst({ where: eq(briefs.id, id) });
  if (!row || !row.audio || row.audio.length === 0) {
    res.status(404).json({ error: "Audio not found" });
    return;
  }
  const buffer = Buffer.from(row.audio);
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Length", String(buffer.length));
  res.setHeader("Cache-Control", "no-store");
  res.end(buffer);
});

export default router;
