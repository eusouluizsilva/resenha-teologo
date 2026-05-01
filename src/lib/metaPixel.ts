// Meta Pixel "rt" (ID 1884382392256153). Carrega o fbevents.js só com consent
// de anúncios concedido (ad_storage = granted). RouteTracker (App.tsx) dispara
// PageView a cada navegação SPA. Idempotente, escuta o evento
// rdt:consent-change emitido pelo CookieBanner.

import { isAdConsentGranted } from './consent'

const META_PIXEL_ID = '1884382392256153'

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[][]
  push: unknown
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: FbqFn
    _fbq?: FbqFn
    __rdtMetaPixelReady?: boolean
  }
}

export function getMetaPixelId(): string {
  return META_PIXEL_ID
}

export function isMetaPixelEnabled(): boolean {
  return isAdConsentGranted()
}

export function initMetaPixel(): void {
  if (typeof window === 'undefined') return
  if (window.__rdtMetaPixelReady) return
  if (!isAdConsentGranted()) return

  // Snippet oficial do Meta (fbevents.js loader). Mantido fiel ao do Facebook
  // para que o Pixel Helper reconheça a instalação.
  if (!window.fbq) {
    const fbq: FbqFn = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args)
      } else {
        fbq.queue.push(args)
      }
    } as FbqFn
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.push = fbq
    window.fbq = fbq
    if (!window._fbq) window._fbq = fbq

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }

  window.fbq!('init', META_PIXEL_ID)
  window.fbq!('track', 'PageView')
  window.__rdtMetaPixelReady = true
}

export function trackMetaPageView(): void {
  if (typeof window === 'undefined' || !window.__rdtMetaPixelReady || !window.fbq) return
  window.fbq('track', 'PageView')
}

// Eventos padrão do Meta. Use estes nomes (canonical) para que o Events Manager
// agrupe corretamente. Custom events são possíveis via fbq('trackCustom', ...).
type StandardEventName =
  | 'CompleteRegistration'
  | 'Lead'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Subscribe'
  | 'Contact'

export function trackMetaEvent(
  name: StandardEventName,
  params?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined' || !window.__rdtMetaPixelReady || !window.fbq) return
  window.fbq('track', name, params)
}
