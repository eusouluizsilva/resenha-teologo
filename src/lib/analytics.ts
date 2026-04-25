// Camada de analítica do cliente. Responsabilidades:
// 1. Carregar (ou não) o gtag.js do GA4 conforme env var e consentimento LGPD.
// 2. Fornecer wrappers tipados para pageview e ad_impression.
// 3. Gerar/ler um sessionId estável por aba (usado para deduplicar impressões
//    no Convex e correlacionar eventos no GA4).
//
// Não tem dependência de Convex nem de React: chamadas a Convex acontecem nos
// componentes (RouteTracker, AdSlot) usando useMutation. Aqui é só o lado GA4.

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
  return Boolean(GA_ID) && readConsent() === 'all'
}

export function initGA4(): void {
  if (typeof window === 'undefined') return
  if (window.__rdtGAReady) return
  if (!GA_ID) {
    console.debug('[analytics] VITE_GA4_MEASUREMENT_ID ausente, GA4 desativado')
    return
  }
  if (readConsent() !== 'all') return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  // send_page_view: false porque os pageviews são disparados manualmente
  // pelo RouteTracker (SPA com client-side routing).
  window.gtag('config', GA_ID, { send_page_view: false })
  window.__rdtGAReady = true
}

export function disableAnalytics(): void {
  if (typeof window === 'undefined' || !GA_ID) return
  ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true
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
