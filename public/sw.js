// Service worker da Resenha do Teólogo. Estratégias por tipo:
// - HTML/navegações: network-first com fallback de cache + página offline
// - Assets estáticos do build (/assets/*): cache-first (hash imutável)
// - Logos / manifest / og-default: cache-first
// - Fonts (Google Fonts): stale-while-revalidate
// - Imagens cross-origin (covers/thumbnails): stale-while-revalidate (cap)
// Convex, Clerk, AdSense, GA4 e Meta Pixel passam direto sem cache.

const VERSION = 'v3'
const STATIC_CACHE = `resenha-static-${VERSION}`
const NAV_CACHE = `resenha-nav-${VERSION}`
const FONT_CACHE = `resenha-fonts-${VERSION}`
const IMG_CACHE = `resenha-img-${VERSION}`
const IMG_CACHE_MAX = 80
const OFFLINE_URL = '/offline.html'

const STATIC_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/og-default.jpg',
  '/logos/LOGO%20ICONE%20PRETA.png',
  '/logos/LOGO%20ICONE%20BRANCA.png',
  '/logos/LOGO%20RETANGULO%20LETRA%20BRANCA.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined)
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      const allowed = new Set([STATIC_CACHE, NAV_CACHE, FONT_CACHE, IMG_CACHE])
      await Promise.all(keys.filter((k) => !allowed.has(k)).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

// Permite que o app peça ao SW para pular o waiting (após avisar o usuário
// que existe versão nova). Disparado por navigator.serviceWorker.controller.postMessage
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/logos/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/og-default.jpg' ||
    url.pathname === '/favicon.ico'
  )
}

function isHtmlNavigation(req, url) {
  return (
    req.mode === 'navigate' ||
    (req.method === 'GET' &&
      req.headers.get('accept')?.includes('text/html') &&
      url.origin === self.location.origin)
  )
}

function isFontRequest(url) {
  return (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  )
}

function isCachableImage(url) {
  if (url.origin === self.location.origin) return false
  // Convex storage URLs (covers de blog/artigos) e thumbnails do YouTube
  return (
    url.hostname.endsWith('.convex.cloud') ||
    url.hostname === 'i.ytimg.com' ||
    url.hostname === 'img.youtube.com'
  )
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= max) return
  const toDelete = keys.slice(0, keys.length - max)
  await Promise.all(toDelete.map((k) => cache.delete(k)))
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Skip qualquer endpoint que precisa de frescor/auth.
  const skipHosts = [
    'pagead2.googlesyndication.com',
    'googleads.g.doubleclick.net',
    'www.googletagmanager.com',
    'connect.facebook.net',
    'www.facebook.com',
  ]
  if (skipHosts.includes(url.hostname)) return
  if (url.hostname.endsWith('.clerk.accounts.dev') || url.hostname.endsWith('.clerk.com')) return
  if (url.hostname.endsWith('.convex.site')) return // funções HTTP do Convex
  if (url.pathname.startsWith('/_clerk') || url.pathname.startsWith('/api/')) return

  // Imagens externas cachadas (covers do blog em Convex storage, thumbs YouTube)
  if (isCachableImage(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMG_CACHE)
        const cached = await cache.match(req)
        const networkPromise = fetch(req)
          .then((res) => {
            if (res.ok && res.status === 200) {
              cache.put(req, res.clone()).then(() => trimCache(IMG_CACHE, IMG_CACHE_MAX))
            }
            return res
          })
          .catch(() => cached)
        return cached ?? (await networkPromise)
      })()
    )
    return
  }

  // Google Fonts
  if (isFontRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FONT_CACHE)
        const cached = await cache.match(req)
        const networkPromise = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone())
            return res
          })
          .catch(() => cached)
        return cached ?? (await networkPromise)
      })()
    )
    return
  }

  // Same-origin daqui pra baixo. Cross-origin não cacheado cai pro browser default.
  if (url.origin !== self.location.origin) return

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ??
          fetch(req)
            .then((res) => {
              if (res.ok) {
                const clone = res.clone()
                caches.open(STATIC_CACHE).then((c) => c.put(req, clone)).catch(() => undefined)
              }
              return res
            })
            .catch(() => cached)
      )
    )
    return
  }

  if (isHtmlNavigation(req, url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(NAV_CACHE).then((c) => c.put(req, clone)).catch(() => undefined)
          }
          return res
        })
        .catch(async () => {
          const cached = await caches.match(req)
          if (cached) return cached
          const home = await caches.match('/')
          if (home) return home
          const offline = await caches.match(OFFLINE_URL)
          if (offline) return offline
          return Response.error()
        })
    )
  }
})
