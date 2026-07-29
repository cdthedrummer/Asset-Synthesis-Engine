import React from 'react';
import { BRAND } from '@/lib/brand';

/**
 * The Shortlist mark: three bars descending in width and height, the surviving
 * one accented.
 *
 * Colours come from the tokens rather than literals so the mark tracks the
 * theme. Geometry is identical to public/icon.svg and the assets-src/ raster
 * sources — if you change one, change all four.
 */
export const ShortlistMark = ({
  size = 24,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <rect x="9" y="9" width="30" height="8" rx="4" fill="var(--start)" />
    <rect x="9" y="22" width="21" height="6" rx="3" fill="var(--ink-1)" />
    <rect x="9" y="33" width="13" height="5" rx="2.5" fill="var(--ink-4)" />
  </svg>
);

/**
 * Mark plus wordmark. The word is HTML, not SVG <text>, so it inherits the
 * live type system and never ships a second copy of the font.
 */
export const ShortlistLockup = ({
  size = 24,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <span className={`inline-flex items-center gap-2 select-none ${className}`}>
    <ShortlistMark size={size} />
    <span
      className="display font-bold text-ink-1 leading-none tracking-[-0.03em]"
      style={{ fontSize: Math.round(size * 0.95) }}
    >
      {BRAND.name}
    </span>
  </span>
);
