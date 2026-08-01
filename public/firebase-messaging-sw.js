// Firebase Messaging Service Worker
// Version: 2.0.0 (Secure — config injected at runtime, no hardcoded credentials)
// This file is required for background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Config is injected by the service worker registration call in the app
// via postMessage or self.FIREBASE_CONFIG set before registration.
// Fallback: read from self (injected by Next.js build or a registration script).
let firebaseConfig = self.FIREBASE_CONFIG || null;

// Listen for config injection via postMessage (from the main thread)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        firebaseConfig = event.data.config;
        initFirebase();
    }
});

function initFirebase() {
    if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
        // Skip gracefully if Firebase env vars are missing
        return;
    }
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const messaging = firebase.messaging();

        messaging.onBackgroundMessage((payload) => {
            const notificationTitle = payload.notification?.title || 'SmartERP';
            const notificationOptions = {
                body: payload.notification?.body || '',
                icon: '/icon.png',
                data: payload.data,
                badge: '/icon.png',
            };
            self.registration.showNotification(notificationTitle, notificationOptions);
        });
    } catch (err) {
        console.error('[SW] Firebase init error:', err);
    }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});
