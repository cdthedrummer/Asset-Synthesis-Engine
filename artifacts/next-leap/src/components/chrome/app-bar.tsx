import React from 'react';
import { Link } from 'wouter';
import { ShortlistMark } from '@/components/brand/shortlist-mark';

/**
 * The board's only persistent chrome.
 *
 * Sticky rather than fixed, so it participates in document flow and needs no
 * companion padding variable. z-30 — deliberately BELOW the dock's z-40, so it
 * never fights the overlay ladder.
 *
 * The mark alone, no wordmark: it is both the identity and the only way home,
 * and it adds zero words to a board that is deliberately near-wordless. Safe to
 * navigate away from, because the front door already offers the last board back
 * out of localStorage.
 *
 * `title` cross-fades in only once the real headline has scrolled away, so the
 * goal is never on screen twice.
 */
export const AppBar = ({
  title,
  condensed,
  actions,
}: {
  title?: string;
  condensed: boolean;
  actions?: React.ReactNode;
}) => (
  <div
    className={`sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b transition-colors ${
      condensed ? 'border-rule' : 'border-transparent'
    }`}
  >
    <div className="max-w-7xl mx-auto px-4 md:px-6 h-[52px] flex items-center gap-3">
      <Link
        href="/"
        aria-label="Shortlist home"
        className="w-11 h-11 -ml-2 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
      >
        <ShortlistMark size={22} />
      </Link>

      <span
        className={`flex-1 min-w-0 text-caption font-semibold text-ink-1 truncate transition-opacity duration-200 ${
          condensed ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!condensed}
      >
        {title}
      </span>

      {actions && <span className="shrink-0 flex items-center gap-2">{actions}</span>}
    </div>
  </div>
);
