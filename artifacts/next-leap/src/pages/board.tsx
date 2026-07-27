import React from 'react';
import { useRoute } from 'wouter';
import { useGetLeapBoard, getGetLeapBoardQueryKey } from '@workspace/api-client-react';
import { StatChips } from '@/components/board/stat-chips';
import { TrajectoryCard } from '@/components/board/trajectory-card';
import { BoardItem } from '@/components/board/pin-item';
import { QuickAddBar } from '@/components/board/quick-add-bar';
import { VerdictPopover } from '@/components/board/verdict-popover';
import { ExpandedPinView } from '@/components/board/expanded-pin-view';
import { ExpandedTrajectoryView } from '@/components/board/expanded-trajectory-view';
import { MovesOverlay } from '@/components/board/moves-overlay';
import { InterviewOverlay } from '@/components/board/interview-overlay';
import { CheckinOverlay } from '@/components/board/checkin-overlay';
import { CheckCircle2 } from 'lucide-react';

function pinIdFromUrl(): number | null {
  const raw = new URLSearchParams(window.location.search).get('pin');
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

export default function Board() {
  const [, params] = useRoute('/b/:token');
  const token = params?.token;

  const { data: boardState, isLoading } = useGetLeapBoard(token!, {
    query: { enabled: !!token, queryKey: getGetLeapBoardQueryKey(token!) }
  });

  // ?pin=<id> deep-links straight into a pin (also lets a shared link land right).
  const [activePinId, setActivePinId] = React.useState<number | null>(pinIdFromUrl);
  const [popoverPinId, setPopoverPinId] = React.useState<number | null>(null);
  const [showTrajectory, setShowTrajectory] = React.useState(false);
  const [showMoves, setShowMoves] = React.useState(false);
  const [showCheckin, setShowCheckin] = React.useState(false);

  // Keep ?pin= in the address bar matching the open pin, so a copied link
  // lands on this exact view (replaceState — no history spam).
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const want = activePinId != null ? String(activePinId) : null;
    if (url.searchParams.get('pin') === want) return;
    if (want === null) url.searchParams.delete('pin');
    else url.searchParams.set('pin', want);
    window.history.replaceState(null, '', url);
  }, [activePinId]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading board...</div>;
  }

  if (!boardState) {
    return <div className="min-h-screen flex items-center justify-center">Board not found.</div>;
  }

  const { board, pins, moves } = boardState;
  const tasks = boardState.tasks ?? [];

  // Sort pins by recency
  const sortedPins = [...pins].sort((a, b) => new Date(b.lastTouchedAt).getTime() - new Date(a.lastTouchedAt).getTime());

  // Find active elements
  const activePin = pins.find(p => p.id === activePinId);
  const popoverPin = pins.find(p => p.id === popoverPinId);

  // Latest question + tap answers for interview stage
  const assistantMessages = (boardState.messages || []).filter(m => m.role === 'assistant');
  const latestMessage = assistantMessages[assistantMessages.length - 1];
  const coachSay = board.stage === 'interview' ? (latestMessage?.content || "Let's begin.") : "";

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Board Header area */}
      <div className="p-4 md:p-6 pb-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold font-sans text-foreground leading-none">{board.name}'s Board</h1>
          <div className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest mt-1">Goal: {board.goalText}</div>
        </div>
        {board.stage === 'board' && (
          <button
            onClick={() => setShowCheckin(true)}
            className="shrink-0 font-mono text-[11px] uppercase tracking-widest border border-border rounded-full px-4 py-2.5 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            Check in
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-32">
        <StatChips chips={board.statChips} />

        {board.trajectory && (
          <TrajectoryCard trajectory={board.trajectory} onClick={() => setShowTrajectory(true)} />
        )}

        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {sortedPins.map(pin => (
            <BoardItem
              key={pin.id}
              pin={pin}
              onClick={() => setActivePinId(pin.id)}
              onVerdictClick={(e, v) => { e.stopPropagation(); setPopoverPinId(pin.id); }}
            />
          ))}
        </div>
      </div>

      {board.stage === 'board' && (
        <>
          <QuickAddBar boardId={board.id} token={board.token} />

          {/* Moves Affordance */}
          {moves.length > 0 && (
            <button
              onClick={() => setShowMoves(true)}
              className="fixed bottom-24 right-4 z-40 bg-[#10B981] text-white px-5 py-3 rounded-full font-bold font-sans shadow-lg flex items-center gap-2 hover:bg-[#059669] active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              Next Moves
            </button>
          )}
        </>
      )}

      <InterviewOverlay
        token={board.token}
        stage={board.stage}
        say={coachSay}
        options={board.stage === 'interview' ? latestMessage?.options ?? null : null}
      />

      {popoverPin && (
        <VerdictPopover
          pin={popoverPin}
          onClose={() => setPopoverPinId(null)}
          onArgue={() => {
            setPopoverPinId(null);
            setActivePinId(popoverPin.id);
          }}
        />
      )}

      {activePin && (
        <ExpandedPinView
          pin={activePin}
          token={board.token}
          tasks={tasks.filter(t => t.pinId === activePin.id)}
          onBack={() => setActivePinId(null)}
          onHome={() => setActivePinId(null)}
        />
      )}

      {showTrajectory && (
        <ExpandedTrajectoryView
          trajectory={board.trajectory}
          onBack={() => setShowTrajectory(false)}
          onHome={() => setShowTrajectory(false)}
        />
      )}

      {showMoves && (
        <MovesOverlay
          moves={moves}
          onClose={() => setShowMoves(false)}
          token={board.token}
        />
      )}

      {showCheckin && (
        <CheckinOverlay
          token={board.token}
          pins={pins}
          onClose={() => setShowCheckin(false)}
        />
      )}
    </div>
  );
}
