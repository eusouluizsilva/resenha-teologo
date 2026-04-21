import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { cn } from '@/lib/brand'

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

function VideoPlayer({
  youtubeUrl,
  initialWatched,
  totalSeconds,
  onProgress,
  onComplete,
}: {
  youtubeUrl: string
  initialWatched: number
  totalSeconds: number
  onProgress: (watched: number, total: number) => void
  onComplete: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxWatchedRef = useRef(initialWatched)
  const completedRef = useRef(false)

  const videoId = extractYouTubeId(youtubeUrl)

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
        controls: 0,       // sem controles nativos do YouTube
        disablekb: 1,      // sem atalhos de teclado
        fs: 0,             // sem botão de fullscreen nativo
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        start: Math.floor(initialWatched),
      },
      events: {
        onReady: () => {
          // Começa pausado para o aluno decidir
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) {
            startTracking()
          } else {
            stopTracking()
          }
          if (e.data === window.YT.PlayerState.ENDED) {
            handleComplete()
          }
        },
      },
    })
  }, [videoId, initialWatched])

  function startTracking() {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return
      const current = playerRef.current.getCurrentTime()
      const duration = playerRef.current.getDuration() || totalSeconds

      // Anti-skip: se o aluno tentar avançar além do max assistido, volta
      if (current > maxWatchedRef.current + 3) {
        playerRef.current.seekTo(maxWatchedRef.current, true)
        return
      }

      maxWatchedRef.current = Math.max(maxWatchedRef.current, current)
      onProgress(Math.floor(maxWatchedRef.current), Math.floor(duration))

      if (!completedRef.current && duration > 0 && maxWatchedRef.current / duration >= 0.9) {
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

  useEffect(() => {
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
      playerRef.current?.destroy()
    }
  }, [initPlayer])

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gray-900 text-gray-500">
        <p className="text-sm">URL de vídeo inválida</p>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video shadow-2xl">
      <div ref={containerRef} className="absolute inset-0 [&>div]:h-full [&>div]:w-full [&>iframe]:h-full [&>iframe]:w-full" />
    </div>
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

function QuizBlock({
  quiz,
  lessonCompleted,
  courseId,
  lessonId,
  alreadySubmitted,
  initialScore,
}: {
  quiz: QuizData
  lessonCompleted: boolean
  courseId: string
  lessonId: string
  alreadySubmitted: boolean
  initialScore?: number
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(
    alreadySubmitted && initialScore !== undefined ? { score: initialScore, passed: initialScore >= 70 } : null
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitQuiz = useMutation(api.student.submitQuiz)

  if (!lessonCompleted) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600">Quiz bloqueado</p>
        <p className="mt-1 text-xs text-gray-400">Conclua a aula para desbloquear o quiz.</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className={cn('rounded-2xl border p-6', result.passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
        <div className="mb-4 flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>
            {result.passed ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <p className={cn('font-bold text-lg', result.passed ? 'text-emerald-700' : 'text-red-700')}>
              {result.score}%
            </p>
            <p className="text-sm text-gray-600">{result.passed ? 'Aprovado. Avance para a próxima aula.' : 'Abaixo de 70%. Continue estudando.'}</p>
          </div>
        </div>

        {quiz.questions.map((q) => (
          <div key={q.id} className="mb-3 last:mb-0">
            <p className="text-sm font-medium text-gray-700 mb-2">{q.text}</p>
            {q.explanation && (
              <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100">{q.explanation}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  async function handleSubmit() {
    const answeredAll = quiz.questions.every((q) => answers[q.id])
    if (!answeredAll) {
      setError('Responda todas as perguntas antes de enviar.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitQuiz({
        lessonId: lessonId as Id<'lessons'>,
        courseId: courseId as Id<'courses'>,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
      })
      setResult({ score: res.score, passed: res.passed })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar quiz')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-gray-800">Quiz da aula</p>
      </div>

      {quiz.questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-800">{qi + 1}. {q.text}</p>
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
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                  className="sr-only"
                />
                <span className={cn('flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all', answers[q.id] === opt.id ? 'border-[#F37E20] bg-[#F37E20]' : 'border-gray-300')}>
                  {answers[q.id] === opt.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
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
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type SidebarTab = 'visao-geral' | 'biblia' | 'caderno' | 'materiais' | 'discussao'

const SIDEBAR_TABS: { id: SidebarTab; label: string }[] = [
  { id: 'visao-geral', label: 'Visão geral' },
  { id: 'biblia', label: 'Bíblia' },
  { id: 'caderno', label: 'Caderno' },
  { id: 'materiais', label: 'Materiais' },
  { id: 'discussao', label: 'Discussão' },
]

function SidebarContent({
  tab,
  lesson,
}: {
  tab: SidebarTab
  lesson: { title: string; description?: string }
}) {
  if (tab === 'visao-geral') {
    return (
      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Sobre esta aula</p>
          <p className="text-sm font-semibold text-gray-800">{lesson.title}</p>
          {lesson.description && (
            <p className="mt-2 text-sm leading-6 text-gray-600">{lesson.description}</p>
          )}
        </div>
      </div>
    )
  }

  if (tab === 'biblia') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600">Bíblia integrada</p>
        <p className="mt-1 text-xs text-gray-400">Em breve: versículos citados nesta aula com múltiplas traduções.</p>
      </div>
    )
  }

  if (tab === 'caderno') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600">Caderno digital</p>
        <p className="mt-1 text-xs text-gray-400">Em breve: notas vinculadas ao momento do vídeo.</p>
      </div>
    )
  }

  if (tab === 'materiais') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600">Materiais da aula</p>
        <p className="mt-1 text-xs text-gray-400">Em breve: PDFs, eBooks e recursos extras.</p>
      </div>
    )
  }

  // Discussão
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-600">Discussão</p>
      <p className="mt-1 text-xs text-gray-400">Em breve: perguntas ao professor e fórum da aula.</p>
    </div>
  )
}

// ─── AulaPage ─────────────────────────────────────────────────────────────────

export function AulaPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const navigate = useNavigate()
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('visao-geral')
  const [lessonCompleted, setLessonCompleted] = useState(false)

  const data = useQuery(
    api.student.getLessonForPlayer,
    courseId && lessonId
      ? { courseId: courseId as Id<'courses'>, lessonId: lessonId as Id<'lessons'> }
      : 'skip'
  )

  const updateProgress = useMutation(api.student.updateProgress)
  const submitProgress = useMutation(api.student.updateProgress)

  useEffect(() => {
    if (data?.progress?.completed) {
      setLessonCompleted(true)
    }
  }, [data?.progress?.completed])

  const handleProgress = useCallback(
    async (watched: number, total: number) => {
      if (!courseId || !lessonId) return
      try {
        await updateProgress({
          lessonId: lessonId as Id<'lessons'>,
          courseId: courseId as Id<'courses'>,
          watchedSeconds: watched,
          totalSeconds: total,
        })
      } catch {
        // Falha silenciosa — próxima chamada vai tentar novamente
      }
    },
    [courseId, lessonId, updateProgress]
  )

  const handleComplete = useCallback(async () => {
    if (!courseId || !lessonId) return
    setLessonCompleted(true)
    try {
      await submitProgress({
        lessonId: lessonId as Id<'lessons'>,
        courseId: courseId as Id<'courses'>,
        watchedSeconds: data?.lesson.durationSeconds ?? 0,
        totalSeconds: data?.lesson.durationSeconds ?? 0,
      })
    } catch {
      // Silencioso
    }
  }, [courseId, lessonId, submitProgress, data?.lesson.durationSeconds])

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (!data) {
    navigate(`/dashboard/meus-cursos/${courseId}`, { replace: true })
    return null
  }

  const { lesson, course, module: mod, progress, quiz, prevLesson, nextLesson, lessonIndex, totalLessons } = data

  const progressPercent = progress
    ? progress.totalSeconds > 0
      ? Math.round((progress.watchedSeconds / progress.totalSeconds) * 100)
      : 0
    : 0

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to={`/dashboard/meus-cursos/${courseId}`}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:block">Voltar ao curso</span>
          </Link>

          <div className="mx-2 h-4 w-px bg-gray-200 flex-shrink-0" />

          <nav className="flex min-w-0 items-center gap-1.5 text-xs text-gray-400 overflow-hidden">
            <span className="flex-shrink-0 hidden sm:block truncate max-w-[120px]">{course.title}</span>
            <span className="flex-shrink-0 hidden sm:block">/</span>
            {mod && <span className="flex-shrink-0 hidden sm:block truncate max-w-[100px]">{mod.title}</span>}
            {mod && <span className="flex-shrink-0 hidden sm:block">/</span>}
            <span className="truncate font-medium text-gray-700">{lesson.title}</span>
          </nav>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">{lessonIndex}/{totalLessons}</span>
            {lessonCompleted && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Concluída
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Coluna principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">

            {/* Player */}
            <VideoPlayer
              youtubeUrl={lesson.youtubeUrl}
              initialWatched={progress?.watchedSeconds ?? 0}
              totalSeconds={lesson.durationSeconds ?? 0}
              onProgress={handleProgress}
              onComplete={handleComplete}
            />

            {/* Progresso da aula */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span>Progresso da aula</span>
                <span className="font-semibold text-gray-600">{lessonCompleted ? 100 : progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#F37E20] transition-all duration-500"
                  style={{ width: `${lessonCompleted ? 100 : progressPercent}%` }}
                />
              </div>
            </div>

            {/* Info da aula */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                {mod?.title}
              </p>
              <h1 className="font-display text-2xl font-bold text-gray-900">{lesson.title}</h1>
              {lesson.description && (
                <p className="mt-3 text-sm leading-7 text-gray-600">{lesson.description}</p>
              )}
            </div>

            {/* Quiz */}
            {lesson.hasMandatoryQuiz && quiz && (
              <div className="mt-8">
                <h2 className="mb-4 font-display text-lg font-bold text-gray-800">Quiz</h2>
                <QuizBlock
                  quiz={quiz as QuizData}
                  lessonCompleted={lessonCompleted}
                  courseId={courseId ?? ''}
                  lessonId={lessonId ?? ''}
                  alreadySubmitted={progress?.quizScore !== undefined}
                  initialScore={progress?.quizScore}
                />
              </div>
            )}

            {/* Navegação entre aulas */}
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
              {prevLesson ? (
                <Link
                  to={`/dashboard/meus-cursos/${courseId}/aula/${prevLesson._id}`}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  <span className="hidden sm:block">Anterior</span>
                </Link>
              ) : <div />}

              {nextLesson ? (
                <Link
                  to={`/dashboard/meus-cursos/${courseId}/aula/${nextLesson._id}`}
                  className="flex items-center gap-2 rounded-xl bg-[#F37E20] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#e06e10]"
                >
                  <span>Próxima aula</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              ) : (
                <Link
                  to={`/dashboard/meus-cursos/${courseId}`}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600"
                >
                  Ver progresso do curso
                </Link>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar contextual (desktop) */}
        <aside className="hidden lg:flex w-80 flex-col border-l border-gray-200 bg-white overflow-hidden flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSidebarTab(tab.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-3 text-xs font-semibold transition-all whitespace-nowrap border-b-2 -mb-px',
                  sidebarTab === tab.id
                    ? 'border-[#F37E20] text-[#F37E20]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo da aba */}
          <div className="flex-1 overflow-y-auto">
            <SidebarContent tab={sidebarTab} lesson={lesson} />
          </div>
        </aside>
      </div>

      {/* Mobile: abas do sidebar */}
      <div className="lg:hidden border-t border-gray-200 bg-white">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {SIDEBAR_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSidebarTab(tab.id)}
              className={cn(
                'flex-shrink-0 px-4 py-3 text-xs font-semibold transition-all whitespace-nowrap border-b-2 -mb-px',
                sidebarTab === tab.id
                  ? 'border-[#F37E20] text-[#F37E20]'
                  : 'border-transparent text-gray-500'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="min-h-[200px]">
          <SidebarContent tab={sidebarTab} lesson={lesson} />
        </div>
      </div>
    </div>
  )
}
