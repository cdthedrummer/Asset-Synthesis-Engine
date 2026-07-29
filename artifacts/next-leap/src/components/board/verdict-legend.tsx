import React from 'react';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import {
  VERDICT_EXPLANATIONS,
  VERDICT_ORDER,
  VERDICT_TOKENS,
  VerdictStamp,
} from './verdict-stamp';

const SEEN_KEY = 'sl:keySeen';

export function hasSeenKey(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // storage blocked — never nag
  }
}

export function markKeySeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage blocked — nothing useful to do */
  }
}

/**
 * A wordless entry point: the four stamps in miniature, SKIP as an outline
 * because that is what it actually is on the board. It teaches four-ness before
 * anyone taps it.
 */
const KeyGlyph = () => (
  <span className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
    {VERDICT_ORDER.map(v => (
      <span
        key={v}
        className="block w-[7px] h-[7px] rounded-full border"
        style={{
          backgroundColor: VERDICT_TOKENS[v].fill,
          borderColor: VERDICT_TOKENS[v].edge,
        }}
      />
    ))}
  </span>
);

/**
 * The key.
 *
 * The board is deliberately near-wordless, so the four stamps carry all of its
 * meaning — and nothing ever explained them. This is a map key, not a tutorial
 * and not a coach: it labels the notation, never the person. It lives behind a
 * deliberate tap, so the resting board stays wordless.
 */
export const VerdictLegend = ({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerTrigger asChild>
      <button
        aria-label="What the stamps mean"
        className="w-11 h-11 rounded-full border border-rule flex items-center justify-center text-ink-3 hover:border-ink-1/40 transition-colors shrink-0"
      >
        <KeyGlyph />
      </button>
    </DrawerTrigger>
    <DrawerContent className="bg-card border-rule">
      <div className="mx-auto w-full max-w-[520px] px-5 pt-2 pb-safe">
        <DrawerTitle className="kicker text-ink-3 mb-5">What the stamps mean</DrawerTitle>
        <ul className="space-y-4">
          {VERDICT_ORDER.map(v => (
            <li key={v} className="flex items-baseline gap-3">
              <span className="shrink-0 w-[104px]">
                <VerdictStamp verdict={v} />
              </span>
              <span className="text-body text-ink-2">{VERDICT_EXPLANATIONS[v]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-caption text-ink-3">
          Order on the board follows the conversation, not the stamps.
        </p>
      </div>
    </DrawerContent>
  </Drawer>
);
