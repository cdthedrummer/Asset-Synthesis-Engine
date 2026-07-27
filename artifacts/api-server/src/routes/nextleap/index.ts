import { Router, type IRouter } from "express";
import { asc, and, eq, isNull } from "drizzle-orm";
import {
  db,
  nlBoards,
  nlCheckins,
  nlMessages,
  nlMoves,
  nlPins,
  type NlBoard,
} from "@workspace/db";
import {
  CreateLeapBoardBody,
  AnswerLeapInterviewBody,
  SendLeapChatBody,
  QuickAddLeapPinBody,
  CreateLeapCheckinBody,
  UpdateLeapMoveBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../../lib/logger";
import {
  LEAP_MODEL,
  applyOps,
  boardSnapshot,
  callLeapJson,
  chatSystem,
  checkinSystem,
  generateToken,
  interviewSystem,
  loadState,
  quickAddSystem,
} from "./engine";
import {
  serializeNlBoard,
  serializeNlCheckin,
  serializeNlMessage,
  serializeNlMove,
  serializeNlPin,
} from "./serialize";

const router: IRouter = Router();

async function findBoard(token: string): Promise<NlBoard | undefined> {
  return db.query.nlBoards.findFirst({ where: eq(nlBoards.token, token) });
}

async function boardStateJson(board: NlBoard) {
  const fresh = await db.query.nlBoards.findFirst({
    where: eq(nlBoards.id, board.id),
  });
  const state = await loadState(fresh ?? board);
  return {
    board: serializeNlBoard(state.board),
    pins: state.pins.map(serializeNlPin),
    moves: state.moves.map(serializeNlMove),
    checkins: state.checkins.map(serializeNlCheckin),
    messages: state.mainMessages.map(serializeNlMessage),
  };
}

function demoBlocked(board: NlBoard, res: import("express").Response): boolean {
  if (board.kind !== "demo") return false;
  res.status(403).json({
    error: "This board is a demo. Start your own from the front door.",
  });
  return true;
}

const OPENING_FALLBACK: Record<string, string> = {
  ambition:
    "Good. That's a real one. Before we get into it — how much have you used AI tools like ChatGPT? Never touched them, poked around, or every day? No wrong answer, it just changes how we work.",
  juggle:
    "Alright, let's get all of it out of your head and onto a board. First, though — how much have you used AI tools like ChatGPT? Never, a little, or daily? It changes how we do the next part.",
};

// --- create board ----------------------------------------------------------
router.post("/nextleap/boards", async (req, res) => {
  const body = CreateLeapBoardBody.parse(req.body);
  const [board] = await db
    .insert(nlBoards)
    .values({
      token: generateToken(),
      door: body.door,
      goalText: body.goalText,
      name: body.name ?? "",
    })
    .returning();
  if (!board) {
    res.status(500).json({ error: "Could not create the board." });
    return;
  }

  // Their front-door text is the first user turn of the interview.
  await db.insert(nlMessages).values({
    boardId: board.id,
    role: "user",
    content: body.goalText,
  });

  let opening = OPENING_FALLBACK[board.door] ?? OPENING_FALLBACK["ambition"]!;
  try {
    const state = await loadState(board);
    const parsed = await callLeapJson([
      { role: "system", content: interviewSystem(state, 0) },
      { role: "user", content: body.goalText },
    ]);
    if (typeof parsed["say"] === "string" && parsed["say"].trim()) {
      opening = parsed["say"].trim();
      await applyOps(board, parsed["ops"]);
    }
  } catch (err) {
    logger.warn({ err }, "leap opening question failed, using fallback");
  }

  await db.insert(nlMessages).values({
    boardId: board.id,
    role: "assistant",
    content: opening,
  });

  res.status(201).json(await boardStateJson(board));
});

// --- read board -------------------------------------------------------------
router.get("/nextleap/boards/:token", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  res.json(await boardStateJson(board));
});

// --- interview turn ---------------------------------------------------------
router.post("/nextleap/boards/:token/answers", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;
  const body = AnswerLeapInterviewBody.parse(req.body);

  await db.insert(nlMessages).values({
    boardId: board.id,
    role: "user",
    content: body.content,
  });

  const state = await loadState(board);
  const questionsAsked = state.mainMessages.filter(
    (m) => m.role === "assistant",
  ).length;

  try {
    const parsed = await callLeapJson([
      { role: "system", content: interviewSystem(state, questionsAsked) },
      ...state.mainMessages.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    ]);

    const say =
      typeof parsed["say"] === "string" && parsed["say"].trim()
        ? parsed["say"].trim()
        : "Say more — what does that look like in a normal week?";
    const done = parsed["done"] === true;
    const opsResult = await applyOps(board, parsed["ops"]);

    let stage = board.stage;
    if (done && board.stage === "interview") {
      // The reveal needs moves, bet, trajectory, and stat chips.
      // If the model skipped any of them, force the issue in one repair call.
      try {
        const freshState = await loadState(board);
        const bet = freshState.board.bet as { text?: string } | null;
        const missing = [
          freshState.moves.length === 0 && "the moves op with exactly 3 moves",
          !bet?.text && "the bet op",
          !freshState.board.trajectory &&
            "the trajectory op, sketched honestly from their numbers",
          !freshState.board.statChips && "the statChips op",
        ].filter(Boolean);
        if (missing.length > 0) {
          const fix = await callLeapJson([
            { role: "system", content: interviewSystem(freshState, 8) },
            {
              role: "user",
              content: `The interview is over. Based on this board — ${boardSnapshot(freshState)} — reply with ONLY {"say":"","done":true,"ops":[${missing.join(", ")}]}.`,
            },
          ]);
          await applyOps(board, fix["ops"]);
        }
      } catch (err) {
        logger.error({ err }, "leap board-reveal fallback failed");
      }
      stage = "board";
      await db
        .update(nlBoards)
        .set({ stage, updatedAt: new Date() })
        .where(eq(nlBoards.id, board.id));
    } else {
      await db
        .update(nlBoards)
        .set({ updatedAt: new Date() })
        .where(eq(nlBoards.id, board.id));
    }

    await db.insert(nlMessages).values({
      boardId: board.id,
      role: "assistant",
      content: say,
    });

    res.json({
      say,
      stage,
      newPinIds: opsResult.newPinIds,
      touchedPinIds: opsResult.touchedPinIds,
      board: await boardStateJson(board),
    });
  } catch (err) {
    logger.error({ err }, "leap interview turn failed");
    res.status(502).json({
      error: "Lost the thread for a second. Send that answer again.",
    });
  }
});

// --- chat (SSE): main thread, pin threads, move rep sessions ----------------
router.post("/nextleap/boards/:token/chat", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  const body = SendLeapChatBody.parse(req.body);
  const isDemo = board.kind === "demo";

  const pin = body.pinId
    ? await db.query.nlPins.findFirst({
        where: and(eq(nlPins.id, body.pinId), eq(nlPins.boardId, board.id)),
      })
    : undefined;
  const move = body.moveId
    ? await db.query.nlMoves.findFirst({
        where: and(eq(nlMoves.id, body.moveId), eq(nlMoves.boardId, board.id)),
      })
    : undefined;
  if ((body.pinId && !pin) || (body.moveId && !move)) {
    res.status(404).json({ error: "That thread doesn't exist on this board." });
    return;
  }

  const scopeWhere = move
    ? and(eq(nlMessages.boardId, board.id), eq(nlMessages.moveId, move.id))
    : pin
      ? and(eq(nlMessages.boardId, board.id), eq(nlMessages.pinId, pin.id))
      : and(
          eq(nlMessages.boardId, board.id),
          isNull(nlMessages.pinId),
          isNull(nlMessages.moveId),
        );
  const history = await db
    .select()
    .from(nlMessages)
    .where(scopeWhere)
    .orderBy(asc(nlMessages.createdAt));

  if (!isDemo) {
    await db.insert(nlMessages).values({
      boardId: board.id,
      pinId: pin?.id ?? null,
      moveId: move?.id ?? null,
      role: "user",
      content: body.content,
    });
  }

  const state = await loadState(board);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // If the browser drops mid-stream, stop the model instead of talking to a wall.
  let clientGone = false;
  res.on("close", () => {
    if (!res.writableEnded) clientGone = true;
  });

  try {
    const stream = await openai.chat.completions.create({
      model: LEAP_MODEL,
      max_completion_tokens: 8192,
      stream: true,
      messages: [
        {
          role: "system",
          content: chatSystem(state, { pin: pin ?? undefined, move: move ?? undefined }),
        },
        ...history.map((m) => ({
          role:
            m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
        { role: "user", content: body.content },
      ],
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      // Breaking out of the loop aborts the upstream request.
      if (clientGone) break;
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    if (fullResponse && !isDemo && !clientGone) {
      await db.insert(nlMessages).values({
        boardId: board.id,
        pinId: pin?.id ?? null,
        moveId: move?.id ?? null,
        role: "assistant",
        content: fullResponse,
      });
      if (move) {
        await db
          .update(nlMoves)
          .set({ repDraft: fullResponse })
          .where(eq(nlMoves.id, move.id));
      }
      if (pin) {
        await db
          .update(nlPins)
          .set({ lastTouchedAt: new Date() })
          .where(eq(nlPins.id, pin.id));
      }
      await db
        .update(nlBoards)
        .set({ updatedAt: new Date() })
        .where(eq(nlBoards.id, board.id));
    }
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err) {
    logger.error({ err }, "leap chat stream failed");
    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ error: "Hit a snag mid-sentence. Try again." })}\n\n`,
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  }
});

// --- thread listings ---------------------------------------------------------
router.get("/nextleap/boards/:token/pins/:pinId/messages", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  const pinId = Number(req.params["pinId"]);
  const rows = await db
    .select()
    .from(nlMessages)
    .where(and(eq(nlMessages.boardId, board.id), eq(nlMessages.pinId, pinId)))
    .orderBy(asc(nlMessages.createdAt));
  res.json(rows.map(serializeNlMessage));
});

router.get(
  "/nextleap/boards/:token/moves/:moveId/messages",
  async (req, res) => {
    const board = await findBoard(req.params["token"]!);
    if (!board) {
      res.status(404).json({ error: "No board at this link." });
      return;
    }
    const moveId = Number(req.params["moveId"]);
    const rows = await db
      .select()
      .from(nlMessages)
      .where(
        and(eq(nlMessages.boardId, board.id), eq(nlMessages.moveId, moveId)),
      )
      .orderBy(asc(nlMessages.createdAt));
    res.json(rows.map(serializeNlMessage));
  },
);

// --- quick add ----------------------------------------------------------------
router.post("/nextleap/boards/:token/pins", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;
  const body = QuickAddLeapPinBody.parse(req.body);

  try {
    const state = await loadState(board);
    const parsed = await callLeapJson([
      { role: "system", content: quickAddSystem(state) },
      { role: "user", content: body.text },
    ]);
    const result = await applyOps(board, [
      { op: "upsertPin", pin: parsed["pin"] },
    ]);
    const pinId = result.newPinIds[0] ?? result.touchedPinIds[0];
    if (!pinId) throw new Error("quick add produced no pin");
    const pin = await db.query.nlPins.findFirst({ where: eq(nlPins.id, pinId) });
    if (!pin) throw new Error("quick add pin vanished");
    await db
      .update(nlBoards)
      .set({ updatedAt: new Date() })
      .where(eq(nlBoards.id, board.id));
    res.status(201).json(serializeNlPin(pin));
  } catch (err) {
    logger.error({ err }, "leap quick add failed");
    res
      .status(502)
      .json({ error: "Couldn't place that pin. Say it again, shorter." });
  }
});

// --- check-in -------------------------------------------------------------------
router.post("/nextleap/boards/:token/checkins", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;
  const body = CreateLeapCheckinBody.parse(req.body);

  try {
    const state = await loadState(board);
    const parsed = await callLeapJson([
      { role: "system", content: checkinSystem(state) },
      { role: "user", content: body.note },
    ]);

    const summary =
      typeof parsed["summary"] === "string" && parsed["summary"].trim()
        ? parsed["summary"].trim()
        : "Logged. The board's current.";
    const dodged =
      typeof parsed["dodged"] === "string" && parsed["dodged"].trim()
        ? parsed["dodged"].trim()
        : null;

    // Apply verdict changes, capturing before/after for the response.
    const appliedChanges: {
      pinId: number;
      field: string;
      from: string;
      to: string;
      why: string;
    }[] = [];
    if (Array.isArray(parsed["changes"])) {
      for (const cUnknown of parsed["changes"] as unknown[]) {
        if (!cUnknown || typeof cUnknown !== "object") continue;
        const c = cUnknown as Record<string, unknown>;
        const pinId = Number(c["pinId"]);
        const to = String(c["to"] ?? "");
        if (
          !Number.isInteger(pinId) ||
          !["start", "schedule", "skip", "gethelp"].includes(to)
        )
          continue;
        const pin = state.pins.find((p) => p.id === pinId);
        if (!pin || pin.verdict === to) continue;
        await db
          .update(nlPins)
          .set({
            verdict: to,
            verdictWhy: String(c["why"] ?? pin.verdictWhy).slice(0, 240),
            lastTouchedAt: new Date(),
          })
          .where(eq(nlPins.id, pinId));
        appliedChanges.push({
          pinId,
          field: "verdict",
          from: pin.verdict,
          to,
          why: String(c["why"] ?? "").slice(0, 240),
        });
      }
    }

    const ops: Record<string, unknown>[] = [];
    if (Array.isArray(parsed["statChips"]) && parsed["statChips"].length)
      ops.push({ op: "statChips", chips: parsed["statChips"] });
    if (Array.isArray(parsed["moves"]) && parsed["moves"].length)
      ops.push({ op: "moves", moves: parsed["moves"] });
    await applyOps(board, ops);

    const [checkin] = await db
      .insert(nlCheckins)
      .values({
        boardId: board.id,
        note: body.note,
        summary,
        changes: appliedChanges,
        dodged,
      })
      .returning();

    // The check-in is part of the board's main story thread too.
    await db.insert(nlMessages).values([
      { boardId: board.id, role: "user", content: body.note },
      { boardId: board.id, role: "assistant", content: summary },
    ]);
    await db
      .update(nlBoards)
      .set({ updatedAt: new Date() })
      .where(eq(nlBoards.id, board.id));

    res.status(201).json({
      checkin: serializeNlCheckin(checkin!),
      board: await boardStateJson(board),
    });
  } catch (err) {
    logger.error({ err }, "leap check-in failed");
    res.status(502).json({
      error: "The re-score stalled. Tell me again what happened.",
    });
  }
});

// --- move state ---------------------------------------------------------------
router.patch("/nextleap/boards/:token/moves/:moveId", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;
  const body = UpdateLeapMoveBody.parse(req.body);
  const moveId = Number(req.params["moveId"]);
  const [move] = await db
    .update(nlMoves)
    .set({ state: body.state })
    .where(and(eq(nlMoves.id, moveId), eq(nlMoves.boardId, board.id)))
    .returning();
  if (!move) {
    res.status(404).json({ error: "That move isn't on this board." });
    return;
  }
  if (move.pinId) {
    await db
      .update(nlPins)
      .set({ lastTouchedAt: new Date() })
      .where(eq(nlPins.id, move.pinId));
  }
  await db
    .update(nlBoards)
    .set({ updatedAt: new Date() })
    .where(eq(nlBoards.id, board.id));
  res.json(serializeNlMove(move));
});

// --- demo personas --------------------------------------------------------------
const DEMO_META: Record<string, { slug: string; title: string; tagline: string }> =
  {
    "demo-baker": {
      slug: "baker",
      title: "Maya — baker to bakery owner",
      tagline:
        "Fifty-two sold-out Saturdays. One home oven. The question isn't demand.",
    },
    "demo-swim": {
      slug: "swim",
      title: "Dev — swim instructor to head coach",
      tagline:
        "Every slot booked, a waitlist he keeps apologizing to, and no next rung at the pool.",
    },
  };

router.get("/nextleap/demos", async (_req, res) => {
  const rows = await db
    .select()
    .from(nlBoards)
    .where(eq(nlBoards.kind, "demo"))
    .orderBy(asc(nlBoards.id));
  res.json(
    rows.map((b) => {
      const meta = DEMO_META[b.token];
      return {
        slug: meta?.slug ?? b.token,
        title: meta?.title ?? b.name,
        tagline: meta?.tagline ?? b.goalText,
        token: b.token,
      };
    }),
  );
});

export default router;
