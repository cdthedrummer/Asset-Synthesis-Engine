import crypto from "node:crypto";
import { asc, desc, eq, and, isNull, sql } from "drizzle-orm";
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
import {
  findDuplicate,
  findDuplicateClusters,
  pickSurvivor,
  type DedupPin,
} from "./dedup";
import { mergePins, pinInvestment } from "./merge";
import { computeProgress } from "./progress";
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

/**
 * Hard ceiling on pins per board, enforced here rather than asked for in the
 * prompt. A twenty-card board is the "we look like an AI dashboard and not an
 * engaging app" failure all by itself, so the tightness promise gets teeth.
 */
export const MAX_PINS = 9;

/** How many questions the interview gets before it is finished in code. */
export const MAX_INTERVIEW_QUESTIONS = 5;

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
// Answer affordances
//
// `options` above is chat's shape and stays exactly as it is. Interview turns
// get something richer, because answering has to get CHEAPER as the interview
// goes on: the owner typed the hard sentence to get in the door, and every
// question after that should cost a tap or a drag, not a paragraph.
// ---------------------------------------------------------------------------

/**
 * Concept keys an image ask may use. Icons, not photographs: there is no asset
 * pipeline and no CDN here, and an icon is a category marker rather than a
 * claim about their life — so it can't violate the never-invent-data rule.
 *
 * MUST stay identical to ASK_ICONS in
 * artifacts/next-leap/src/components/board/ask/ask-icons.ts. A key the server
 * allows but the client can't draw falls back to a monogram tile.
 */
export const ASK_ICONS = new Set([
  "money", "calendar", "clock", "people", "oneperson", "storefront", "home",
  "building", "delivery", "package", "shop", "phone", "laptop", "online",
  "email", "message", "camera", "mic", "music", "food", "kitchen", "coffee",
  "water", "fitness", "art", "writing", "list", "award", "handshake",
  "teaching", "book", "tools", "map", "car", "travel", "morning", "evening",
  "up", "flat", "legal", "heart", "star",
]);

const ASK_TYPES = new Set(["text", "single", "multi", "rank", "scale", "image"]);

export interface LeapAsk {
  type: string;
  placeholder?: string;
  choices?: { label: string; icon?: string; recommended?: boolean }[];
  maxPick?: number;
  items?: string[];
  min?: number;
  max?: number;
  step?: number;
  startAt?: number;
  minLabel?: string;
  maxLabel?: string;
  unit?: string;
}

function cleanLabel(raw: unknown, maxLen: number): string {
  return String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Trimmed, deduped, length-capped choice list, or [] if nothing survives. */
function cleanChoices(
  raw: unknown,
  maxLen: number,
  limit: number,
): { label: string; icon?: string; recommended?: boolean }[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: { label: string; icon?: string; recommended?: boolean }[] = [];
  for (const entry of raw) {
    const rec =
      typeof entry === "string"
        ? { label: entry }
        : entry && typeof entry === "object"
          ? (entry as Record<string, unknown>)
          : null;
    if (!rec) continue;
    const label = cleanLabel(rec["label"], maxLen);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const icon = String(rec["icon"] ?? "");
    out.push({
      label,
      ...(ASK_ICONS.has(icon) ? { icon } : {}),
      // A nudge on every choice is decoration, not a nudge — only the first
      // one that claims it keeps it (applied after the loop).
      ...(rec["recommended"] === true ? { recommended: true } : {}),
    });
    if (out.length >= limit) break;
  }
  let usedRecommended = false;
  for (const c of out) {
    if (!c.recommended) continue;
    if (usedRecommended) delete c.recommended;
    usedRecommended = true;
  }
  return out;
}

/**
 * Clamp-and-whitelist the model's answer affordance, in the same spirit as
 * normalizePin: never trust the shape, and degrade rather than break. A
 * rejected ask returns null, which the client renders as a plain text box —
 * always a working question, never an empty widget.
 *
 * Pure: worth a unit test the day this repo has a runner.
 */
export function sanitizeAsk(raw: unknown): LeapAsk | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const type = String(rec["type"] ?? "");
  if (!ASK_TYPES.has(type)) {
    logger.warn({ type }, "leap ask rejected: unknown type");
    return null;
  }

  if (type === "text") {
    const placeholder = cleanLabel(rec["placeholder"], 48);
    return { type: "text", ...(placeholder ? { placeholder } : {}) };
  }

  if (type === "scale") {
    const min = clamp(rec["min"], 0, 1000, 0);
    const max = clamp(rec["max"], min + 1, 1000, min + 10);
    const step = clamp(rec["step"], 1, Math.max(1, max - min), 1);
    const startAt = clamp(rec["startAt"], min, max, min);
    const minLabel = cleanLabel(rec["minLabel"], 24);
    const maxLabel = cleanLabel(rec["maxLabel"], 24);
    const unit = cleanLabel(rec["unit"], 12);
    return {
      type: "scale",
      min,
      max,
      step,
      startAt,
      ...(minLabel ? { minLabel } : {}),
      ...(maxLabel ? { maxLabel } : {}),
      ...(unit ? { unit } : {}),
    };
  }

  if (type === "rank") {
    const items = [
      ...new Set(
        (Array.isArray(rec["items"]) ? rec["items"] : [])
          .map((i) => cleanLabel(i, 40))
          .filter((i) => i.length > 0),
      ),
    ].slice(0, 4);
    // Two items isn't an ordering, it's a fork — that's a `single`.
    if (items.length < 3) {
      logger.warn({ count: items.length }, "leap ask sanitized down: rank -> null");
      return null;
    }
    return { type: "rank", items };
  }

  // single | multi | image
  const isImage = type === "image";
  const choices = cleanChoices(rec["choices"], isImage ? 24 : 40, isImage ? 4 : 5);
  if (choices.length < 2) {
    logger.warn({ type, count: choices.length }, "leap ask rejected: too few choices");
    return null;
  }

  if (isImage) {
    // Every tile needs a glyph or the grid is a row of blank squares. If none
    // of the icons were usable, this was really a single choice all along.
    if (!choices.some((c) => c.icon)) {
      logger.warn("leap ask sanitized down: image -> single (no valid icons)");
      return { type: "single", choices: choices.map(({ label }) => ({ label })) };
    }
    return { type: "image", choices };
  }

  if (type === "multi") {
    // Two options means one answer — that's a single, not a multi-select.
    if (choices.length < 3) {
      logger.warn("leap ask sanitized down: multi -> single (only 2 choices)");
      return { type: "single", choices };
    }
    return {
      type: "multi",
      choices,
      maxPick: clamp(rec["maxPick"], 1, choices.length, choices.length),
    };
  }

  return { type: "single", choices };
}

// ---------------------------------------------------------------------------
// Shared prompt fragments. The viz spec is the contract with the frontend
// renderers — shapes here must match the components exactly.
// ---------------------------------------------------------------------------

export const VIZ_SPEC = `PIN VISUAL TEMPLATES — a pin IS its visual. It must be readable with zero explanation, built ONLY from numbers and facts they actually said. Never invent a number. "kind" + matching "vizData":
- steps: {"steps":[{"label":"Module 3 of 6","state":"done"|"active"|"todo"}],"caption":"optional, 4-6 words"} (3-6 steps, labels under 20 chars)
- pipeline: {"items":[{"name":"Northview Care","status":"TOUR MON","state":"done"|"active"|"todo"}]} (2-4 items; status is a tiny tag, 1-3 words, caps)
- menu: {"heading":"optional","items":[{"name":"Saturday lesson","price":"$38"}]} (3-5 items) — any short list of things with a number attached: prices, rates, distances, doses
- table: {"rows":[{"label":"Medicaid look-back","state":"done"|"active"|"todo"|"waiting","note":"optional, 2-4 words"}]} (3-5 rows)
- calendar: {"month":"MAR","marks":[{"day":3,"kind":"post"|"event"|"due"}],"caption":"optional"} (a real month of theirs)
- bars: {"unit":"applications/mo","bars":[{"label":"JAN","value":4}],"capLine":{"value":8,"label":"cap"}} (3-6 bars; capLine only when a real ceiling exists)
- stat: {"value":"7:00 PM","label":"Wednesday","sub":"BOOKED"} (one hero fact)
Optional "detail" = second tap level: {"blocks":[{"type":"text","body":"2-3 plain sentences"} | {"type":"bars"|"steps"|"table"|"calendar","title":"optional", ...same payload as that kind}]}
BOARD-LEVEL VISUALS:
- statChips: exactly 3, [{"value":"52/52","label":"SAT SOLD OUT","tone":"neutral"|"good"|"warn"}] — the "how we got here" row, labels in caps, under 16 chars
- trajectory: {"title":"Summer '27","headline":"~$2,400","unit":"/wk","series":[{"x":"Jan","y":300,"projected":false},...],"milestones":[{"x":"Sep","label":"LLC"}]} — 6-10 points, history projected:false, future projected:true. Honest: the projection follows from their numbers, not from optimism.`;

export const OPS_SPEC = `OPS you can emit (1-3 per turn; the board must visibly grow or shift with every answer):
{"op":"upsertPin","ref":<existing pin id — only when updating>,"pin":{"title":"...","verdict":"start"|"schedule"|"skip"|"gethelp","verdictWhy":"one blunt sentence","difficulty":1-10,"impact":1-10,"kind":"...","vizData":{...},"detail":{...}?,"verifyYourself":true?,"relatedTitles":["titles of related pins"]?}}
{"op":"touchPin","id":<pin id>} — bumps a pin to the top because it came up again
{"op":"intake","aiFamiliarity":"new"|"some"|"daily"?,"craftComfort":"none"|"some"|"confident"?,"name":"their first name, ONLY if they actually said it"?} — emit the moment an answer reveals it
{"op":"statChips","chips":[exactly 3]} — once you know 3 sharp facts; update later if a fact changes
{"op":"trajectory","trajectory":{...}} — once you can sketch it honestly from their numbers
{"op":"moves","moves":[exactly 3 of {"title":"...","first48":"a concrete step finishable within 48 hours","pinTitle":"which pin it serves"?,"repKind":"email"|"post"|"pitch"|"plan"|"message"|"none"}]} — ONLY with done:true
{"op":"bet","bet":{"pinTitle":"...","text":"one sentence: which item you'd bet they abandon first, and why — warm, not mean"}} — ONLY with done:true
VERDICT MEANINGS: start = do this now, it's the wedge. schedule = real, but it has a date, not a today. skip = not now, say why without apology. gethelp = a person, not a plan (accountant, mentor, inspector).
Difficulty = how hard FOR THEM (how confident they are in the skill it needs, and what their life actually allows). Impact = what it changes in 12 months.
SAFETY RAILS (hard rules): never make an irreversible step a "start" verdict or a move — quitting a job, signing a lease, big spend all get "schedule" plus the reversible test that comes first. Anything involving licenses, permits, taxes, insurance or the law: verifyYourself=true, verdict usually "gethelp" or "schedule", and the pin should point at the official source or a human, never your guess.`;

export const ASK_SPEC = `HOW YOU ASK — every question ships with an "ask" that decides how they answer it. Pick the cheapest affordance that can still hold the truth:
{"type":"single","choices":[{"label":"under 40 chars","recommended":true}]} — 2-5 taps, one answer, submits the moment they tap. Your workhorse.
{"type":"multi","choices":[...],"maxPick":3} — 3-5 taps, more than one answer. Only when several can honestly be true at once.
{"type":"rank","items":["...","..."]} — 3-4 things they put in order, in THEIR words, pulled from what they already told you. This is the best question in the set: what someone protects and what they'd let go tells you more than anything they'd type.
{"type":"scale","min":0,"max":40,"step":1,"minLabel":"none","maxLabel":"40+","unit":"orders/wk","startAt":0} — a number by dragging instead of typing. Counts, prices, hours a week, how confident they are: all scales. Set min and max around what's plausible for THEM — a range they slide straight past is a wasted question.
{"type":"image","choices":[{"label":"under 24 chars","icon":"<key>"}]} — 2-4 picture tiles. Only when the choices are things you can actually see: a place, an object, the shape of a week. Icon keys, and nothing outside this list: ${[...ASK_ICONS].join(" ")}.
{"type":"text","placeholder":"a few words"} — free typing or talking. The most expensive thing you can ask a person for. You get maybe one of these after the opening.
"recommended":true goes on at most ONE choice, and only when you'd actually push them there. It's a nudge with your name on it, not decoration.

EFFORT GOES DOWN WHILE THE BOARD GOES UP. They typed the hard one to get in the door. Question two is a tap, no exceptions. After that: taps, drags, orderings. A "text" ask is a cost you have to earn, and never for something a scale could hold.
NEVER fake a tap. If the honest answer is a name, a story, or a list only they have, ask for text and pay the cost. Choices you invented that don't fit their life are worse than a blank box — they teach them this thing isn't listening.
Before you finish you need at least one real number from them. If you don't have one, your last question is that number, as a scale.`;

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
    // Real, observed counts — the one part of the snapshot the model may cite
    // as fact when it celebrates something.
    progress: computeProgress(state),
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
  /** Pins refused by the MAX_PINS ceiling, awaiting a consolidation pass. */
  overflow: { pin: ReturnType<typeof normalizePin>; relatedTitles: string[] }[];
  /** Pins collapsed into an existing card by near-duplicate detection. */
  mergedPinIds: number[];
  /**
   * When an insert was folded into an existing pin instead, the id it landed
   * on — quick-add needs it to open the right card rather than 502.
   */
  foldedIntoPinId: number | null;
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
  const verifyYourself = raw["verifyYourself"] === true;
  return {
    title: String(raw["title"] ?? "Untitled").slice(0, 80),
    // OPS_SPEC calls this rail non-negotiable, and a prompt cannot be
    // non-negotiable. Anything flagged verify-yourself — permits, licences,
    // tax, insurance — never gets a "do it today" verdict, whatever the model
    // returned.
    verdict: verifyYourself && verdict === "start" ? "schedule" : verdict,
    verdictWhy: String(raw["verdictWhy"] ?? "").slice(0, 240),
    difficulty: clamp(raw["difficulty"], 1, 10, 5),
    impact: clamp(raw["impact"], 1, 10, 5),
    kind,
    vizData,
    detail,
    verifyYourself,
  };
}

/** Board pins in the shape the pure dedup helpers want. */
function toDedupPins(pins: NlPin[]): DedupPin[] {
  return pins.map((p) => ({
    id: p.id,
    title: p.title,
    kind: p.kind,
    vizData: p.vizData,
    impact: p.impact,
    lastTouchedAt: p.lastTouchedAt,
  }));
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
    overflow: [],
    mergedPinIds: [],
    foldedIntoPinId: null,
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
          // No valid ref, so the model means "new pin". Two deterministic
          // gates stand between that intent and an actual insert.
          const existing = await db
            .select()
            .from(nlPins)
            .where(eq(nlPins.boardId, board.id));

          // Gate 1 — is this really a second copy of something already up
          // there? Exact-title matching used to be the only check, so a
          // rephrased title silently created a twin.
          const twin = findDuplicate(toDedupPins(existing), {
            title: pin.title,
            kind: pin.kind,
            vizData: pin.vizData,
          });
          if (twin) {
            const [folded] = await db
              .update(nlPins)
              .set({ ...pin, lastTouchedAt: new Date() })
              .where(and(eq(nlPins.id, twin.id), eq(nlPins.boardId, board.id)))
              .returning();
            if (folded) {
              logger.info(
                { boardId: board.id, pinId: folded.id, title: pin.title, was: twin.title },
                "leap pin folded into near-duplicate",
              );
              result.touchedPinIds.push(folded.id);
              result.mergedPinIds.push(folded.id);
              result.foldedIntoPinId = folded.id;
              if (relatedTitles.length)
                relatedQueue.push({ pinId: folded.id, titles: relatedTitles });
              break;
            }
          }

          // Gate 2 — the ceiling. Don't insert, and don't drop the content
          // either: queue it so one consolidation pass can decide whether it
          // belongs inside an existing pin or displaces the weakest one.
          if (existing.length >= MAX_PINS) {
            logger.info(
              { boardId: board.id, title: pin.title, pins: existing.length },
              "leap pin held back at ceiling, queued for consolidation",
            );
            result.overflow.push({ pin, relatedTitles });
            break;
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
        case "mergePin": {
          const survivorRef = Number(op["survivorRef"]);
          const absorbRefs = Array.isArray(op["absorbRefs"])
            ? (op["absorbRefs"] as unknown[]).map(Number).filter(Number.isInteger)
            : [];
          if (!Number.isInteger(survivorRef) || absorbRefs.length === 0) break;
          const patch =
            op["pin"] && typeof op["pin"] === "object"
              ? normalizePin(op["pin"] as Record<string, unknown>)
              : null;
          const merged = await mergePins(
            board,
            survivorRef,
            absorbRefs.filter((id) => id !== survivorRef),
            patch,
          );
          if (merged) {
            result.touchedPinIds.push(merged.survivorId);
            result.mergedPinIds.push(merged.survivorId);
            result.foldedIntoPinId = merged.survivorId;
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
        case "deletePin": {
          const id = Number(op["id"]);
          if (!Number.isInteger(id)) break;
          await deletePinAndScrub(board, id);
          break;
        }
        case "intake": {
          const patch: Partial<typeof nlBoards.$inferInsert> = {};
          if (["new", "some", "daily"].includes(String(op["aiFamiliarity"])))
            patch.aiFamiliarity = String(op["aiFamiliarity"]);
          if (["none", "some", "confident"].includes(String(op["craftComfort"])))
            patch.craftComfort = String(op["craftComfort"]);
          // The front door no longer asks for a name, so this is how a board
          // learns one — only ever from something they actually said.
          const name = String(op["name"] ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 40);
          if (name) patch.name = name;
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
          // Every check-in issues a fresh set of three. Closed and skipped
          // moves are kept as history, so the new set needs its own cycle
          // number — otherwise the board accumulates 4-6 moves all claiming
          // orderIndex 0-2 and "2 of 3 this round" can't be computed.
          const [{ maxCycle } = { maxCycle: null }] = await db
            .select({ maxCycle: sql<number | null>`max(${nlMoves.cycleIndex})` })
            .from(nlMoves)
            .where(eq(nlMoves.boardId, board.id));
          const nextCycle = (maxCycle ?? -1) + 1;
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
              cycleIndex: nextCycle,
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
// Grooming: keep the board tight, with a deterministic answer when the model
// can't or won't give one.
// ---------------------------------------------------------------------------

/**
 * One cleanup pass. Call after applyOps whenever the board might have grown
 * duplicates or overflowed the ceiling — at the interview's reveal, on a
 * check-in, and whenever an insert was held back.
 *
 * `overflow` pins are the ones the ceiling refused. The model gets one chance
 * to fold them in or displace something weaker; if it fails, the deterministic
 * fallback still resolves the duplicates, because a board that quietly keeps
 * twins has broken its only structural promise.
 */
export async function groomBoard(
  board: NlBoard,
  overflow: OpsResult["overflow"] = [],
): Promise<void> {
  try {
    const state = await loadState(board);
    const clusters = findDuplicateClusters(toDedupPins(state.pins));
    const needsWork =
      clusters.length > 0 ||
      overflow.length > 0 ||
      state.pins.length > MAX_PINS;
    if (!needsWork) return;

    try {
      const parsed = await callLeapJson([
        {
          role: "system",
          content:
            overflow.length > 0
              ? consolidateSystem(state, clusters, overflow.map((o) => o.pin))
              : groomSystem(state, clusters),
        },
        {
          role: "user",
          content:
            "Do the cleanup now. Reply with only the JSON object described.",
        },
      ]);
      const ops = Array.isArray(parsed["ops"]) ? parsed["ops"] : [];
      // Grooming may only tidy what exists plus land the held-back pins. It
      // never gets to invent moves, bets, chips or a trajectory.
      const allowed = (ops as unknown[]).filter((o) => {
        if (!o || typeof o !== "object") return false;
        const rec = o as Record<string, unknown>;
        return (
          rec["op"] === "mergePin" ||
          rec["op"] === "upsertPin" ||
          rec["op"] === "deletePin"
        );
      });
      if (allowed.length > 0) await applyOps(board, allowed);
    } catch (err) {
      logger.warn({ err, boardId: board.id }, "leap groom model pass failed");
    }

    // Whatever the model did or didn't do, duplicates must not survive.
    const after = await loadState(board);
    const remaining = findDuplicateClusters(toDedupPins(after.pins));
    if (remaining.length > 0) {
      const investment = await pinInvestment(board.id);
      const weight = (id: number) =>
        investment.get(id) ?? { tasks: 0, messages: 0 };
      for (const group of remaining) {
        const pins = toDedupPins(after.pins).filter((p) => group.includes(p.id));
        const survivor = pickSurvivor(pins, weight);
        if (!survivor) continue;
        logger.info(
          { boardId: board.id, group, survivorId: survivor.id },
          "leap groom fallback merged duplicates",
        );
        await mergePins(
          board,
          survivor.id,
          group.filter((id) => id !== survivor.id),
          null,
        );
      }
    }
  } catch (err) {
    // Grooming is never allowed to fail the request that triggered it.
    logger.warn({ err, boardId: board.id }, "leap groom pass failed");
  }
}

/**
 * Delete a pin (board-scoped) and clean up everything that pointed at it:
 * sibling related-pin lists and the abandon-bet's pin link (the bet text
 * survives). Chat thread + checklist go via FK cascade; moves detach (null).
 * Used by both the DELETE route and the chat `deletePin` action.
 */
export async function deletePinAndScrub(
  board: NlBoard,
  pinId: number,
): Promise<boolean> {
  const [gone] = await db
    .delete(nlPins)
    .where(and(eq(nlPins.id, pinId), eq(nlPins.boardId, board.id)))
    .returning();
  if (!gone) return false;
  const siblings = await db
    .select()
    .from(nlPins)
    .where(eq(nlPins.boardId, board.id));
  for (const sib of siblings) {
    const rel = (sib.relatedPinIds as number[] | null) ?? [];
    if (rel.includes(pinId))
      await db
        .update(nlPins)
        .set({ relatedPinIds: rel.filter((id) => id !== pinId) })
        .where(eq(nlPins.id, sib.id));
  }
  const bet = (board.bet ?? null) as Record<string, unknown> | null;
  const patch: Partial<typeof nlBoards.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (bet && bet["pinId"] === pinId) {
    const { pinId: _dropped, ...rest } = bet;
    patch.bet = rest;
  }
  await db.update(nlBoards).set(patch).where(eq(nlBoards.id, board.id));
  return true;
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const NO_JARGON = `Plain words only. Banned: MVP, runway, TAM, ICP, KPI, go-to-market, monetize, pivot, stakeholder, "side hustle" as a noun of ceremony. If it would sound strange said out loud in someone's kitchen, cut it.`;

export function interviewSystem(
  state: LeapState,
  questionsAsked: number,
): string {
  const { board } = state;
  const who = board.name ? board.name : "someone a friend sent over";
  // The door is the shape of the problem, never the domain. Could be a
  // business, a job, a team, a record, a move, someone's care.
  const doorLine =
    board.door === "ambition"
      ? `They walked in with one thing they're going after: "${board.goalText}". Take it seriously and make it concrete — you don't get to be vague back at them.`
      : `They walked in carrying too much at once: "${board.goalText}". Your first job is to lay all of it out so it stops being fog — then say what comes off the pile.`;

  return `${COACH_VOICE}

You are interviewing ${who} — like a sharp friend who happens to be very good at figuring out what someone should do next. ${doorLine}

Their board is on screen right now, underneath your question, and it is empty until you put something on it. Every answer has to visibly change it. You do that by emitting ops.

${VIZ_SPEC}

${OPS_SPEC}

${ASK_SPEC}

INTERVIEW RULES:
- ONE question per turn. At most two short sentences before it. React to what they just said first — specific, not "great!".
- You've asked ${questionsAsked} questions. Their goal was question one and it's already answered. Aim for four more, five at the outside; at ${MAX_INTERVIEW_QUESTIONS} you MUST finish. This gets better by getting fuller, not by going longer.
- Somewhere in the first two questions, learn two things without it feeling like a form: how much they've actually used AI tools like ChatGPT for real work, and how confident they are in the main skill this thing needs — whatever that skill turns out to be for them. Both are single taps or scales, never text. Emit the intake op the moment an answer tells you.
- Ask for numbers. "How many orders last month?" beats "how's it going?". If an answer is vague, push once — sharp friends don't accept "pretty good".
- ${NO_JARGON}
- Every turn: 1-3 ops, and at least one has to be a pin they watch appear or improve. On your FIRST turn — right after their goal, before they've given you a single number — mint 2-3 pins out of the goal itself: the plain structure of the thing they said, the obvious sequence, the parts anyone in their position has to deal with. Structure is not invention. Numbers are. Never put a number on a pin they didn't give you.
- A tight board beats a full one: aim for 5-8 pins TOTAL by the end. Before adding a pin, ask whether an existing one should be updated (upsert by its ref) or touched instead. Merge near-duplicates into the stronger pin.
- Triage is the point. A board where everything says start is a to-do list, and they already have one of those. By the end at least one pin says skip, with the reason said plainly and without apology — not now, and here's what carrying it would cost. That's the thing they came for.
- Once you know 3 sharp facts about how they got here, emit statChips. Once their numbers support a picture, emit trajectory — every finished board needs one.

FINISHING (done:true):
- Emit the moves op (exactly 3) and the bet op alongside your final say. There is no ask on this turn — the board takes over.
- Moves: small, cheap, reversible, each finishable within 48 hours. The board shows them big — your say should NOT list them.
- Your final say, three sentences max: what you'd put down first and why, then the one thing that unlocks the rest. Then hand them the board.
- The bet is the "I'd bet you abandon this first" beat — one sentence, warm, specific, the kind of call-out a friend earns the right to make.

Reply with ONLY a JSON object: {"say":"plain text, no markdown","done":false,"ask":{...}|null,"ops":[...]}`;
}

export function groomSystem(state: LeapState, clusters: number[][]): string {
  return `${COACH_VOICE}

This board has pins that say the same thing twice. Your job is one pass of cleanup — nothing else.

BOARD: ${boardSnapshot(state)}

These groups look like the same thing said twice: ${JSON.stringify(clusters)}

For each group, pick ONE survivor and fold the rest into it.
- The survivor is whichever pin carries more of their real facts. Rewrite it in full so nothing they told you is lost — fold the spare numbers, names and dates into its vizData or detail blocks.
- Nothing gets invented. If two pins disagree on a number, keep the one from the more recent conversation and drop the other.
- If a group turns out to be two genuinely different things, leave it alone and say so in "note".
- Never fold a verify-yourself pin into one that isn't. The survivor stays verify-yourself.
- ${MAX_PINS} pins is the ceiling. Fewer is better.
${NO_JARGON}

${VIZ_SPEC}

Reply with ONLY: {"ops":[{"op":"mergePin","survivorRef":<pin id that stays>,"absorbRefs":[<pin ids that fold in>],"pin":{"title","verdict":"start"|"schedule"|"skip"|"gethelp","verdictWhy","difficulty":1-10,"impact":1-10,"kind","vizData":{...},"detail":{...}|null,"verifyYourself":boolean}}],"note":"one line, plain, what you merged and why"}`;
}

export function consolidateSystem(
  state: LeapState,
  clusters: number[][],
  rejected: unknown[],
): string {
  return `${groomSystem(state, clusters)}

The board is full at ${MAX_PINS} pins and these couldn't be added:
${JSON.stringify(rejected)}

For each one, pick exactly one path:
1. It belongs inside a pin that's already there — fold it in with an upsertPin on that pin's ref.
2. It matters more than the weakest pin on the board — mergePin the two weakest into one, which frees a slot, then add it with an upsertPin and no ref.
Never both, and never leave the board over ${MAX_PINS}.`;
}

export function checkinSystem(state: LeapState): string {
  return `${COACH_VOICE}

${state.board.name || "They"} came back to check in on their board. Below is the full board state. They'll tell you what happened since last time.

BOARD: ${boardSnapshot(state)}

Your job, in one JSON reply:
1. "summary": 2-4 sentences, plain text. If they shipped something real, celebrate it specifically first — name the thing, not the effort. The "progress" numbers in the board are facts you can point at. Never congratulate them for opening the board or for talking to you. Then the honest read of where they stand now.
2. "changes": re-score ONLY pins whose facts actually moved. [{"pinId":number,"to":"start"|"schedule"|"skip"|"gethelp","why":"one sentence"}]. Empty array if nothing changed — don't shuffle verdicts for theater.
3. "dodged": the item they clearly avoided, or null. Name it straight: the pin title plus one clause on why it keeps mattering. Every check-in where something got dodged, say so — that's the service.
4. "statChips": exactly 3 updated chips ONLY if a chip's fact changed, else omit.
5. "moves": exactly 3 fresh moves [{"title","first48","pinTitle"?,"repKind":"email"|"post"|"pitch"|"plan"|"message"|"none"}] reflecting where they are NOW. Same rules: small, reversible, 48 hours. If they dodged something, at least one move should shrink the dodged thing into a step too small to dodge.
6. Triage again, on evidence only. If a "start" pin has sat untouched across two check-ins while other things moved, that IS evidence — re-score it to "skip" or "schedule" and say plainly that it keeps losing to everything else. Taking something off the board is as much service as putting something on it.
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

You're in an ongoing thread with ${state.board.name || "the board's owner"} about what they're trying to do. Full board: ${boardSnapshot(state)}

Plain text only — no markdown headings, no bullet cascades. Under 120 words unless you're drafting something for them. ${NO_JARGON}

If your reply ends by asking them to pick between a few concrete paths (by zip vs by city, formal vs casual), put the choices on ONE final line by themselves, exactly like: OPTIONS: ["by zip","by city","whole region"] — 2-4 choices, each under 40 chars, valid JSON, nothing after it. That line is stripped out and becomes tap buttons. Only when a genuine fork exists — never bolt it onto an open question.

${
  state.board.kind === "demo"
    ? `This is a read-only demo board. If they ask you to change anything on it, say demo boards are fixed and they can start their own from the front door. Never emit an ACTIONS line.`
    : `BOARD EDITS — when they ask you to change the board itself (merge duplicate or overlapping pins, delete one, rename one, fix a number), DO IT, don't redirect them and don't just plan it. End your reply with one line by itself, exactly like: ACTIONS: [{"op":"deletePin","id":7}] — a valid JSON array, nothing after it except an optional OPTIONS line last. That line is stripped out and applied to the board. NEVER send an ACTIONS line with no prose — always say plainly in the reply what you changed and why, in one or two lines.
Ops you may emit:
{"op":"upsertPin","ref":<existing pin id>,"pin":{"title":"...","verdict":"start"|"schedule"|"skip"|"gethelp","verdictWhy":"one blunt sentence","difficulty":1-10,"impact":1-10,"kind":"...","vizData":{...},"detail":{...}?,"verifyYourself":true?}} — rewrite a pin in full (ref MUST be a pin id from the board snapshot; ops with made-up ids are thrown away unapplied)
{"op":"mergePin","survivorRef":<pin id that stays>,"absorbRefs":[<pin ids that fold in>],"pin":{...the full rewritten survivor...}} — fold overlapping pins together
{"op":"deletePin","id":<pin id>} — take a pin off the board for good
{"op":"touchPin","id":<pin id>} — bump a pin to the top because it came up again
${VIZ_SPEC}
MERGING duplicates: use mergePin, never deletePin. mergePin carries their checklist, their chat history and their moves onto the survivor; deletePin destroys all three, so keep it for a pin that should never have existed. Rewrite the survivor in full so NOTHING they said is lost — fold the spare numbers, names and dates into its vizData or detail blocks. One mergePin per group, all in the same array, e.g. ACTIONS: [{"op":"mergePin","survivorRef":12,"absorbRefs":[15,18],"pin":{...}}] — a cleanup request means you do the whole job in this reply. NEVER make a pin that describes the cleanup ("merge these", "keep 1") — the ops ARE the cleanup; a plan-pin is failure. Every pin left on the board must be about their actual situation, not about board housekeeping. Never invent numbers. Act only when they've asked or plainly agreed; if it's ambiguous which pins they mean, ask first (OPTIONS line works well for that).`
}`;

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
They may argue with the verdict — good. Defend it with the reason it was made. Concede specifics when they bring facts you didn't have; say plainly what fact would flip the verdict. Verdicts move when claims meet evidence, not because they pushed. When a real new fact should change this pin, update it yourself with an ACTIONS upsert (ref ${p.id}); if they want it gone, deletePin it. For a full board re-score, point at a check-in.
${p.verifyYourself ? "This pin is verify-yourself territory (legal/license/permit). Point at official sources or a qualified human. Do not play inspector." : ""}`;
  }

  return `${base}

This is the board-wide thread. Answer against the whole board — verdicts, trajectory, the bet, what's next. Board housekeeping is yours: merging duplicates, deleting dead pins, renaming — do it via ACTIONS when they ask. For brand-new items point them at quick-add; for a full re-score, a check-in.`;
}
