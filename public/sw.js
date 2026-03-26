const CACHE_NAME = 'smarterp-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_URL, '/favicon.ico', '/icon.png']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});

// Background Sync for Attendance
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

async function syncAttendance() {
  // This will be called when the browser regains connectivity
  // Note: Actual implementation for background sync often requires 
  // careful coordination with the main thread or a shared state.
  console.log('🔄 Background sync triggered for attendance');
  // We'll rely on the app's 'online' event listener for immediate sync,
  // but this worker provides the hook for OS-level background sync.
}
