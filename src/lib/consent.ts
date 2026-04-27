// Camada central de Google Consent Mode v2.
//
// Por que centralizar: AdSense, GA4 e qualquer outro tag do Google leem o
// consent state via window.dataLayer/gtag. O default precisa ser configurado
// UMA VEZ, antes de qualquer script externo carregar. Antes deste módulo, o
// initGA4 fazia isso, mas se VITE_GA4_MEASUREMENT_ID estivesse ausente, nada
// seria configurado e o AdSense rodaria sem Consent Mode.
//
// Em modo 'denied', o AdSense ainda serve anúncios não-personalizados (NPA)
// e o GA4 ainda envia pings agregados (Consent Mode v2 anonymous pings).
// Isso significa monetização e medição preservadas mesmo sem cookies, em
// conformidade com LGPD/GDPR.

const CONSENT_KEY = 'rdt_cookie_consent_v1'

type ConsentChoice = 'all' | 'essential'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __rdtConsentReady?: boolean
  }
}

export function readConsentChoice(): ConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { choice?: ConsentChoice }
    return parsed?.choice ?? null
  } catch {
    return null
  }
}

function consentParamsFor(choice: ConsentChoice | null) {
  if (choice === 'all') {
    return {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    }
  }
  return {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
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
  const stored = readConsentChoice()
  if (stored) {
    window.gtag('consent', 'update', consentParamsFor(stored))
  }

  window.__rdtConsentReady = true
}

// Atualiza o consent state. Chamada pelo CookieBanner via evento
// 'rdt:consent-change' (que main.tsx escuta).
export function applyCurrentConsent(): void {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('consent', 'update', consentParamsFor(readConsentChoice()))
}
