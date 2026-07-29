import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { NlMove, NlPin } from '@workspace/api-client-react';
import { VerdictStamp, verdictLabel } from './verdict-stamp';
import { BetCard, BoardBet } from './bet-card';
import { currentCycleMoves } from './moves-overlay';

/**
 * The payoff of session one.
 *
 * Before this, the interview ended, the overlay returned null, and the owner was
 * dropped onto a grid with no idea what they'd been given. The promise of this
 * product is triage relief, so the reveal says the triage out loud, in this
 * order and no other:
 *
 *   1. THE DROP  — what you're allowed to stop carrying. First, deliberately.
 *   2. THE BET   — the one you'd abandon first. The line the interview earns.
 *   3. THE THREE — the next 48 hours, and keep the link.
 *
 * Gated on localStorage rather than a column: "has this device seen the
 * animation" is exactly what localStorage is for, and it needs no route and no
 * demo-board carve-out. Private browsing replays it — acceptable, and the board
 * header keeps a Replay entry so it's re-viewable on purpose.
 */

export function revealSeenKey(token: string): string {
  return `nl:revealed:${token}`;
}

export function hasSeenReveal(token: string): boolean {
  try {
    return window.localStorage.getItem(revealSeenKey(token)) === '1';
  } catch {
    // Private mode or blocked storage: show it. A repeated reveal is a much
    // smaller failure than never showing the payoff at all.
    return false;
  }
}

export function markRevealSeen(token: string): void {
  try {
    window.localStorage.setItem(revealSeenKey(token), '1');
  } catch {
    /* nothing to do — the reveal just shows again next time */
  }
}

const KICKER = 'font-mono text-kicker uppercase tracking-widest font-bold';

export const RevealOverlay = ({
  pins,
  moves,
  bet,
  token,
  onOpenPin,
  onOpenMoves,
  onClose,
}: {
  pins: NlPin[];
  moves: NlMove[];
  bet: BoardBet | null;
  token: string;
  onOpenPin: (pinId: number) => void;
  onOpenMoves: () => void;
  onClose: () => void;
}) => {
  const reduce = useReducedMotion();
  const [beat, setBeat] = React.useState(0);
  const [copied, setCopied] = React.useState(false);

  const dropped = pins.filter(p => verdictLabel(p.verdict) === 'SKIP FOR NOW');
  // Fallback so the drop beat is never empty: if the model gave nothing to
  // skip, the scheduled pins are still "not this week".
  const deferred = pins.filter(p => verdictLabel(p.verdict) === 'SCHEDULE');
  const dropList = dropped.length > 0 ? dropped : deferred;
  const dropLabel = dropped.length > 0 ? 'Not now' : 'Not this week';

  const cycle = currentCycleMoves(moves);
  const betPin = bet?.pinId ? pins.find(p => p.id === bet.pinId) : undefined;

  // Beats that have nothing to show are skipped rather than rendered empty.
  const beats = React.useMemo(() => {
    const list: ('drop' | 'bet' | 'three')[] = [];
    if (dropList.length > 0) list.push('drop');
    if (bet?.text) list.push('bet');
    list.push('three');
    return list;
  }, [dropList.length, bet?.text]);

  const current = beats[Math.min(beat, beats.length - 1)];
  const isLast = beat >= beats.length - 1;

  const finish = () => {
    markRevealSeen(token);
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked — the URL is on screen to copy by hand */
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <AnimatePresence mode="wait">
            {current === 'drop' && (
              <motion.div
                key="drop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center">
                  <div className="font-sans text-metric-xl font-bold leading-none tracking-tight text-foreground">
                    {dropList.length}
                  </div>
                  <div className={`${KICKER} text-muted-foreground mt-3`}>{dropLabel}</div>
                </div>

                <div className="mt-10 space-y-3">
                  {dropList.map((pin, i) => (
                    <motion.div
                      key={pin.id}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: reduce ? 0 : 0.35 + i * 0.18 }}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-sans text-body font-bold text-foreground leading-snug line-through decoration-muted-foreground/50">
                          {pin.title}
                        </div>
                        <VerdictStamp verdict={pin.verdict} />
                      </div>
                      {pin.verdictWhy && (
                        <div className="text-caption text-muted-foreground mt-2 leading-relaxed">
                          {pin.verdictWhy}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {current === 'bet' && (
              <motion.div
                key="bet"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BetCard
                  bet={bet}
                  pin={betPin}
                  onOpenPin={pinId => {
                    markRevealSeen(token);
                    onOpenPin(pinId);
                  }}
                />
              </motion.div>
            )}

            {current === 'three' && (
              <motion.div
                key="three"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={`${KICKER} text-muted-foreground`}>Next 48 hours</div>
                <div className="mt-4 space-y-3">
                  {cycle.map((move, i) => (
                    <motion.div
                      key={move.id}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduce ? 0 : 0.15 + i * 0.12 }}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      <div className="font-mono text-kicker uppercase tracking-widest text-muted-foreground font-bold mb-1.5">
                        {move.title}
                      </div>
                      <div className="font-sans text-body font-bold text-foreground leading-snug">
                        {move.first48}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Save the link. There are no accounts, so this IS the account
                    — and until now nothing told them the board was losable. */}
                <div className="mt-8 border-t border-border pt-5">
                  <div className={`${KICKER} text-muted-foreground`}>Keep this link</div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0 font-mono text-kicker-lg text-muted-foreground truncate bg-canvas border border-border rounded-full px-3 py-2">
                      {typeof window !== 'undefined' ? window.location.href : ''}
                    </div>
                    <button
                      onClick={copyLink}
                      className="shrink-0 w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                      aria-label="Copy the board link"
                    >
                      {copied ? <Check className="w-4 h-4 text-moss" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-2 font-mono text-kicker-sm uppercase tracking-widest text-muted-foreground/70 font-bold sm:hidden">
                    Add to home screen
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-6 pt-6 pb-safe border-t border-border bg-card/60 backdrop-blur">
        <div className="max-w-[440px] mx-auto flex gap-3">
          {isLast ? (
            <>
              <button
                onClick={finish}
                className="flex-1 border border-border text-foreground font-bold font-sans rounded-full py-3.5 active:scale-[0.99] transition-all"
              >
                See the board
              </button>
              {cycle.length > 0 && (
                <button
                  onClick={() => { markRevealSeen(token); onOpenMoves(); }}
                  className="flex-1 bg-foreground text-background font-bold font-sans rounded-full py-3.5 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  Start the first one <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setBeat(b => b + 1)}
              className="w-full bg-foreground text-background font-bold font-sans rounded-full py-3.5 active:scale-[0.99] transition-all"
            >
              {current === 'drop' ? 'Got it' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
