// Incrémenter VERSION à chaque publication, même pour un changement de contenu.
const VERSION = 'tomrof-github-v21';
const BASE = new URL('./', self.location).href;
const SHELL = ['./', './index.html', './styles.css', './header.css', './shop.css?v=16', './tee-shirt-standard.jpg', './tee-shirt-girly.png', './visuel-personnalisation-exemple.jpg', './slogan.css', './musicians.css?v=7', './content.js?v=13', './app.js?v=7', './manifest.webmanifest', './logo-original.png', './tomrof-studio-v3.jpg', './perla-studio-v2.jpg', './fred-studio-v2.jpg', './icon-192.png', './icon-512.png'].map(path => new URL(path, BASE).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('tomrof-') && key !== VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !SHELL.includes(request.url)) return;
  // Version cohérente du site : le shell entier change avec le service worker.
  event.respondWith(caches.open(VERSION).then(async cache => (await cache.match(request)) || fetch(request)));
});
