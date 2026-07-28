import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { NlProgress } from '@workspace/api-client-react';
import { formatRecency } from './pin-item';

/**
 * The board's pulse: what the owner has actually done.
 *
 * Sits with StatChips (how we got here) and TrajectoryCard (where it goes) as a
 * fixed board-level element, deliberately NOT a pin kind the model can place.
 * Two reasons: pins must carry facts the owner said, and these are facts the app
 * observed; and letting the model own the one literally-true part of the board
 * would go stale the instant a checkbox ticks.
 *
 * Wordless except a single date stamp. Cover every label and it still reads as
 * "a number, and three things, some of them finished."
 */

/** One accent, no chart junk. Steps up with the week's real activity. */
function weekTone(actions: number): string {
  if (actions === 0) return 'bg-canvas border border-[#E7E5E4]';
  if (actions === 1) return 'bg-[#ECFDF5]';
  if (actions <= 3) return 'bg-[#A7F3D0]';
  if (actions <= 6) return 'bg-[#34D399]';
  return 'bg-[#10B981]';
}

const CountUp = ({ value }: { value: number }) => {
  const reduce = useReducedMotion();
  return (
    <motion.span
      key={value}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="inline-block font-sans text-[44px] font-bold leading-none tracking-tight text-foreground"
    >
      {value}
    </motion.span>
  );
};

/** One dot per move in the current round. Warm outline = past its 48 hours. */
export const CycleDots = ({
  progress,
  className = '',
}: {
  progress: NlProgress;
  className?: string;
}) => {
  const { done, dropped, open } = progress.cycle;
  const stale =
    !!progress.cycle.staleAt && new Date(progress.cycle.staleAt).getTime() < Date.now();
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < done; i++)
    dots.push(<span key={`d${i}`} className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />);
  for (let i = 0; i < dropped; i++)
    dots.push(
      <span key={`s${i}`} className="relative w-2.5 h-2.5 rounded-full bg-border">
        <span className="absolute left-0 right-0 top-1/2 h-px bg-muted-foreground" />
      </span>,
    );
  for (let i = 0; i < open; i++)
    dots.push(
      <span
        key={`o${i}`}
        className={`w-2.5 h-2.5 rounded-full border-2 ${stale ? 'border-[#D97706]' : 'border-border'}`}
      />,
    );
  if (dots.length === 0) return null;
  return <div className={`flex items-center gap-1.5 ${className}`}>{dots}</div>;
};

export const PulseCard = ({
  progress,
  onClick,
}: {
  progress: NlProgress;
  onClick: () => void;
}) => {
  // Nothing done and nothing to show yet — an empty pulse card is just chrome.
  const hasSignal =
    progress.done > 0 ||
    progress.dropped > 0 ||
    progress.ticks > 0 ||
    progress.checkins > 0 ||
    progress.cycle.open > 0;
  if (!hasSignal) return null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-[24px] p-5 shadow-sm active:scale-[0.98] transition-transform flex items-center gap-5 min-w-0"
    >
      <div className="shrink-0">
        <CountUp value={progress.done} />
        <CycleDots progress={progress} className="mt-2.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex gap-1 justify-end">
          {progress.weeks.map(week => (
            <div
              key={week.start}
              className={`flex-1 max-w-[26px] aspect-square rounded-[6px] ${weekTone(week.actions)}`}
            />
          ))}
        </div>
        <div className="mt-2 text-right font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold truncate">
          {formatRecency(progress.lastActionAt) || 'Nothing yet'}
        </div>
      </div>
    </button>
  );
};
