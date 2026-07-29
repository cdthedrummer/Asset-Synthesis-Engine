import React from 'react';
import { useRoute } from 'wouter';
import { Check, Copy } from 'lucide-react';
import { useGetLeapBoard, getGetLeapBoardQueryKey } from '@workspace/api-client-react';
import { StatChips } from '@/components/board/stat-chips';
import { PulseCard } from '@/components/board/pulse-card';
import { BetCard, BoardBet } from '@/components/board/bet-card';
import { TrajectoryCard } from '@/components/board/trajectory-card';
import { BoardGrid } from '@/components/board/board-grid';
import { BoardChat } from '@/components/board/board-chat';
import { VerdictPopover } from '@/components/board/verdict-popover';
import { ExpandedPinView } from '@/components/board/expanded-pin-view';
import { ExpandedTrajectoryView } from '@/components/board/expanded-trajectory-view';
import { MovesOverlay } from '@/components/board/moves-overlay';
import { InterviewDock } from '@/components/board/interview-dock';
import { CheckinOverlay } from '@/components/board/checkin-overlay';
import { RevealOverlay, hasSeenReveal, markRevealSeen } from '@/components/board/reveal-overlay';
import { useInterview } from '@/components/board/use-interview';
import { AppBar } from '@/components/chrome/app-bar';
import { VerdictLegend, hasSeenKey, markKeySeen } from '@/components/board/verdict-legend';
import { useScrolledPast } from '@/hooks/use-scrolled-past';
import { DeadEnd } from '@/pages/not-found';

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
  const [showReveal, setShowReveal] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showKey, setShowKey] = React.useState(false);

  // The bar takes over the title once the real headline scrolls away.
  const [sentinel, scrolledPast] = useScrolledPast();

  const interview = useInterview({ token: token!, boardState });

  // Opening the key counts as having seen it, however it was opened.
  const onKeyOpenChange = React.useCallback((open: boolean) => {
    setShowKey(open);
    if (open) markKeySeen();
  }, []);

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

  const board = boardState?.board;

  // Browser history is the only recovery route for a lost link, so make the
  // title searchable for the thing they actually remember: their goal.
  React.useEffect(() => {
    if (!board) return;
    document.title = `${board.name ? `${board.name} — ` : ''}${board.goalText.slice(0, 60)}`;
  }, [board]);

  // Remember the last real board on this device so the front door can offer it
  // back. Never a demo, or the front door would call someone else's board yours.
  React.useEffect(() => {
    if (!board || board.kind !== 'real') return;
    try {
      window.localStorage.setItem(
        'nl:lastBoard',
        JSON.stringify({ token: board.token, name: board.name, goalText: board.goalText }),
      );
    } catch {
      /* blocked storage just means no resume row */
    }
  }, [board]);

  // The reveal fires on the turn that ended the interview, and once per device.
  React.useEffect(() => {
    if (!board || !interview.justFinished) return;
    interview.clearJustFinished();
    if (!hasSeenReveal(board.token)) setShowReveal(true);
  }, [board, interview]);

  // Teach the notation once per device, at the moment it starts mattering: the
  // reveal has just shown drops/bet/moves and the stamps are about to be met in
  // the wild. Not a coach — a map key, offered once.
  const revealClosed = React.useCallback(() => {
    setShowReveal(false);
    if (!hasSeenKey()) {
      markKeySeen();
      setShowKey(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <span className="kicker text-ink-3 animate-pulse">Loading board</span>
      </div>
    );
  }

  if (!boardState || !board) {
    return (
      <DeadEnd kicker="Board not found" headline="That board isn't here anymore.">
        Links don't expire on their own — check for a truncated paste, or search your browser
        history for the goal you typed.
      </DeadEnd>
    );
  }

  const { pins, moves, progress } = boardState;
  const tasks = boardState.tasks ?? [];
  const bet = (board.bet as BoardBet | null) ?? null;
  const isInterview = board.stage === 'interview';

  // Sort pins by conversation recency — the board mirrors the conversation.
  const sortedPins = [...pins].sort(
    (a, b) => new Date(b.lastTouchedAt).getTime() - new Date(a.lastTouchedAt).getTime(),
  );

  const activePin = pins.find(p => p.id === activePinId);
  const popoverPin = pins.find(p => p.id === popoverPinId);
  const betPin = bet?.pinId ? pins.find(p => p.id === bet.pinId) : undefined;
  const latestDodge = boardState.checkins?.[0]?.dodged ?? null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked — nothing useful to say */
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <AppBar
        title={board.goalText}
        condensed={scrolledPast}
        actions={
          <>
            <VerdictLegend open={showKey} onOpenChange={onKeyOpenChange} />
            {/* No accounts, so the link is the account. Always reachable. */}
            <button
              onClick={copyLink}
              aria-label="Copy the board link"
              className="w-11 h-11 rounded-full border border-rule text-ink-3 hover:text-ink-1 hover:border-ink-1/40 flex items-center justify-center transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-moss" /> : <Copy className="w-4 h-4" />}
            </button>
            {!isInterview && (
              <button
                onClick={() => setShowCheckin(true)}
                className="kicker-lg border border-rule rounded-pill px-4 py-3 text-ink-3 hover:text-ink-1 hover:border-ink-1/40 transition-colors shrink-0"
              >
                Check in
              </button>
            )}
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-5">
        <div className="kicker text-ink-3">
          {board.name ? `${board.name}'s board` : 'Your board'}
        </div>
        <h1 className="text-heading md:text-heading-lg text-ink-1 mt-1.5 line-clamp-2">
          {board.goalText}
        </h1>
      </div>
      {/* Sentinel: once this passes under the bar, the bar takes over the title. */}
      <div ref={sentinel} aria-hidden="true" className="h-px" />

      <div
        className="px-4 md:px-6 pt-6 space-y-6 max-w-7xl mx-auto"
        style={{ paddingBottom: 'calc(var(--dock-h, 8rem) + 3rem)' }}
      >
        <StatChips chips={board.statChips} />

        {!isInterview && (
          <>
            <PulseCard progress={progress} onClick={() => setShowMoves(true)} />
            <BetCard bet={bet} pin={betPin} onOpenPin={setActivePinId} />
          </>
        )}

        {board.trajectory && (
          <TrajectoryCard trajectory={board.trajectory} onClick={() => setShowTrajectory(true)} />
        )}

        <BoardGrid
          pins={sortedPins}
          tasks={tasks}
          mintingCount={interview.mintingCount}
          mintedIds={interview.mintedIds}
          onOpenPin={setActivePinId}
          onVerdictClick={(e, pinId) => { e.stopPropagation(); setPopoverPinId(pinId); }}
        />

        {/* Never fake pins: if the opening turn failed, say so plainly. */}
        {isInterview && sortedPins.length === 0 && interview.mintingCount === 0 && (
          <p className="text-body text-muted-foreground">
            Nothing up here yet. Answer that and it starts filling.
          </p>
        )}
      </div>

      {isInterview ? (
        <InterviewDock
          token={board.token}
          question={interview.question}
          ask={interview.ask}
          questionsLeft={interview.questionsLeft}
          isPending={interview.isPending}
          error={interview.error}
          onAnswer={interview.submit}
        />
      ) : (
        <BoardChat boardState={boardState} token={board.token} />
      )}

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
          pinTitleOf={pinId => pins.find(p => p.id === pinId)?.title}
          dodgedText={latestDodge}
        />
      )}

      {showCheckin && (
        <CheckinOverlay
          token={board.token}
          pins={pins}
          onClose={() => setShowCheckin(false)}
        />
      )}

      {showReveal && (
        <RevealOverlay
          pins={pins}
          moves={moves}
          bet={bet}
          token={board.token}
          onOpenPin={pinId => { setShowReveal(false); setActivePinId(pinId); }}
          onOpenMoves={() => { setShowReveal(false); setShowMoves(true); }}
          onClose={() => { markRevealSeen(board.token); revealClosed(); }}
        />
      )}
    </div>
  );
}
