import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tap-to-answer chips. One shape everywhere: the interview overlay and every
 * chat thread render the same 2-4 short strings the server hands back.
 *
 * cn() rather than string concatenation so a caller can actually override the
 * defaults — the board's persistent bar needs `flex-nowrap`, and a bare template
 * string leaves both wrap and nowrap in the class list with the winner decided
 * by stylesheet order.
 */
export const ChoiceChips = ({
  options,
  onPick,
  disabled,
  className,
}: {
  options: string[];
  onPick: (option: string) => void;
  disabled?: boolean;
  className?: string;
}) => (
  <div className={cn('flex flex-wrap gap-2', className)}>
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        disabled={disabled}
        onClick={() => onPick(opt)}
        className="shrink-0 px-4 py-2.5 rounded-pill bg-card border border-rule shadow-sm text-body font-medium text-ink-1 hover:border-ink-1 active:scale-95 transition-all disabled:opacity-50 animate-in fade-in slide-in-from-bottom-1 duration-300"
      >
        {opt}
      </button>
    ))}
  </div>
);
