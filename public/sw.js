/**
 * public/sw.js — SmartERP Service Worker
 *
 * Handles:
 *   - Offline fallback for navigation requests
 *   - Background sync hook for attendance
 *
 * IMPORTANT: This file must be served at /sw.js with NO redirects.
 * The Next.js middleware matcher is configured to exclude this path.
 */

const CACHE_NAME = 'smarterp-v2';
const OFFLINE_URL = '/offline.html';

// ─── Install ───────────────────────────────────────────────────────────────
// Pre-cache the offline fallback. Uses try/catch so a single cache miss
// does NOT abort the entire service worker installation.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll([OFFLINE_URL, '/favicon.ico', '/icon.png']);
      } catch (err) {
        // If a resource is missing, log and continue — don't block SW install
        console.warn('[sw.js] Pre-cache failed for one or more resources:', err);
        // Still try to cache just the offline page as minimum viable fallback
        try { await cache.add(OFFLINE_URL); } catch (_) { /* ignore */ }
      }
    })
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────────────────────
// Clean up old caches so stale assets don't survive deployments
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
// For page navigation requests: try the network first, fall back to offline page.
// For everything else: let the browser handle it normally.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
    );
  }
});

// ─── Background Sync ───────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

async function syncAttendance() {
  // Called when connectivity is restored via OS-level background sync.
  // The main app thread handles the actual re-submission via the 'online' event.
  console.log('[sw.js] Background sync triggered for attendance');
}
