import express, { Router, type IRouter } from "express";
import { asc, and, eq, isNull, sql } from "drizzle-orm";
import { createMarkerLineFilter } from "./options-stream";
import {
  db,
  nlBoards,
  nlCheckins,
  nlMessages,
  nlMoves,
  nlPins,
  nlTasks,
  type NlBoard,
} from "@workspace/db";
import {
  CreateLeapBoardBody,
  AnswerLeapInterviewBody,
  SendLeapChatBody,
  QuickAddLeapPinBody,
  CreateLeapCheckinBody,
  UpdateLeapMoveBody,
  UpdateLeapPinBody,
  AppendLeapPinBody,
  CreateLeapPinTaskBody,
  UpdateLeapPinTaskBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  detectAudioFormat,
  ensureCompatibleFormat,
  speechToText,
} from "@workspace/integrations-openai-ai-server/audio";
import { logger } from "../../lib/logger";
import {
  LEAP_MODEL,
  appendPinSystem,
  applyOps,
  boardSnapshot,
  callLeapJson,
  chatSystem,
  checkinSystem,
  deletePinAndScrub,
  ensureAskQuestion,
  generateToken,
  groomBoard,
  interviewSystem,
  MAX_INTERVIEW_QUESTIONS,
  loadState,
  quickAddSystem,
  sanitizeAsk,
  sanitizeOptions,
  type LeapAsk,
} from "./engine";
import {
  serializeNlBoard,
  serializeNlCheckin,
  serializeNlMessage,
  serializeNlMove,
  serializeNlPin,
  serializeNlProgress,
  serializeNlTask,
} from "./serialize";
import { computeProgress } from "./progress";

const router: IRouter = Router();

/** Trailing marker lines the chat model may emit; stripped before display. */
const CHAT_MARKERS = ["ACTIONS:", "OPTIONS:"];

async function findBoard(token: string): Promise<NlBoard | undefined> {
  return db.query.nlBoards.findFirst({ where: eq(nlBoards.token, token) });
}

async function findPin(boardId: number, pinIdRaw: string | undefined) {
  const pinId = Number(pinIdRaw);
  if (!Number.isInteger(pinId)) return undefined;
  return db.query.nlPins.findFirst({
    where: and(eq(nlPins.id, pinId), eq(nlPins.boardId, boardId)),
  });
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
    tasks: state.tasks.map(serializeNlTask),
    // Derived on read from rows already loaded above: no progress table, so no
    // second source of truth to drift, and demo boards get a live-looking
    // pulse for free from their seeded rows.
    progress: serializeNlProgress(computeProgress(state)),
  };
}

function demoBlocked(board: NlBoard, res: import("express").Response): boolean {
  if (board.kind !== "demo") return false;
  res.status(403).json({
    error: "This board is a demo. Start your own from the front door.",
  });
  return true;
}

/**
 * If the opening model call fails, the interview still has to start. Domain-free
 * and one tap, and it doubles as the AI-familiarity intake the prompt wants
 * learned early.
 */
const FALLBACK_OPENING = {
  say: "Got it. Quick one so I aim this right — how far along are you?",
  ask: {
    type: "single",
    choices: [
      { label: "Just an idea so far" },
      { label: "Started, it's small" },
      { label: "Running, want more" },
      { label: "Stuck" },
    ],
  },
} as const;

/** The interview turn shape both /boards/:token/opening and /answers return. */
async function interviewTurnJson(
  board: NlBoard,
  say: string,
  ask: LeapAsk | Record<string, unknown> | null,
  /**
   * Questions the owner still has to answer, INCLUDING the one in `say`. So a
   * fresh board is MAX_INTERVIEW_QUESTIONS, and 0 only when the interview is
   * over — that's what keeps the dock's progress dots honest.
   */
  questionsLeft: number,
  newPinIds: number[] = [],
  touchedPinIds: number[] = [],
) {
  const fresh = await db.query.nlBoards.findFirst({
    where: eq(nlBoards.id, board.id),
  });
  return {
    say,
    options: null,
    ...(ask ? { ask } : {}),
    questionsLeft: Math.max(0, questionsLeft),
    stage: (fresh ?? board).stage,
    newPinIds,
    touchedPinIds,
    board: await boardStateJson(board),
  };
}

// --- create board ----------------------------------------------------------
// Deliberately model-free, so it returns in tens of milliseconds. The opening
// question is a separate call the board page makes once it is already on
// screen — that is the whole reason the owner gets to WATCH their first cards
// land instead of staring at a spinner on the front door.
router.post("/nextleap/boards", async (req, res) => {
  const body = CreateLeapBoardBody.parse(req.body);
  const [board] = await db
    .insert(nlBoards)
    .values({
      token: generateToken(),
      // The door is the shape of the problem, not the domain: "I'm going after
      // one thing" vs "I'm carrying too much". Optional at the contract now, so
      // a caller that doesn't fork gets the ambition opening.
      door: body.door ?? "ambition",
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

  res.status(201).json(await boardStateJson(board));
});

// --- opening interview turn (idempotent) -----------------------------------
router.post("/nextleap/boards/:token/opening", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;

  const state = await loadState(board);
  const existingAssistant = state.mainMessages.filter(
    (m) => m.role === "assistant",
  );
  // Already opened: hand back the current question rather than minting a second
  // set of pins. React StrictMode double-fires effects in dev, so this path is
  // hit routinely, not just on a retry.
  if (existingAssistant.length > 0) {
    const latest = existingAssistant[existingAssistant.length - 1]!;
    res.json(
      await interviewTurnJson(
        board,
        latest.content,
        (latest.ask as Record<string, unknown> | null) ?? null,
        Math.max(0, MAX_INTERVIEW_QUESTIONS - (existingAssistant.length - 1)),
      ),
    );
    return;
  }

  // Claim the opening atomically, so two concurrent calls can't both mint a set
  // of pins. The condition IS the invariant — "no assistant turn exists yet" —
  // evaluated inside the UPDATE by Postgres.
  //
  // Deliberately not a compare-and-swap on updatedAt: Postgres stores timestamptz
  // to microseconds and a JS Date round-trips at milliseconds, so that comparison
  // never matches and every single call would take the "already in flight" branch.
  const [claimed] = await db
    .update(nlBoards)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(nlBoards.id, board.id),
        sql`not exists (select 1 from ${nlMessages} where ${nlMessages.boardId} = ${board.id} and ${nlMessages.role} = 'assistant')`,
      ),
    )
    .returning();
  if (!claimed) {
    // Someone else got there first. Hand back whatever the board says now.
    const fresh = await loadState(board);
    const latest = fresh.mainMessages.filter((m) => m.role === "assistant").at(-1);
    res.json(
      await interviewTurnJson(
        board,
        latest?.content ?? FALLBACK_OPENING.say,
        (latest?.ask as Record<string, unknown> | null) ?? null,
        MAX_INTERVIEW_QUESTIONS,
      ),
    );
    return;
  }

  let say: string = FALLBACK_OPENING.say;
  let ask: LeapAsk | Record<string, unknown> | null = {
    ...FALLBACK_OPENING.ask,
    choices: FALLBACK_OPENING.ask.choices.map((c) => ({ ...c })),
  };
  let newPinIds: number[] = [];
  let touchedPinIds: number[] = [];
  try {
    const parsed = await callLeapJson([
      { role: "system", content: interviewSystem(state, 0) },
      { role: "user", content: board.goalText },
    ]);
    if (typeof parsed["say"] === "string" && parsed["say"].trim()) {
      ({ say, ask } = await ensureAskQuestion(
        parsed["say"].trim(),
        sanitizeAsk(parsed["ask"]),
      ));
      const opsResult = await applyOps(board, parsed["ops"]);
      newPinIds = opsResult.newPinIds;
      touchedPinIds = opsResult.touchedPinIds;
      if (opsResult.overflow.length > 0) await groomBoard(board, opsResult.overflow);
    }
  } catch (err) {
    logger.warn({ err }, "leap opening question failed, using fallback");
  }

  await db.insert(nlMessages).values({
    boardId: board.id,
    role: "assistant",
    content: say,
    ask,
  });

  res.json(
    await interviewTurnJson(
      board,
      say,
      ask,
      MAX_INTERVIEW_QUESTIONS,
      newPinIds,
      touchedPinIds,
    ),
  );
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

    const rawSay =
      typeof parsed["say"] === "string" && parsed["say"].trim()
        ? parsed["say"].trim()
        : "Say more — what does that look like in a normal week?";
    // The prompt states the budget; this enforces it. A chatty model would
    // otherwise outlive the cap, and the whole point of the shorter interview
    // is that it actually ends.
    const done =
      parsed["done"] === true || questionsAsked >= MAX_INTERVIEW_QUESTIONS;
    // No ask on the wrap-up — the board takes over.
    const { say, ask } = done
      ? { say: rawSay, ask: null }
      : await ensureAskQuestion(rawSay, sanitizeAsk(parsed["ask"]));
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
            {
              role: "system",
              content: interviewSystem(freshState, MAX_INTERVIEW_QUESTIONS),
            },
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
      // The board has to be clean at the exact moment it's revealed — that's
      // the payoff. Never allowed to fail the turn.
      await groomBoard(board, opsResult.overflow);
      stage = "board";
      await db
        .update(nlBoards)
        .set({ stage, updatedAt: new Date() })
        .where(eq(nlBoards.id, board.id));
    } else {
      if (opsResult.overflow.length > 0) await groomBoard(board, opsResult.overflow);
      await db
        .update(nlBoards)
        .set({ updatedAt: new Date() })
        .where(eq(nlBoards.id, board.id));
    }

    await db.insert(nlMessages).values({
      boardId: board.id,
      role: "assistant",
      content: say,
      ask,
    });

    res.json({
      say,
      options: null,
      ...(ask ? { ask } : {}),
      questionsLeft: done
        ? 0
        : Math.max(0, MAX_INTERVIEW_QUESTIONS - questionsAsked),
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

// --- voice answers ---------------------------------------------------------
// Raw audio in, text out. Route-level raw parser only — the global
// express.json() in app.ts stays untouched.
const rawAudio = express.raw({
  type: ["audio/*", "application/octet-stream"],
  limit: "8mb",
});

async function transcribe(
  req: import("express").Request,
  res: import("express").Response,
): Promise<void> {
  const audio: unknown = req.body;
  if (!Buffer.isBuffer(audio) || audio.length < 1024) {
    res.status(400).json({ error: "Didn't catch that — hold it a beat longer." });
    return;
  }

  try {
    const detected = detectAudioFormat(audio);
    // Chrome and Firefox record webm, Safari and iOS record mp4, and the
    // transcription endpoint takes both containers as they are. Only an
    // unrecognised buffer is worth an ffmpeg round trip.
    const { buffer, format } =
      detected === "unknown"
        ? await ensureCompatibleFormat(audio)
        : { buffer: audio, format: detected };
    const text = (await speechToText(buffer, format)).trim();
    res.json({ text });
  } catch (err) {
    logger.warn({ err }, "leap transcription failed");
    res
      .status(502)
      .json({ error: "Couldn't make out the recording. Type it instead." });
  }
}

// The front door IS question one, and it has to take voice as well as typing —
// which means transcription can't require a board, because none exists yet.
// No worse an exposure than POST /boards, which already spends a model call
// for anyone who asks.
router.post("/nextleap/transcriptions", rawAudio, transcribe);

// Board-scoped variant, for answers given once the interview is under way.
router.post(
  "/nextleap/boards/:token/transcriptions",
  rawAudio,
  async (req, res) => {
    const board = await findBoard(req.params["token"]!);
    if (!board) {
      res.status(404).json({ error: "No board at this link." });
      return;
    }
    if (demoBlocked(board, res)) return;
    await transcribe(req, res);
  },
);

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

    // Stream while withholding whatever could still turn out to be a trailing
    // marker line (see options-stream.ts) — even when the model ends a marker
    // with a newline, raw JSON never flashes at the user.
    const filter = createMarkerLineFilter(CHAT_MARKERS);
    let safeOut = "";
    for await (const chunk of stream) {
      // Breaking out of the loop aborts the upstream request.
      if (clientGone) break;
      const content = chunk.choices[0]?.delta?.content;
      if (!content) continue;
      const safe = filter.push(content);
      if (safe) {
        safeOut += safe;
        res.write(`data: ${JSON.stringify({ content: safe })}\n\n`);
      }
    }

    const { rest, markers } = filter.finish();
    let options: string[] | null = null;
    if (markers["OPTIONS:"] !== undefined) {
      try {
        options = sanitizeOptions(JSON.parse(markers["OPTIONS:"]));
      } catch {
        // Malformed marker: drop it silently rather than show raw JSON.
        options = null;
      }
    }
    // Board edits the model was asked to make. Chat may only EDIT what
    // exists: upsertPin with a valid ref, deletePin, touchPin. Everything
    // else in the op vocabulary (new pins, moves, bet, stat chips,
    // trajectory, intake) is ignored here — those belong to the interview,
    // quick-add, and check-in flows. Demo boards never apply anything.
    let chatOps: Record<string, unknown>[] = [];
    if (markers["ACTIONS:"] !== undefined && !isDemo && !clientGone) {
      // Every referenced pin must actually exist on THIS board. applyOps
      // treats upsertPin with an unknown ref as "insert new pin" — in chat
      // that turns a botched merge into junk pins, so reject it here.
      const pinIds = new Set(state.pins.map((p) => p.id));
      try {
        const raw: unknown = JSON.parse(markers["ACTIONS:"]);
        if (Array.isArray(raw)) {
          chatOps = raw.filter((o): o is Record<string, unknown> => {
            if (!o || typeof o !== "object") return false;
            const rec = o as Record<string, unknown>;
            if (rec["op"] === "deletePin" || rec["op"] === "touchPin")
              return pinIds.has(Number(rec["id"]));
            if (rec["op"] === "upsertPin")
              return pinIds.has(Number(rec["ref"]));
            // mergePin is the safe way to collapse duplicates — it re-parents
            // checklists, threads and moves instead of cascading them away.
            // Every id still has to be a real pin on this board.
            if (rec["op"] === "mergePin") {
              const survivor = Number(rec["survivorRef"]);
              const absorb = Array.isArray(rec["absorbRefs"])
                ? (rec["absorbRefs"] as unknown[]).map(Number)
                : [];
              return (
                pinIds.has(survivor) &&
                absorb.length > 0 &&
                absorb.every((id) => pinIds.has(id) && id !== survivor)
              );
            }
            return false;
          });
        }
      } catch (err) {
        logger.warn({ err }, "leap chat ACTIONS marker failed, ignoring");
      }
    }
    if (rest.trim() && !clientGone && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ content: rest })}\n\n`);
    }
    // Persist exactly what the user saw — the filtered stream, markers out.
    let fullResponse = (safeOut + rest).trimEnd();
    // The model sometimes sends an ACTIONS line with no prose at all; the
    // user must never wonder whether anything happened.
    if (!fullResponse && chatOps.length > 0 && !clientGone) {
      fullResponse = "Done — the board's updated. Take a look.";
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
      }
    }

    if (fullResponse && !isDemo && !clientGone) {
      await db.insert(nlMessages).values({
        boardId: board.id,
        pinId: pin?.id ?? null,
        moveId: move?.id ?? null,
        role: "assistant",
        content: fullResponse,
        options,
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
    // Apply board edits AFTER persisting the reply: if the model deleted the
    // very pin this thread hangs off, the FK cascade takes the thread with it
    // instead of the message insert hitting a dead pinId.
    let boardChanged = false;
    if (chatOps.length > 0) {
      await applyOps(board, chatOps);
      boardChanged = true;
    }
    if (!res.writableEnded) {
      if (options) res.write(`data: ${JSON.stringify({ options })}\n\n`);
      if (boardChanged)
        res.write(`data: ${JSON.stringify({ boardChanged: true })}\n\n`);
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
    // At the ceiling the insert is held back and consolidated instead, and a
    // near-duplicate is folded into the pin it duplicates. Either way the
    // owner must land on the card their words ended up on — "nothing happened"
    // is the one outcome a quick-add can't have.
    if (result.overflow.length > 0) await groomBoard(board, result.overflow);
    const pinId =
      result.newPinIds[0] ??
      result.touchedPinIds[0] ??
      result.foldedIntoPinId ??
      undefined;
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

// --- pin management -----------------------------------------------------------
router.patch("/nextleap/boards/:token/pins/:pinId", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;
  const pin = await findPin(board.id, req.params["pinId"]);
  if (!pin) {
    res.status(404).json({ error: "That pin isn't on this board." });
    return;
  }
  const body = UpdateLeapPinBody.parse(req.body);
  const patch: Partial<typeof nlPins.$inferInsert> = {};
  if (typeof body.title === "string" && body.title.trim())
    patch.title = body.title.trim().slice(0, 80);
  if (typeof body.verdictWhy === "string" && body.verdictWhy.trim())
    patch.verdictWhy = body.verdictWhy.trim().slice(0, 240);
  if (Object.keys(patch).length === 0) {
    res.json(serializeNlPin(pin));
    return;
  }
  const [updated] = await db
    .update(nlPins)
    .set({ ...patch, lastTouchedAt: new Date() })
    .where(eq(nlPins.id, pin.id))
    .returning();
  await db
    .update(nlBoards)
    .set({ updatedAt: new Date() })
    .where(eq(nlBoards.id, board.id));
  res.json(serializeNlPin(updated ?? pin));
});

router.delete("/nextleap/boards/:token/pins/:pinId", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;
  const pin = await findPin(board.id, req.params["pinId"]);
  if (!pin) {
    res.status(404).json({ error: "That pin isn't on this board." });
    return;
  }
  // Chat thread + checklist go with it (FK cascade); moves detach (set null).
  // Sibling related-pin lists and the abandon-bet get scrubbed inside.
  await deletePinAndScrub(board, pin.id);
  res.status(204).end();
});

router.post("/nextleap/boards/:token/pins/:pinId/append", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;
  const pin = await findPin(board.id, req.params["pinId"]);
  if (!pin) {
    res.status(404).json({ error: "That pin isn't on this board." });
    return;
  }
  const body = AppendLeapPinBody.parse(req.body);

  try {
    const state = await loadState(board);
    const parsed = await callLeapJson([
      { role: "system", content: appendPinSystem(state, pin) },
      { role: "user", content: body.text },
    ]);
    if (!parsed["pin"] || typeof parsed["pin"] !== "object")
      throw new Error("append produced no pin");
    await applyOps(board, [
      { op: "upsertPin", ref: pin.id, pin: parsed["pin"] },
    ]);
    const fresh = await db.query.nlPins.findFirst({
      where: eq(nlPins.id, pin.id),
    });
    if (!fresh) throw new Error("pin vanished after append");
    await db
      .update(nlBoards)
      .set({ updatedAt: new Date() })
      .where(eq(nlBoards.id, board.id));
    res.json(serializeNlPin(fresh));
  } catch (err) {
    logger.error({ err }, "leap pin append failed");
    res.status(502).json({ error: "Couldn't fold that in. Say it shorter." });
  }
});

// --- pin checklist --------------------------------------------------------------
router.post("/nextleap/boards/:token/pins/:pinId/tasks", async (req, res) => {
  const board = await findBoard(req.params["token"]!);
  if (!board) {
    res.status(404).json({ error: "No board at this link." });
    return;
  }
  if (demoBlocked(board, res)) return;
  const pin = await findPin(board.id, req.params["pinId"]);
  if (!pin) {
    res.status(404).json({ error: "That pin isn't on this board." });
    return;
  }
  const body = CreateLeapPinTaskBody.parse(req.body);
  const label = body.label.trim().slice(0, 200);
  if (!label) {
    res.status(400).json({ error: "Give the task a few words." });
    return;
  }
  // Single-statement append: concurrent adds can't race to the same slot.
  const [task] = await db
    .insert(nlTasks)
    .values({
      boardId: board.id,
      pinId: pin.id,
      label,
      orderIndex: sql`(select coalesce(max(${nlTasks.orderIndex}), -1) + 1 from ${nlTasks} where ${nlTasks.pinId} = ${pin.id})`,
    })
    .returning();
  if (!task) {
    res.status(500).json({ error: "Couldn't add that task." });
    return;
  }
  await db
    .update(nlBoards)
    .set({ updatedAt: new Date() })
    .where(eq(nlBoards.id, board.id));
  res.status(201).json(serializeNlTask(task));
});

router.patch(
  "/nextleap/boards/:token/pins/:pinId/tasks/:taskId",
  async (req, res) => {
    const board = await findBoard(req.params["token"]!);
    if (!board) {
      res.status(404).json({ error: "No board at this link." });
      return;
    }
    if (demoBlocked(board, res)) return;
    const pin = await findPin(board.id, req.params["pinId"]);
    if (!pin) {
      res.status(404).json({ error: "That pin isn't on this board." });
      return;
    }
    const taskId = Number(req.params["taskId"]);
    const [task] = Number.isInteger(taskId)
      ? await db
          .select()
          .from(nlTasks)
          .where(and(eq(nlTasks.id, taskId), eq(nlTasks.pinId, pin.id)))
      : [];
    if (!task) {
      res.status(404).json({ error: "That task isn't on this pin." });
      return;
    }
    const body = UpdateLeapPinTaskBody.parse(req.body);
    const patch: Partial<typeof nlTasks.$inferInsert> = {};
    if (typeof body.done === "boolean") {
      patch.done = body.done;
      // The sensor needs a timestamp, not a flag — ticking a box is the
      // cheapest real signal this board can collect.
      patch.doneAt = body.done ? new Date() : null;
    }
    if (typeof body.label === "string" && body.label.trim())
      patch.label = body.label.trim().slice(0, 200);
    if (Object.keys(patch).length === 0) {
      res.json(serializeNlTask(task));
      return;
    }
    const [updated] = await db
      .update(nlTasks)
      .set(patch)
      .where(eq(nlTasks.id, task.id))
      .returning();
    res.json(serializeNlTask(updated ?? task));
  },
);

router.delete(
  "/nextleap/boards/:token/pins/:pinId/tasks/:taskId",
  async (req, res) => {
    const board = await findBoard(req.params["token"]!);
    if (!board) {
      res.status(404).json({ error: "No board at this link." });
      return;
    }
    if (demoBlocked(board, res)) return;
    const pin = await findPin(board.id, req.params["pinId"]);
    if (!pin) {
      res.status(404).json({ error: "That pin isn't on this board." });
      return;
    }
    const taskId = Number(req.params["taskId"]);
    if (Number.isInteger(taskId)) {
      await db
        .delete(nlTasks)
        .where(and(eq(nlTasks.id, taskId), eq(nlTasks.pinId, pin.id)));
    }
    res.status(204).end();
  },
);

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

    // Tidy on the natural cadence, so the board doesn't depend on the owner
    // noticing duplicates and asking.
    await groomBoard(board);

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
    .set({
      state: body.state,
      // Skipping is a decision, not a gap — it gets a timestamp too, so a
      // deliberate drop counts as real work on the week strip.
      doneAt: body.state === "pending" ? null : new Date(),
    })
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
