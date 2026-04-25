// Service worker da Resenha do Teólogo.
// Estratégia conservadora: pré-cache do shell mínimo + network-first para
// navegações (HTML), cache-first para logos. Intencionalmente não intercepta
// chamadas do Convex, Clerk, YouTube ou APIs externas.

const VERSION = 'v1'
const STATIC_CACHE = `resenha-static-${VERSION}`
const NAV_CACHE = `resenha-nav-${VERSION}`

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/logos/LOGO%20ICONE%20PRETA.png',
  '/logos/LOGO%20ICONE%20BRANCA.png',
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
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== NAV_CACHE)
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

function isStaticAsset(url) {
  return url.pathname.startsWith('/logos/') || url.pathname === '/manifest.webmanifest'
}

function isSameOriginNavigation(req, url) {
  return (
    req.mode === 'navigate' ||
    (req.method === 'GET' && req.headers.get('accept')?.includes('text/html') && url.origin === self.location.origin)
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Ignora completamente APIs externas sensíveis a frescor/auth.
  if (url.origin !== self.location.origin) return

  // Evita cachear respostas de terceiros que entram sob mesma origem via fetch
  // (ex. Clerk, Convex chamados por HTTP proxy — não se aplica hoje, mas
  // mantém safe).

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

  if (isSameOriginNavigation(req, url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(NAV_CACHE).then((c) => c.put(req, clone)).catch(() => undefined)
          }
          return res
        })
        .catch(() => caches.match(req).then((r) => r ?? caches.match('/')))
    )
  }
})
