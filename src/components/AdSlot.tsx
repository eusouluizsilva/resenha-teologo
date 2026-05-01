import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useIsPremium } from '../lib/useIsPremium'
import { getSessionId, trackAdImpression } from '../lib/analytics'
import { getAdSensePublisherId, isAdSenseEnabled } from '../lib/ads'

type AdSlotProps = {
  slotId: string
  creatorId?: string
  courseId?: Id<'courses'>
  lessonId?: Id<'lessons'>
  format?: 'auto' | 'fluid'
  responsive?: boolean
  className?: string
}

// Renderiza um <ins class="adsbygoogle"> respeitando premium gate e env var.
// Com Consent Mode v2, o gate de consent foi removido daqui: o adsbygoogle.js
// sempre carrega se o PUB_ID existir, e o Google decide servir personalized
// ou NPA (non-personalized ads) baseado no consent state do gtag. Isso permite
// monetização mesmo sem "Aceitar todos" no banner de cookies.
//
// Usa IntersectionObserver para registrar impressão no Convex (atribuída ao
// creatorId) só quando o slot entra na viewport pela primeira vez. Dedup
// ocorre server-side via index by_session_slot.

export function AdSlot({
  slotId,
  creatorId,
  courseId,
  lessonId,
  format = 'auto',
  responsive = true,
  className,
}: AdSlotProps) {
  const isPremium = useIsPremium()
  const insRef = useRef<HTMLModElement | null>(null)
  const reportedRef = useRef(false)
  const logImpression = useMutation(api.analytics.logAdImpression)

  const publisherId = getAdSensePublisherId()
  const enabled = isAdSenseEnabled()
  // Derivado dos props, sem state intermediário. O useEffect+setState anterior
  // causava render extra e era anti-pattern (ESLint react-hooks/set-state-in-effect).
  const shouldRender = !isPremium && enabled

  // Inicializa o slot do AdSense.
  useEffect(() => {
    if (!shouldRender) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle ?? []).push({})
    } catch {
      /* AdSense ainda não carregou ou ad-blocker ativo, silencioso */
    }
  }, [shouldRender])

  // Observa viewport para registrar impressão atribuída ao criador.
  useEffect(() => {
    if (!shouldRender || !creatorId || !insRef.current) return
    const node = insRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !reportedRef.current) {
            reportedRef.current = true
            const sessionId = getSessionId()
            const page =
              typeof window !== 'undefined' ? window.location.pathname : '/'
            trackAdImpression({ slotId, creatorId, courseId, lessonId, page })
            logImpression({ slotId, creatorId, courseId, lessonId, page, sessionId }).catch(
              () => {
                /* falha silenciosa, não atrapalha o ad */
              }
            )
            observer.disconnect()
          }
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldRender, creatorId, courseId, lessonId, slotId, logImpression])

  if (!shouldRender || !publisherId) return null

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className ?? ''}`.trim()}
      // min-height reservado pra reduzir CLS enquanto o AdSense decide o
      // tamanho do criativo. Se o ad não preencher, o slot continua com o
      // espaço (in: AdSense pode colapsar via collapseEmptyDivs).
      style={{ display: 'block', minHeight: 90 }}
      data-ad-client={publisherId}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  )
}
