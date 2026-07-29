import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Registering a worker is what makes Android treat this as an installable app
// rather than a browser bookmark. It is a bonus, never a blocker, so failures
// are swallowed. PROD-only: in dev a worker caches module URLs and produces
// phantom stale-module bugs.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // BASE_URL carries its trailing slash, so plain concatenation is correct.
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {});
  });
}

// In DEV, shout if any design token failed to resolve. This is the direct
// detector for the Tailwind v4 `@theme inline` trap recorded in
// .agents/memory/stack-gotchas.md: a var() that resolves empty renders as
// white-on-white, which is invisible in code review.
if (import.meta.env.DEV) {
  const cs = getComputedStyle(document.documentElement);
  const missing = [
    'paper', 'surface', 'sunken', 'scrim',
    'ink-1', 'ink-2', 'ink-3', 'ink-4', 'on-ink', 'on-ink-dim',
    'rule', 'rule-soft', 'rule-strong',
    'start', 'start-deep', 'start-tint', 'on-start',
    'moss', 'moss-deep', 'moss-0', 'moss-1', 'moss-2', 'moss-3', 'moss-4',
    'verdict-start-fill', 'verdict-start-ink', 'verdict-start-edge',
    'verdict-schedule-fill', 'verdict-schedule-ink', 'verdict-schedule-edge',
    'verdict-help-fill', 'verdict-help-ink', 'verdict-help-edge',
    'verdict-skip-ink', 'verdict-skip-edge',
    'danger', 'danger-deep', 'danger-tint',
    'chart-fill-top', 'chart-fill-bottom',
  ].filter(name => !cs.getPropertyValue(`--${name}`).trim());
  if (missing.length) {
    console.error('[tokens] resolved empty:', missing.join(', '));
  }
}
