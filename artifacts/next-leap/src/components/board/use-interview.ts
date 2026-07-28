import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  NlAsk,
  NlBoardState,
  NlMessage,
  getGetLeapBoardQueryKey,
  useAnswerLeapInterview,
  useOpenLeapInterview,
} from '@workspace/api-client-react';
import { MAX_INTERVIEW_QUESTIONS } from './interview-constants';

/**
 * Interview state, owned in one place so the dock and the grid read the same
 * truth.
 *
 * The opening question is fetched here rather than during board creation. That's
 * the whole trick behind "the board builds itself while you talk": POST /boards
 * is model-free and returns instantly, the board page renders, and *then* the
 * first turn runs — so the owner watches their first cards land instead of
 * staring at a spinner on the front door.
 */

/** Boards mid-interview from before `ask` existed still have `options`. */
function legacyAsk(message: NlMessage | undefined): NlAsk | null {
  if (!message) return null;
  if (message.ask) return message.ask;
  const options = message.options;
  if (!options?.length) return null;
  return { type: 'single', choices: options.map(label => ({ label })) };
}

/** Guards a double-fired opening across component instances, not just renders. */
const openingInFlight = new Set<string>();

export function useInterview({
  token,
  boardState,
}: {
  token: string;
  boardState: NlBoardState | undefined;
}) {
  const queryClient = useQueryClient();
  const answer = useAnswerLeapInterview();
  const opening = useOpenLeapInterview();

  const [mintedIds, setMintedIds] = React.useState<Set<number>>(new Set());
  const [questionsLeft, setQuestionsLeft] = React.useState<number | null>(null);
  const [justFinished, setJustFinished] = React.useState(false);
  const openedRef = React.useRef(false);

  const board = boardState?.board;
  const isInterview = board?.stage === 'interview';
  const isDemo = !!board && board.kind !== 'real';

  const assistantMessages = React.useMemo(
    () => (boardState?.messages ?? []).filter(m => m.role === 'assistant'),
    [boardState?.messages],
  );
  const latest = assistantMessages[assistantMessages.length - 1];

  const invalidate = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) }),
    [queryClient, token],
  );

  // Flash newly-minted pins so board growth is impossible to miss. newPinIds
  // and touchedPinIds have always come back on the turn — they were discarded.
  const flash = React.useCallback((ids: number[]) => {
    if (ids.length === 0) return;
    setMintedIds(new Set(ids));
    setTimeout(() => setMintedIds(new Set()), 1600);
  }, []);

  // Fire the opening turn exactly once, on a board that has no reply yet.
  React.useEffect(() => {
    if (!board || !isInterview || isDemo) return;
    if (assistantMessages.length > 0) return;
    if (openedRef.current || openingInFlight.has(token)) return;
    openedRef.current = true;
    openingInFlight.add(token);
    opening.mutate(
      { token },
      {
        onSuccess: turn => {
          setQuestionsLeft(turn.questionsLeft);
          flash([...turn.newPinIds, ...turn.touchedPinIds]);
          void invalidate();
        },
        onSettled: () => openingInFlight.delete(token),
      },
    );
    // `opening` is a stable mutation object; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isInterview, isDemo, assistantMessages.length, token, flash, invalidate]);

  const submit = React.useCallback(
    (content: string) => {
      if (!content.trim() || answer.isPending) return;
      answer.mutate(
        { token, data: { content } },
        {
          onSuccess: turn => {
            setQuestionsLeft(turn.questionsLeft);
            flash([...turn.newPinIds, ...turn.touchedPinIds]);
            if (turn.stage === 'board') setJustFinished(true);
            void invalidate();
          },
        },
      );
    },
    [answer, flash, invalidate, token],
  );

  const isPending = answer.isPending || opening.isPending;

  // A reload has no mutation result to read, so fall back to the message log:
  // every assistant turn but the one on screen has been answered.
  const derivedLeft = isInterview
    ? Math.max(0, MAX_INTERVIEW_QUESTIONS - Math.max(0, assistantMessages.length - 1))
    : 0;

  return {
    question: latest?.content ?? '',
    ask: isInterview ? legacyAsk(latest) : null,
    questionsLeft: questionsLeft ?? (assistantMessages.length > 0 ? derivedLeft : null),
    /** Placeholder cards while a turn is in flight, so the grid never sits still. */
    mintingCount: isInterview && isPending ? (assistantMessages.length === 0 ? 2 : 1) : 0,
    mintedIds,
    isPending,
    error: answer.error ?? opening.error ?? null,
    /** True on the turn that ended the interview — cues the reveal, once. */
    justFinished,
    clearJustFinished: () => setJustFinished(false),
    submit,
  };
}
