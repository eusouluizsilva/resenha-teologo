import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useAction } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { cn } from '@/lib/brand'
import {
  BIBLE_BOOKS,
  formatVerseReference,
  getBibleBook,
  type BibleTestament,
} from '@/lib/bible/books'
import {
  BIBLE_SOURCES,
  DEFAULT_BIBLE_SOURCE_ID,
  getBibleSource,
  type BibleSource,
} from '@/lib/bible/translations'
import { BiblePanel, type BiblePanelInitialRef } from '@/components/BiblePanel'
import { fetchChapter, type BibleVerse } from '@/lib/bible/api'
import { DonateButton } from '@/components/donate/DonateButton'
import { FlashcardsLessonSection } from '@/components/aula/FlashcardsLessonSection'
import { CourseInDevelopmentNotice } from '@/components/aula/CourseInDevelopmentNotice'

// ─── YouTube Player ───────────────────────────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string
          playerVars: Record<string, number | string>
          events: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number; target: YTPlayer }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  getCurrentTime: () => number
  getDuration: () => number
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  destroy: () => void
  setPlaybackRate: (rate: number) => void
  getPlaybackRate: () => number
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
const PLAYBACK_RATE_STORAGE_KEY = 'rdt_player_rate'

function readSavedPlaybackRate(): number {
  if (typeof window === 'undefined') return 1
  const raw = window.localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY)
  const n = raw ? Number(raw) : NaN
  return PLAYBACK_RATES.includes(n as (typeof PLAYBACK_RATES)[number]) ? n : 1
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// Limiar de conclusão alinhado ao backend (COMPLETION_RATIO em convex/student.ts).
const COMPLETION_RATIO = 0.95

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function VideoPlayer({
  youtubeUrl,
  initialWatched,
  totalSeconds,
  onProgress,
  onComplete,
  resetKey,
  playerHandleRef,
}: {
  youtubeUrl: string
  initialWatched: number
  totalSeconds: number
  onProgress: (watched: number, total: number) => void
  onComplete: () => void
  // resetKey muda quando o aluno pede retry (watchedSeconds zerado). Força
  // remontagem do player para ignorar o progresso antigo em memória.
  resetKey: string | number
  // Ref exposto ao parent para consultar o tempo atual e saltar para um
  // timestamp específico (usado pelas anotações por momento).
  playerHandleRef?: React.MutableRefObject<YTPlayer | null>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const overlayHideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blockToastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialWatchedRef = useRef(initialWatched)
  const maxWatchedRef = useRef(initialWatched)
  const completedRef = useRef(false)
  const isPlayingRef = useRef(false)
  const barRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialWatched)
  const [duration, setDuration] = useState(totalSeconds)
  const [maxWatched, setMaxWatched] = useState(initialWatched)
  const [overlayVisible, setOverlayVisible] = useState(true)
  const [blockToast, setBlockToast] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(() => readSavedPlaybackRate())

  const videoId = extractYouTubeId(youtubeUrl)

  const showOverlayTemporarily = useCallback(() => {
    setOverlayVisible(true)
    if (overlayHideRef.current) clearTimeout(overlayHideRef.current)
    if (isPlayingRef.current) {
      overlayHideRef.current = setTimeout(() => setOverlayVisible(false), 2500)
    }
  }, [])

  const flashBlockToast = useCallback(() => {
    setBlockToast(true)
    if (blockToastRef.current) clearTimeout(blockToastRef.current)
    blockToastRef.current = setTimeout(() => setBlockToast(false), 2500)
  }, [])

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !videoId) return
    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }

    const div = document.createElement('div')
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(div)

    playerRef.current = new window.YT.Player(div, {
      videoId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        start: Math.floor(initialWatchedRef.current),
      },
      events: {
        onReady: (e) => {
          if (playerHandleRef) playerHandleRef.current = e.target
          const d = e.target.getDuration()
          if (d > 0) setDuration(d)
          const saved = readSavedPlaybackRate()
          if (saved !== 1) {
            try {
              e.target.setPlaybackRate(saved)
            } catch {
              // ignora — algumas instancias do YT.Player ainda nao expuseram
              // setPlaybackRate quando onReady dispara em conexoes lentas.
            }
          }
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) {
            isPlayingRef.current = true
            setIsPlaying(true)
            startTracking()
            startTick()
            // some o overlay automaticamente quando começa a tocar
            if (overlayHideRef.current) clearTimeout(overlayHideRef.current)
            overlayHideRef.current = setTimeout(() => setOverlayVisible(false), 1500)
          } else {
            isPlayingRef.current = false
            setIsPlaying(false)
            stopTracking()
            stopTick()
            // pausado: mantém overlay visível
            setOverlayVisible(true)
            if (overlayHideRef.current) {
              clearTimeout(overlayHideRef.current)
              overlayHideRef.current = null
            }
          }
          if (e.data === window.YT.PlayerState.ENDED) {
            handleComplete()
          }
        },
      },
    })
  }, [videoId, playerHandleRef])

  function startTick() {
    if (tickRef.current) return
    tickRef.current = setInterval(() => {
      if (!playerRef.current) return
      const t = playerRef.current.getCurrentTime()
      const d = playerRef.current.getDuration()
      if (d > 0 && d !== duration) setDuration(d)
      // anti-skip imediato: se passou de maxWatched + 10, reverte
      if (t > maxWatchedRef.current + 10) {
        playerRef.current.seekTo(maxWatchedRef.current, true)
        flashBlockToast()
        setCurrentTime(maxWatchedRef.current)
        return
      }
      if (t > maxWatchedRef.current) {
        maxWatchedRef.current = t
        setMaxWatched(t)
      }
      setCurrentTime(t)
    }, 250)
  }

  function stopTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  function startTracking() {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return
      const current = playerRef.current.getCurrentTime()
      const dur = playerRef.current.getDuration() || totalSeconds

      if (current > maxWatchedRef.current + 10) {
        playerRef.current.seekTo(maxWatchedRef.current, true)
        return
      }

      maxWatchedRef.current = Math.max(maxWatchedRef.current, current)
      onProgress(Math.floor(maxWatchedRef.current), Math.floor(dur))

      if (
        !completedRef.current &&
        dur > 0 &&
        maxWatchedRef.current / dur >= COMPLETION_RATIO
      ) {
        handleComplete()
      }
    }, 3000)
  }

  function stopTracking() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function handleComplete() {
    if (completedRef.current) return
    completedRef.current = true
    stopTracking()
    onComplete()
  }

  function togglePlay() {
    if (!playerRef.current) return
    if (isPlayingRef.current) playerRef.current.pauseVideo()
    else playerRef.current.playVideo()
  }

  // Pula 10s para tras (sempre permitido). Se o aluno apertar 'J' no teclado,
  // recua dentro do que ja foi assistido. Nao mexe em maxWatched.
  function seekRelative(deltaSeconds: number) {
    if (!playerRef.current) return
    const now = playerRef.current.getCurrentTime()
    const next = Math.max(0, now + deltaSeconds)
    if (deltaSeconds > 0 && next > maxWatchedRef.current + 1) {
      flashBlockToast()
      return
    }
    const clamped = Math.min(next, maxWatchedRef.current)
    playerRef.current.seekTo(clamped, true)
    setCurrentTime(clamped)
  }

  function cyclePlaybackRate() {
    if (!playerRef.current) return
    const idx = PLAYBACK_RATES.indexOf(playbackRate as (typeof PLAYBACK_RATES)[number])
    const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length]
    setPlaybackRate(next)
    try {
      playerRef.current.setPlaybackRate(next)
    } catch {
      // ignora
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, String(next))
    }
  }

  function seekFromPointer(clientX: number) {
    if (!barRef.current || !playerRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const target = ratio * (duration || totalSeconds || 1)
    if (target > maxWatchedRef.current + 1) {
      flashBlockToast()
      return
    }
    const clamped = Math.max(0, Math.min(target, maxWatchedRef.current))
    playerRef.current.seekTo(clamped, true)
    setCurrentTime(clamped)
  }

  function onBarPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    isDraggingRef.current = true
    barRef.current?.setPointerCapture(e.pointerId)
    seekFromPointer(e.clientX)
  }

  function onBarPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return
    seekFromPointer(e.clientX)
  }

  function onBarPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    isDraggingRef.current = false
    barRef.current?.releasePointerCapture(e.pointerId)
  }

  useEffect(() => {
    initialWatchedRef.current = initialWatched
    maxWatchedRef.current = initialWatched
    setMaxWatched(initialWatched)
    setCurrentTime(initialWatched)
    completedRef.current = false

    if (window.YT?.Player) {
      initPlayer()
    } else {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      stopTracking()
      stopTick()
      if (overlayHideRef.current) clearTimeout(overlayHideRef.current)
      if (blockToastRef.current) clearTimeout(blockToastRef.current)
      playerRef.current?.destroy()
      if (playerHandleRef) playerHandleRef.current = null
    }
    // resetKey intencional: força reinicialização do player quando o progresso
    // é zerado (retry de quiz) ou a aula muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initPlayer, resetKey])

  // Atalhos de teclado: espaco/K = play/pause; J = -10s; L = +10s; setas = +/-5s.
  // Ignora se o foco estiver em campo de texto (nota, comentario etc.).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        togglePlay()
        showOverlayTemporarily()
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        seekRelative(-10)
        showOverlayTemporarily()
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        seekRelative(10)
        showOverlayTemporarily()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekRelative(-5)
        showOverlayTemporarily()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekRelative(5)
        showOverlayTemporarily()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gray-900 text-gray-500">
        <p className="text-sm">URL de video invalida</p>
      </div>
    )
  }

  const safeDuration = duration > 0 ? duration : totalSeconds || 1
  const playedPct = Math.min(100, (currentTime / safeDuration) * 100)
  const allowedPct = Math.min(100, (maxWatched / safeDuration) * 100)

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video shadow-2xl"
      onMouseMove={showOverlayTemporarily}
      onMouseEnter={showOverlayTemporarily}
      onTouchStart={showOverlayTemporarily}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 [&>div]:h-full [&>div]:w-full [&>iframe]:h-full [&>iframe]:w-full"
      />

      {/* Camada que cobre o iframe e captura o clique para play/pause sem
          deixar o usuário interagir com a UI nativa do YouTube. */}
      <button
        type="button"
        onClick={togglePlay}
        className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
      />

      {/* Toast de bloqueio: aparece quando o aluno tenta adiantar */}
      {blockToast && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Você não pode adiantar a aula. Continue assistindo para liberar.
        </div>
      )}

      {/* Overlay de controles: bottom bar com play/pause + scrubber + tempo */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-3 pt-10 transition-opacity motion-reduce:transition-none',
          overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Barra (scrubber) */}
        <div
          ref={barRef}
          onPointerDown={onBarPointerDown}
          onPointerMove={onBarPointerMove}
          onPointerUp={onBarPointerUp}
          onPointerCancel={onBarPointerUp}
          className="group relative h-2 w-full cursor-pointer touch-none"
        >
          {/* trilho */}
          <div className="absolute inset-y-0 left-0 right-0 my-auto h-1 rounded-full bg-white/25" />
          {/* parte liberada (até maxWatched) */}
          <div
            className="absolute inset-y-0 left-0 my-auto h-1 rounded-full bg-[#F37E20]/40"
            style={{ width: `${allowedPct}%` }}
          />
          {/* progresso atual */}
          <div
            className="absolute inset-y-0 left-0 my-auto h-1 rounded-full bg-[#F37E20]"
            style={{ width: `${playedPct}%` }}
          />
          {/* handle */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-[#F37E20] shadow-md transition-transform group-hover:scale-125"
            style={{ left: `${playedPct}%` }}
          />
        </div>

        {/* Linha inferior: play/pause + tempo */}
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-white">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cyclePlaybackRate}
              className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/90 transition-colors hover:bg-white/20"
              aria-label="Alterar velocidade de reprodução"
              title="Velocidade"
            >
              {playbackRate}x
            </button>
            <span className="tabular-nums tracking-wide text-white/90">
              {formatClock(currentTime)} / {formatClock(safeDuration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Versículos ───────────────────────────────────────────────────────────────

type VerseRef = {
  bookSlug: string
  chapter: number
  verseStart: number
  verseEnd: number
  testament: BibleTestament
}

const MAX_INLINE_VERSES = 6

function VerseCard({
  refData,
  source,
  onOpenInPanel,
}: {
  refData: VerseRef
  source: BibleSource
  onOpenInPanel: (ref: VerseRef) => void
}) {
  const book = getBibleBook(refData.bookSlug)
  const label = formatVerseReference(refData)
  const compatible = source.testaments.includes(refData.testament)
  const bibleGatewayVersion = source.bibleGatewayVersion
  const searchRef = book
    ? `${book.name} ${refData.chapter}:${refData.verseStart}${
        refData.verseEnd !== refData.verseStart ? `-${refData.verseEnd}` : ''
      }`
    : label
  const bibleGatewayHref = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(searchRef)}&version=${encodeURIComponent(bibleGatewayVersion)}`

  const [verses, setVerses] = useState<BibleVerse[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!compatible) return
    let cancelled = false
    setLoading(true)
    setFetchError(false)
    setExpanded(false)
    fetchChapter({
      sourceId: source.id,
      bookSlug: refData.bookSlug,
      chapter: refData.chapter,
    })
      .then((data) => {
        if (cancelled) return
        const filtered = data.filter(
          (v) => v.verse >= refData.verseStart && v.verse <= refData.verseEnd
        )
        setVerses(filtered)
      })
      .catch(() => {
        if (cancelled) return
        setFetchError(true)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [compatible, source.id, refData.bookSlug, refData.chapter, refData.verseStart, refData.verseEnd])

  const visibleVerses = useMemo(() => {
    if (!verses) return []
    if (expanded || verses.length <= MAX_INLINE_VERSES) return verses
    return verses.slice(0, MAX_INLINE_VERSES)
  }, [verses, expanded])

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-display text-sm font-semibold text-gray-800 truncate">
          {label}
        </span>
        <span
          className={cn(
            'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            compatible
              ? 'bg-[#F37E20]/10 text-[#F37E20]'
              : 'bg-gray-100 text-gray-400'
          )}
        >
          {source.label}
        </span>
      </div>

      {!compatible ? (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            {source.label} não cobre este testamento. Escolha outra tradução
            para ver o texto.
          </p>
        </div>
      ) : loading ? (
        <div className="border-t border-gray-100 px-4 py-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-gray-100" />
        </div>
      ) : fetchError || !verses ? (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            Não foi possível carregar o texto agora.
          </p>
          <a
            href={bibleGatewayHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#F37E20] hover:underline"
          >
            Abrir no BibleGateway
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M7.5 16.5L21 3m0 0h-4.875M21 3v4.875" />
            </svg>
          </a>
        </div>
      ) : verses.length === 0 ? (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            Versículo não encontrado nesta tradução.
          </p>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-sm leading-7 text-gray-700 font-serif">
            {visibleVerses.map((v, idx) => (
              <span key={v.pk}>
                <sup className="mr-1 text-[10px] font-semibold text-[#F37E20] align-super">
                  {v.verse}
                </sup>
                {v.text}
                {idx < visibleVerses.length - 1 && ' '}
              </span>
            ))}
          </p>
          {verses.length > MAX_INLINE_VERSES && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-2 text-xs font-semibold text-[#F37E20] hover:underline"
            >
              Mostrar tudo ({verses.length - MAX_INLINE_VERSES} a mais)
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenInPanel(refData)}
            className="mt-2 ml-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#F37E20]"
          >
            Abrir capítulo no painel
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function VersesSection({
  versesRefs,
  onOpenInPanel,
}: {
  versesRefs: VerseRef[]
  onOpenInPanel: (ref: VerseRef) => void
}) {
  const [sourceId, setSourceId] = useState(DEFAULT_BIBLE_SOURCE_ID)

  const source = getBibleSource(sourceId) ?? BIBLE_SOURCES[0]

  const sortedRefs = useMemo(() => {
    const order = new Map(BIBLE_BOOKS.map((b, i) => [b.slug, i]))
    return [...versesRefs].sort((a, b) => {
      const ai = order.get(a.bookSlug) ?? 999
      const bi = order.get(b.bookSlug) ?? 999
      if (ai !== bi) return ai - bi
      if (a.chapter !== b.chapter) return a.chapter - b.chapter
      return a.verseStart - b.verseStart
    })
  }, [versesRefs])

  if (versesRefs.length === 0) return null

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-gray-800">
              Versículos citados
            </h2>
            <p className="text-xs text-gray-500">
              {sortedRefs.length} referência
              {sortedRefs.length !== 1 ? 's' : ''} nesta aula.
            </p>
          </div>
        </div>

        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
        >
          {BIBLE_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sortedRefs.map((ref, i) => (
          <VerseCard
            key={`${ref.bookSlug}-${ref.chapter}-${ref.verseStart}-${ref.verseEnd}-${i}`}
            refData={ref}
            source={source}
            onOpenInPanel={onOpenInPanel}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Anotações por momento ────────────────────────────────────────────────────

function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function TimestampNotesSection({
  lessonId,
  playerHandleRef,
}: {
  lessonId: Id<'lessons'>
  playerHandleRef: React.MutableRefObject<YTPlayer | null>
}) {
  const entries = useQuery(api.lessonTimestamps.listMyByLesson, { lessonId })
  const create = useMutation(api.lessonTimestamps.create)
  const update = useMutation(api.lessonTimestamps.update)
  const remove = useMutation(api.lessonTimestamps.remove)

  const [note, setNote] = useState('')
  const [capturedSeconds, setCapturedSeconds] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<Id<'lessonTimestamps'> | null>(null)
  const [editingText, setEditingText] = useState('')

  function handleCapture() {
    const p = playerHandleRef.current
    if (!p) return
    const current = p.getCurrentTime()
    setCapturedSeconds(Math.floor(current))
  }

  async function handleSave() {
    if (saving) return
    if (capturedSeconds === null) {
      handleCapture()
      return
    }
    if (!note.trim()) return
    setSaving(true)
    try {
      await create({ lessonId, timestampSeconds: capturedSeconds, note: note.trim() })
      setNote('')
      setCapturedSeconds(null)
    } finally {
      setSaving(false)
    }
  }

  function handleJump(seconds: number) {
    const p = playerHandleRef.current
    if (!p) return
    p.seekTo(seconds, true)
    p.playVideo()
  }

  async function handleDelete(id: Id<'lessonTimestamps'>) {
    if (!window.confirm('Remover esta anotação?')) return
    await remove({ id })
  }

  async function handleSaveEdit(id: Id<'lessonTimestamps'>) {
    if (!editingText.trim()) return
    await update({ id, note: editingText.trim() })
    setEditingId(null)
    setEditingText('')
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">Anotações por momento</h2>
          <p className="text-xs text-gray-500">
            Marque trechos específicos do vídeo com uma observação. Clique depois para voltar àquele ponto.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCapture}
            className="flex items-center gap-1.5 rounded-full border border-[#F37E20]/40 bg-[#F37E20]/8 px-3 py-1.5 text-xs font-bold text-[#F37E20] hover:bg-[#F37E20]/12"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {capturedSeconds === null ? 'Marcar este momento' : `Capturado em ${formatTimestamp(capturedSeconds)}`}
          </button>
          {capturedSeconds !== null && (
            <button
              type="button"
              onClick={() => setCapturedSeconds(null)}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Limpar
            </button>
          )}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="O que você quer anotar sobre este momento?"
          maxLength={1000}
          className="mt-3 min-h-[70px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{note.length} / 1.000</span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !note.trim() || capturedSeconds === null}
            className="rounded-xl bg-[#F37E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar anotação'}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {entries === undefined ? (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-xs text-gray-400">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
            Carregando anotações...
          </div>
        ) : entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-xs text-gray-400">
            Nenhuma anotação ainda. Marque momentos importantes do vídeo enquanto estuda.
          </p>
        ) : (
          entries.map((entry) => {
            const isEditing = editingId === entry._id
            return (
              <div key={entry._id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleJump(entry.timestampSeconds)}
                    className="flex-shrink-0 rounded-lg bg-[#F37E20]/10 px-3 py-1.5 text-xs font-bold text-[#F37E20] hover:bg-[#F37E20]/15"
                  >
                    {formatTimestamp(entry.timestampSeconds)}
                  </button>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          maxLength={1000}
                          className="min-h-[60px] w-full rounded-lg border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(entry._id)}
                            className="rounded-lg bg-[#F37E20] px-3 py-1 text-xs font-bold text-white hover:bg-[#e06e10]"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setEditingText('')
                            }}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{entry.note}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(entry._id)
                              setEditingText(entry.note)
                            }}
                            className="font-semibold hover:text-[#F37E20]"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry._id)}
                            className="font-semibold hover:text-red-500"
                          >
                            Remover
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

// ─── Perguntas privadas ao professor ─────────────────────────────────────────

function PrivateQuestionsSection({
  courseId,
  lessonId,
  isCreator,
}: {
  courseId: Id<'courses'>
  lessonId: Id<'lessons'>
  isCreator: boolean
}) {
  const entries = useQuery(
    api.courseQuestions.listMyByCourse,
    isCreator ? 'skip' : { courseId }
  )
  const ask = useMutation(api.courseQuestions.ask)
  const edit = useMutation(api.courseQuestions.editQuestion)
  const remove = useMutation(api.courseQuestions.remove)

  const [question, setQuestion] = useState('')
  const [saving, setSaving] = useState(false)
  const [attachToLesson, setAttachToLesson] = useState(true)
  const [editingId, setEditingId] = useState<Id<'courseQuestions'> | null>(null)
  const [editingText, setEditingText] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isCreator) return null

  async function handleAsk() {
    if (saving || !question.trim()) return
    setSaving(true)
    setError(null)
    try {
      await ask({
        courseId,
        lessonId: attachToLesson ? lessonId : undefined,
        question: question.trim(),
      })
      setQuestion('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a pergunta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit(id: Id<'courseQuestions'>) {
    if (!editingText.trim()) return
    setError(null)
    try {
      await edit({ id, question: editingText.trim() })
      setEditingId(null)
      setEditingText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar a edição.')
    }
  }

  async function handleDelete(id: Id<'courseQuestions'>) {
    if (!window.confirm('Remover esta pergunta?')) return
    setError(null)
    try {
      await remove({ id })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível remover a pergunta.')
    }
  }

  const lessonEntries = (entries ?? []).filter((e) => e.lessonId === lessonId)
  const otherEntries = (entries ?? []).filter((e) => e.lessonId !== lessonId)

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h.01M15.75 8.25h.01M8.25 14.25c.883 1.2 2.174 2 3.75 2s2.867-.8 3.75-2M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">Perguntas privadas ao professor</h2>
          <p className="text-xs text-gray-500">
            Envie uma dúvida em particular. Só você e o professor veem. Respostas aparecem aqui quando estiverem prontas.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Descreva sua dúvida para o professor. Seja específico, isso ajuda a resposta."
          maxLength={2000}
          className="min-h-[90px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={attachToLesson}
              onChange={(e) => setAttachToLesson(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#F37E20] focus:ring-[#F37E20]"
            />
            Vincular a esta aula
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{question.length} / 2.000</span>
            <button
              type="button"
              onClick={handleAsk}
              disabled={saving || !question.trim()}
              className="rounded-xl bg-[#F37E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-60"
            >
              {saving ? 'Enviando...' : 'Enviar pergunta'}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      {entries === undefined ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-xs text-gray-400">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
          Carregando...
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {lessonEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Nesta aula
              </h3>
              {lessonEntries.map((entry) => (
                <QuestionCard
                  key={entry._id}
                  entry={entry}
                  isEditing={editingId === entry._id}
                  editingText={editingText}
                  onStartEdit={() => {
                    setEditingId(entry._id)
                    setEditingText(entry.question)
                  }}
                  onCancelEdit={() => {
                    setEditingId(null)
                    setEditingText('')
                  }}
                  onChangeEditing={(v) => setEditingText(v)}
                  onSaveEdit={() => handleSaveEdit(entry._id)}
                  onDelete={() => handleDelete(entry._id)}
                />
              ))}
            </div>
          )}

          {otherEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Outras aulas deste curso
              </h3>
              {otherEntries.map((entry) => (
                <QuestionCard
                  key={entry._id}
                  entry={entry}
                  isEditing={editingId === entry._id}
                  editingText={editingText}
                  onStartEdit={() => {
                    setEditingId(entry._id)
                    setEditingText(entry.question)
                  }}
                  onCancelEdit={() => {
                    setEditingId(null)
                    setEditingText('')
                  }}
                  onChangeEditing={(v) => setEditingText(v)}
                  onSaveEdit={() => handleSaveEdit(entry._id)}
                  onDelete={() => handleDelete(entry._id)}
                />
              ))}
            </div>
          )}

          {lessonEntries.length === 0 && otherEntries.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-xs text-gray-400">
              Você ainda não enviou perguntas neste curso.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function QuestionCard({
  entry,
  isEditing,
  editingText,
  onStartEdit,
  onCancelEdit,
  onChangeEditing,
  onSaveEdit,
  onDelete,
}: {
  entry: {
    _id: Id<'courseQuestions'>
    question: string
    answer?: string
    askedAt: number
    answeredAt?: number
  }
  isEditing: boolean
  editingText: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onChangeEditing: (v: string) => void
  onSaveEdit: () => void
  onDelete: () => void
}) {
  const isAnswered = Boolean(entry.answeredAt)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
          isAnswered
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        )}>
          {isAnswered ? 'Respondida' : 'Aguardando resposta'}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(entry.askedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Sua pergunta</p>
        {isEditing ? (
          <>
            <textarea
              value={editingText}
              onChange={(e) => onChangeEditing(e.target.value)}
              maxLength={2000}
              className="mt-1 min-h-[80px] w-full rounded-lg border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onSaveEdit}
                className="rounded-lg bg-[#F37E20] px-3 py-1 text-xs font-bold text-white hover:bg-[#e06e10]"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{entry.question}</p>
        )}
      </div>

      {isAnswered && entry.answer && (
        <div className="mt-3 rounded-lg border border-[#F37E20]/20 bg-[#F37E20]/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#F37E20]">Resposta do professor</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-800">{entry.answer}</p>
          {entry.answeredAt && (
            <p className="mt-2 text-xs text-gray-400">
              {new Date(entry.answeredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {!isAnswered && !isEditing && (
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <button type="button" onClick={onStartEdit} className="font-semibold hover:text-gray-700">
            Editar
          </button>
          <button type="button" onClick={onDelete} className="font-semibold hover:text-red-500">
            Remover
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Caderno ──────────────────────────────────────────────────────────────────

function NotebookSection({
  lessonId,
}: {
  lessonId: Id<'lessons'>
}) {
  const notebooks = useQuery(api.notebooks.listMine, {}) ?? undefined
  const [activeNotebookId, setActiveNotebookId] = useState<Id<'notebooks'> | null>(
    null
  )
  const [newNotebookOpen, setNewNotebookOpen] = useState(false)
  const [newNotebookTitle, setNewNotebookTitle] = useState('')
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  )
  const [isDirty, setIsDirty] = useState(false)

  const createNotebook = useMutation(api.notebooks.create)
  const renameNotebook = useMutation(api.notebooks.rename)
  const removeNotebook = useMutation(api.notebooks.remove)
  const upsertEntry = useMutation(api.notebooks.upsertEntry)

  const [editingNotebookId, setEditingNotebookId] = useState<Id<'notebooks'> | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [notebookActionError, setNotebookActionError] = useState<string | null>(null)
  const [view, setView] = useState<'lesson' | 'all'>('lesson')

  // Seleciona caderno padrão quando carrega lista.
  useEffect(() => {
    if (!notebooks || activeNotebookId) return
    if (notebooks.length > 0) {
      setActiveNotebookId(notebooks[0]._id)
    }
  }, [notebooks, activeNotebookId])

  const entry = useQuery(
    api.notebooks.getEntry,
    activeNotebookId
      ? { notebookId: activeNotebookId, lessonId }
      : 'skip'
  )

  const allEntries = useQuery(
    api.notebooks.listNotebookEntries,
    activeNotebookId && view === 'all' ? { notebookId: activeNotebookId } : 'skip'
  )

  // Sincroniza conteúdo quando troca de caderno ou quando entrada carrega do servidor.
  useEffect(() => {
    if (entry === undefined) return
    setContent(entry?.content ?? '')
    setIsDirty(false)
    setSaveStatus('idle')
  }, [entry, activeNotebookId])

  // Auto-save com debounce de 1.5s após última alteração.
  useEffect(() => {
    if (!isDirty || !activeNotebookId) return
    const handle = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await upsertEntry({
          notebookId: activeNotebookId,
          lessonId,
          content,
        })
        setSaveStatus('saved')
        setIsDirty(false)
      } catch {
        setSaveStatus('idle')
      }
    }, 1500)
    return () => clearTimeout(handle)
  }, [content, isDirty, activeNotebookId, lessonId, upsertEntry])

  async function handleCreateNotebook() {
    const title = newNotebookTitle.trim()
    if (!title) return
    const id = await createNotebook({ title })
    setActiveNotebookId(id as Id<'notebooks'>)
    setNewNotebookTitle('')
    setNewNotebookOpen(false)
  }

  function startEditingNotebook(id: Id<'notebooks'>, currentTitle: string) {
    setEditingNotebookId(id)
    setEditingTitle(currentTitle)
    setNotebookActionError(null)
  }

  function cancelEditingNotebook() {
    setEditingNotebookId(null)
    setEditingTitle('')
  }

  async function commitRenameNotebook() {
    if (!editingNotebookId) return
    const title = editingTitle.trim()
    if (!title) {
      cancelEditingNotebook()
      return
    }
    try {
      await renameNotebook({ id: editingNotebookId, title })
      cancelEditingNotebook()
    } catch (e) {
      setNotebookActionError(e instanceof Error ? e.message : 'Não foi possível renomear.')
    }
  }

  async function handleDeleteNotebook(id: Id<'notebooks'>, title: string) {
    if (!window.confirm(`Apagar o caderno "${title}"?`)) return
    setNotebookActionError(null)
    try {
      await removeNotebook({ id })
      if (activeNotebookId === id) {
        setActiveNotebookId(null)
      }
    } catch (e) {
      setNotebookActionError(e instanceof Error ? e.message : 'Não foi possível apagar.')
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">
            Caderno digital
          </h2>
          <p className="text-xs text-gray-500">
            Organize anotações em cadernos. Cada aula tem sua entrada dentro
            do caderno ativo.
          </p>
        </div>
      </div>

      {notebooks === undefined ? (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-6 text-xs text-gray-400">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
          Carregando cadernos...
        </div>
      ) : notebooks.length === 0 && !newNotebookOpen ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-gray-700">
            Crie seu primeiro caderno
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Cadernos separam seus estudos por assunto ou curso.
          </p>
          <button
            type="button"
            onClick={() => setNewNotebookOpen(true)}
            className="mt-4 rounded-xl bg-[#F37E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#e06e10]"
          >
            Criar caderno
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
            {notebooks.map((nb) => {
              const isActive = activeNotebookId === nb._id
              const isEditing = editingNotebookId === nb._id

              if (isEditing) {
                return (
                  <input
                    key={nb._id}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    maxLength={50}
                    autoFocus
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={() => commitRenameNotebook()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitRenameNotebook()
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelEditingNotebook()
                      }
                    }}
                    className="w-40 rounded-full border border-[#F37E20]/40 bg-white px-3 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                  />
                )
              }

              return (
                <div
                  key={nb._id}
                  className={cn(
                    'group flex items-center gap-1 rounded-full border pr-1 transition-all',
                    isActive
                      ? 'border-[#F37E20] bg-[#F37E20]/10 text-[#F37E20]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveNotebookId(nb._id)}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {nb.title}
                  </button>
                  {isActive && (
                    <>
                      <button
                        type="button"
                        title="Renomear caderno"
                        onClick={() => startEditingNotebook(nb._id, nb.title)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-full p-1 text-[#F37E20] hover:bg-[#F37E20]/15 transition-opacity"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Apagar caderno"
                        onClick={() => handleDeleteNotebook(nb._id, nb.title)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-full p-1 text-[#F37E20] hover:bg-[#F37E20]/15 transition-opacity"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              )
            })}

            {newNotebookOpen ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newNotebookTitle}
                  onChange={(e) => setNewNotebookTitle(e.target.value)}
                  placeholder="Nome do caderno"
                  maxLength={50}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateNotebook()
                    if (e.key === 'Escape') {
                      setNewNotebookOpen(false)
                      setNewNotebookTitle('')
                    }
                  }}
                  className="w-40 rounded-full border border-[#F37E20]/40 bg-white px-3 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                />
                <button
                  type="button"
                  onClick={handleCreateNotebook}
                  className="rounded-full bg-[#F37E20] px-3 py-1 text-xs font-bold text-white hover:bg-[#e06e10]"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewNotebookOpen(false)
                    setNewNotebookTitle('')
                  }}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNewNotebookOpen(true)}
                className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500 hover:border-[#F37E20]/40 hover:text-[#F37E20]"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Novo caderno
              </button>
            )}
          </div>

          {notebookActionError && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              {notebookActionError}
            </div>
          )}

          {activeNotebookId && (
            <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setView('lesson')}
                className={cn(
                  'rounded-full px-3 py-1 font-semibold transition-all',
                  view === 'lesson'
                    ? 'bg-[#F37E20]/10 text-[#F37E20]'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Esta aula
              </button>
              <button
                type="button"
                onClick={() => setView('all')}
                className={cn(
                  'rounded-full px-3 py-1 font-semibold transition-all',
                  view === 'all'
                    ? 'bg-[#F37E20]/10 text-[#F37E20]'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Caderno completo
              </button>
            </div>
          )}

          {activeNotebookId && view === 'lesson' && (
            <div className="p-4">
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setIsDirty(true)
                  setSaveStatus('idle')
                }}
                placeholder="Escreva suas anotações sobre esta aula..."
                maxLength={20000}
                className="min-h-[180px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-4 py-3 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>
                  {content.length.toLocaleString()} / 20.000 caracteres
                </span>
                <span>
                  {saveStatus === 'saving'
                    ? 'Salvando...'
                    : saveStatus === 'saved'
                    ? 'Salvo automaticamente'
                    : isDirty
                    ? 'Alterações não salvas'
                    : 'Atualizado'}
                </span>
              </div>
            </div>
          )}

          {activeNotebookId && view === 'all' && (
            <div className="p-4">
              {allEntries === undefined ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
                  Carregando anotações...
                </div>
              ) : allEntries.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhuma anotação neste caderno ainda. Use a aba "Esta aula" para começar.
                </p>
              ) : (
                <ul className="space-y-3">
                  {allEntries.map((e) => {
                    const isCurrent = e.lessonId === lessonId
                    return (
                      <li
                        key={e._id}
                        className={cn(
                          'rounded-xl border p-3 transition-all',
                          isCurrent
                            ? 'border-[#F37E20]/40 bg-[#F37E20]/5'
                            : 'border-gray-200 bg-white'
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-gray-700">
                              {e.lessonTitle}
                            </p>
                            <p className="truncate text-[11px] text-gray-400">
                              {e.courseTitle}
                            </p>
                          </div>
                          {!isCurrent && e.courseSlug && e.lessonSlug && (
                            <Link
                              to={`/dashboard/meus-cursos/${e.courseId}/aula/${e.lessonId}`}
                              className="shrink-0 text-[11px] font-semibold text-[#F37E20] hover:underline"
                            >
                              Abrir aula
                            </Link>
                          )}
                          {isCurrent && (
                            <span className="shrink-0 rounded-full bg-[#F37E20]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F37E20]">
                              Aula atual
                            </span>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {e.content || (
                            <span className="text-gray-400 italic">Sem conteúdo</span>
                          )}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ─── Materiais ────────────────────────────────────────────────────────────────

function MaterialsSection({ lessonId }: { lessonId: Id<'lessons'> }) {
  const materials = useQuery(api.lessonMaterials.listByLesson, { lessonId })
  const getDownloadUrl = useAction(api.lessonMaterials.getDownloadUrl)
  const [openingId, setOpeningId] = useState<Id<'lessonMaterials'> | null>(null)

  if (materials === undefined) return null
  if (materials.length === 0) return null

  const openMaterial = async (id: Id<'lessonMaterials'>, fallbackUrl: string | null) => {
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
      return
    }
    try {
      setOpeningId(id)
      const url = await getDownloadUrl({ materialId: id })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // sem-op: botão volta a estar habilitado
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">
            Materiais
          </h2>
          <p className="text-xs text-gray-500">
            {materials.length} arquivo{materials.length !== 1 ? 's' : ''} de apoio
            para esta aula.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {materials.map((m) => {
          const hasStorageUrl = typeof m.url === 'string' && m.url.length > 0
          const hasR2Key = typeof m.r2Key === 'string' && m.r2Key.length > 0
          const canOpen = hasStorageUrl || hasR2Key
          const isOpening = openingId === m._id
          const inner = (
            <>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {m.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(m.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <svg
                className="h-4 w-4 flex-shrink-0 text-gray-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M7.5 16.5L21 3m0 0h-4.875M21 3v4.875"
                />
              </svg>
            </>
          )
          return canOpen ? (
            <button
              key={m._id}
              type="button"
              onClick={() => void openMaterial(m._id, m.url ?? null)}
              disabled={isOpening}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-[#F37E20]/40 hover:shadow-sm disabled:opacity-60"
            >
              {inner}
            </button>
          ) : (
            <div
              key={m._id}
              aria-disabled="true"
              title="Arquivo indisponível"
              className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 opacity-60"
            >
              {inner}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Fórum (comentários) ──────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

type CommentItem = {
  _id: Id<'lessonComments'>
  authorId: string
  authorName: string
  authorAvatarUrl?: string
  authorRole: 'aluno' | 'criador'
  text: string
  isOfficial?: boolean
  parentId?: Id<'lessonComments'>
  createdAt: number
  editedAt?: number
  deletedAt?: number
}

function CommentRow({
  comment,
  isReply = false,
  canModerate = false,
}: {
  comment: CommentItem
  isReply?: boolean
  canModerate?: boolean
}) {
  const deleted = Boolean(comment.deletedAt)
  const softDelete = useMutation(api.lessonComments.softDelete)
  const setOfficial = useMutation(api.lessonComments.setOfficial)
  const [moderating, setModerating] = useState(false)

  async function handleRemove() {
    if (moderating) return
    if (!window.confirm('Remover este comentário? Essa ação não pode ser desfeita.')) return
    setModerating(true)
    try {
      await softDelete({ id: comment._id })
    } finally {
      setModerating(false)
    }
  }

  async function handleToggleOfficial() {
    if (moderating) return
    setModerating(true)
    try {
      await setOfficial({ id: comment._id, isOfficial: !comment.isOfficial })
    } finally {
      setModerating(false)
    }
  }

  return (
    <div className={cn('flex gap-3', isReply && 'mt-3 ml-10')}>
      <div className="flex-shrink-0">
        {comment.authorAvatarUrl ? (
          <img
            src={comment.authorAvatarUrl}
            alt={comment.authorName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {comment.authorName}
          </span>
          {comment.authorRole === 'criador' && (
            <span className="rounded-full bg-[#F37E20]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F37E20]">
              Professor
            </span>
          )}
          {comment.isOfficial && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Resposta oficial
            </span>
          )}
          <span className="text-xs text-gray-400">
            {timeAgo(comment.createdAt)}
            {comment.editedAt ? ' (editado)' : ''}
          </span>
        </div>
        <p
          className={cn(
            'mt-1 whitespace-pre-wrap break-words text-sm leading-6',
            deleted ? 'italic text-gray-400' : 'text-gray-700'
          )}
        >
          {deleted ? 'Comentário removido.' : comment.text}
        </p>
        {canModerate && !deleted && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {isReply && (
              <button
                type="button"
                onClick={handleToggleOfficial}
                disabled={moderating}
                className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-60"
              >
                {comment.isOfficial ? 'Remover marcação oficial' : 'Marcar como resposta oficial'}
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={moderating}
              className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-60"
            >
              {moderating ? 'Processando...' : 'Remover'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ForumSection({ lessonId }: { lessonId: Id<'lessons'> }) {
  const threadData = useQuery(api.lessonComments.listByLesson, { lessonId })
  const thread = threadData?.threads
  const canModerate = threadData?.viewerRole === 'criador'
  const create = useMutation(api.lessonComments.create)

  const [rootText, setRootText] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'lessonComments'> | null>(
    null
  )
  const [replyText, setReplyText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handlePostRoot() {
    const trimmed = rootText.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await create({ lessonId, text: trimmed })
      setRootText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePostReply(parentId: Id<'lessonComments'>) {
    const trimmed = replyText.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await create({ lessonId, text: trimmed, parentId })
      setReplyText('')
      setReplyingTo(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao responder')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">
            Discussão
          </h2>
          <p className="text-xs text-gray-500">
            Pergunte ao criador, compartilhe reflexões, ou responda colegas.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <textarea
          value={rootText}
          onChange={(e) => setRootText(e.target.value)}
          placeholder="Escreva uma dúvida ou reflexão..."
          maxLength={2000}
          className="min-h-[80px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-4 py-3 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {rootText.length} / 2.000
          </span>
          <button
            type="button"
            onClick={handlePostRoot}
            disabled={submitting || !rootText.trim()}
            className="rounded-xl bg-[#F37E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-60"
          >
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      <div className="mt-4 space-y-5">
        {thread === undefined ? (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-xs text-gray-400">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
            Carregando discussão...
          </div>
        ) : thread.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-xs text-gray-400">
            Nenhum comentário ainda. Seja o primeiro a comentar.
          </p>
        ) : (
          thread.map((root) => (
            <div
              key={root._id}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <CommentRow comment={root as CommentItem} canModerate={canModerate} />
              {root.replies.map((reply) => (
                <CommentRow
                  key={reply._id}
                  comment={reply as CommentItem}
                  isReply
                  canModerate={canModerate}
                />
              ))}

              {replyingTo === root._id ? (
                <div className="ml-10 mt-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva uma resposta..."
                    maxLength={2000}
                    autoFocus
                    className="min-h-[60px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePostReply(root._id)}
                      disabled={submitting || !replyText.trim()}
                      className="rounded-lg bg-[#F37E20] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e06e10] disabled:opacity-60"
                    >
                      {submitting ? 'Enviando...' : 'Responder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyText('')
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(root._id)
                    setReplyText('')
                  }}
                  className="ml-10 mt-2 text-xs font-semibold text-[#F37E20] hover:underline"
                >
                  Responder
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

type QuizQuestion = {
  id: string
  text: string
  options: { id: string; text: string }[]
  correctOptionId: string
  explanation?: string
}

type QuizData = {
  _id: string
  questions: QuizQuestion[]
}

type QuizProgressState = {
  quizScore?: number
  quizPassed?: boolean
  quizRetryPending?: boolean
  completed?: boolean
}

function QuizSection({
  quiz,
  courseId,
  lessonId,
  progress,
  quizUnlocked,
  allowRetry,
  reachedThreshold,
}: {
  quiz: QuizData | null
  courseId: Id<'courses'>
  lessonId: Id<'lessons'>
  progress: QuizProgressState | null
  quizUnlocked: boolean
  allowRetry: boolean
  reachedThreshold: boolean
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [requestingRetry, setRequestingRetry] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitQuiz = useMutation(api.student.submitQuiz)
  const requestRetry = useMutation(api.student.requestQuizRetry)

  const alreadyAnswered =
    progress?.quizScore !== undefined && !progress?.quizRetryPending
  const retryPending = Boolean(progress?.quizRetryPending)
  const passed = (progress?.quizPassed ?? false) && alreadyAnswered

  async function handleSubmit() {
    if (!quiz) return
    const answeredAll = quiz.questions.every((q) => answers[q.id])
    if (!answeredAll) {
      setError('Responda todas as perguntas antes de enviar.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitQuiz({
        lessonId,
        courseId,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      })
      setAnswers({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar quiz')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRetry() {
    setRequestingRetry(true)
    setError(null)
    try {
      await requestRetry({ lessonId, courseId })
      setAnswers({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao solicitar retry')
    } finally {
      setRequestingRetry(false)
    }
  }

  // ─── Estado: aula sem quiz ──
  if (!quiz) return null

  // ─── Cabeçalho comum ──
  const header = (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <div>
        <h2 className="font-display text-lg font-bold text-gray-800">
          Quiz da aula
        </h2>
        <p className="text-xs text-gray-500">
          Responda para registrar seu progresso e avançar para o certificado.
        </p>
      </div>
    </div>
  )

  // ─── Estado: retry pendente (aluno pediu refazer, precisa reassistir) ──
  if (retryPending) {
    return (
      <section className="mt-10">
        {header}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-bold text-amber-800">Reassistir a aula</p>
          <p className="mt-1 text-sm text-amber-700">
            Você solicitou refazer este quiz. Assista novamente até 95% para
            liberar uma nova tentativa.
          </p>
        </div>
      </section>
    )
  }

  // ─── Estado: já respondido e não-pendente ──
  if (alreadyAnswered) {
    const score = progress?.quizScore ?? 0
    return (
      <section className="mt-10">
        {header}
        <div
          className={cn(
            'rounded-2xl border p-6',
            passed
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                passed
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              )}
            >
              {passed ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div>
              <p
                className={cn(
                  'font-bold text-lg',
                  passed ? 'text-emerald-700' : 'text-red-700'
                )}
              >
                {score}%
              </p>
              <p className="text-sm text-gray-600">
                {passed
                  ? 'Aprovado. Avance para a próxima aula.'
                  : 'Abaixo de 70%. Continue estudando.'}
              </p>
            </div>
          </div>

          {quiz.questions.map((q) => (
            <div key={q.id} className="mb-3 last:mb-0">
              <p className="text-sm font-medium text-gray-700 mb-2">{q.text}</p>
              {q.explanation && (
                <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100">
                  {q.explanation}
                </p>
              )}
            </div>
          ))}

          {allowRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={requestingRetry}
              className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:border-[#F37E20]/40 hover:text-[#F37E20] disabled:opacity-60"
            >
              {requestingRetry
                ? 'Preparando retry...'
                : 'Refazer quiz (reassistir a aula primeiro)'}
            </button>
          )}
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      </section>
    )
  }

  // ─── Estado: bloqueado (ainda não assistiu 95%) ──
  if (!quizUnlocked) {
    return (
      <section className="mt-10">
        {header}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">
            Quiz bloqueado
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {reachedThreshold
              ? 'Confirmando sua conclusão...'
              : 'Assista pelo menos 95% da aula para destravar o quiz.'}
          </p>
        </div>
      </section>
    )
  }

  // ─── Estado: liberado, ainda não respondido ──
  return (
    <section className="mt-10">
      {header}
      <div className="space-y-4">
        {quiz.questions.map((q, qi) => (
          <div
            key={q.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="mb-3 text-sm font-semibold text-gray-800">
              {qi + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-all',
                    answers[q.id] === opt.id
                      ? 'border-[#F37E20]/40 bg-[#F37E20]/6 text-[#F37E20] font-semibold'
                      : 'border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                    }
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all',
                      answers[q.id] === opt.id
                        ? 'border-[#F37E20] bg-[#F37E20]'
                        : 'border-gray-300'
                    )}
                  >
                    {answers[q.id] === opt.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  {opt.text}
                </label>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-xl bg-[#F37E20] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-60"
        >
          {submitting ? 'Enviando...' : 'Enviar respostas'}
        </button>
      </div>
    </section>
  )
}

// ─── AulaPage ─────────────────────────────────────────────────────────────────

export function AulaPage() {
  const { courseId: rawCourseRef, lessonId: rawLessonRef } = useParams<{
    courseId: string
    lessonId: string
  }>()
  const navigate = useNavigate()

  const isSlugBased =
    rawCourseRef?.includes('-') || rawLessonRef?.includes('-')

  const resolved = useQuery(
    api.student.resolveLesson,
    isSlugBased && rawCourseRef && rawLessonRef
      ? { courseRef: rawCourseRef, lessonRef: rawLessonRef }
      : 'skip'
  )

  const courseId = isSlugBased ? resolved?.courseId : rawCourseRef
  const lessonId = isSlugBased ? resolved?.lessonId : rawLessonRef

  const data = useQuery(
    api.student.getLessonForPlayer,
    courseId && lessonId
      ? {
          courseId: courseId as Id<'courses'>,
          lessonId: lessonId as Id<'lessons'>,
        }
      : 'skip'
  )

  const updateProgress = useMutation(api.student.updateProgress)

  // Curtida interna da aula. Substitui o antigo botão "Curtir no YouTube":
  // sem OAuth, sem redirect. Toggle idempotente no servidor.
  const likeStatus = useQuery(
    api.lessonLikes.getStatus,
    lessonId ? { lessonId: lessonId as Id<'lessons'> } : 'skip'
  )
  const toggleLike = useMutation(api.lessonLikes.toggle)
  const [likePending, setLikePending] = useState(false)
  const handleToggleLike = useCallback(async () => {
    if (!lessonId || likePending) return
    setLikePending(true)
    try {
      await toggleLike({ lessonId: lessonId as Id<'lessons'> })
    } catch {
      // Silencioso: usuário sem acesso (caso raro) ou rede caindo.
    } finally {
      setLikePending(false)
    }
  }, [lessonId, likePending, toggleLike])

  const { user: clerkUser } = useUser()
  const isCreatorOfThisCourse = Boolean(
    clerkUser?.id && data?.course?.creatorId && clerkUser.id === data.course.creatorId
  )

  // Ref do player YouTube exposto a componentes irmãos (anotações por momento).
  const playerHandleRef = useRef<YTPlayer | null>(null)

  // Estado local para acompanhar atingimento de 95% antes do servidor confirmar.
  const [reachedThresholdLocal, setReachedThresholdLocal] = useState(false)

  // Painel lateral da Bíblia. Aluno abre via botão flutuante; quando clica num
  // versículo da seção VersesSection, abre já posicionado naquela referência.
  const [bibleOpen, setBibleOpen] = useState(false)
  const [bibleRef, setBibleRef] = useState<BiblePanelInitialRef | undefined>(undefined)

  // Modo Estudo Profundo: cobre toda a tela (z-[60]) escondendo sidebar e
  // notificações, layout fica mais largo e silencioso. Atalhos: F para alternar,
  // Esc para sair. Usa data-study-deep no <html> pra outros componentes
  // (NotificationsBell) silenciarem som/abertura automática.
  const [studyDeep, setStudyDeep] = useState(false)
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (studyDeep) {
      document.documentElement.dataset.studyDeep = 'true'
      try {
        window.localStorage.setItem('rdt_study_deep_active', '1')
      } catch {
        // Privacy mode: ignora.
      }
    } else {
      delete document.documentElement.dataset.studyDeep
      try {
        window.localStorage.removeItem('rdt_study_deep_active')
      } catch {
        // ignora
      }
    }
    return () => {
      delete document.documentElement.dataset.studyDeep
    }
  }, [studyDeep])
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const editing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable
      if (e.key === 'Escape' && studyDeep) {
        setStudyDeep(false)
        return
      }
      if (editing) return
      if (e.key === 'f' || e.key === 'F') {
        if (e.metaKey || e.ctrlKey || e.altKey) return
        e.preventDefault()
        setStudyDeep((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [studyDeep])

  useEffect(() => {
    // Reset quando troca aula ou quando servidor zerou watchedSeconds (retry).
    setReachedThresholdLocal(false)
  }, [lessonId, data?.progress?.watchResetAt])

  const progressPercent = data?.progress
    ? data.progress.totalSeconds > 0
      ? Math.round(
          (data.progress.watchedSeconds / data.progress.totalSeconds) * 100
        )
      : 0
    : 0

  const handleProgress = useCallback(
    async (watched: number, total: number) => {
      if (!courseId || !lessonId) return
      if (total > 0 && watched / total >= COMPLETION_RATIO) {
        setReachedThresholdLocal(true)
      }
      try {
        await updateProgress({
          lessonId: lessonId as Id<'lessons'>,
          courseId: courseId as Id<'courses'>,
          watchedSeconds: watched,
          totalSeconds: total,
        })
      } catch {
        // Falha silenciosa (retorna na próxima chamada periódica).
      }
    },
    [courseId, lessonId, updateProgress]
  )

  const handleComplete = useCallback(async () => {
    if (!courseId || !lessonId) return
    setReachedThresholdLocal(true)
    try {
      await updateProgress({
        lessonId: lessonId as Id<'lessons'>,
        courseId: courseId as Id<'courses'>,
        watchedSeconds: data?.lesson.durationSeconds ?? 0,
        totalSeconds: data?.lesson.durationSeconds ?? 0,
      })
    } catch {
      // Silencioso.
    }
  }, [courseId, lessonId, updateProgress, data?.lesson.durationSeconds])

  useEffect(() => {
    if (data === null && rawCourseRef) {
      navigate(`/dashboard/meus-cursos/${rawCourseRef}`, { replace: true })
    }
  }, [data, rawCourseRef, navigate])

  if (data === undefined || (isSlugBased && resolved === undefined)) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  const {
    lesson,
    course,
    module: mod,
    progress,
    quiz,
    prevLesson,
    nextLesson,
    nextScheduledLesson,
    lessonIndex,
    totalLessons,
  } = data

  const lessonCompleted = Boolean(progress?.completed)
  const retryPending = Boolean(progress?.quizRetryPending)
  // Quiz destravado: backend só envia gabarito quando progress.completed &&
  // !quizRetryPending. Em retry, o aluno precisa reassistir até 95% (o que
  // limpa quizRetryPending em updateProgress) para o backend devolver o quiz
  // destravado.
  const quizUnlocked =
    quiz !== null &&
    quiz !== undefined &&
    quiz.questions.length > 0 &&
    quiz.questions[0].correctOptionId !== ''

  const displayPercent = lessonCompleted && !retryPending ? 100 : progressPercent

  const versesRefs = ((lesson.versesRefs ?? []) as VerseRef[]).filter(
    (v) => v.bookSlug
  )

  // resetKey: muda quando retry é pedido (watchResetAt novo) para forçar
  // remount do player com initialWatched=0. Também muda quando a aula muda.
  const playerResetKey = `${lesson._id}-${progress?.watchResetAt ?? 0}`

  return (
    <div
      className={cn(
        'flex flex-col bg-[#F7F5F2]',
        studyDeep
          ? 'fixed inset-0 z-[60] min-h-screen overflow-y-auto'
          : 'min-h-screen',
      )}
    >
      {/* Header fixo com breadcrumb, contador e voltar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to={`/dashboard/meus-cursos/${rawCourseRef}`}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            <span className="hidden sm:block">Voltar ao curso</span>
          </Link>

          <div className="mx-2 h-4 w-px bg-gray-200 flex-shrink-0" />

          <nav className="flex min-w-0 items-center gap-1.5 text-xs text-gray-400 overflow-hidden">
            <span className="flex-shrink-0 hidden sm:block truncate max-w-[120px]">
              {course.title}
            </span>
            {course.releaseStatus === 'in_progress' && (
              <span className="flex-shrink-0 hidden sm:inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Em produção
              </span>
            )}
            <span className="flex-shrink-0 hidden sm:block">/</span>
            {mod && (
              <span className="flex-shrink-0 hidden sm:block truncate max-w-[100px]">
                {mod.title}
              </span>
            )}
            {mod && <span className="flex-shrink-0 hidden sm:block">/</span>}
            <span className="truncate font-medium text-gray-700">
              {lesson.title}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setStudyDeep((v) => !v)}
              className={cn(
                'hidden lg:flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                studyDeep
                  ? 'border-[#F37E20] bg-[#F37E20] text-white hover:bg-[#E6711A]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800',
              )}
              aria-pressed={studyDeep}
              title="Estudo Profundo (atalho: F)"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {studyDeep ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                )}
              </svg>
              <span>{studyDeep ? 'Sair (Esc)' : 'Estudo Profundo'}</span>
            </button>
            <span className="text-xs text-gray-400">
              {lessonIndex}/{totalLessons}
            </span>
            {lessonCompleted && !retryPending && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                Concluída
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal em coluna única, ordem vertical */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
          {/* 1. Progresso + navegação (acima do vídeo) */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>Progresso da aula</span>
              <span className="font-semibold text-gray-600">
                {displayPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#F37E20] transition-all duration-500"
                style={{ width: `${displayPercent}%` }}
              />
            </div>
          </div>

          {/* 2. Player (anti-skip preservado) */}
          <VideoPlayer
            youtubeUrl={lesson.youtubeUrl}
            initialWatched={progress?.watchedSeconds ?? 0}
            totalSeconds={lesson.durationSeconds ?? 0}
            onProgress={handleProgress}
            onComplete={handleComplete}
            resetKey={playerResetKey}
            playerHandleRef={playerHandleRef}
          />

          {/* 3. Informações da aula */}
          <div className="mt-6 border-b border-gray-200 pb-6">
            <h1 className="font-display text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="mt-3 text-sm leading-7 text-gray-600 whitespace-pre-wrap">
                {lesson.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={likePending || likeStatus === undefined}
                aria-pressed={Boolean(likeStatus?.liked)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-all',
                  likeStatus?.liked
                    ? 'border-[#F37E20] bg-[#F37E20]/10 text-[#F37E20] hover:bg-[#F37E20]/15'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                  (likePending || likeStatus === undefined) && 'opacity-60 cursor-wait'
                )}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill={likeStatus?.liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                {likeStatus?.liked ? 'Curtido' : 'Curtir'}
                {likeStatus && likeStatus.count > 0 && (
                  <span className="ml-1 rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold tabular-nums text-gray-600">
                    {likeStatus.count}
                  </span>
                )}
              </button>

              <DonateButton tone="light" variant="inline" />
            </div>
          </div>

          {/* 4. Versículos citados (abaixo do vídeo) */}
          <VersesSection
            versesRefs={versesRefs}
            onOpenInPanel={(ref) => {
              setBibleRef({
                bookSlug: ref.bookSlug,
                chapter: ref.chapter,
                verseStart: ref.verseStart,
                verseEnd: ref.verseEnd,
              })
              setBibleOpen(true)
            }}
          />

          {/* 5. Anotações por momento do vídeo */}
          <TimestampNotesSection
            lessonId={lesson._id as Id<'lessons'>}
            playerHandleRef={playerHandleRef}
          />

          {/* 6. Caderno digital */}
          <NotebookSection lessonId={lesson._id as Id<'lessons'>} />

          {/* 6b. Flashcards desta aula */}
          <FlashcardsLessonSection courseId={courseId as Id<'courses'>} />

          {/* 6c. Materiais */}
          <MaterialsSection lessonId={lesson._id as Id<'lessons'>} />

          {/* 7. Fórum de comentários */}
          <ForumSection lessonId={lesson._id as Id<'lessons'>} />

          {/* 7b. Perguntas privadas ao professor (escondida para o próprio criador) */}
          <PrivateQuestionsSection
            courseId={courseId as Id<'courses'>}
            lessonId={lesson._id as Id<'lessons'>}
            isCreator={isCreatorOfThisCourse}
          />

          {/* 8. Quiz */}
          {lesson.hasMandatoryQuiz && (
            <QuizSection
              quiz={quiz as QuizData | null}
              courseId={courseId as Id<'courses'>}
              lessonId={lesson._id as Id<'lessons'>}
              progress={progress as QuizProgressState | null}
              quizUnlocked={quizUnlocked}
              allowRetry={Boolean(lesson.allowQuizRetry)}
              reachedThreshold={reachedThresholdLocal || progressPercent >= 95}
            />
          )}

          {/* 9. Navegação entre aulas */}
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
            {prevLesson ? (
              <Link
                to={`/dashboard/meus-cursos/${rawCourseRef}/aula/${
                  (prevLesson as { slug?: string; _id: string }).slug ??
                  prevLesson._id
                }`}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                <span className="hidden sm:block">Aula anterior</span>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Link
                to={`/dashboard/meus-cursos/${rawCourseRef}/aula/${
                  (nextLesson as { slug?: string; _id: string }).slug ??
                  nextLesson._id
                }`}
                className="flex items-center gap-2 rounded-xl bg-[#F37E20] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#e06e10]"
              >
                <span>Próxima aula</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            ) : course.releaseStatus === 'in_progress' ? (
              <div className="flex flex-col items-end gap-1">
                <Link
                  to={`/dashboard/meus-cursos/${rawCourseRef}`}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-600"
                >
                  Você está em dia
                </Link>
                {nextScheduledLesson ? (
                  <span className="text-[11px] text-amber-700">
                    Próxima aula em {(() => {
                      const d = new Date(nextScheduledLesson.publishAt)
                      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
                    })()}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-700">Aguarde a próxima aula.</span>
                )}
              </div>
            ) : (
              <Link
                to={`/dashboard/meus-cursos/${rawCourseRef}`}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600"
              >
                Ver progresso do curso
              </Link>
            )}
          </div>

          {/* 10. Curso em desenvolvimento (Caminho C) — somente na ultima aula
               publicada de um curso em producao. Mensagem editorial + carrossel
               de cursos recomendados (mesmo professor, depois mesma categoria). */}
          {!nextLesson && course.releaseStatus === 'in_progress' ? (
            <CourseInDevelopmentNotice
              courseId={courseId as Id<'courses'>}
              scheduleText={course.nextLessonScheduleText ?? null}
              nextScheduledLessonAt={nextScheduledLesson?.publishAt ?? null}
            />
          ) : null}
        </div>
      </main>

      {/* Botão flutuante para abrir o painel da Bíblia em qualquer momento */}
      <button
        type="button"
        onClick={() => {
          setBibleRef(undefined)
          setBibleOpen(true)
        }}
        className="fixed bottom-6 right-6 z-30 flex h-12 items-center gap-2 rounded-full bg-[#F37E20] px-5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#E6711A]"
        aria-label="Abrir Bíblia"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        Bíblia
      </button>

      <BiblePanel
        open={bibleOpen}
        onClose={() => setBibleOpen(false)}
        initialRef={bibleRef}
      />
    </div>
  )
}
