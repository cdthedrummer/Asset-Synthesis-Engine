import React from 'react';

/**
 * True once a sentinel element has scrolled up behind the app bar.
 *
 * IntersectionObserver rather than a scroll listener: no per-frame work, and no
 * dependency.
 */
export function useScrolledPast(barHeight = 52) {
  const sentinel = React.useRef<HTMLDivElement>(null);
  const [past, setPast] = React.useState(false);

  React.useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting),
      { rootMargin: `-${barHeight}px 0px 0px 0px`, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [barHeight]);

  return [sentinel, past] as const;
}
