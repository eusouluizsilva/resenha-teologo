// Camada central de Google Consent Mode v2.
//
// Por que centralizar: AdSense, GA4 e qualquer outro tag do Google leem o
// consent state via window.dataLayer/gtag. O default precisa ser configurado
// UMA VEZ, antes de qualquer script externo carregar.
//
// Modelo de armazenamento (v2): granular por categoria.
//   { ad: boolean, analytics: boolean, at: number, v: 2 }
// "ad" controla ad_storage + ad_user_data + ad_personalization.
// "analytics" controla analytics_storage.
//
// Compatibilidade v1 (formato antigo: { choice: 'all' | 'essential' }):
//   'all'       -> { ad: true,  analytics: true  }
//   'essential' -> { ad: false, analytics: false }
//
// Estratégia de defaults (sem GTM, Consent Mode v2 básico):
// - analytics_storage = 'granted' por padrão. Sem GTM, o modo básico NÃO envia
//   pings modelados quando denied; nesse cenário GA4 fica zerado. Optamos por
//   medir tráfego desde o primeiro tick e respeitar opt-out explícito do
//   usuário.
// - ad_storage / ad_user_data / ad_personalization = 'denied' por padrão.
//   AdSense serve apenas NPA até o usuário aceitar. LGPD-compliant.

const CONSENT_KEY = 'rdt_cookie_consent_v1'

export type ConsentState = {
  ad: boolean
  analytics: boolean
  at: number
  v: 2
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __rdtConsentReady?: boolean
  }
}

export function readConsentState(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      v?: number
      ad?: boolean
      analytics?: boolean
      at?: number
      choice?: 'all' | 'essential'
    }
    if (parsed?.v === 2 && typeof parsed.ad === 'boolean' && typeof parsed.analytics === 'boolean') {
      return { ad: parsed.ad, analytics: parsed.analytics, at: parsed.at ?? Date.now(), v: 2 }
    }
    if (parsed?.choice === 'all') {
      return { ad: true, analytics: true, at: parsed.at ?? Date.now(), v: 2 }
    }
    if (parsed?.choice === 'essential') {
      return { ad: false, analytics: false, at: parsed.at ?? Date.now(), v: 2 }
    }
    return null
  } catch {
    return null
  }
}

export function writeConsentState(next: { ad: boolean; analytics: boolean }): void {
  if (typeof window === 'undefined') return
  try {
    const payload: ConsentState = { ad: next.ad, analytics: next.analytics, at: Date.now(), v: 2 }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload))
  } catch {
    /* silencioso */
  }
  try {
    window.dispatchEvent(
      new CustomEvent('rdt:consent-change', {
        detail: { ad: next.ad, analytics: next.analytics },
      }),
    )
  } catch {
    /* silencioso */
  }
}

function consentParamsFor(state: ConsentState | null) {
  if (state) {
    return {
      ad_storage: state.ad ? 'granted' : 'denied',
      ad_user_data: state.ad ? 'granted' : 'denied',
      ad_personalization: state.ad ? 'granted' : 'denied',
      analytics_storage: state.analytics ? 'granted' : 'denied',
    }
  }
  // Default (sem escolha registrada): analytics medindo desde o primeiro tick,
  // anúncios sem personalização até o usuário aceitar.
  return {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  }
}

// Inicializa dataLayer + gtag stub e define consent default. Idempotente.
// Deve ser chamada antes de qualquer script externo do Google (gtag.js,
// adsbygoogle.js) carregar, para que esses scripts respeitem o consent state
// desde o primeiro tick.
export function initConsent(): void {
  if (typeof window === 'undefined') return
  if (window.__rdtConsentReady) return

  window.dataLayer = window.dataLayer ?? []
  window.gtag =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }

  window.gtag('consent', 'default', {
    ...consentParamsFor(null),
    wait_for_update: 500,
  })

  // Se o usuário já tinha aceitado antes (sessão anterior), aplica imediatamente
  // para que scripts carregados em seguida vejam o consent correto.
  const stored = readConsentState()
  if (stored) {
    window.gtag('consent', 'update', consentParamsFor(stored))
  }

  window.__rdtConsentReady = true
}

// Atualiza o consent state. Chamada pelo CookieBanner via evento
// 'rdt:consent-change' (que main.tsx escuta).
export function applyCurrentConsent(): void {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('consent', 'update', consentParamsFor(readConsentState()))
}

// Helper para módulos que precisam saber se podem fazer tracking de ads
// (Meta Pixel, por exemplo, usa cookies de ads).
export function isAdConsentGranted(): boolean {
  return readConsentState()?.ad === true
}
