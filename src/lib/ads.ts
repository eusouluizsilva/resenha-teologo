// Inicialização do AdSense com Google Consent Mode v2.
//
// adsbygoogle.js carrega sempre que houver Publisher ID configurado. O consent
// state é gerenciado por src/lib/consent.ts via gtag('consent', ...). Em modo
// 'denied' (default LGPD), o Google serve anúncios não-personalizados (NPA),
// que ainda monetizam mas sem cookies/personalização. Em 'granted' (após
// "Aceitar todos"), monetiza com personalização completa.

import { initConsent } from './consent'

const PUB_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined

declare global {
  interface Window {
    adsbygoogle?: unknown[]
    __rdtAdsReady?: boolean
  }
}

export function getAdSensePublisherId(): string | undefined {
  return PUB_ID
}

export function isAdSenseEnabled(): boolean {
  // Com Consent Mode v2, AdSense está sempre habilitado se PUB_ID existir.
  // O premium gate é feito no AdSlot (independente do consent).
  return Boolean(PUB_ID)
}

export function initAdSense(): void {
  if (typeof window === 'undefined') return
  if (window.__rdtAdsReady) return
  if (!PUB_ID) {
    console.debug('[ads] VITE_ADSENSE_PUBLISHER_ID ausente, AdSense desativado')
    return
  }

  // Garante consent default antes do adsbygoogle.js carregar, para que o
  // script já saiba se deve servir personalized ou NPA.
  initConsent()

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`
  document.head.appendChild(script)
  window.adsbygoogle = window.adsbygoogle ?? []
  window.__rdtAdsReady = true
}
