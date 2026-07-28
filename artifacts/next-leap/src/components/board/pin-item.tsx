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
  tasks = [],
  minted,
  onClick,
  onVerdictClick,
}: {
  pin: NlPin,
  /** This pin's checklist items, so progress shows on the board itself. */
  tasks?: { done: boolean }[],
  /** Just created or just upgraded — plays a one-shot ring. */
  minted?: boolean,
  onClick: () => void,
  onVerdictClick: (e: React.MouseEvent, v: string) => void
}) => {
  const recency = formatRecency(pin.lastTouchedAt);
  // Triage means one verdict is loud and one is quiet. A dropped pin reads as
  // dropped from across the room, with the stamp covered — the card itself sets
  // down rather than the chip getting smaller.
  const isSkipped = pin.verdict.toLowerCase().replace(/[\s_-]/g, '') === 'skip'
    || pin.verdict.toLowerCase().replace(/[\s_-]/g, '') === 'skipfornow';
  const doneCount = tasks.filter(t => t.done).length;
  const ratio = tasks.length > 0 ? doneCount / tasks.length : 0;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-card border rounded-[24px] p-3.5 flex flex-col transition-all text-left active:scale-[0.98] cursor-pointer break-inside-avoid w-full min-w-0 ${
        isSkipped
          ? 'border-border opacity-70 shadow-none hover:opacity-100'
          : 'border-border shadow-sm hover:shadow-md'
      } ${minted ? 'ring-2 ring-[#10B981] ring-offset-2 ring-offset-background' : ''}`}
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

      {/* Ticking a checkbox has to change the board, not just a drawer. No text. */}
      {tasks.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-divider)]">
          <div
            className="h-full bg-[#10B981] transition-[width] duration-500"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};
