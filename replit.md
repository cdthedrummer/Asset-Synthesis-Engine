# Portfolio Pulse & Next Leap

## Overview
Two products for Charlie, sharing one API server:
- **Portfolio Pulse** (`/`) — a private "living project HQ": visual portfolio board with blunt AI verdicts, a daily podcast-style AI brief with audio, quick 15-second check-ins, an operating plan (max 3 active bets), and a context-aware AI advisor chat.
- **Next Leap** (`/next-leap`) — a "second brain for career changers": a short AI interview builds a pinboard of verdict-stamped infographic pins (`artifacts/next-leap`; routes under `/api/nextleap/`, schema `lib/db/src/schema/nl-*.ts`). Interview questions and chat replies offer tap-answer chips; every pin opens into a recap + pin-scoped chat with edit / AI "Add info" / delete and Keep-style checklists. Boards live at `/b/<token>` (`?pin=<id>` deep-links a pin). Demo boards (`demo-*` tokens) are read-only — all mutation routes 403.

## Architecture
- pnpm monorepo. Frontend: `artifacts/portfolio-pulse` (React + Vite, wouter, dark editorial theme, served at `/`). Backend: `artifacts/api-server` (Express 5) at `/api`.
- Contract-first: `lib/api-spec/openapi.yaml` → `pnpm --filter @workspace/api-spec run codegen` → hooks in `lib/api-client-react`, Zod in `lib/api-zod`.
- DB: Drizzle + Postgres (`lib/db/src/schema/`: projects, checkins, briefs, conversations, messages). Push with `pnpm --filter @workspace/db run push`.
- AI: Replit AI Integrations (OpenAI proxy, no API key, billed to credits). Chat/brief model: `gpt-5.6-terra` (use `max_completion_tokens`, no temperature). Brief audio: `textToSpeech` (voice "onyx", mp3) stored as bytea in `briefs.audio`, served at `GET /api/briefs/{id}/audio`.
- Advisor chat streams SSE from `POST /api/openai/conversations/{id}/messages`; frontend parses with fetch + ReadableStream (no generated hook). Portfolio context is injected server-side (`artifacts/api-server/src/lib/portfolio-context.ts`).

## Product conventions
- Verdicts: lead / delegate / partner / publish / park / kill. Categories: work / personal / life. Scores: difficulty 1-10, upside 1-10, traction 1-5. Max 3 active bets (`isActiveBet`).
- Tone throughout (AI prompts + copy): direct, opinionated, "Hemingway not McKinsey". No emojis in UI.
- Seed data (29 projects) was authored from Charlie's uploaded portfolio brief and retrospective — verdicts and truths are intentionally opinionated.

## User preferences
- Charlie is non-technical and a visual learner: explain in outcome terms, not implementation terms.
- Wants dark, confident visual style; daily podcast-style audio brief is a core feature, not a nice-to-have.
