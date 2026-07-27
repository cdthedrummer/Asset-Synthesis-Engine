import React from 'react';
import { NlBoardStatChipsItem } from '@workspace/api-client-react';

export const StatChips = ({ chips }: { chips: NlBoardStatChipsItem[] | null }) => {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="flex gap-2">
      {chips.map((chip, i) => {
        const isGood = chip.tone === 'good';
        const isWarn = chip.tone === 'warn';
        const bgClass = isGood ? 'bg-[#ECFDF5] border-[#BBF7D0]' : isWarn ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-card border-border';
        const textClass = isGood ? 'text-[#10B981]' : isWarn ? 'text-[#D97706]' : 'text-foreground';
        const subClass = isGood ? 'text-[#10B981] opacity-80' : isWarn ? 'text-[#D97706] opacity-80' : 'text-muted-foreground';

        return (
          <div key={i} className={`${bgClass} border rounded-[20px] p-3 flex-1 shadow-sm flex flex-col items-center justify-center min-w-0`}>
            <div className={`text-[20px] font-bold ${textClass} font-sans leading-none mb-1.5 truncate w-full text-center`}>{chip.value}</div>
            <div className={`text-[9px] font-mono uppercase tracking-[0.1em] ${subClass} font-bold text-center truncate w-full`}>{chip.label}</div>
          </div>
        );
      })}
    </div>
  );
};
