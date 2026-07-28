# Portfolio Pulse & Next Leap

## Overview
Two products for Charlie, sharing one API server:
- **Portfolio Pulse** (`/`) — a private "living project HQ": visual portfolio board with blunt AI verdicts, a daily podcast-style AI brief with audio, quick 15-second check-ins, an operating plan (max 3 active bets), and a context-aware AI advisor chat.
- **Next Leap** (`/next-leap`) — **triage relief for any one big goal** (a business, a job, a team, a record, someone's care): a short AI interview builds a pinboard of verdict-stamped infographic pins, and the payoff is what comes OFF the board. Not career-only, one goal per board. (`artifacts/next-leap`; routes under `/api/nextleap/`, schema `lib/db/src/schema/nl-*.ts`.) Boards live at `/b/<token>` (`?pin=<id>` deep-links a pin). Demo boards (`demo-*` tokens) are read-only — all mutation routes 403.
  - **The promise, in one line:** permission to drop things, an order to do the rest in, and the first one already done. The board is the receipt; the SKIP stamps and the abandon-bet are the product.
  - **Flow.** `POST /nextleap/boards` is model-free and instant; `POST .../opening` (idempotent, CAS-locked on `updatedAt`) runs the first turn once the board is already on screen, so the owner watches their first pins land. Interview is capped at 5 questions and **force-finished in code** at `MAX_INTERVIEW_QUESTIONS`, not by prompt. Ending the interview triggers a reveal overlay: the drop → the bet → the three moves + keep-the-link.
  - **Answer affordances.** Interview turns carry `nl_messages.ask` (`text|single|multi|rank|scale|image`), sanitized by `sanitizeAsk` and dispatched by `AskInput`. Effort descends as the interview goes on. Image asks are allowlisted `lucide-react` icon keys — `ASK_ICONS` must stay identical in `engine.ts` and `ask/ask-icons.ts`. Chat threads keep the older `options: string[]` + `OPTIONS:` marker, untouched.
  - **Voice.** `POST /nextleap/transcriptions` (no board — the front door is question one) and `POST .../boards/:token/transcriptions`, both raw-body. Transcripts land editable, never auto-sent. Browser containers pass straight to `speechToText`; only an unrecognised buffer goes via `ensureCompatibleFormat`, which shells out to ffmpeg.
  - **Progress is the sensor.** `NlBoardState.progress` is derived on read by `computeProgress` (no table, no drift): moves done/dropped, reps, checklist ticks, check-ins, the current move cycle, and eight UTC week buckets. Week streaks only, never day streaks — nothing here can be advanced by opening the app. Rendered as the board-level `PulseCard`, deliberately not a pin kind the model can place.
  - **Self-healing is code, not prompt.** `MAX_PINS = 9` enforced in `applyOps` with a consolidation pass for overflow; near-duplicate titles fold into the existing pin (`dedup.ts`); `mergePins` (`merge.ts`) re-parents tasks, chat and moves and re-points the bet **before** deleting, because `deletePin` cascades them away. `mergePin` is in the chat ACTIONS allowlist; `verifyYourself` is sticky through a merge and can never carry a `start` verdict.

## Architecture
- pnpm monorepo. Frontend: `artifacts/portfolio-pulse` (React + Vite, wouter, dark editorial theme, served at `/`). Backend: `artifacts/api-server` (Express 5) at `/api`.
- Contract-first: `lib/api-spec/openapi.yaml` → `pnpm --filter @workspace/api-spec run codegen` → hooks in `lib/api-client-react`, Zod in `lib/api-zod`.
- DB: Drizzle + Postgres (`lib/db/src/schema/`: projects, checkins, briefs, conversations, messages, and the `nl-*` Next Leap tables). Push with `pnpm --filter @workspace/db run push` — schema push, no migration files.
- AI: Replit AI Integrations (OpenAI proxy, no API key, billed to credits). Chat/brief model: `gpt-5.6-terra` (use `max_completion_tokens`, no temperature). Brief audio: `textToSpeech` (voice "onyx", mp3) stored as bytea in `briefs.audio`, served at `GET /api/briefs/{id}/audio`.
- Advisor chat streams SSE from `POST /api/openai/conversations/{id}/messages`; frontend parses with fetch + ReadableStream (no generated hook). Portfolio context is injected server-side (`artifacts/api-server/src/lib/portfolio-context.ts`).

## Product conventions
- Verdicts: lead / delegate / partner / publish / park / kill. Categories: work / personal / life. Scores: difficulty 1-10, upside 1-10, traction 1-5. Max 3 active bets (`isActiveBet`).
- Tone throughout (AI prompts + copy): direct, opinionated, "Hemingway not McKinsey". No emojis in UI.
- Seed data (29 projects) was authored from Charlie's uploaded portfolio brief and retrospective — verdicts and truths are intentionally opinionated.

## User preferences
- Charlie is non-technical and a visual learner: explain in outcome terms, not implementation terms.
- Portfolio Pulse is dark and confident; its daily podcast-style audio brief is a core feature, not a nice-to-have. Next Leap is light — "dark mode is for nerds".
