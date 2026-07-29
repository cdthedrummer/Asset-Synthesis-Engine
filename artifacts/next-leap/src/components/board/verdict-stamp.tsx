import React from 'react';

export type VerdictLabel = 'START' | 'SCHEDULE' | 'GET HELP' | 'SKIP FOR NOW';

/**
 * Verdict colours as token *pointers*, not values.
 *
 * This replaces a `STYLE_GUIDE` object that had grown into a full second design
 * system (canvas, surface, three ink levels, border, divider, radii, shadows)
 * applied through inline `style={{}}`, where Tailwind could not see it and
 * nothing kept it in sync with index.css.
 *
 * An export is still needed — the stamp computes three colours from two
 * booleans, which cannot be expressed as static classes without a twelve-branch
 * lookup — but it now holds `var()` references, so CSS remains the only source
 * of truth.
 */
export const VERDICT_TOKENS = {
  START: {
    fill: 'var(--verdict-start-fill)',
    ink: 'var(--verdict-start-ink)',
    edge: 'var(--verdict-start-edge)',
  },
  SCHEDULE: {
    fill: 'var(--verdict-schedule-fill)',
    ink: 'var(--verdict-schedule-ink)',
    edge: 'var(--verdict-schedule-edge)',
  },
  'GET HELP': {
    fill: 'var(--verdict-help-fill)',
    ink: 'var(--verdict-help-ink)',
    edge: 'var(--verdict-help-edge)',
  },
  'SKIP FOR NOW': {
    fill: 'var(--verdict-skip-fill)',
    ink: 'var(--verdict-skip-ink)',
    edge: 'var(--verdict-skip-edge)',
  },
} as const satisfies Record<VerdictLabel, { fill: string; ink: string; edge: string }>;

export const VERDICT_EXPLANATIONS: Record<VerdictLabel, string> = {
  START: 'Do it in the next 48 hours.',
  SCHEDULE: 'Real, but it has a trigger date.',
  'SKIP FOR NOW': 'Costs more than it moves.',
  'GET HELP': 'One conversation unblocks it.',
};

export const VERDICT_ORDER: VerdictLabel[] = ['START', 'SCHEDULE', 'GET HELP', 'SKIP FOR NOW'];

/** Map raw verdict values from the API (start | schedule | skip | gethelp) to display labels. */
export function verdictLabel(verdict: string): VerdictLabel {
  switch (verdict.toLowerCase().replace(/[\s_-]/g, '')) {
    case 'schedule':
      return 'SCHEDULE';
    case 'skip':
    case 'skipfornow':
      return 'SKIP FOR NOW';
    case 'gethelp':
      return 'GET HELP';
    default:
      return 'START';
  }
}

/**
 * Visual emphasis only — never sort order. Pins sort by conversation recency by
 * design, so the board keeps mirroring the conversation.
 *
 * The product's promise is triage, so the four verdicts are not peers. START is
 * the only saturated fill on the board; SKIP FOR NOW goes to a hairline so the
 * permission-to-drop reads as a decision rather than an alarm.
 */
export const VERDICT_WEIGHT: Record<string, number> = {
  START: 3,
  'GET HELP': 2,
  SCHEDULE: 1,
  'SKIP FOR NOW': 0,
};

export const VerdictStamp = ({
  verdict,
  onClick,
  className = '',
}: {
  verdict: string;
  onClick?: (e: React.MouseEvent, v: string) => void;
  className?: string;
}) => {
  const normVerdict = verdictLabel(verdict);
  const token = VERDICT_TOKENS[normVerdict];
  const isStart = normVerdict === 'START';

  const pill = (
    <span
      className={`inline-flex w-auto items-center rounded-pill border font-mono uppercase font-bold relative z-10 shrink-0 whitespace-nowrap ${
        // Size delta is part of "verdicts are not peers". The old non-START
        // size was 8px, which is unreadable on a phone; 9px against START's
        // 10px keeps the hierarchy and clears the legibility floor.
        isStart ? 'px-2.5 py-1.5 text-kicker' : 'px-1.5 py-1 text-kicker-sm'
      } ${onClick ? 'active:scale-95 transition-transform' : ''} ${className}`}
      style={{ backgroundColor: token.fill, color: token.ink, borderColor: token.edge }}
    >
      {normVerdict}
    </span>
  );

  if (!onClick) return pill;

  // The pill has to stay visually tiny — the triage hierarchy depends on START
  // being the only loud thing — but it is the ONLY entry point to the verdict
  // popover, i.e. the only door to what the board means. So the hit box grows
  // with padding and the layout is pulled back with a matching negative margin:
  // a 44px target, zero visual change.
  return (
    <button
      onClick={e => onClick(e, normVerdict)}
      aria-label={`${normVerdict} — ${VERDICT_EXPLANATIONS[normVerdict]}`}
      className="inline-flex items-center px-2 -mx-2 py-3 -my-3"
    >
      {pill}
    </button>
  );
};
