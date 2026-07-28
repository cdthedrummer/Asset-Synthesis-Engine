/**
 * The board's sensor.
 *
 * A pinboard borrowed the look of a phone health app, but not its physics: a
 * health app is filled in by a sensor while you sleep, and this board has no
 * pedometer. Nothing here changes unless the owner does something. So the
 * progress layer is not a reward skin on top of the product — it IS the only
 * telemetry this app can honestly collect, and it's what keeps the board alive
 * on a Tuesday when nobody has typed anything for nine days.
 *
 * MEASURED — every one of these is a state change the owner caused, with a
 * timestamp, and none of them can be advanced by opening the app:
 *   done      moves closed
 *   dropped   moves deliberately skipped (a decision, not a gap)
 *   reps      moves that produced a real draft
 *   ticks     checklist items the owner ticked, in their own words
 *   checkins  they came back and reported
 *
 * DELIBERATELY NOT MEASURED, and please don't re-add them: board opens,
 * visits, sessions, days-since-created, message or word counts, XP, levels,
 * badges, titles, "profile completeness", or any percent-complete of the goal.
 * Nobody knows the denominator of "open a bakery"; inventing one is exactly the
 * theater this product is supposed to be the opposite of.
 *
 * Streaks are counted in WEEKS, never days. A day streak is an app-opening
 * reward with extra steps. A week can only be advanced by closing a move,
 * ticking a box, or checking in — and empty weeks render empty, because the
 * board is allowed to look quiet when the owner was quiet.
 *
 * Pure and dependency-free on purpose: no db, no React, structural input type
 * rather than importing LeapState (which would make engine.ts circular). First
 * thing in here worth a unit test the day this repo gets a test runner.
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS_SHOWN = 8;
/** Moves promise "finishable within 48 hours" — so that promise is the clock. */
const CYCLE_STALE_MS = 48 * 60 * 60 * 1000;

export interface ProgressMoveInput {
  state: string;
  cycleIndex: number;
  doneAt: Date | null;
  repDraft: string | null;
  createdAt: Date;
}

export interface ProgressTaskInput {
  done: boolean;
  doneAt: Date | null;
}

export interface ProgressCheckinInput {
  createdAt: Date;
}

/** Structurally satisfied by LeapState — pass the state straight in. */
export interface ProgressInput {
  moves: ProgressMoveInput[];
  tasks: ProgressTaskInput[];
  checkins: ProgressCheckinInput[];
}

export interface ProgressCycle {
  index: number;
  done: number;
  dropped: number;
  open: number;
  issuedAt: string | null;
  staleAt: string | null;
}

export interface ProgressWeek {
  /** UTC ISO-week start (Monday), YYYY-MM-DD. */
  start: string;
  actions: number;
}

export interface Progress {
  done: number;
  dropped: number;
  reps: number;
  ticks: number;
  checkins: number;
  cycle: ProgressCycle;
  weeks: ProgressWeek[];
  activeWeeks: number;
  lastActionAt: string | null;
}

/**
 * Midnight UTC on the Monday of the week containing `d`. Bucketing happens on
 * the server, in UTC, and ships pre-bucketed — so the client never re-derives
 * week boundaries and can never disagree with the number next to them.
 */
function weekStart(d: Date): number {
  const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  // getUTCDay: 0 = Sunday. Shift so Monday is 0.
  const dayOffset = (new Date(utc).getUTCDay() + 6) % 7;
  return utc - dayOffset * 24 * 60 * 60 * 1000;
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function computeProgress(
  state: ProgressInput,
  now: Date = new Date(),
): Progress {
  const doneMoves = state.moves.filter((m) => m.state === "done");
  const droppedMoves = state.moves.filter((m) => m.state === "skipped");
  const doneTasks = state.tasks.filter((t) => t.done);

  // Only timestamped facts can be placed on the week strip. `reps` has no
  // timestamp of its own (repDraft is just text on the move), so it counts
  // toward the totals but never toward a week — better a missing bar than a
  // guessed one.
  const stamps: Date[] = [
    ...doneMoves.map((m) => m.doneAt),
    ...droppedMoves.map((m) => m.doneAt),
    ...doneTasks.map((t) => t.doneAt),
    ...state.checkins.map((c) => c.createdAt),
  ].filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()));

  const thisWeek = weekStart(now);
  const oldestShown = thisWeek - (WEEKS_SHOWN - 1) * WEEK_MS;

  const buckets = new Map<number, number>();
  for (let i = 0; i < WEEKS_SHOWN; i++) buckets.set(oldestShown + i * WEEK_MS, 0);
  for (const s of stamps) {
    const bucket = weekStart(s);
    if (bucket < oldestShown || bucket > thisWeek) continue;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  const weeks: ProgressWeek[] = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([start, actions]) => ({ start: isoDate(start), actions }));

  // Consecutive weeks with at least one action, counting back from this week.
  let activeWeeks = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if ((weeks[i]?.actions ?? 0) === 0) break;
    activeWeeks++;
  }

  const lastActionMs = stamps.reduce(
    (max, d) => Math.max(max, d.getTime()),
    0,
  );

  // The current round of three: whatever the highest cycleIndex is. Every
  // check-in issues a fresh set, so without this the counts would blend rounds.
  const cycleIndex = state.moves.reduce(
    (max, m) => Math.max(max, m.cycleIndex ?? 0),
    0,
  );
  const cycleMoves = state.moves.filter((m) => (m.cycleIndex ?? 0) === cycleIndex);
  const issuedMs = cycleMoves.reduce(
    (min, m) => Math.min(min, m.createdAt.getTime()),
    Number.POSITIVE_INFINITY,
  );
  const hasCycle = cycleMoves.length > 0 && Number.isFinite(issuedMs);

  return {
    done: doneMoves.length,
    dropped: droppedMoves.length,
    reps: state.moves.filter((m) => m.repDraft != null && m.repDraft !== "")
      .length,
    ticks: doneTasks.length,
    checkins: state.checkins.length,
    cycle: {
      index: cycleIndex,
      done: cycleMoves.filter((m) => m.state === "done").length,
      dropped: cycleMoves.filter((m) => m.state === "skipped").length,
      open: cycleMoves.filter((m) => m.state === "pending").length,
      issuedAt: hasCycle ? new Date(issuedMs).toISOString() : null,
      staleAt: hasCycle
        ? new Date(issuedMs + CYCLE_STALE_MS).toISOString()
        : null,
    },
    weeks,
    activeWeeks,
    lastActionAt: lastActionMs > 0 ? new Date(lastActionMs).toISOString() : null,
  };
}
