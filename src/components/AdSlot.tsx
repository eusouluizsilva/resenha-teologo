import { useEffect, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
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

// Renderiza um <ins class="adsbygoogle"> respeitando: premium gate, env var,
// consentimento LGPD. Usa IntersectionObserver para registrar impressão no
// Convex (atribuída ao creatorId) só quando o slot entra na viewport pela
// primeira vez. Dedup ocorre server-side via index by_session_slot.

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
  const [shouldRender, setShouldRender] = useState(false)
  const logImpression = useMutation(api.analytics.logAdImpression)

  const publisherId = getAdSensePublisherId()
  const enabled = isAdSenseEnabled()

  // Re-checa habilitação após montar (consent pode ter sido aceito agora,
  // disparando rdt:consent-change).
  useEffect(() => {
    if (isPremium) {
      setShouldRender(false)
      return
    }
    setShouldRender(enabled)
    const onConsent = () => setShouldRender(isAdSenseEnabled())
    window.addEventListener('rdt:consent-change', onConsent)
    return () => window.removeEventListener('rdt:consent-change', onConsent)
  }, [enabled, isPremium])

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
      style={{ display: 'block' }}
      data-ad-client={publisherId}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  )
}
