const CACHE = 'ip-v3'
const PRECACHE_URLS = ['/', '/login', '/register', '/flussi', '/offline.html', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, responseClone)).catch(() => {})
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached || caches.match('/offline.html')
        }),
    )
    return
  }

  if (['style', 'script', 'worker', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const responseClone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, responseClone)).catch(() => {})
            return response
          })
          .catch(() => cached)

        return cached || networkFetch
      }),
    )
    return
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)))
})
