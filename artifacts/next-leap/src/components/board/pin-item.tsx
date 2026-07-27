import React from 'react';
import { VerdictStamp } from './verdict-stamp';
import { Visualizer } from './visuals';
import { NlPin } from '@workspace/api-client-react';

export function formatRecency(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const hours = (Date.now() - then) / 36e5;
  if (hours < 6) return 'Just now';
  if (hours < 24) return 'Today';
  if (hours < 48) return 'Yesterday';
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const BoardItem = ({ 
  pin, 
  onClick, 
  onVerdictClick 
}: { 
  pin: NlPin, 
  onClick: () => void, 
  onVerdictClick: (e: React.MouseEvent, v: string) => void 
}) => {
  const recency = formatRecency(pin.lastTouchedAt);

  return (
    <div 
      onClick={onClick}
      className="bg-card border border-border rounded-[24px] p-3.5 flex flex-col shadow-sm hover:shadow-md transition-all text-left active:scale-[0.98] cursor-pointer break-inside-avoid w-full min-w-0"
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="min-w-0 shrink">
          <VerdictStamp verdict={pin.verdict} onClick={onVerdictClick} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase mt-1 shrink-0">{recency}</span>
          {pin.verifyYourself && (
             <span className="text-[8px] font-mono font-bold text-[#D97706] uppercase mt-1 shrink-0 bg-[#FFFBEB] px-1.5 py-0.5 rounded-full">Verify</span>
          )}
        </div>
      </div>
      <Visualizer kind={pin.kind} data={pin.vizData} />
    </div>
  );
};
