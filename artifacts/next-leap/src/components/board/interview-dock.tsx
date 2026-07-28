import React from 'react';
import { NlAsk } from '@workspace/api-client-react';
import { AskInput } from './ask/ask-input';
import { ComposerInput } from './composer-input';
import { MAX_INTERVIEW_QUESTIONS } from './interview-constants';

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

  // Publish the dock's real height so the board can pad itself by exactly that.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty('--dock-h', `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--dock-h');
    };
  }, []);

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
      className="fixed inset-x-0 bottom-0 z-40 max-h-[52dvh] overflow-y-auto bg-card border-t border-border rounded-t-[28px] shadow-[0_-12px_32px_rgba(28,25,23,0.08)]"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="w-full max-w-[520px] mx-auto px-5 pt-5 space-y-4">
        {/* Dots, not "3 of 5" — the board is near-wordless and the count is
            honest because the cap is enforced server-side. */}
        {questionsLeft != null && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: MAX_INTERVIEW_QUESTIONS }).map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < answered ? 'bg-[#10B981]' : 'bg-[var(--color-divider)]'
                }`}
              />
            ))}
          </div>
        )}

        <div className="font-sans text-[19px] sm:text-[21px] font-medium leading-snug text-foreground">
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
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-bold hover:text-foreground transition-colors"
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
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#BE123C] font-bold">
            Lost the thread. Send that again.
          </div>
        )}
      </div>
    </div>
  );
};
