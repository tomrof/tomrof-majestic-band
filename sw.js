// Incrémenter VERSION à chaque publication, même pour un changement de contenu.
const VERSION = 'tomrof-github-v32';
const BASE = new URL('./', self.location).href;
const SHELL = ['./', './index.html', './styles.css', './header.css?v=29', './shop.css?v=23', './tee-shirt-standard.jpg', './tee-shirt-girly.png', './ds-titi.png', './slogan.css', './musicians.css?v=28', './content.js?v=28', './app.js?v=12', './manifest.webmanifest', './son-courrier.mp3', './son-caisse.mp3', './logo-original.png', './tomrof-studio-v3.jpg', './perla-basse-studio-v3.jpg', './fred-batterie-studio-v4.jpg', './icon-192.png', './icon-512.png'].map(path => new URL(path, BASE).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL.map(url => new Request(url, {cache: 'reload'})))).then(() => self.skipWaiting()));
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
