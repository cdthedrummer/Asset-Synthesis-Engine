---
name: Stack gotchas (Orval codegen, Tailwind v4)
description: Non-obvious failures in the monorepo's OpenAPI codegen and Tailwind v4 theming
---
- Orval emits a colliding `<OperationId>Params` type when a single operation declares BOTH path and query params, and the generated client fails tsc. **Why:** hit while generating the api client for a new feature. **How to apply:** keep api-spec operations path-param-only (split filtered variants into separate paths) or rename operationIds until generated type names are unique.
- Tailwind v4 `@theme inline` tokens create utilities (e.g. `bg-surface`) but do NOT emit raw `var(--color-*)` custom properties. Styles that reference `var(--color-x)` directly resolve empty (white-on-white cards). **Why:** mockup CSS ported from the canvas sandbox silently broke this way. **How to apply:** when porting mockup styles into an artifact, audit raw `var()` references and define those custom properties in an explicit `:root` block next to the `@theme`.
