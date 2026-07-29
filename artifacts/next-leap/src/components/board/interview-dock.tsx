import React from 'react';
import { NlAsk } from '@workspace/api-client-react';
import { AskInput } from './ask/ask-input';
import { ComposerInput } from './composer-input';
import { MAX_INTERVIEW_QUESTIONS } from './interview-constants';
import { useDockHeight } from './use-dock-height';

/**
 * The interview, docked at the bottom instead of drawn across the screen.
 *
 * Replaces interview-overlay, which put a full-screen scrim over the board on
 * phones — so the owner answered every question with the thing they were
 * building hidden behind frosted glass. The board staying visible is the
 * feature, so there is no scrim here at any breakpoint. The card behind the
 * question stays solid on mobile, per the locked taste direction.
 *
 * The dock measures itself into `--dock-h` so nothing on the board is ever
 * stranded underneath it.
 */
export const InterviewDock = ({
  token,
  question,
  ask,
  questionsLeft,
  isPending,
  error,
  onAnswer,
}: {
  token: string;
  question: string;
  ask: NlAsk | null;
  questionsLeft: number | null;
  isPending: boolean;
  error: unknown;
  onAnswer: (content: string) => void;
}) => {
  const [input, setInput] = React.useState('');
  const [typed, setTyped] = React.useState('');
  const [openText, setOpenText] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useDockHeight(ref);

  // Typewriter reveal, but skipped on long questions where it just delays.
  React.useEffect(() => {
    if (question.length > 180) {
      setTyped(question);
      return;
    }
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      setTyped(question.slice(0, i));
      i++;
      if (i > question.length) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [question]);

  React.useEffect(() => {
    // A new question means the previous answer is spent.
    setInput('');
    setOpenText(false);
  }, [question]);

  const typingDone = typed === question;
  const showAsk = typingDone && !isPending && !!ask && ask.type !== 'text';
  const textOnly = !ask || ask.type === 'text';
  const showComposer = typingDone && (textOnly || openText);

  const answered = questionsLeft == null ? 0 : MAX_INTERVIEW_QUESTIONS - questionsLeft;

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-40 max-h-[52dvh] overflow-y-auto bg-card border-t border-rule rounded-t-2xl shadow-dock pb-safe px-safe"
      // iOS ignores interactive-widget=resizes-content, so the keyboard would
      // simply cover the dock. useKeyboardInset publishes what it is stealing.
      style={{ transform: 'translateY(calc(-1 * var(--kb-h, 0px)))' }}
    >
      <div className="w-full max-w-[520px] mx-auto px-5 pt-5 space-y-4">
        {/* Dots, not "3 of 5" — the board is near-wordless and the count is
            honest because the cap is enforced server-side. */}
        {questionsLeft != null && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: MAX_INTERVIEW_QUESTIONS }).map((_, i) => (
              <span
                key={i}
                // Ink, not moss. These are form progress, not achievement:
                // answering question two of five should not look like you
                // completed a move.
                className={`h-1 flex-1 rounded-full ${
                  i < answered ? 'bg-ink-1' : 'bg-rule-soft'
                }`}
              />
            ))}
          </div>
        )}

        <div className="font-sans text-lede font-medium leading-snug text-foreground">
          {typed}
          {isPending && (
            <span className="ml-2 inline-block w-2 h-5 bg-foreground/40 animate-pulse align-middle" />
          )}
        </div>

        {showAsk && <AskInput ask={ask} disabled={isPending} onAnswer={onAnswer} />}

        {showAsk && !openText && (
          <button
            type="button"
            onClick={() => setOpenText(true)}
            className="font-mono text-kicker uppercase tracking-widest text-muted-foreground font-bold hover:text-foreground transition-colors"
          >
            Or say it your way
          </button>
        )}

        {showComposer && (
          <ComposerInput
            value={input}
            onChange={setInput}
            onSubmit={() => onAnswer(input)}
            placeholder={textOnly ? (ask?.placeholder ?? 'Type or talk…') : 'In your own words…'}
            disabled={isPending}
            token={token}
            autoFocus={textOnly}
          />
        )}

        {!!error && (
          <div className="font-mono text-kicker uppercase tracking-widest text-danger font-bold">
            Lost the thread. Send that again.
          </div>
        )}
      </div>
    </div>
  );
};
