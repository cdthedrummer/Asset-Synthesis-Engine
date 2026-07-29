import React from 'react';

/**
 * Publishes a bottom dock's real height as `--dock-h` so the board can pad
 * itself by exactly that and never strand content underneath.
 *
 * Extracted from interview-dock, which used to be the only publisher — meaning
 * that once the interview ended and BoardChat took over, the board fell back to
 * a guessed `8rem` while the chat bar (composer + starter chips) was often much
 * taller, hiding the last pins behind it. Both docks use this now.
 *
 * Exactly one dock is mounted at a time (board.tsx picks with a ternary), and
 * React runs the outgoing cleanup before the incoming effect on a sibling swap,
 * so removeProperty -> setProperty sequences correctly.
 */
export function useDockHeight<T extends HTMLElement>(ref: React.RefObject<T | null>): void {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const publish = () =>
      document.documentElement.style.setProperty('--dock-h', `${el.offsetHeight}px`);
    publish();

    // Writing layout from inside the observer callback can re-trigger the same
    // observation in one frame — the browser reports that as a "ResizeObserver
    // loop" error through window.onerror with no Error object attached, which
    // crashes the dev overlay. Deferring the write one frame breaks the loop.
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(publish);
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.documentElement.style.removeProperty('--dock-h');
    };
  }, [ref]);
}
