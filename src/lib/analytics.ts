// Camada de analítica do cliente (GA4 + Google Consent Mode v2).
//
// Estratégia LGPD: carregamos o gtag.js logo no boot com consent default
// 'denied'. Nesse modo, o GA4 continua enviando pings agregados (sem cookies,
// sem ID de cliente), o que nos permite medir tráfego anônimo mesmo de quem
// fechou o banner sem aceitar. Quando o usuário clica "Aceitar todos" no
// CookieBanner, fazemos consent update 'granted' e a partir daí passa a haver
// coleta completa com cookies.
//
// Antes desta versão, o gtag.js só carregava após "Aceitar todos", o que
// resultava em 0 eventos no GA4 mesmo com tráfego real (a maioria fecha o
// banner sem interagir).

const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined
const CONSENT_KEY = 'rdt_cookie_consent_v1'
const SESSION_KEY = 'rdt_session_id'

type ConsentChoice = 'all' | 'essential'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __rdtGAReady?: boolean
  }
}

function readConsent(): ConsentChoice | null {
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

// Mapeia escolha do usuário para os flags do Consent Mode v2 do Google.
// 'all' libera cookies de analytics e ads. Qualquer outra coisa (essential ou
// banner não interagido) mantém negado, mas o GA4 ainda coleta pings agregados.
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

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return `mem_${Date.now()}`
  }
}

export function isAnalyticsEnabled(): boolean {
  // Com Consent Mode v2, GA4 está sempre ativo se a env var existir; o que
  // muda é se a coleta tem cookies (consent='all') ou é agregada (default).
  return Boolean(GA_ID)
}

export function initGA4(): void {
  if (typeof window === 'undefined') return
  if (!GA_ID) {
    console.debug('[analytics] VITE_GA4_MEASUREMENT_ID ausente, GA4 desativado')
    return
  }

  // Idempotente: se já carregou, apenas reaplica o consent atual. Isso permite
  // que o listener de 'rdt:consent-change' chame initGA4() de novo após o
  // usuário interagir com o banner.
  if (window.__rdtGAReady) {
    window.gtag?.('consent', 'update', consentParamsFor(readConsent()))
    return
  }

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }

  // ORDEM IMPORTA: o consent default precisa ir antes do gtag('config', ...)
  // para o GA4 inicializar já em modo Consent Mode v2.
  window.gtag('consent', 'default', {
    ...consentParamsFor(null),
    wait_for_update: 500,
  })
  // Se o usuário já tinha escolhido em sessão anterior, aplica antes do config.
  const stored = readConsent()
  if (stored) {
    window.gtag('consent', 'update', consentParamsFor(stored))
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  // send_page_view: false porque os pageviews são disparados manualmente
  // pelo RouteTracker (SPA com client-side routing).
  window.gtag('config', GA_ID, { send_page_view: false })
  window.__rdtGAReady = true
}

type PageViewParams = {
  path: string
  creatorId?: string
  courseId?: string
  lessonId?: string
}

export function trackPageView({ path, creatorId, courseId, lessonId }: PageViewParams): void {
  if (typeof window === 'undefined' || !window.__rdtGAReady || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    creator_id: creatorId,
    course_id: courseId,
    lesson_id: lessonId,
  })
}

type AdImpressionParams = {
  slotId: string
  creatorId: string
  page: string
  courseId?: string
  lessonId?: string
}

export function trackAdImpression(params: AdImpressionParams): void {
  if (typeof window === 'undefined' || !window.__rdtGAReady || !window.gtag) return
  window.gtag('event', 'ad_impression', {
    slot_id: params.slotId,
    creator_id: params.creatorId,
    course_id: params.courseId,
    lesson_id: params.lessonId,
    page: params.page,
  })
}
