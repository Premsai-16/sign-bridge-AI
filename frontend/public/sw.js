const SHELL_CACHE = 'signbridge-shell-v1'
const RUNTIME_CACHE = 'signbridge-runtime-v1'
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/app-icon.svg']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.put('/index.html', response.clone())).catch(() => {}))
      return response
    }).catch(async () => (await caches.match(request)) || (await caches.match('/index.html'))))
    return
  }

  const staticModelOrAsset = url.pathname.startsWith('/assets/') || url.pathname.startsWith('/models/') || url.pathname.startsWith('/mediapipe/wasm/')
  if (!staticModelOrAsset) return
  event.respondWith(caches.match(request).then(async cached => {
    if (cached) return cached
    try {
      const response = await fetch(request)
      if (response.ok) event.waitUntil(caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone())).catch(() => {}))
      return response
    } catch { return Response.error() }
  }))
})
