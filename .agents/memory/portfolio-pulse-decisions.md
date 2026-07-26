---
name: Portfolio Pulse decisions
description: Durable decisions for the Portfolio Pulse app (brief audio, SSE chat, seed-data tone)
---

- Daily brief audio: generated once per brief via OpenAI TTS (voice "onyx", mp3), stored in `briefs.audio` (bytea), served by a plain Express route. **Why:** avoids object storage for a single-user app and keeps audio tied to the brief row; regenerating a brief replaces its audio.
  **How to apply:** if briefs get large or multi-user, move audio to object storage before scaling.
- Brief generation returns JSON {headline, content, script}: `content` is the written markdown, `script` is a separate ear-optimized version fed to TTS. **Why:** written and spoken registers differ; TTS of markdown sounds broken.
- Seed data tone: the 29 projects' verdicts/one-line truths are deliberately blunt and opinionated per the user's explicit "Hemingway not McKinsey" request. Do not soften them in future edits; the user confirmed this direction.
- Frontend markdown rendering escapes HTML before regex transforms (XSS guard) — keep that if the renderer is ever replaced.
