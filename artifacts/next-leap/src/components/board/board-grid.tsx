import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { NlPin, NlTask } from '@workspace/api-client-react';
import { BoardItem } from './pin-item';

/**
 * The masonry, plus the thing that makes it feel alive: cards visibly arriving.
 *
 * A placeholder is rendered for each card we expect from the turn in flight, and
 * when the real pin lands the placeholder leaves as the pin enters in the same
 * layout slot — so it reads as the card resolving rather than a list jumping.
 * That difference is most of what turns "a board appeared eventually" into
 * "I watched it build".
 */

/** Pin-shaped, and wordless — the near-wordless rule applies to placeholders. */
const MintingCard = () => (
  <div className="bg-card border border-border rounded-[24px] p-3.5 shadow-sm break-inside-avoid w-full animate-pulse">
    <div className="flex justify-between items-start mb-4 gap-2">
      <div className="h-4 w-16 rounded-full bg-[var(--color-divider)]" />
      <div className="h-3 w-10 rounded-full bg-[var(--color-divider)]" />
    </div>
    <div className="space-y-2.5">
      <div className="h-3 w-full rounded-full bg-[var(--color-divider)]" />
      <div className="h-3 w-4/5 rounded-full bg-[var(--color-divider)]" />
      <div className="h-3 w-2/3 rounded-full bg-[var(--color-divider)]" />
    </div>
  </div>
);

export const BoardGrid = ({
  pins,
  tasks,
  mintingCount = 0,
  mintedIds,
  onOpenPin,
  onVerdictClick,
}: {
  pins: NlPin[];
  tasks: NlTask[];
  mintingCount?: number;
  mintedIds?: Set<number>;
  onOpenPin: (pinId: number) => void;
  onVerdictClick: (e: React.MouseEvent, pinId: number) => void;
}) => {
  const reduce = useReducedMotion();
  const newest = React.useRef<number | null>(null);

  // Bring the first freshly-minted card into view, once per batch.
  React.useEffect(() => {
    const first = mintedIds && mintedIds.size > 0 ? [...mintedIds][0]! : null;
    if (first == null || first === newest.current) return;
    newest.current = first;
    requestAnimationFrame(() => {
      document
        .getElementById(`pin-${first}`)
        ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    });
  }, [mintedIds, reduce]);

  const tasksFor = (pinId: number) => tasks.filter(t => t.pinId === pinId);

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      <AnimatePresence initial={false}>
        {Array.from({ length: mintingCount }).map((_, i) => (
          <motion.div
            key={`minting-${i}`}
            layout
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="break-inside-avoid"
          >
            <MintingCard />
          </motion.div>
        ))}

        {pins.map(pin => (
          <motion.div
            key={pin.id}
            id={`pin-${pin.id}`}
            layout
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="break-inside-avoid"
          >
            <BoardItem
              pin={pin}
              tasks={tasksFor(pin.id)}
              minted={mintedIds?.has(pin.id)}
              onClick={() => onOpenPin(pin.id)}
              onVerdictClick={e => onVerdictClick(e, pin.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
