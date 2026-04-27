// Camada central de Google Consent Mode v2.
//
// Por que centralizar: AdSense, GA4 e qualquer outro tag do Google leem o
// consent state via window.dataLayer/gtag. O default precisa ser configurado
// UMA VEZ, antes de qualquer script externo carregar.
//
// Estratégia de defaults (sem GTM, Consent Mode v2 básico):
// - analytics_storage = 'granted' por padrão. Sem GTM, o modo básico NÃO envia
//   pings modelados quando denied; nesse cenário GA4 fica zerado. Optamos por
//   medir tráfego desde o primeiro tick e respeitar opt-out explícito do
//   usuário (botão "Apenas essenciais" passa para denied).
// - ad_storage / ad_user_data / ad_personalization = 'denied' por padrão.
//   AdSense serve apenas NPA até o usuário aceitar todos. Isso preserva LGPD
//   compliance no que diz respeito a publicidade comportamental.

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
  if (choice === 'essential') {
    return {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    }
  }
  // Default (sem escolha registrada): analytics medindo desde o primeiro tick,
  // anúncios sem personalização até o usuário aceitar todos.
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
