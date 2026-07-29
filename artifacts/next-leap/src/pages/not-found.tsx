import React from 'react';
import { Link } from 'wouter';
import { ShortlistMark } from '@/components/brand/shortlist-mark';

/**
 * A dead link is the scariest moment in a product with no accounts, so this page
 * has one job: say the board probably still exists, and how to find it.
 *
 * The history hint is real advice, not filler — board.tsx sets document.title to
 * the goal text precisely so browser history can recover a lost board, and
 * nothing in the UI used to tell anyone that.
 *
 * Exported as DeadEnd too, because board.tsx's "Board not found." bare string
 * needs exactly this treatment for exactly the same reason.
 */
export function DeadEnd({
  kicker,
  headline,
  children,
}: {
  kicker: string;
  headline: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 py-10 text-center">
      <ShortlistMark size={40} />
      <div className="kicker text-ink-3 mt-7">{kicker}</div>
      <h1 className="mt-3 text-heading text-ink-1 max-w-[320px]">{headline}</h1>
      <p className="mt-3 text-body text-ink-2 max-w-[320px]">
        {children ?? "If you had a board, it's still in your browser history — search for the goal you typed."}
      </p>
      <Link
        href="/"
        className="mt-8 bg-ink-1 text-on-ink font-bold rounded-pill px-6 py-3.5 active:scale-[0.98] transition-transform"
      >
        Start one
      </Link>
    </div>
  );
}

export default function NotFound() {
  return <DeadEnd kicker="Nothing here" headline="That link doesn't point at a board." />;
}
