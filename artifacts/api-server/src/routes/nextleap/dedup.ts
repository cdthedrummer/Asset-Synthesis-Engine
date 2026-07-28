/**
 * Near-duplicate detection for pins.
 *
 * The board's promise is that it stays tight and never shows the same thing
 * twice. Until now that promise lived entirely in prompt text ("aim for 6-9
 * pins TOTAL... merge near-duplicates into the stronger pin") plus one
 * deterministic check: exact lowercase title equality in applyOps' byTitle map.
 * So a model emitting "Instagram preorders" once and "IG preorder posts" the
 * next turn silently created a twin, and the tightness promise quietly failed.
 *
 * A rule that can be expressed in code does not belong in a prompt — the same
 * principle that puts the chat op allowlist on the server. These are the rules
 * that can be.
 *
 * Pure and dependency-free: no db, no drizzle. Worth unit tests the day this
 * repo has a runner.
 */

/** Words that carry no distinguishing signal in a pin title. */
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "my",
  "our",
  "of",
  "for",
  "to",
  "and",
  "with",
  "on",
  "in",
  "at",
  "up",
  "get",
  "getting",
  "plan",
  "planning",
]);

/** Same normalized title, or this much token overlap, means the same pin. */
const JACCARD_STRONG = 0.6;
/** Weaker overlap still counts when both pins render the same template. */
const JACCARD_WITH_SAME_KIND = 0.4;

export interface DedupPin {
  id: number;
  title: string;
  kind: string;
  vizData: unknown;
  impact: number;
  lastTouchedAt: Date;
}

export interface NormalizedTitle {
  /** Canonical key — stopword-free, singularized, alphabetically sorted. */
  key: string;
  tokens: Set<string>;
}

export function normalizeTitle(title: string): NormalizedTitle {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
    // Crude singularization: "orders" and "order" are the same subject. Kept
    // deliberately dumb — a stemmer would be a dependency for no real gain.
    .map((t) => (t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t));
  const unique = new Set(tokens);
  return { key: [...unique].sort().join(" "), tokens: unique };
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / (a.size + b.size - shared);
}

/**
 * Canonical fingerprint of what a pin actually shows. Catches the case a title
 * comparison can't: the model renamed a pin and re-emitted the identical
 * visual, which to the owner is unmistakably the same card.
 */
export function vizFingerprint(kind: string, vizData: unknown): string {
  return `${kind}:${stableStringify(vizData)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

export interface DuplicateCandidate {
  title: string;
  kind: string;
  vizData: unknown;
}

/**
 * The existing pin `candidate` is really a second copy of, or null.
 *
 * Conservative on purpose. A false positive folds two genuinely different
 * things together — no data is lost (mergePins re-parents everything) but the
 * owner is confused, and only they can undo it. A false negative just leaves a
 * twin the groom pass or a chat cleanup will catch later.
 */
export function findDuplicate(
  pins: DedupPin[],
  candidate: DuplicateCandidate,
  excludeId?: number,
): DedupPin | null {
  const norm = normalizeTitle(candidate.title);
  if (norm.tokens.size === 0) return null;
  const fingerprint = vizFingerprint(candidate.kind, candidate.vizData);
  const hasViz =
    candidate.vizData != null &&
    typeof candidate.vizData === "object" &&
    Object.keys(candidate.vizData as Record<string, unknown>).length > 0;

  let best: { pin: DedupPin; score: number } | null = null;
  for (const pin of pins) {
    if (excludeId != null && pin.id === excludeId) continue;
    const pinNorm = normalizeTitle(pin.title);
    let score = 0;

    if (pinNorm.key === norm.key) score = 1;
    else if (hasViz && vizFingerprint(pin.kind, pin.vizData) === fingerprint) score = 1;
    else {
      const overlap = jaccard(pinNorm.tokens, norm.tokens);
      const threshold =
        pin.kind === candidate.kind ? JACCARD_WITH_SAME_KIND : JACCARD_STRONG;
      if (overlap >= threshold) score = overlap;
    }

    if (score > 0 && (!best || score > best.score)) best = { pin, score };
  }
  return best?.pin ?? null;
}

/**
 * Groups of pins already on the board that say the same thing. Transitive
 * closure, so A~B and B~C arrive as one group of three. Feeds the groom pass.
 */
export function findDuplicateClusters(pins: DedupPin[]): number[][] {
  const parent = new Map<number, number>();
  const find = (id: number): number => {
    let root = id;
    while ((parent.get(root) ?? root) !== root) root = parent.get(root) ?? root;
    return root;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const p of pins) parent.set(p.id, p.id);

  for (let i = 0; i < pins.length; i++) {
    for (let j = i + 1; j < pins.length; j++) {
      const a = pins[i]!;
      const b = pins[j]!;
      const match = findDuplicate([a], {
        title: b.title,
        kind: b.kind,
        vizData: b.vizData,
      });
      if (match) union(a.id, b.id);
    }
  }

  const groups = new Map<number, number[]>();
  for (const p of pins) {
    const root = find(p.id);
    groups.set(root, [...(groups.get(root) ?? []), p.id]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

/**
 * Which pin survives a merge when the model won't or can't decide. Highest
 * twelve-month impact wins; ties break toward the pin the owner has invested
 * more in (checklist items, then chat), then the more recently discussed one.
 * Deterministic so duplicates still get resolved with a dead model.
 */
export function pickSurvivor(
  pins: DedupPin[],
  weight: (pinId: number) => { tasks: number; messages: number },
): DedupPin | null {
  if (pins.length === 0) return null;
  return [...pins].sort((a, b) => {
    if (b.impact !== a.impact) return b.impact - a.impact;
    const wa = weight(a.id);
    const wb = weight(b.id);
    if (wb.tasks !== wa.tasks) return wb.tasks - wa.tasks;
    if (wb.messages !== wa.messages) return wb.messages - wa.messages;
    return b.lastTouchedAt.getTime() - a.lastTouchedAt.getTime();
  })[0]!;
}
