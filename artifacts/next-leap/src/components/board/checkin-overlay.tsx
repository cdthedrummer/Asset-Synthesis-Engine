import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useCreateLeapCheckin, getGetLeapBoardQueryKey } from '@workspace/api-client-react';
import type { NlCheckinTurn, NlPin } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { VerdictStamp } from './verdict-stamp';

/**
 * The come-back-later beat: say what happened, watch the board re-score,
 * get called out on the thing you dodged.
 */
export const CheckinOverlay = ({ token, pins, onClose }: { token: string, pins: NlPin[], onClose: () => void }) => {
  const [note, setNote] = React.useState('');
  const queryClient = useQueryClient();
  const isDemo = token.startsWith('demo-');

  const checkin = useCreateLeapCheckin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });
      },
    },
  });

  const result: NlCheckinTurn | undefined = checkin.data;
  // The spec types change items as an open map; the server always writes this shape.
  type CheckinChange = { pinId: number; field: string; from: string; to: string; why?: string };
  const changes = (result?.checkin.changes ?? []) as unknown as CheckinChange[];
  const serverError = checkin.error
    ? ((checkin.error as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'The re-score stalled. Tell me again what happened.')
    : null;

  const pinTitle = (pinId: number) => {
    const all = result?.board.pins ?? pins;
    return all.find(p => p.id === pinId)?.title ?? 'A pin';
  };

  const submit = () => {
    if (!note.trim() || checkin.isPending) return;
    checkin.mutate({ token, data: { note: note.trim() } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 pt-10 pb-16">
        <div className="flex items-center justify-between mb-10">
          <span className="font-mono text-kicker-lg uppercase tracking-widest text-muted-foreground">Check-in</span>
          <button onClick={onClose} aria-label="Close" className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <>
            <h2 className="text-heading font-bold font-sans text-foreground leading-tight">What happened since last time?</h2>
            <p className="text-body text-muted-foreground mt-2 mb-6">Plain words. What got done, what didn't, what surprised you. The board re-scores itself.</p>

            {isDemo && (
              <div className="mb-4 text-caption font-mono uppercase tracking-wide text-muted-foreground border border-border rounded-xl px-4 py-3">
                This board is a demo — start your own from the front door to check in.
              </div>
            )}

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={5}
              placeholder="I texted nine people, six booked. Never called about the kitchen…"
              className="w-full bg-surface border border-border rounded-md p-4 text-body-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 resize-none"
            />

            {serverError && (
              <div className="mt-3 text-caption text-rose-600">{serverError}</div>
            )}

            <button
              onClick={submit}
              disabled={!note.trim() || checkin.isPending || isDemo}
              className="mt-4 w-full bg-foreground text-background font-bold font-sans rounded-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.99] transition-all"
            >
              {checkin.isPending ? <span className="animate-pulse">Re-scoring your board…</span> : <>Re-score my board <ArrowRight className="w-4 h-4" /></>}
            </button>
          </>
        ) : (
          <>
            <p className="text-body-lg leading-relaxed text-foreground font-medium">{result.checkin.summary}</p>

            <div className="mt-8">
              <div className="font-mono text-kicker-lg uppercase tracking-widest text-muted-foreground mb-3">Verdicts moved</div>
              {changes.length === 0 ? (
                <div className="text-caption font-mono uppercase tracking-wide text-muted-foreground">No verdicts moved this time.</div>
              ) : (
                <div className="space-y-3">
                  {changes.map((c, i) => (
                    <div key={i} className="bg-surface border border-rule rounded-md p-4">
                      <div className="text-body font-bold font-sans text-foreground mb-2">{pinTitle(c.pinId)}</div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-50"><VerdictStamp verdict={c.from} /></span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <VerdictStamp verdict={c.to} />
                      </div>
                      {c.why && <div className="text-caption text-muted-foreground mt-2">{c.why}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.checkin.dodged && (
              <div className="mt-6 border-l-2 border-rose-400 bg-surface rounded-r-2xl p-4">
                <div className="font-mono text-kicker-lg uppercase tracking-widest text-rose-500 mb-1.5">The dodge</div>
                <div className="text-body text-foreground leading-relaxed">{result.checkin.dodged}</div>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-8 w-full bg-foreground text-background font-bold font-sans rounded-full py-3.5 active:scale-[0.99] transition-all"
            >
              Back to the board
            </button>
          </>
        )}
      </div>
    </div>
  );
};
