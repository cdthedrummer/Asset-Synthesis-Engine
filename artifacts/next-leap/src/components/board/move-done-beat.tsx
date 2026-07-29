import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { NlProgress } from '@workspace/api-client-react';
import { CycleDots } from './pulse-card';

/**
 * What closing a move feels like.
 *
 * The celebrating is done by motion, not by words — the check travels into the
 * round's dot row and the count ticks up. Exactly one flat, factual line comes
 * with it. No confetti, no toast, no sound, no second colour.
 */
export const MoveDoneBeat = ({
  progress,
  line,
  tone = 'done',
  onFinish,
}: {
  progress: NlProgress;
  line: string;
  tone?: 'done' | 'dropped';
  onFinish: () => void;
}) => {
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const t = setTimeout(onFinish, reduce ? 700 : 1500);
    return () => clearTimeout(t);
  }, [onFinish, reduce]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
      >
        <motion.div
          layoutId="move-done-check"
          initial={reduce ? { scale: 1 } : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            tone === 'done' ? 'bg-moss' : 'bg-muted'
          }`}
        >
          <Check
            className={`w-7 h-7 ${tone === 'done' ? 'text-white' : 'text-muted-foreground'}`}
            strokeWidth={3}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.25 }}
          className="mt-6"
        >
          <div className="font-sans text-metric font-bold leading-none tracking-tight text-foreground">
            {progress.done}
          </div>
          <CycleDots progress={progress} className="mt-3 justify-center" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.45 }}
          className={`mt-6 max-w-[300px] text-body leading-relaxed font-medium ${
            tone === 'done' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {line}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};
