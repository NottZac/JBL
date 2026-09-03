// Service Worker do app "Gestão de Ocorrências - E.E. Profº. José Bernardino Lindoso"
// Só existe pra deixar o app instalável (PWA) e dar um cache básico do "esqueleto"
// do app. NUNCA intercepta chamadas pro Firebase nem pros CDNs externos (Chart.js,
// PDF.js, Google Fonts) — essas continuam indo direto na rede, sem cache, pra não
// arriscar dado desatualizado.

const CACHE_NAME = 'jbl-ocorrencias-v1';
const APP_SHELL = [
  '.',
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // se algum arquivo do shell falhar, não trava a instalação
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // deixa Firebase/CDNs passarem direto

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
