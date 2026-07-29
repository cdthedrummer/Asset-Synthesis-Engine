import type { Plugin } from 'vite';

/**
 * Dev-only fixture API, enabled with NL_MOCK_API=1.
 *
 * The real API needs Postgres (`lib/db` throws at module load without
 * DATABASE_URL) and there is no dev proxy, so relative `/api/...` fetches would
 * 404 against the Vite origin. That makes every board surface — the interview
 * dock, a full board, an expanded pin, the moves overlay, the reveal — impossible
 * to look at locally. This serves enough shape to render them.
 *
 * Never enabled in production: registration is gated on the env var in
 * vite.config.ts, and this file is not imported otherwise.
 *
 * Token selects the scenario:
 *   mock-board       a finished board, all four verdicts, progress, bet, trajectory
 *   mock-interview   stage=interview, so the dock renders
 *   mock-empty       a board with nothing on it yet
 */
const ISO = (daysAgo: number) =>
  new Date(Date.UTC(2026, 6, 29) - daysAgo * 86_400_000).toISOString();

const WEEKS = [0, 2, 1, 0, 4, 7, 2, 3].map((actions, i) => ({
  start: ISO(56 - i * 7),
  actions,
}));

const PINS = [
  {
    id: 1,
    title: 'Health department permit',
    verdict: 'start',
    verdictWhy: 'Nothing else can legally happen until this clears. Two weeks of lead time.',
    difficulty: 4,
    impact: 9,
    kind: 'steps',
    vizData: {
      caption: 'Cottage food licence',
      steps: [
        { label: 'Kitchen inspection booked', state: 'done' },
        { label: 'Form 4B submitted', state: 'active' },
        { label: 'Certificate issued', state: 'todo' },
      ],
    },
    detail: null,
    verifyYourself: true,
    relatedPinIds: [],
    lastTouchedAt: ISO(0),
  },
  {
    id: 2,
    title: 'Weekend farmers market',
    verdict: 'schedule',
    verdictWhy: 'Real revenue, but the season opens in April. Nothing to do until March.',
    difficulty: 3,
    impact: 6,
    kind: 'calendar',
    vizData: {
      month: 'April',
      caption: '6 market days',
      marks: [
        { day: 4, kind: 'event' },
        { day: 11, kind: 'event' },
        { day: 18, kind: 'event' },
        { day: 25, kind: 'event' },
        { day: 12, kind: 'due' },
        { day: 20, kind: 'post' },
      ],
    },
    detail: null,
    verifyYourself: false,
    relatedPinIds: [],
    lastTouchedAt: ISO(1),
  },
  {
    id: 3,
    title: 'Pricing the menu',
    verdict: 'start',
    verdictWhy: 'You are underpricing by roughly a third. This is a one-afternoon fix.',
    difficulty: 2,
    impact: 8,
    kind: 'menu',
    vizData: {
      heading: 'Per unit',
      items: [
        { name: 'Sourdough loaf', price: '$9' },
        { name: 'Focaccia tray', price: '$14' },
        { name: 'Cinnamon buns (6)', price: '$18' },
        { name: 'Custom cake', price: '$65' },
      ],
    },
    detail: null,
    verifyYourself: false,
    relatedPinIds: [],
    lastTouchedAt: ISO(2),
  },
  {
    id: 4,
    title: 'Monthly output vs oven capacity',
    verdict: 'gethelp',
    verdictWhy: 'You hit the ceiling in month three. One conversation with a commissary fixes it.',
    difficulty: 6,
    impact: 7,
    kind: 'bars',
    vizData: {
      unit: 'loaves / week',
      capLine: { label: 'Oven cap', value: 120 },
      bars: [
        { label: 'Jan', value: 40 },
        { label: 'Feb', value: 65 },
        { label: 'Mar', value: 95 },
        { label: 'Apr', value: 130 },
      ],
    },
    detail: null,
    verifyYourself: false,
    relatedPinIds: [],
    lastTouchedAt: ISO(3),
  },
  {
    id: 5,
    title: 'Custom cake commissions',
    verdict: 'skip',
    verdictWhy: 'Highest effort, lowest margin, and it eats the weekend you need for market prep.',
    difficulty: 8,
    impact: 3,
    kind: 'stat',
    vizData: { value: '11', label: 'hrs per cake', sub: 'avg' },
    detail: null,
    verifyYourself: false,
    relatedPinIds: [],
    lastTouchedAt: ISO(4),
  },
  {
    id: 6,
    title: 'Wholesale to two cafés',
    verdict: 'skip',
    verdictWhy: 'Wrong order. Retail margin first, then wholesale has something to negotiate with.',
    difficulty: 7,
    impact: 4,
    kind: 'pipeline',
    vizData: {
      items: [
        { name: 'Corner Roasters', status: 'Replied', state: 'done' },
        { name: 'Bluebird Café', status: 'Waiting', state: 'active' },
        { name: 'Third St. Deli', status: 'Not sent', state: 'todo' },
      ],
    },
    detail: null,
    verifyYourself: false,
    relatedPinIds: [],
    lastTouchedAt: ISO(6),
  },
  {
    id: 7,
    title: 'Instagram build-up',
    verdict: 'schedule',
    verdictWhy: 'Useful, not urgent. Start it two weeks before the market opens, not now.',
    difficulty: 3,
    impact: 5,
    kind: 'table',
    vizData: {
      rows: [
        { label: 'Handle reserved', state: 'done', note: 'done' },
        { label: 'First 9 posts', state: 'active', note: 'drafting' },
        { label: 'Market announcement', state: 'todo' },
      ],
    },
    detail: null,
    verifyYourself: false,
    relatedPinIds: [],
    lastTouchedAt: ISO(9),
  },
];

const MOVES = [
  {
    id: 1, boardId: 1, pinId: 1, title: 'Submit Form 4B',
    first48: 'Scan the inspection sheet and email it with Form 4B to the county health office.',
    orderIndex: 0, state: 'done', repKind: 'email', repDraft: null, cycleIndex: 0,
    doneAt: ISO(1), createdAt: ISO(5),
  },
  {
    id: 2, boardId: 1, pinId: 3, title: 'Reprice the four core items',
    first48: 'Take last month’s ingredient receipts and set every price at 3.2x cost.',
    orderIndex: 1, state: 'pending', repKind: 'plan', repDraft: null, cycleIndex: 0,
    doneAt: null, createdAt: ISO(5),
  },
  {
    id: 3, boardId: 1, pinId: 4, title: 'Ask about commissary hours',
    first48: 'One message to the commissary kitchen asking their weekly rate and availability.',
    orderIndex: 2, state: 'pending', repKind: 'message', repDraft: null, cycleIndex: 0,
    doneAt: null, createdAt: ISO(5),
  },
];

const TASKS = [
  { id: 1, boardId: 1, pinId: 1, label: 'Book inspection', done: true, doneAt: ISO(12), orderIndex: 0, createdAt: ISO(20) },
  { id: 2, boardId: 1, pinId: 1, label: 'Print Form 4B', done: true, doneAt: ISO(5), orderIndex: 1, createdAt: ISO(20) },
  { id: 3, boardId: 1, pinId: 1, label: 'Mail certificate fee', done: false, doneAt: null, orderIndex: 2, createdAt: ISO(20) },
  { id: 4, boardId: 1, pinId: 3, label: 'Pull ingredient costs', done: true, doneAt: ISO(2), orderIndex: 0, createdAt: ISO(10) },
  { id: 5, boardId: 1, pinId: 3, label: 'Rewrite the price card', done: false, doneAt: null, orderIndex: 1, createdAt: ISO(10) },
];

function board(token: string, stage: string) {
  return {
    id: 1,
    token,
    kind: 'real',
    name: 'Maya',
    door: 'ambition',
    goalText: 'Turn my weekend baking into a real bakery business',
    aiFamiliarity: 'some',
    craftComfort: 'some',
    stage,
    statChips: [
      { label: 'Off the board', value: '2', tone: 'good' },
      { label: 'Weeks active', value: '6', tone: 'neutral' },
      { label: 'Needs a date', value: '2', tone: 'warn' },
    ],
    trajectory: {
      title: 'Weekly revenue',
      headline: '$180 → $1.4k',
      series: [
        { x: 'Jan', y: 180 }, { x: 'Feb', y: 320 }, { x: 'Mar', y: 410 },
        { x: 'Apr', y: 680, projected: true }, { x: 'May', y: 1040, projected: true },
        { x: 'Jun', y: 1400, projected: true },
      ],
      milestones: [
        { label: 'Permit clears', when: 'Mar' },
        { label: 'First market day', when: 'Apr' },
      ],
    },
    bet: {
      pinId: 6,
      title: 'Wholesale to two cafés',
      why: 'It is the one you will talk about and never start. Drop it and the week gets honest.',
    },
    createdAt: ISO(42),
    updatedAt: ISO(0),
  };
}

function state(token: string) {
  const interview = token === 'mock-interview';
  const empty = token === 'mock-empty';
  return {
    board: board(token, interview ? 'interview' : 'board'),
    pins: empty ? [] : interview ? PINS.slice(0, 3) : PINS,
    moves: empty || interview ? [] : MOVES,
    checkins: [],
    messages: interview
      ? [{
          id: 1, boardId: 1, pinId: null, moveId: null, role: 'assistant',
          content: 'Which of these is actually blocking the others right now?',
          options: null,
          ask: {
            type: 'single',
            options: ['The permit', 'Pricing', 'Finding customers', 'Not enough hours'],
            placeholder: null,
          },
          createdAt: ISO(0),
        }]
      : [],
    tasks: empty || interview ? [] : TASKS,
    progress: {
      done: empty ? 0 : 4,
      dropped: empty ? 0 : 2,
      reps: empty ? 0 : 3,
      ticks: empty ? 0 : 3,
      checkins: empty ? 0 : 2,
      cycle: {
        index: 0,
        done: empty ? 0 : 1,
        dropped: empty ? 0 : 1,
        open: empty ? 0 : 1,
        issuedAt: ISO(3),
        staleAt: ISO(1),
      },
      weeks: WEEKS,
      activeWeeks: empty ? 0 : 3,
      lastActionAt: empty ? null : ISO(1),
    },
  };
}

export function mockApi(): Plugin {
  return {
    name: 'nl-mock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (!url.startsWith('/api/nextleap')) return next();

        const send = (body: unknown, status = 200) => {
          res.statusCode = status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(body));
        };

        if (url === '/api/nextleap/demos') {
          return send([
            { token: 'mock-board', title: "Maya's bakery", tagline: 'Baker → bakery owner' },
            { token: 'mock-interview', title: 'Dev, mid-interview', tagline: 'Swim instructor → head coach' },
          ]);
        }

        const m = url.match(/^\/api\/nextleap\/boards\/([^/]+)(\/.*)?$/);
        if (m) {
          const [, token, rest] = m;
          if (rest && /\/messages$/.test(rest)) return send([]);
          if (req.method === 'GET' || !rest) return send(state(token));
          return send(state(token)); // mutations echo the board back unchanged
        }
        return send({ error: 'not mocked' }, 404);
      });
    },
  };
}
