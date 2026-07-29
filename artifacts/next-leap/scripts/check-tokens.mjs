/**
 * Design-token guard.
 *
 * Check 1 (always fatal) — every `var(--x)` referenced from src/ must be a name
 * actually declared in index.css. This is the deterministic detector for the
 * Tailwind v4 trap in .agents/memory/stack-gotchas.md: `@theme inline` creates
 * utilities but does not emit raw custom properties, so an undeclared var()
 * silently resolves to nothing and renders white-on-white — invisible in review.
 *
 * Check 2 (fatal with --strict) — no raw hex literals and no arbitrary
 * `text-[Npx]` outside index.css. Non-strict during the migration so progress
 * is measurable; --strict is the done condition.
 *
 *   node scripts/check-tokens.mjs            # white-on-white guard only
 *   node scripts/check-tokens.mjs --strict   # full done-condition
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(APP, 'src');
const CSS = path.join(SRC, 'index.css');
const strict = process.argv.includes('--strict');

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const css = readFileSync(CSS, 'utf8');

// Names declared anywhere in index.css (:root, @theme, @theme inline).
const declared = new Set([...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map(m => m[1]));

// Tailwind generates these from the @theme namespaces; they are legitimate
// references even though they are never written as declarations.
const generated = /^--(color|text|radius|shadow|font|spacing|breakpoint|leading|tracking|ease|animate)-/;

// Published at runtime by JS, not declared in CSS: the dock's measured height
// (interview-dock's ResizeObserver), the keyboard inset, and the simulated
// safe-area insets the screenshot harness injects.
const runtime = new Set(['--dock-h', '--kb-h', '--sai-t', '--sai-b', '--sai-l', '--sai-r']);

// components/ui is vendored shadcn: it legitimately references radix runtime
// vars (--radix-*) and its own --button-outline/--badge-outline, none of which
// are ours to declare. Our code is everything else.
const files = walk(SRC)
  .filter(f => /\.(tsx?|css)$/.test(f) && f !== CSS)
  .filter(f => !f.includes(`${path.sep}components${path.sep}ui${path.sep}`));

const problems = [];
const softProblems = [];

for (const file of files) {
  const body = readFileSync(file, 'utf8');
  const rel = path.relative(APP, file);

  body.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/var\((--[a-z0-9-]+)/gi)) {
      const name = m[1];
      if (!declared.has(name) && !generated.test(name) && !runtime.has(name)) {
        problems.push(`${rel}:${i + 1}  var(${name}) is not declared in index.css`);
      }
    }
    for (const m of line.matchAll(/#[0-9A-Fa-f]{6}\b/g)) {
      softProblems.push(`${rel}:${i + 1}  raw hex ${m[0]}`);
    }
    for (const m of line.matchAll(/text-\[\d+px\]/g)) {
      softProblems.push(`${rel}:${i + 1}  arbitrary type ${m[0]}`);
    }
  });
}

// Check 3 (always fatal) — the naming invariant itself. `:root` owns the raw,
// un-prefixed names (always emitted); Tailwind owns the --color-* namespace
// (may not emit). Crossing them is what reintroduces white-on-white.
const rootBlock = css.match(/^:root\s*\{([\s\S]*?)^\}/m)?.[1] ?? '';
for (const m of rootBlock.matchAll(/^\s*(--color-[a-z0-9-]+)\s*:/gim)) {
  problems.push(`src/index.css  :root declares ${m[1]} — the --color-* namespace belongs to @theme`);
}
for (const file of files) {
  const rel = path.relative(APP, file);
  if (!/\.tsx?$/.test(file)) continue;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/var\(--color-/.test(line)) {
      problems.push(`${rel}:${i + 1}  references var(--color-…); use the raw token name instead`);
    }
  });
}

if (problems.length) {
  console.error(`\nUNDECLARED TOKENS (${problems.length}) — these render as nothing:\n`);
  problems.forEach(p => console.error('  ' + p));
}

if (softProblems.length) {
  const label = strict ? 'UNTOKENIZED VALUES' : 'untokenized values remaining';
  console.error(`\n${label} (${softProblems.length}):\n`);
  softProblems.slice(0, 40).forEach(p => console.error('  ' + p));
  if (softProblems.length > 40) console.error(`  ... and ${softProblems.length - 40} more`);
}

const failed = problems.length > 0 || (strict && softProblems.length > 0);
if (!failed) console.log(`tokens ok${strict ? ' (strict)' : ''}`);
process.exit(failed ? 1 : 0);
