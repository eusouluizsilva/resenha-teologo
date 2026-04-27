// GA4 + tracking de pageviews/ad impressions.
//
// O consent default vem de src/lib/consent.ts (initConsent), que precisa rodar
// ANTES desta função. Aqui só carregamos o gtag.js externo e configuramos o
// stream do GA4. Em modo 'denied' o GA4 ainda envia pings agregados (Consent
// Mode v2). Em 'granted' coleta normal com cookies.

import { initConsent } from './consent'

const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined
const SESSION_KEY = 'rdt_session_id'

declare global {
  interface Window {
    __rdtGAReady?: boolean
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
  // Com Consent Mode v2 sempre ativo se GA_ID existir; cookies dependem do
  // consent state que o gtag gerencia automaticamente.
  return Boolean(GA_ID)
}

export function initGA4(): void {
  if (typeof window === 'undefined') return
  if (window.__rdtGAReady) return
  if (!GA_ID) {
    console.debug('[analytics] VITE_GA4_MEASUREMENT_ID ausente, GA4 desativado')
    return
  }

  // Garante consent default antes do gtag.js carregar.
  initConsent()

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.gtag!('js', new Date())
  // send_page_view: false porque os pageviews são disparados manualmente
  // pelo RouteTracker (SPA com client-side routing).
  window.gtag!('config', GA_ID, { send_page_view: false })
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
