import type { NlPin } from '@workspace/api-client-react';

/**
 * First-poke suggestions for an empty pin chat, derived client-side from what
 * the pin already knows — no model call needed to say hello.
 */
const VERDICT_PROMPTS: Record<string, string> = {
  start: "What's my first step this week?",
  schedule: 'When should this actually happen?',
  skip: 'Convince me — why skip this?',
  gethelp: 'Who exactly do I need to find?',
};

const KIND_PROMPTS: Record<string, string> = {
  stat: 'What does this number really mean?',
  bars: 'What do these numbers tell you?',
  pipeline: 'Draft an outreach message for these.',
  calendar: 'Help me plan the next two weeks.',
  menu: 'Are these prices right?',
  steps: "What's blocking the next step?",
  table: 'Which row matters most?',
};

export function starterPrompts(pin: NlPin): string[] {
  const prompts = [
    VERDICT_PROMPTS[pin.verdict],
    pin.verifyYourself
      ? 'What exactly do I need to verify?'
      : KIND_PROMPTS[pin.kind],
    'Poke holes in this pin.',
  ].filter((p): p is string => typeof p === 'string');
  return [...new Set(prompts)].slice(0, 3);
}
