import React from 'react';
import { NlPin } from '@workspace/api-client-react';
import { Visualizer } from './visuals';

export interface BoardBet {
  text?: string;
  pinId?: number;
  pinTitle?: string;
}

/**
 * "The one item I'd bet you abandon first."
 *
 * The engine has always generated this, force-repaired it when the model skipped
 * it, and stored it on the board — and nothing ever rendered it. It was the most
 * valuable sentence the product produces and it was invisible.
 *
 * This is the one board surface that legitimately carries a whole sentence. The
 * near-wordless rule is about labels: a pin has to self-identify without prose.
 * This isn't a label, it's the voice, and it's the single line the entire
 * interview exists to earn.
 */
export const BetCard = ({
  bet,
  pin,
  onOpenPin,
  className = '',
}: {
  bet: BoardBet | null;
  pin?: NlPin;
  onOpenPin?: (pinId: number) => void;
  className?: string;
}) => {
  if (!bet?.text) return null;
  const pinId = bet.pinId;
  const canOpen = !!pinId && !!onOpenPin;

  return (
    <div
      className={`relative overflow-hidden bg-card border border-border rounded-[24px] p-5 shadow-sm ${className}`}
    >
      {/* The pin it's about, dimmed underneath — you can see what's being called. */}
      {pin && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.07] scale-110 origin-right"
        >
          <Visualizer kind={pin.kind} data={pin.vizData} />
        </div>
      )}

      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[#BE123C] font-bold mb-2">
          The bet
        </div>
        <p className="text-[16px] leading-relaxed text-foreground font-medium">{bet.text}</p>

        {canOpen && (
          <button
            onClick={() => onOpenPin!(pinId!)}
            className="mt-4 px-4 py-2 rounded-full border border-border bg-card text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/40 active:scale-95 transition-all"
          >
            Prove me wrong
          </button>
        )}
      </div>
    </div>
  );
};
