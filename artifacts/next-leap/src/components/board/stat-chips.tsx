import React from 'react';
import { NlBoardStatChipsItem } from '@workspace/api-client-react';

export const StatChips = ({ chips }: { chips: NlBoardStatChipsItem[] | null }) => {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="flex gap-2">
      {chips.map((chip, i) => {
        const isGood = chip.tone === 'good';
        const isWarn = chip.tone === 'warn';
        const bgClass = isGood ? 'bg-moss-tint border-moss-2' : isWarn ? 'bg-ochre-tint border-ochre-edge' : 'bg-card border-border';
        const textClass = isGood ? 'text-moss' : isWarn ? 'text-ochre' : 'text-foreground';
        const subClass = isGood ? 'text-moss opacity-80' : isWarn ? 'text-ochre opacity-80' : 'text-muted-foreground';

        return (
          <div key={i} className={`${bgClass} border rounded-lg p-3 flex-1 shadow-sm flex flex-col items-center justify-center min-w-0`}>
            <div className={`text-title font-bold ${textClass} font-sans leading-none mb-1.5 truncate w-full text-center`}>{chip.value}</div>
            <div className={`text-kicker-sm font-mono uppercase tracking-[0.1em] ${subClass} font-bold text-center truncate w-full`}>{chip.label}</div>
          </div>
        );
      })}
    </div>
  );
};
