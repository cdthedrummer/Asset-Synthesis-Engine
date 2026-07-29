/**
 * Rasterise the brand SVGs in assets-src/ into the PNGs in public/.
 *
 * This is a one-time dev operation, never CI: the PNGs are committed as brand
 * assets so no image toolchain enters the deploy path (Replit only runs
 * `vite build`). Chromium is the rasteriser because this container has no
 * ImageMagick, rsvg, Inkscape, resvg, cairosvg or PIL — and because using the
 * browser means the og.png text renders in the real webfont.
 *
 * Run from artifacts/next-leap:
 *   NODE_PATH=$(npm root -g) PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
 *     node scripts/icons.mjs
 * or just: pnpm run icons
 */
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(here, '..');
const SRC = path.join(APP, 'assets-src');
const OUT = path.join(APP, 'public');

// playwright lives in the global node_modules in this container, not the
// workspace — resolve it from NODE_PATH rather than adding a dependency.
const req = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = req('playwright'));
} catch {
  for (const root of (process.env.NODE_PATH ?? '').split(path.delimiter).filter(Boolean)) {
    try {
      ({ chromium } = req(path.join(root, 'playwright')));
      break;
    } catch { /* try the next root */ }
  }
}
if (!chromium) {
  console.error(
    'Could not resolve playwright. Retry with:\n' +
      '  NODE_PATH=$(npm root -g) PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/icons.mjs',
  );
  process.exit(1);
}

/** SVG jobs: square, fixed size, transparent background disabled. */
const SVG_JOBS = [
  { src: 'icon-any.svg', out: 'icon-192.png', size: 192 },
  { src: 'icon-any.svg', out: 'icon-512.png', size: 512 },
  { src: 'icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
  { src: 'apple-touch.svg', out: 'apple-touch-icon.png', size: 180 },
];

/** HTML jobs: arbitrary aspect, needs webfonts to settle first. */
const HTML_JOBS = [{ src: 'og.html', out: 'og.png', width: 1200, height: 630 }];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const job of SVG_JOBS) {
  const svg = readFileSync(path.join(SRC, job.src), 'utf8');
  const page = await browser.newPage({
    viewport: { width: job.size, height: job.size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><style>html,body{margin:0;padding:0;overflow:hidden}` +
      `svg{display:block;width:${job.size}px;height:${job.size}px}</style>${svg}`,
    { waitUntil: 'load' },
  );
  await page.screenshot({ path: path.join(OUT, job.out), omitBackground: false });
  await page.close();
  console.log(`  ${job.out.padEnd(26)} ${job.size}x${job.size}`);
}

for (const job of HTML_JOBS) {
  const page = await browser.newPage({
    viewport: { width: job.width, height: job.height },
    deviceScaleFactor: 1,
  });
  await page.goto(`file://${path.join(SRC, job.src)}`, { waitUntil: 'load' });
  // Without this the headline rasterises in the Georgia fallback.
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, job.out), omitBackground: false });
  await page.close();
  console.log(`  ${job.out.padEnd(26)} ${job.width}x${job.height}`);
}

await browser.close();
