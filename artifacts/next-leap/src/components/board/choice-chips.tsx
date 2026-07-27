import React from 'react';

/**
 * Tap-to-answer chips. One shape everywhere: the interview overlay and every
 * chat thread render the same 2-4 short strings the server hands back.
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
  <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        disabled={disabled}
        onClick={() => onPick(opt)}
        className="px-4 py-2.5 rounded-full bg-card border border-border shadow-sm font-sans text-[14px] font-medium text-foreground hover:border-[#10B981] hover:text-[#059669] active:scale-95 transition-all disabled:opacity-50 animate-in fade-in slide-in-from-bottom-1 duration-300"
      >
        {opt}
      </button>
    ))}
  </div>
);
