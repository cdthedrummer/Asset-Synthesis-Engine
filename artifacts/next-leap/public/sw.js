/**
 * Shortlist service worker.
 *
 * Hand-written on purpose (no workbox, no vite-plugin-pwa): the only jobs here
 * are making the app installable and making a cold launch show its own shell.
 * A dependency would also have to clear pnpm's `minimumReleaseAge` gate.
 *
 * Why it exists at all: on Android, "Add to Home screen" without a service
 * worker produces a plain bookmark that opens in a browser tab — no themed
 * status bar, no standalone window, and `beforeinstallprompt` never fires. The
 * worker is what turns it into a real installed app. (iOS needs none of this;
 * it installs off the apple-mobile-web-app-* meta tags alone.)
 *
 * Board data is NEVER cached. See the /api/ bailout below — that is the single
 * most important line in this file.
 */
const VERSION = 'shortlist-v1';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

// Relative to the worker's own URL (/next-leap/sw.js), so the sub-path is never
// hardcoded here and survives a BASE_PATH change.
const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

// "/next-leap/" — computed once from this file's location.
const SCOPE = new URL('./', self.location.href).pathname;

self.addEventListener('install', event => {
  // A missing file must not poison the whole install, so add individually.
  event.waitUntil(
    caches.open(SHELL).then(cache =>
      Promise.all(SHELL_URLS.map(url => cache.add(url).catch(() => {}))),
    ),
  );
  // Deliberately NO skipWaiting(). Navigations are network-first, so new app
  // code reaches users immediately anyway; only the worker's own logic waits a
  // launch. Swapping mid-session would delete the asset cache out from under a
  // page still lazily importing hashed chunks from it.
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter(n => !n.startsWith(VERSION)).map(n => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // never intercept a write

  const url = new URL(req.url);

  // THE API *IS* THE BOARD — hand it straight to the network, always.
  //
  // `scope` controls which documents this worker controls, not which requests
  // it observes: the board page is in scope, so every fetch it makes fires this
  // handler, /api/ included. Bailing out here means three things at once:
  // a stale board can never be served, the SSE chat stream is never cloned
  // (cloning a streamed body breaks the typewriter), and offline failures
  // surface as the app's own error state rather than fiction.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;

  // Anything else cross-origin, or outside our sub-path, is not ours.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  if (req.mode === 'navigate') {
    event.respondWith(navigate(req));
    return;
  }

  // Vite emits content-hashed filenames under assets/, so a cache hit can never
  // be the wrong version.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(req, ASSETS));
    return;
  }

  event.respondWith(staleWhileRevalidate(req, SHELL));
});

async function navigate(req) {
  const cache = await caches.open(SHELL);
  try {
    const fresh = await fetch(req);
    // Keep the offline shell current, including the asset hashes it points at.
    if (fresh.ok) cache.put('./index.html', fresh.clone());
    return fresh;
  } catch {
    return (await cache.match('./index.html')) || Response.error();
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const net = fetch(req)
    .then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit || Response.error());
  return hit || net;
}
