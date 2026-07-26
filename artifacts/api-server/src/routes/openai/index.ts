import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  buildPortfolioContext,
  CHARLIE_PROFILE,
} from "../../lib/portfolio-context";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

function serializeConversation(c: typeof conversations.$inferSelect) {
  return { id: c.id, title: c.title, createdAt: c.createdAt.toISOString() };
}

function serializeMessage(m: typeof messages.$inferSelect) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/openai/conversations", async (_req, res) => {
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt));
  res.json(rows.map(serializeConversation).reverse());
});

router.post("/openai/conversations", async (req, res) => {
  const body = CreateOpenaiConversationBody.parse(req.body);
  const [row] = await db.insert(conversations).values(body).returning();
  res.status(201).json(serializeConversation(row!));
});

router.get("/openai/conversations/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json({
    ...serializeConversation(conversation),
    messages: rows.map(serializeMessage),
  });
});

router.delete("/openai/conversations/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [row] = await db
    .delete(conversations)
    .where(eq(conversations.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.status(204).end();
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params["id"]);
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json(rows.map(serializeMessage));
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = SendOpenaiMessageBody.parse(req.body);

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  await db
    .insert(messages)
    .values({ conversationId: id, role: "user", content: body.content });

  const context = await buildPortfolioContext();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.6-terra",
      max_completion_tokens: 8192,
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are Charlie's portfolio advisor inside his Portfolio Pulse HQ. ${CHARLIE_PROFILE}

You have his full, current portfolio below. Ground every answer in it. Reference projects by name, use the scores and check-ins, and push him toward his next proof points. Challenge him when he drifts toward his fade pattern or exceeds 3 active bets.

${context}`,
        },
        ...history.map((m) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
        { role: "user", content: body.content },
      ],
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    if (fullResponse) {
      await db.insert(messages).values({
        conversationId: id,
        role: "assistant",
        content: fullResponse,
      });
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "Advisor chat stream failed");
    res.write(
      `data: ${JSON.stringify({ error: "The advisor hit a snag. Try again." })}\n\n`,
    );
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

export default router;
