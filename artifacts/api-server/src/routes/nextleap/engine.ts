import crypto from "node:crypto";
import { asc, desc, eq, and, isNull } from "drizzle-orm";
import {
  db,
  nlBoards,
  nlCheckins,
  nlMessages,
  nlMoves,
  nlPins,
  nlTasks,
  type NlBoard,
  type NlMove,
  type NlPin,
  type NlTask,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../../lib/logger";
import { COACH_VOICE } from "./voice";

export const LEAP_MODEL = "gpt-5.6-terra";

export function generateToken(): string {
  return crypto.randomBytes(9).toString("base64url");
}

const VERDICTS = new Set(["start", "schedule", "skip", "gethelp"]);
const KINDS = new Set([
  "steps",
  "pipeline",
  "menu",
  "table",
  "calendar",
  "bars",
  "stat",
]);
const REP_KINDS = new Set(["email", "post", "pitch", "plan", "message", "none"]);

function clamp(n: unknown, lo: number, hi: number, fallback: number): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return fallback;
  return Math.min(hi, Math.max(lo, v));
}

// Tap-to-answer choices coming back from the model. One shape everywhere:
// interview turns and chat threads both reduce to string[] (2-4, short) or null.
export function sanitizeOptions(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o.length <= 60);
  const unique = [...new Set(cleaned)].slice(0, 4);
  return unique.length >= 2 ? unique : null;
}

// ---------------------------------------------------------------------------
// Shared prompt fragments. The viz spec is the contract with the frontend
// renderers — shapes here must match the components exactly.
// ---------------------------------------------------------------------------

export const VIZ_SPEC = `PIN VISUAL TEMPLATES — a pin IS its visual. It must be readable with zero explanation, built ONLY from numbers and facts they actually said. Never invent a number. "kind" + matching "vizData":
- steps: {"steps":[{"label":"Module 3 of 6","state":"done"|"active"|"todo"}],"caption":"optional, 4-6 words"} (3-6 steps, labels under 20 chars)
- pipeline: {"items":[{"name":"Fern & Ground","status":"SAMPLES FRI","state":"done"|"active"|"todo"}]} (2-4 items; status is a tiny tag, 1-3 words, caps)
- menu: {"heading":"optional","items":[{"name":"Sourdough loaf","price":"$9"}]} (3-5 items)
- table: {"rows":[{"label":"Food handler card","state":"done"|"active"|"todo"|"waiting","note":"optional, 2-4 words"}]} (3-5 rows)
- calendar: {"month":"MAR","marks":[{"day":3,"kind":"post"|"event"|"due"}],"caption":"optional"} (a real month of theirs)
- bars: {"unit":"orders/mo","bars":[{"label":"Jan","value":4}],"capLine":{"value":8,"label":"cap"}} (3-6 bars; capLine only when a real ceiling exists)
- stat: {"value":"7:00 PM","label":"Wednesday","sub":"BOOKED"} (one hero fact)
Optional "detail" = second tap level: {"blocks":[{"type":"text","body":"2-3 plain sentences"} | {"type":"bars"|"steps"|"table"|"calendar","title":"optional", ...same payload as that kind}]}
BOARD-LEVEL VISUALS:
- statChips: exactly 3, [{"value":"52/52","label":"SAT SOLD OUT","tone":"neutral"|"good"|"warn"}] — the "how we got here" row, labels in caps, under 16 chars
- trajectory: {"title":"Summer '27","headline":"~$2,400","unit":"/wk","series":[{"x":"Jan","y":300,"projected":false},...],"milestones":[{"x":"Sep","label":"LLC"}]} — 6-10 points, history projected:false, future projected:true. Honest: the projection follows from their numbers, not from optimism.`;

export const OPS_SPEC = `OPS you can emit (1-3 per turn; the board must visibly grow or shift with every answer):
{"op":"upsertPin","ref":<existing pin id — only when updating>,"pin":{"title":"...","verdict":"start"|"schedule"|"skip"|"gethelp","verdictWhy":"one blunt sentence","difficulty":1-10,"impact":1-10,"kind":"...","vizData":{...},"detail":{...}?,"verifyYourself":true?,"relatedTitles":["titles of related pins"]?}}
{"op":"touchPin","id":<pin id>} — bumps a pin to the top because it came up again
{"op":"intake","aiFamiliarity":"new"|"some"|"daily"?,"craftComfort":"none"|"some"|"confident"?} — emit the moment an answer reveals it
{"op":"statChips","chips":[exactly 3]} — once you know 3 sharp facts; update later if a fact changes
{"op":"trajectory","trajectory":{...}} — once you can sketch it honestly from their numbers
{"op":"moves","moves":[exactly 3 of {"title":"...","first48":"a concrete step finishable within 48 hours","pinTitle":"which pin it serves"?,"repKind":"email"|"post"|"pitch"|"plan"|"message"|"none"}]} — ONLY with done:true
{"op":"bet","bet":{"pinTitle":"...","text":"one sentence: which item you'd bet they abandon first, and why — warm, not mean"}} — ONLY with done:true
VERDICT MEANINGS: start = do this now, it's the wedge. schedule = real, but it has a date, not a today. skip = not now, say why without apology. gethelp = a person, not a plan (accountant, mentor, inspector).
Difficulty = how hard FOR THEM (their craft comfort and life constraints count). Impact = what it changes in 12 months.
SAFETY RAILS (hard rules): never make an irreversible step a "start" verdict or a move — quitting a job, signing a lease, big spend all get "schedule" plus the reversible test that comes first. Anything involving licenses, permits, taxes, insurance or the law: verifyYourself=true, verdict usually "gethelp" or "schedule", and the pin should point at the official source or a human, never your guess.`;

// ---------------------------------------------------------------------------
// State loading + snapshots
// ---------------------------------------------------------------------------

export interface LeapState {
  board: NlBoard;
  pins: NlPin[];
  moves: NlMove[];
  checkins: (typeof nlCheckins.$inferSelect)[];
  mainMessages: (typeof nlMessages.$inferSelect)[];
  tasks: NlTask[];
}

export async function loadState(board: NlBoard): Promise<LeapState> {
  const [pins, moves, checkins, mainMessages, tasks] = await Promise.all([
    db
      .select()
      .from(nlPins)
      .where(eq(nlPins.boardId, board.id))
      .orderBy(desc(nlPins.lastTouchedAt)),
    db
      .select()
      .from(nlMoves)
      .where(eq(nlMoves.boardId, board.id))
      .orderBy(asc(nlMoves.orderIndex), asc(nlMoves.id)),
    db
      .select()
      .from(nlCheckins)
      .where(eq(nlCheckins.boardId, board.id))
      .orderBy(desc(nlCheckins.createdAt)),
    db
      .select()
      .from(nlMessages)
      .where(
        and(
          eq(nlMessages.boardId, board.id),
          isNull(nlMessages.pinId),
          isNull(nlMessages.moveId),
        ),
      )
      .orderBy(asc(nlMessages.createdAt)),
    db
      .select()
      .from(nlTasks)
      .where(eq(nlTasks.boardId, board.id))
      .orderBy(asc(nlTasks.orderIndex), asc(nlTasks.id)),
  ]);
  return { board, pins, moves, checkins, mainMessages, tasks };
}

export function boardSnapshot(state: LeapState): string {
  const { board, pins, moves } = state;
  const tasksByPin = new Map<number, { label: string; done: boolean }[]>();
  for (const t of state.tasks) {
    const list = tasksByPin.get(t.pinId) ?? [];
    list.push({ label: t.label, done: t.done });
    tasksByPin.set(t.pinId, list);
  }
  return JSON.stringify({
    name: board.name || null,
    door: board.door,
    goal: board.goalText,
    aiFamiliarity: board.aiFamiliarity,
    craftComfort: board.craftComfort,
    stage: board.stage,
    statChips: board.statChips,
    trajectory: board.trajectory,
    bet: board.bet,
    pins: pins.map((p) => ({
      id: p.id,
      title: p.title,
      verdict: p.verdict,
      verdictWhy: p.verdictWhy,
      difficulty: p.difficulty,
      impact: p.impact,
      kind: p.kind,
      vizData: p.vizData,
      verifyYourself: p.verifyYourself,
      checklist: tasksByPin.get(p.id),
    })),
    moves: moves.map((m) => ({
      id: m.id,
      title: m.title,
      first48: m.first48,
      state: m.state,
      repKind: m.repKind,
      hasDraft: m.repDraft != null,
    })),
  });
}

// ---------------------------------------------------------------------------
// JSON model call with one repair retry
// ---------------------------------------------------------------------------

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object found");
  return JSON.parse(t.slice(start, end + 1));
}

export async function callLeapJson(
  messages: ChatMsg[],
): Promise<Record<string, unknown>> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await openai.chat.completions.create({
      model: LEAP_MODEL,
      max_completion_tokens: 8192,
      messages:
        attempt === 0
          ? messages
          : [
              ...messages,
              {
                role: "user" as const,
                content:
                  "Your last reply was not valid JSON. Reply again with ONLY the JSON object, no prose, no code fences.",
              },
            ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    try {
      const parsed = extractJson(raw);
      if (parsed && typeof parsed === "object")
        return parsed as Record<string, unknown>;
      throw new Error("parsed JSON is not an object");
    } catch (err) {
      lastErr = err;
      logger.warn({ err, attempt }, "leap JSON parse failed, retrying");
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("leap JSON call failed");
}

// ---------------------------------------------------------------------------
// Ops application
// ---------------------------------------------------------------------------

export interface OpsResult {
  newPinIds: number[];
  touchedPinIds: number[];
  gotMoves: boolean;
  gotBet: boolean;
}

function normalizePin(raw: Record<string, unknown>) {
  const kind = KINDS.has(String(raw["kind"])) ? String(raw["kind"]) : "stat";
  const verdict = VERDICTS.has(String(raw["verdict"]))
    ? String(raw["verdict"])
    : "schedule";
  const vizData =
    raw["vizData"] && typeof raw["vizData"] === "object"
      ? (raw["vizData"] as Record<string, unknown>)
      : {};
  const detail =
    raw["detail"] && typeof raw["detail"] === "object"
      ? (raw["detail"] as Record<string, unknown>)
      : null;
  return {
    title: String(raw["title"] ?? "Untitled").slice(0, 80),
    verdict,
    verdictWhy: String(raw["verdictWhy"] ?? "").slice(0, 240),
    difficulty: clamp(raw["difficulty"], 1, 10, 5),
    impact: clamp(raw["impact"], 1, 10, 5),
    kind,
    vizData,
    detail,
    verifyYourself: raw["verifyYourself"] === true,
  };
}

export async function applyOps(
  board: NlBoard,
  opsRaw: unknown,
): Promise<OpsResult> {
  const result: OpsResult = {
    newPinIds: [],
    touchedPinIds: [],
    gotMoves: false,
    gotBet: false,
  };
  if (!Array.isArray(opsRaw)) return result;

  const relatedQueue: { pinId: number; titles: string[] }[] = [];
  let betPinTitle: string | null = null;

  for (const opUnknown of opsRaw) {
    if (!opUnknown || typeof opUnknown !== "object") continue;
    const op = opUnknown as Record<string, unknown>;
    try {
      switch (op["op"]) {
        case "upsertPin": {
          if (!op["pin"] || typeof op["pin"] !== "object") break;
          const pinRaw = op["pin"] as Record<string, unknown>;
          const pin = normalizePin(pinRaw);
          const relatedTitles = Array.isArray(pinRaw["relatedTitles"])
            ? (pinRaw["relatedTitles"] as unknown[]).map(String)
            : [];
          const ref = Number(op["ref"]);
          if (Number.isInteger(ref) && ref > 0) {
            const [updated] = await db
              .update(nlPins)
              .set({ ...pin, lastTouchedAt: new Date() })
              .where(and(eq(nlPins.id, ref), eq(nlPins.boardId, board.id)))
              .returning();
            if (updated) {
              result.touchedPinIds.push(updated.id);
              if (relatedTitles.length)
                relatedQueue.push({ pinId: updated.id, titles: relatedTitles });
              break;
            }
          }
          const [inserted] = await db
            .insert(nlPins)
            .values({ ...pin, boardId: board.id, lastTouchedAt: new Date() })
            .returning();
          if (inserted) {
            result.newPinIds.push(inserted.id);
            if (relatedTitles.length)
              relatedQueue.push({ pinId: inserted.id, titles: relatedTitles });
          }
          break;
        }
        case "touchPin": {
          const id = Number(op["id"]);
          if (!Number.isInteger(id)) break;
          const [touched] = await db
            .update(nlPins)
            .set({ lastTouchedAt: new Date() })
            .where(and(eq(nlPins.id, id), eq(nlPins.boardId, board.id)))
            .returning();
          if (touched) result.touchedPinIds.push(touched.id);
          break;
        }
        case "intake": {
          const patch: Partial<typeof nlBoards.$inferInsert> = {};
          if (["new", "some", "daily"].includes(String(op["aiFamiliarity"])))
            patch.aiFamiliarity = String(op["aiFamiliarity"]);
          if (["none", "some", "confident"].includes(String(op["craftComfort"])))
            patch.craftComfort = String(op["craftComfort"]);
          if (Object.keys(patch).length)
            await db
              .update(nlBoards)
              .set(patch)
              .where(eq(nlBoards.id, board.id));
          break;
        }
        case "statChips": {
          if (!Array.isArray(op["chips"]) || op["chips"].length === 0) break;
          await db
            .update(nlBoards)
            .set({ statChips: (op["chips"] as unknown[]).slice(0, 3) })
            .where(eq(nlBoards.id, board.id));
          break;
        }
        case "trajectory": {
          if (!op["trajectory"] || typeof op["trajectory"] !== "object") break;
          await db
            .update(nlBoards)
            .set({ trajectory: op["trajectory"] })
            .where(eq(nlBoards.id, board.id));
          break;
        }
        case "moves": {
          if (!Array.isArray(op["moves"]) || op["moves"].length === 0) break;
          await db
            .delete(nlMoves)
            .where(
              and(eq(nlMoves.boardId, board.id), eq(nlMoves.state, "pending")),
            );
          const pins = await db
            .select()
            .from(nlPins)
            .where(eq(nlPins.boardId, board.id));
          const byTitle = new Map(
            pins.map((p) => [p.title.toLowerCase(), p.id]),
          );
          const moves = (op["moves"] as Record<string, unknown>[]).slice(0, 3);
          for (let i = 0; i < moves.length; i++) {
            const m = moves[i]!;
            if (!m || typeof m !== "object") continue;
            const repKind = REP_KINDS.has(String(m["repKind"]))
              ? String(m["repKind"])
              : "none";
            await db.insert(nlMoves).values({
              boardId: board.id,
              pinId:
                byTitle.get(String(m["pinTitle"] ?? "").toLowerCase()) ?? null,
              title: String(m["title"] ?? "Move").slice(0, 120),
              first48: String(m["first48"] ?? "").slice(0, 400),
              orderIndex: i,
              repKind,
            });
          }
          result.gotMoves = true;
          break;
        }
        case "bet": {
          if (!op["bet"] || typeof op["bet"] !== "object") break;
          const bet = op["bet"] as Record<string, unknown>;
          betPinTitle = String(bet["pinTitle"] ?? "");
          await db
            .update(nlBoards)
            .set({
              bet: {
                pinTitle: betPinTitle,
                text: String(bet["text"] ?? "").slice(0, 400),
              },
            })
            .where(eq(nlBoards.id, board.id));
          result.gotBet = true;
          break;
        }
        default:
          break;
      }
    } catch (err) {
      logger.warn({ err, op: op["op"] }, "leap op failed, skipping");
    }
  }

  // Resolve title references now that all pins exist.
  if (relatedQueue.length || betPinTitle) {
    const pins = await db
      .select()
      .from(nlPins)
      .where(eq(nlPins.boardId, board.id));
    const byTitle = new Map(pins.map((p) => [p.title.toLowerCase(), p.id]));
    for (const entry of relatedQueue) {
      const ids = entry.titles
        .map((t) => byTitle.get(t.toLowerCase()))
        .filter((id): id is number => typeof id === "number" && id !== entry.pinId);
      if (ids.length)
        await db
          .update(nlPins)
          .set({ relatedPinIds: ids })
          .where(eq(nlPins.id, entry.pinId));
    }
    if (betPinTitle) {
      const pinId = byTitle.get(betPinTitle.toLowerCase());
      if (pinId) {
        const [b] = await db
          .select()
          .from(nlBoards)
          .where(eq(nlBoards.id, board.id));
        const bet = (b?.bet ?? {}) as Record<string, unknown>;
        await db
          .update(nlBoards)
          .set({ bet: { ...bet, pinId } })
          .where(eq(nlBoards.id, board.id));
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const NO_JARGON = `Plain words only. Banned: MVP, runway, TAM, ICP, KPI, go-to-market, monetize, pivot, stakeholder, "side hustle" as a noun of ceremony. If a baker wouldn't say it, you don't say it.`;

export function interviewSystem(
  state: LeapState,
  questionsAsked: number,
): string {
  const { board } = state;
  const who = board.name ? board.name : "someone a friend sent over";
  const doorLine =
    board.door === "ambition"
      ? `They walked in with an ambition: "${board.goalText}". Take it seriously and make it concrete.`
      : `They walked in juggling everything at once: "${board.goalText}". Your first job is to lay it all out so it stops being fog.`;

  return `${COACH_VOICE}

You are interviewing ${who} — like a sharp friend who happens to be very good at figuring out what someone should do next. ${doorLine}

While you talk, a pinboard assembles itself next to the conversation. Every answer should visibly change the board. You do that by emitting ops.

${VIZ_SPEC}

${OPS_SPEC}

INTERVIEW RULES:
- ONE question per turn. At most two short sentences before it. React to what they just said first — specific, not "great!".
- You've asked ${questionsAsked} questions so far. Aim for 6-8 total, then finish. At 8 you MUST finish. Don't drag it out once the picture is clear.
- Early on (first two questions, woven in naturally, not as a form): find out how much they've used AI tools like ChatGPT for real work, and how confident they are in the craft their leap needs. Emit the intake op when an answer tells you.
- Ask for numbers. "How many orders last month?" beats "how's it going?". If an answer is vague, push once — sharp friends don't accept "pretty good".
- When a question's answer space is genuinely small — either/or forks, ranges, "how much have you used AI" — include "options": 2-4 tap-to-answer choices, each under 40 chars. Most questions should NOT have options: never use them when the real answer is a number or a story only they know. Typing always stays open, so options invite, never box in.
- ${NO_JARGON}
- Every turn: 1-3 ops. Pins should carry THEIR numbers, names, prices, days. A pin with invented data is worse than no pin.
- A tight board beats a full one: aim for 6-9 pins TOTAL by the end. Before adding a pin, ask whether an existing one should be updated (upsert by its exact title) or touched instead. Merge near-duplicates into the stronger pin.
- Once you know 3 sharp facts about how they got here, emit statChips. Once their numbers support a picture, emit trajectory — every finished board needs one.

FINISHING (done:true):
- Emit the moves op (exactly 3) and the bet op alongside your final say.
- Moves: small, cheap, reversible, each finishable within 48 hours. The board shows them big — your say should NOT list them. Your final say: one-line read of their situation, then hand them the board. Three sentences max.
- The bet is the "I'd bet you abandon this first" beat — one sentence, warm, specific, the kind of call-out a friend earns the right to make.

Reply with ONLY a JSON object: {"say":"plain text, no markdown","done":false,"options":["tap answer", ...]|null,"ops":[...]}`;
}

export function checkinSystem(state: LeapState): string {
  return `${COACH_VOICE}

${state.board.name || "They"} came back to check in on their board. Below is the full board state. They'll tell you what happened since last time.

BOARD: ${boardSnapshot(state)}

Your job, in one JSON reply:
1. "summary": 2-4 sentences, plain text. If they shipped something real, celebrate it specifically first — like a friend, not a scoreboard. Then the honest read of where they stand now.
2. "changes": re-score ONLY pins whose facts actually moved. [{"pinId":number,"to":"start"|"schedule"|"skip"|"gethelp","why":"one sentence"}]. Empty array if nothing changed — don't shuffle verdicts for theater.
3. "dodged": the item they clearly avoided, or null. Name it straight: the pin title plus one clause on why it keeps mattering. Every check-in where something got dodged, say so — that's the service.
4. "statChips": exactly 3 updated chips ONLY if a chip's fact changed, else omit.
5. "moves": exactly 3 fresh moves [{"title","first48","pinTitle"?,"repKind":"email"|"post"|"pitch"|"plan"|"message"|"none"}] reflecting where they are NOW. Same rules: small, reversible, 48 hours. If they dodged something, at least one move should shrink the dodged thing into a step too small to dodge.
${NO_JARGON}
Safety rails still hold: nothing irreversible, licenses/permits stay verify-yourself territory.

Reply with ONLY the JSON object: {"summary":"...","changes":[...],"dodged":string|null,"statChips":[...]?,"moves":[...]}`;
}

export function quickAddSystem(state: LeapState): string {
  return `${COACH_VOICE}

${state.board.name || "The owner"} just tossed a new item onto their board in passing. Classify it into a pin. Their board, for context: ${boardSnapshot(state)}

${VIZ_SPEC}

Rules: use ONLY facts in their text — no invented numbers (a "stat" pin with their own words is fine). Verdict with a real reason. If it smells legal/license/permit/tax/insurance: verifyYourself true. ${NO_JARGON}

Reply with ONLY: {"pin":{"title","verdict":"start"|"schedule"|"skip"|"gethelp","verdictWhy","difficulty":1-10,"impact":1-10,"kind":"steps"|"pipeline"|"menu"|"table"|"calendar"|"bars"|"stat","vizData":{...},"verifyYourself":boolean}}`;
}

export function appendPinSystem(state: LeapState, pin: NlPin): string {
  return `${COACH_VOICE}

${state.board.name || "The owner"} wants to add new information to ONE existing pin on their board. Fold it in: update the numbers, steps, or facts the pin shows so the visual stays current — don't start over unless the new info truly replaces the old.

The pin today: ${JSON.stringify({
    title: pin.title,
    verdict: pin.verdict,
    verdictWhy: pin.verdictWhy,
    difficulty: pin.difficulty,
    impact: pin.impact,
    kind: pin.kind,
    vizData: pin.vizData,
    detail: pin.detail,
    verifyYourself: pin.verifyYourself,
  })}
Their board, for context: ${boardSnapshot(state)}

${VIZ_SPEC}

Rules: keep the same kind unless the new info clearly demands another template. Return the FULL updated pin — anything you leave out is lost, so carry over detail and facts that still hold. Use ONLY facts they gave — never invent numbers. If the new info honestly changes the verdict's logic, update verdict and verdictWhy. If it smells legal/license/permit/tax/insurance: verifyYourself true. ${NO_JARGON}

Reply with ONLY: {"pin":{"title","verdict":"start"|"schedule"|"skip"|"gethelp","verdictWhy","difficulty":1-10,"impact":1-10,"kind":"steps"|"pipeline"|"menu"|"table"|"calendar"|"bars"|"stat","vizData":{...},"detail":{...}|null,"verifyYourself":boolean}}`;
}

export function chatSystem(
  state: LeapState,
  scope: { pin?: NlPin; move?: NlMove },
): string {
  const base = `${COACH_VOICE}

You're in an ongoing thread with ${state.board.name || "the board's owner"} about their leap. Full board: ${boardSnapshot(state)}

Plain text only — no markdown headings, no bullet cascades. Under 120 words unless you're drafting something for them. ${NO_JARGON}

If your reply ends by asking them to pick between a few concrete paths (by zip vs by city, formal vs casual), put the choices on ONE final line by themselves, exactly like: OPTIONS: ["by zip","by city","whole region"] — 2-4 choices, each under 40 chars, valid JSON, nothing after it. That line is stripped out and becomes tap buttons. Only when a genuine fork exists — never bolt it onto an open question.`;

  if (scope.move) {
    const m = scope.move;
    const depth =
      state.board.aiFamiliarity === "new"
        ? `They're new to working with AI, so narrate lightly: one short line on what you're doing as you do it ("Rough cut first — tell me what's wrong with it."). Teach iteration by doing it, never by lecturing about it.`
        : state.board.aiFamiliarity === "daily"
          ? `They use AI daily — skip the training wheels, work like a sharp peer.`
          : `They've dabbled with AI — minimal narration, just make the work feel easy to steer.`;
    return `${base}

This thread is a working session on ONE move: "${m.title}" — first step: ${m.first48}. You're doing it WITH them, not explaining it. The deliverable is a real ${m.repKind === "none" ? "piece of writing or plan" : m.repKind} in THEIR words and register — it should sound like a human wrote it on a phone, not like software.
- If you're missing one or two concrete facts you need, ask for them first (one question, then draft).
- Then produce a tight draft. No "let me know if this works" filler at the end — end clean.
- When they push back, change the draft, don't defend it. Each round should get shorter and sharper.
- ${depth}
The latest full draft you send becomes their copyable draft, so when you revise, send the complete revised version, not a diff.`;
  }

  if (scope.pin) {
    const p = scope.pin;
    return `${base}

This thread is about ONE pin: ${JSON.stringify({
      title: p.title,
      verdict: p.verdict,
      verdictWhy: p.verdictWhy,
      difficulty: p.difficulty,
      impact: p.impact,
      vizData: p.vizData,
      verifyYourself: p.verifyYourself,
    })}.
They may argue with the verdict — good. Defend it with the reason it was made. Concede specifics when they bring facts you didn't have; say plainly what fact would flip the verdict. This chat can't rewrite the pin by itself — verdicts move when claims meet evidence. If they bring a real new fact, point them at "Add info" right above this thread to fold it into the pin, or a check-in to re-score the whole board.
${p.verifyYourself ? "This pin is verify-yourself territory (legal/license/permit). Point at official sources or a qualified human. Do not play inspector." : ""}`;
  }

  return `${base}

This is the board-wide thread. Answer against the whole board — verdicts, trajectory, the bet, what's next. If they ask you to change something, point them at the right motion: quick-add for new items, check-in to re-score, a pin's own thread to argue a verdict.`;
}
