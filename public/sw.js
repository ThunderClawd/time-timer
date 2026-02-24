const CACHE_NAME = 'time-timer-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/timer.svg',
  '/manifest.json'
];

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch (cache-first, network fallback) ────────────────────────────────────

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serve from cache, update in background
        event.waitUntil(
          fetch(event.request)
            .then((res) => {
              if (res && res.status === 200) {
                caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') return caches.match('/');
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// ─── Timer notification scheduling ───────────────────────────────────────────
// The app sends postMessage({ type: 'SCHEDULE_NOTIFICATION', delayMs })
// when a timer starts, and { type: 'CANCEL_NOTIFICATION' } when it stops.
// The SW fires a browser notification after the delay so the user is
// alerted even if the tab is backgrounded or the screen is locked.

let notificationTimer = null;

self.addEventListener('message', (event) => {
  const { type, delayMs } = event.data ?? {};

  if (type === 'SCHEDULE_NOTIFICATION') {
    // Cancel any existing scheduled notification first
    if (notificationTimer !== null) {
      clearTimeout(notificationTimer);
      notificationTimer = null;
    }

    if (typeof delayMs !== 'number' || delayMs <= 0) return;

    notificationTimer = setTimeout(async () => {
      notificationTimer = null;

      // Don't fire if the app is currently visible (the app handles it)
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: false });
      const appVisible = clients.some(
        (c) => c.visibilityState === 'visible'
      );
      if (appVisible) return;

      // Fire the notification
      await self.registration.showNotification('⏰ Timer Done!', {
        body: 'Your timer has finished.',
        icon: '/timer-192.png',
        badge: '/timer-192.png',
        tag: 'timer-complete',       // replaces any existing timer notification
        renotify: true,
        vibrate: [200, 100, 200],
        requireInteraction: false,
      });
    }, delayMs);
  }

  if (type === 'CANCEL_NOTIFICATION') {
    if (notificationTimer !== null) {
      clearTimeout(notificationTimer);
      notificationTimer = null;
    }
  }
});

// Clicking the notification focuses / opens the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.startsWith(self.location.origin));
      if (existing) {
        return existing.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
