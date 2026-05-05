import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/brand'
import {
  COMPLETION_RATIO,
  extractYouTubeId,
  formatClock,
  qualityLabel,
  type YTPlayer,
} from './player-helpers'

export function VideoPlayer({
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
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [currentQuality, setCurrentQuality] = useState<string>('auto')
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false)
  const qualityMenuRef = useRef<HTMLDivElement>(null)

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
          // Qualidades disponíveis só ficam acessíveis depois que o vídeo
          // começa a carregar. Tentamos no ready e o onPlaybackQualityChange
          // confirma o estado real.
          try {
            const levels = e.target.getAvailableQualityLevels?.() ?? []
            if (levels.length > 0) setAvailableQualities(levels)
            const q = e.target.getPlaybackQuality?.()
            if (q) setCurrentQuality(q)
          } catch {
            // ignora
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
          // Atualiza qualidades quando o player começa a tocar (algumas
          // qualidades só ficam acessíveis após buffer inicial).
          try {
            const levels = e.target.getAvailableQualityLevels?.() ?? []
            if (levels.length > 0) {
              setAvailableQualities((prev) =>
                levels.length === prev.length && levels.every((l, i) => l === prev[i])
                  ? prev
                  : levels,
              )
            }
            const q = e.target.getPlaybackQuality?.()
            if (q) setCurrentQuality((prev) => (prev === q ? prev : q))
          } catch {
            // ignora
          }
        },
        onPlaybackQualityChange: (e) => {
          if (e.data) setCurrentQuality(e.data)
          try {
            const levels = e.target.getAvailableQualityLevels?.() ?? []
            if (levels.length > 0) {
              setAvailableQualities((prev) =>
                levels.length === prev.length && levels.every((l, i) => l === prev[i])
                  ? prev
                  : levels,
              )
            }
          } catch {
            // ignora
          }
        },
      },
    })
    // handleComplete/startTick/startTracking são closures estáveis declaradas
    // depois deste useCallback; incluí-las criaria ciclo. Player só reinicializa
    // quando o videoId muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function selectQuality(level: string) {
    if (!playerRef.current) return
    try {
      playerRef.current.setPlaybackQuality?.(level)
      setCurrentQuality(level)
    } catch {
      // ignora
    }
    setQualityMenuOpen(false)
  }

  useEffect(() => {
    if (!qualityMenuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (!qualityMenuRef.current) return
      if (!qualityMenuRef.current.contains(e.target as Node)) {
        setQualityMenuOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setQualityMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [qualityMenuOpen])

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
    // Reseta tempo assistido ao trocar de aula. Side effect intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
            {availableQualities.length > 0 && (
              <div className="relative" ref={qualityMenuRef}>
                <button
                  type="button"
                  onClick={() => setQualityMenuOpen((v) => !v)}
                  className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/90 transition-colors hover:bg-white/20"
                  aria-label="Mudar qualidade do vídeo"
                  aria-haspopup="listbox"
                  aria-expanded={qualityMenuOpen}
                  title="Qualidade"
                >
                  {qualityLabel(currentQuality)}
                </button>
                {qualityMenuOpen && (
                  <div
                    role="listbox"
                    aria-label="Qualidade do vídeo"
                    className="absolute bottom-full right-0 mb-2 w-32 overflow-hidden rounded-xl border border-white/14 bg-[#0F141A]/95 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
                  >
                    {availableQualities.map((level) => {
                      const selected = level === currentQuality
                      return (
                        <button
                          key={level}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => selectQuality(level)}
                          className={cn(
                            'flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold transition-colors',
                            selected
                              ? 'bg-white/[0.08] text-[#F2BD8A]'
                              : 'text-white/80 hover:bg-white/[0.06] hover:text-white',
                          )}
                        >
                          <span>{qualityLabel(level)}</span>
                          {selected && (
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <span className="tabular-nums tracking-wide text-white/90">
              {formatClock(currentTime)} / {formatClock(safeDuration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
