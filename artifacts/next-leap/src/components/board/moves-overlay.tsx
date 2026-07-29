import React from 'react';
import { Breadcrumb } from './breadcrumb';
import { CheckCircle2, ChevronRight, Send, X } from 'lucide-react';
import { NlMove, NlProgress, useUpdateLeapMove, useListLeapMoveMessages, getGetLeapBoardQueryKey, getLeapBoard } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLeapChat } from './use-leap-chat';
import { MoveDoneBeat } from './move-done-beat';
import { moveDoneLine, moveSkippedLine } from './reward-lines';

/** The current round of three. Closed and skipped moves are kept as history, so
 *  without this filter the drawer stacks every round it has ever issued and
 *  contradicts the pulse card's "2 of 3 this round". */
export function currentCycleMoves(moves: NlMove[]): NlMove[] {
  if (moves.length === 0) return [];
  const latest = moves.reduce((max, m) => Math.max(max, m.cycleIndex ?? 0), 0);
  return moves
    .filter(m => (m.cycleIndex ?? 0) === latest)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export const MovesOverlay = ({ moves, onClose, token, pinTitleOf, dodgedText }: {
  moves: NlMove[],
  onClose: () => void,
  token: string,
  /** Which pin a move serves, for the reward line. */
  pinTitleOf?: (pinId: number | null) => string | undefined,
  /** The last check-in's "you avoided this" text, for the best reward line. */
  dodgedText?: string | null,
}) => {
  const [activeMove, setActiveMove] = React.useState<NlMove | null>(null);
  const cycle = currentCycleMoves(moves);
  const earlier = moves.filter(m => !cycle.includes(m));

  if (activeMove) {
    return (
      <MoveRepSession
        move={activeMove}
        token={token}
        pinTitle={pinTitleOf?.(activeMove.pinId)}
        dodgedText={dodgedText}
        onBack={() => setActiveMove(null)}
        onHome={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-[70] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-4 pt-safe pb-4 border-b border-border bg-background/80 backdrop-blur-xl flex justify-between items-center">
        <Breadcrumb onHome={onClose} title="Next Moves" />
        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground bg-muted rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 pt-8 bg-background">
        <div className="max-w-[400px] mx-auto space-y-4">
          <p className="text-muted-foreground font-medium mb-6">Here are the three concrete steps to take in the next 48 hours.</p>

          {cycle.map(move => (
            <div 
              key={move.id}
              onClick={() => setActiveMove(move)}
              className="bg-card border border-border p-5 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group flex justify-between items-center"
            >
              <div>
                <div className="text-kicker-lg font-mono text-muted-foreground uppercase font-bold tracking-widest mb-1.5">{move.title}</div>
                <div className="font-sans font-bold text-body-lg text-foreground leading-snug">{move.first48}</div>
                {move.state === 'done' && <div className="mt-3 flex items-center gap-1.5 text-kicker font-mono font-bold text-moss uppercase tracking-widest"><CheckCircle2 className="w-3.5 h-3.5" /> Done</div>}
                {move.state === 'skipped' && <div className="mt-3 text-kicker font-mono font-bold text-muted-foreground uppercase tracking-widest">Skipped</div>}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
          ))}

          {earlier.length > 0 && (
            <details className="pt-6">
              <summary className="font-mono text-kicker uppercase tracking-widest text-muted-foreground font-bold cursor-pointer list-none">
                Earlier rounds · {earlier.length}
              </summary>
              <div className="mt-4 space-y-2">
                {earlier.map(move => (
                  <div key={move.id} className="flex items-baseline gap-3 opacity-60">
                    <span className="font-mono text-kicker-sm uppercase tracking-widest text-muted-foreground font-bold shrink-0 w-14">
                      {move.state === 'done' ? 'Done' : move.state === 'skipped' ? 'Dropped' : 'Open'}
                    </span>
                    <span className="text-caption text-foreground leading-snug">{move.first48}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

const MoveRepSession = ({ move, token, pinTitle, dodgedText, onBack, onHome }: {
  move: NlMove,
  token: string,
  pinTitle?: string,
  dodgedText?: string | null,
  onBack: () => void,
  onHome: () => void,
}) => {
  const updateMove = useUpdateLeapMove();
  const queryClient = useQueryClient();
  const [input, setInput] = React.useState('');
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [beat, setBeat] = React.useState<{ progress: NlProgress; line: string; tone: 'done' | 'dropped' } | null>(null);
  const isDemo = token.startsWith('demo-');

  const { data: history } = useListLeapMoveMessages(token, move.id);
  const { messages, streamContent, isStreaming, error, send } = useLeapChat({
    token,
    boardId: move.boardId,
    moveId: move.id,
    initialMessages: history,
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  const setState = (state: 'done' | 'skipped') => {
    setSaveError(null);
    updateMove.mutate({ token, moveId: move.id, data: { state } }, {
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });
        // Read the board back so the beat shows the real new count rather than
        // a guess. If it fails, skip the celebration — never block the close.
        try {
          const fresh = await getLeapBoard(token);
          setBeat({
            progress: fresh.progress,
            tone: state === 'done' ? 'done' : 'dropped',
            line:
              state === 'done'
                ? moveDoneLine({ move, progress: fresh.progress, pinTitle, dodgedText })
                : moveSkippedLine(),
          });
        } catch {
          onBack();
        }
      },
      onError: () => {
        setSaveError(isDemo ? 'Demo boards are read-only — start your own from the front door.' : "Couldn't save — try again.");
      }
    });
  };

  if (beat) {
    return (
      <MoveDoneBeat
        progress={beat.progress}
        line={beat.line}
        tone={beat.tone}
        onFinish={() => { setBeat(null); onBack(); }}
      />
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const content = input;
    setInput('');
    void send(content);
  };

  return (
    <div className="fixed inset-0 bg-background z-[80] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 pt-safe pb-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title={move.title} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm mb-6 max-w-[600px] mx-auto">
          <div className="text-kicker-lg font-mono text-muted-foreground uppercase font-bold tracking-widest mb-1.5">First 48 Hours</div>
          <div className="font-sans font-bold text-body-lg text-foreground leading-snug">{move.first48}</div>
        </div>

        <div className="space-y-4 mb-8 max-w-[600px] mx-auto">
          {move.repDraft && (
             <div className="bg-white border border-border p-4 rounded-md shadow-sm font-sans text-body whitespace-pre-wrap relative">
               <div className="absolute -top-3 left-4 bg-background px-2 text-kicker font-mono font-bold text-muted-foreground uppercase tracking-widest">Draft</div>
               {move.repDraft}
             </div>
          )}
          {messages.length === 0 && !isStreaming && !move.repDraft && (
            <p className="text-center text-muted-foreground text-body pt-4">Want a hand? Ask, and you'll draft it together — it does nothing behind your back.</p>
          )}
          {messages.map((m, i) => (
            <div key={m.id || i} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div className={`p-4 rounded-lg ${m.role === 'user' ? 'bg-ink-1 text-white rounded-tr-nub' : 'bg-card border border-border text-foreground rounded-tl-nub'}`}>
                <p className="text-body leading-relaxed font-sans whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex flex-col max-w-[85%] mr-auto items-start">
              <div className="p-4 rounded-lg bg-card border border-border text-foreground rounded-tl-nub">
                <p className="text-body leading-relaxed font-sans whitespace-pre-wrap">
                  {streamContent}<span className="inline-block w-1.5 h-3.5 bg-current ml-1 animate-pulse" />
                </p>
              </div>
            </div>
          )}
          {error && <p className="text-center text-danger text-body">{error}</p>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-4 pt-4 pb-safe bg-background border-t border-border flex flex-col gap-3 max-w-[640px] mx-auto w-full">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Draft this ${move.repKind || 'move'} together...`}
            disabled={isStreaming}
            className="w-full bg-card border border-border rounded-full py-3 pl-5 pr-12 outline-none focus:ring-2 focus:ring-ink-1 font-sans text-body-lg disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-ink-1 hover:bg-ink-2 text-on-ink rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        
        {saveError && <p className="text-center text-danger text-caption">{saveError}</p>}
        <div className="flex gap-2">
          <button 
            onClick={() => setState('skipped')}
            disabled={updateMove.isPending}
            className="flex-1 py-3 bg-muted text-foreground font-sans font-bold rounded-pill active:scale-95 transition-transform disabled:opacity-50"
          >
            Skip for now
          </button>
          <button 
            onClick={() => setState('done')}
            disabled={updateMove.isPending}
            className="flex-[2] py-3 bg-moss text-white font-sans font-bold rounded-pill active:scale-95 transition-transform shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" /> Done
          </button>
        </div>
      </div>
    </div>
  );
};
