// Meta Pixel "rt" (ID 1884382392256153). Carrega o fbevents.js só com
// consent === 'all'. RouteTracker (App.tsx) dispara PageView a cada navegação
// SPA. Mesma estrutura de analytics.ts/ads.ts: idempotente, escuta o evento
// rdt:consent-change emitido pelo CookieBanner.

const META_PIXEL_ID = '1884382392256153'
const CONSENT_KEY = 'rdt_cookie_consent_v1'

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      queue?: unknown[][]
      push?: unknown
      loaded?: boolean
      version?: string
    }
    _fbq?: Window['fbq']
    __rdtMetaPixelReady?: boolean
  }
}

function readConsent(): 'all' | 'essential' | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { choice?: 'all' | 'essential' }
    return parsed?.choice ?? null
  } catch {
    return null
  }
}

export function getMetaPixelId(): string {
  return META_PIXEL_ID
}

export function isMetaPixelEnabled(): boolean {
  return readConsent() === 'all'
}

export function initMetaPixel(): void {
  if (typeof window === 'undefined') return
  if (window.__rdtMetaPixelReady) return
  if (readConsent() !== 'all') return

  // Snippet oficial do Meta (fbevents.js loader). Mantido fiel ao do Facebook
  // para que o Pixel Helper reconheça a instalação.
  const w = window as Window & { fbq?: Window['fbq']; _fbq?: Window['fbq'] }
  if (!w.fbq) {
    const fbq = function (...args: unknown[]) {
      const f = fbq as unknown as {
        callMethod?: (...a: unknown[]) => void
        queue: unknown[][]
      }
      if (f.callMethod) {
        f.callMethod.apply(fbq, args)
      } else {
        f.queue.push(args)
      }
    } as Window['fbq']
    ;(fbq as unknown as { queue: unknown[][] }).queue = []
    ;(fbq as unknown as { loaded: boolean }).loaded = true
    ;(fbq as unknown as { version: string }).version = '2.0'
    ;(fbq as unknown as { push: unknown }).push = fbq
    w.fbq = fbq
    if (!w._fbq) w._fbq = fbq

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
