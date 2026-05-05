import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'
import { PainelBiblia, type BiblePanelInitialRef } from '@/components/PainelBiblia'
import { BotaoDoar } from '@/components/doar/BotaoDoar'
import { SecaoFlashcardsAula } from '@/components/aula/SecaoFlashcardsAula'
import { AvisoCursoEmConstrucao } from '@/components/aula/AvisoCursoEmConstrucao'
import { ToastCelebracaoAula } from '@/components/aula/ToastCelebracaoAula'
import { BotaoComunidadeWhatsApp } from '@/components/aula/BotaoComunidadeWhatsApp'
import { CursosRelacionados } from '@/components/aluno/CursosRelacionados'

import { COMPLETION_RATIO, type YTPlayer } from './aula/player-helpers'
import type { QuizData, QuizProgressState, VerseRef } from './aula/types'
import { VideoPlayer } from './aula/VideoPlayer'
import { VersesSection } from './aula/VersesSection'
import { TimestampNotesSection } from './aula/TimestampNotesSection'
import { PrivateQuestionsSection } from './aula/PrivateQuestionsSection'
import { NotebookSection } from './aula/NotebookSection'
import { MaterialsSection } from './aula/MaterialsSection'
import { ForumSection } from './aula/ForumSection'
import { QuizSection } from './aula/QuizSection'
import { AulaPageSkeleton } from './aula/AulaPageSkeleton'
import { useAlunoTheme } from '@/lib/alunoTheme'
import { AlunoThemeToggle } from '@/components/aluno/AlunoThemeToggle'

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
  // (SinoNotificacoes) silenciarem som/abertura automática.
  const [studyDeep, setStudyDeep] = useState(false)
  const [alunoTheme] = useAlunoTheme()
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReachedThresholdLocal(false)
  }, [lessonId, data?.progress?.watchResetAt])

  // Celebração ao concluir aula. Dispara apenas na transição não-concluída →
  // concluída; evita firing no primeiro render quando a aula já estava
  // concluída ao abrir a página.
  const [celebrationTrigger, setCelebrationTrigger] = useState(0)
  const prevCompletedRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (!data) return
    const completed = Boolean(data.progress?.completed)
    if (prevCompletedRef.current === null) {
      prevCompletedRef.current = completed
      return
    }
    if (prevCompletedRef.current === false && completed) {
      setCelebrationTrigger((t) => t + 1)
    }
    prevCompletedRef.current = completed
  }, [data])
  useEffect(() => {
    // Resetar ao trocar de aula para que a próxima possa celebrar.
    prevCompletedRef.current = null
  }, [lessonId])

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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
    return <AulaPageSkeleton />
  }

  if (!data) {
    return <AulaPageSkeleton />
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
      data-aluno-theme={alunoTheme}
      className={cn(
        'flex flex-col bg-[#F7F5F2]',
        studyDeep
          ? 'fixed inset-0 z-[60] min-h-screen overflow-y-auto'
          : 'min-h-screen',
      )}
    >
      <ToastCelebracaoAula trigger={celebrationTrigger} />
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
            <AlunoThemeToggle size="sm" />
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

              <BotaoDoar tone="light" variant="inline" />
            </div>
          </div>

          {/* 3b. Comunidade no WhatsApp do Pr Luiz Silva */}
          <BotaoComunidadeWhatsApp />

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
          <SecaoFlashcardsAula courseId={courseId as Id<'courses'>} />

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
            <AvisoCursoEmConstrucao
              courseId={courseId as Id<'courses'>}
              scheduleText={course.nextLessonScheduleText ?? null}
              nextScheduledLessonAt={nextScheduledLesson?.publishAt ?? null}
            />
          ) : null}

          {/* 11. Cursos relacionados — só na última aula (sem nextLesson) e em
               cursos finalizados. Em cursos in_progress o AvisoCursoEmConstrucao
               já cobre essa função. */}
          {!nextLesson && course.releaseStatus !== 'in_progress' ? (
            <CursosRelacionados courseId={courseId as Id<'courses'>} limit={4} />
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

      <PainelBiblia
        open={bibleOpen}
        onClose={() => setBibleOpen(false)}
        initialRef={bibleRef}
      />
    </div>
  )
}
