import React from 'react';
import { useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useCreateLeapBoard, useListLeapDemos } from '@workspace/api-client-react';
import { ComposerInput } from '@/components/board/composer-input';
import { ShortlistLockup } from '@/components/brand/shortlist-mark';

interface LastBoard {
  token: string;
  name?: string;
  goalText?: string;
}

function readLastBoard(): LastBoard | null {
  try {
    const raw = window.localStorage.getItem('nl:lastBoard');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastBoard;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * One question, two doors.
 *
 * The name field is gone: it cost a keystroke before any value, and the intake
 * op picks a name up later if they happen to say one. Board creation is now
 * model-free, so the jump to the board is immediate and the first cards mint
 * while the owner is already looking at them.
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [goal, setGoal] = React.useState('');
  const createBoard = useCreateLeapBoard();
  const { data: demos } = useListLeapDemos();
  const [lastBoard] = React.useState<LastBoard | null>(readLastBoard);

  const create = (door: 'ambition' | 'juggle') => {
    if (!goal.trim() || createBoard.isPending) return;
    createBoard.mutate(
      { data: { goalText: goal, door } },
      { onSuccess: state => setLocation(`/b/${state.board.token}`) },
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        {/* There are no accounts, so a device that has been here before gets its
            board offered back rather than lost. */}
        {lastBoard && (
          <button
            onClick={() => setLocation(`/b/${lastBoard.token}`)}
            className="w-full flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3 text-left shadow-sm hover:border-foreground/30 transition-colors"
          >
            <span className="min-w-0">
              <span className="block font-mono text-kicker-sm uppercase tracking-widest text-muted-foreground font-bold">
                Back to your board
              </span>
              <span className="block text-body font-medium text-foreground truncate mt-0.5">
                {lastBoard.goalText || 'Pick up where you left off'}
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        )}

        <div>
          <ShortlistLockup size={26} className="mb-5" />
          <h1 className="text-heading-lg text-ink-1">What are you trying to pull off?</h1>
          <p className="text-ink-2 text-body mt-3">
            Answer a few questions and you'll know what to drop, and the order for the rest.
            No account — the link is yours, so keep it.
          </p>
        </div>

        <div className="space-y-4">
          <ComposerInput
            value={goal}
            onChange={setGoal}
            onSubmit={() => create('ambition')}
            placeholder="One goal. However you'd say it out loud."
            disabled={createBoard.isPending}
            rows={3}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => create('ambition')}
              disabled={!goal.trim() || createBoard.isPending}
              className="py-4 bg-start text-on-start rounded-pill font-bold active:scale-95 transition-transform disabled:opacity-50 hover:bg-start-deep"
            >
              I'm going after one thing
            </button>
            <button
              onClick={() => create('juggle')}
              disabled={!goal.trim() || createBoard.isPending}
              className="py-4 bg-card border border-rule-strong text-ink-1 rounded-pill font-bold hover:bg-sunken active:scale-95 transition-all disabled:opacity-50"
            >
              I'm carrying too much
            </button>
          </div>
        </div>

        {demos && demos.length > 0 && (
          <div className="pt-8 text-center">
            <div className="text-kicker font-mono uppercase tracking-widest text-muted-foreground font-bold mb-4">
              Or read someone else's
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              {demos.map(demo => (
                <button
                  key={demo.token}
                  onClick={() => setLocation(`/b/${demo.token}`)}
                  className="bg-card border border-border px-4 py-3 rounded-md hover:shadow-md transition-all text-left"
                >
                  <div className="font-bold text-foreground font-sans text-body">{demo.title}</div>
                  <div className="text-caption text-muted-foreground mt-1">{demo.tagline}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
