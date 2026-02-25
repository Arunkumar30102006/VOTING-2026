// Kill script to unregister the service worker and prevent it from hijacking requests
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        self.registration.unregister()
            .then(() => self.clients.matchAll())
            .then((clients) => {
                clients.forEach(client => client.navigate(client.url));
            })
    );
});
