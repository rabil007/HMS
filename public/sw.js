/* Service worker for booking push notifications. Kept dependency-free and served from /sw.js so it controls the whole app. */

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let payload = {};

    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        payload = {
            title: 'Notification',
            body: event.data ? event.data.text() : '',
        };
    }

    const title = payload.title || 'Notification';
    const options = {
        body: payload.body || '',
        icon: payload.icon || '/apple-touch-icon.png',
        badge: payload.badge || '/favicon.png',
        tag: payload.tag || undefined,
        renotify: Boolean(payload.tag),
        data: payload.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const target = new URL(
        (event.notification.data && event.notification.data.url) ||
            '/notifications-center',
        self.location.origin,
    );

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (
                        new URL(client.url).origin === target.origin &&
                        'focus' in client
                    ) {
                        return client
                            .navigate(target.href)
                            .then((c) => (c || client).focus());
                    }
                }

                return self.clients.openWindow(target.href);
            }),
    );
});
