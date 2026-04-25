// Inicialização do AdSense. Carrega o script externo só se houver publisher
// ID configurado e consent === 'all'. AdSlot.tsx faz o resto (renderiza
// <ins> e chama adsbygoogle.push).

const PUB_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined
const CONSENT_KEY = 'rdt_cookie_consent_v1'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
    __rdtAdsReady?: boolean
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

export function getAdSensePublisherId(): string | undefined {
  return PUB_ID
}

export function isAdSenseEnabled(): boolean {
  return Boolean(PUB_ID) && readConsent() === 'all'
}

export function initAdSense(): void {
  if (typeof window === 'undefined') return
  if (window.__rdtAdsReady) return
  if (!PUB_ID) {
    console.debug('[ads] VITE_ADSENSE_PUBLISHER_ID ausente, AdSense desativado')
    return
  }
  if (readConsent() !== 'all') return

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`
  document.head.appendChild(script)
  window.adsbygoogle = window.adsbygoogle ?? []
  window.__rdtAdsReady = true
}
