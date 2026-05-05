import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'
import { CourseForum } from '@/components/cursoForum/CourseForum'
import { AvaliacaoCursoModal } from '@/components/aluno/AvaliacaoCursoModal'
import { CursosRelacionados } from '@/components/aluno/CursosRelacionados'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAlunoTheme } from '@/lib/alunoTheme'
import { AlunoThemeToggle } from '@/components/aluno/AlunoThemeToggle'
import { StreakIndicatorLight } from '@/components/aluno/StreakIndicatorLight'

type LessonWithSlug = {
  _id: string
  slug?: string
  title: string
  durationSeconds?: number
  isPublished: boolean
  progress: { completed: boolean; watchedSeconds: number; totalSeconds: number } | null
}

function ProgressBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2.5' : 'h-1.5'
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-gray-200', h)}>
      <div
        className={cn('h-full rounded-full bg-[#F37E20] transition-all duration-500', h)}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}

function LessonStateIcon({ completed, current }: { completed: boolean; current: boolean }) {
  if (completed) {
    return (
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    )
  }
  if (current) {
    return (
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F37E20]/20 text-[#F37E20]">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-400">
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
      </svg>
    </div>
  )
}

function ModuleSection({
  mod,
  courseId,
  nextLessonId,
  defaultOpen,
}: {
  mod: {
    _id: string
    title: string
    lessons: LessonWithSlug[]
  }
  courseId: string
  nextLessonId: string | undefined
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const published = mod.lessons.filter((l) => l.isPublished)
  const completed = published.filter((l) => l.progress?.completed).length

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 text-xs font-bold text-gray-400">{String(mod._id).slice(-2)}</div>
          <span className="text-sm font-semibold text-gray-800 truncate">{mod.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400">{completed}/{published.length}</span>
          <svg className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', open && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && published.length > 0 && (
        <div className="border-t border-gray-100">
          {published.map((lesson) => {
            const isCurrent = lesson._id === nextLessonId
            const isDone = lesson.progress?.completed ?? false
            return (
              <Link
                key={lesson._id}
                to={`/dashboard/meus-cursos/${courseId}/aula/${lesson.slug ?? lesson._id}`}
                className={cn(
                  'flex items-center gap-3 px-6 py-3 transition-all duration-150',
                  isCurrent ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50',
                  isDone && 'opacity-80',
                )}
              >
                <LessonStateIcon completed={isDone} current={isCurrent} />
                <span className={cn('flex-1 text-sm leading-5', isDone ? 'text-gray-500 line-through' : isCurrent ? 'font-semibold text-[#F37E20]' : 'text-gray-700')}>
                  {lesson.title}
                </span>
                {lesson.durationSeconds && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {Math.floor(lesson.durationSeconds / 60)}min
                  </span>
                )}
                {isCurrent && (
                  <span className="flex-shrink-0 rounded-full bg-[#F37E20] px-2 py-0.5 text-[10px] font-bold text-white">
                    Continuar
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Skeleton da página interna do curso. Reproduz hero + barra de progresso +
// lista de módulos com aulas. Usado enquanto `student.getCourseDetail` carrega.
function CursoInternoSkeleton() {
  const [alunoTheme] = useAlunoTheme()
  return (
    <div data-aluno-theme={alunoTheme} className="min-h-[60vh] bg-[#F7F5F2]">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#E6DBCF] bg-white p-6 md:flex-row md:items-center">
          <Skeleton variant="light" className="h-32 w-full md:w-56" rounded="xl" />
          <div className="flex-1 space-y-3">
            <Skeleton variant="light" className="h-6 w-3/4" />
            <Skeleton variant="light" className="h-4 w-1/2" />
            <Skeleton variant="light" className="h-2 w-full" rounded="full" />
            <div className="flex gap-2">
              <Skeleton variant="light" className="h-9 w-32" rounded="full" />
              <Skeleton variant="light" className="h-9 w-28" rounded="full" />
            </div>
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, m) => (
          <div key={m} className="rounded-2xl border border-[#E6DBCF] bg-white p-5 space-y-3">
            <Skeleton variant="light" className="h-5 w-1/3" />
            {Array.from({ length: 4 }).map((_, l) => (
              <div key={l} className="flex items-center gap-3 border-t border-[#F0E7DC] pt-3">
                <Skeleton variant="light" className="h-8 w-8" rounded="full" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="light" className="h-3.5 w-2/3" />
                  <Skeleton variant="light" className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CursoInternoPage() {
  const { courseId: rawCourseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [ratingDismissed, setRatingDismissed] = useState(false)
  const [alunoTheme] = useAlunoTheme()

  useEffect(() => {
    if (searchParams.get('matriculado') === '1') {
      // Banner de sucesso pós-matrícula, auto-dismiss em 4s.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuccess(true)
      const t = setTimeout(() => setShowSuccess(false), 4000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  // Resolve slug to real ID if the param contains hyphens
  const slugLookup = useQuery(
    api.catalog.getBySlug,
    rawCourseId && rawCourseId.includes('-') ? { slug: rawCourseId } : 'skip'
  )
  const resolvedCourseId = rawCourseId?.includes('-')
    ? (slugLookup?._id ?? null)
    : rawCourseId

  const data = useQuery(
    api.student.getEnrolledCourse,
    resolvedCourseId ? { courseId: resolvedCourseId as Id<'courses'> } : 'skip'
  )

  const myCourseRating = useQuery(
    api.student.getMyCourseRating,
    resolvedCourseId ? { courseId: resolvedCourseId as Id<'courses'> } : 'skip',
  )

  useEffect(() => {
    if (data === null && rawCourseId) {
      navigate(`/cursos/${rawCourseId}`, { replace: true })
    }
  }, [data, rawCourseId, navigate])

  useEffect(() => {
    if (
      data &&
      data.enrollment.certificateIssued &&
      myCourseRating === null &&
      !ratingDismissed &&
      !ratingOpen
    ) {
      // Convida o aluno a avaliar quando o certificado foi emitido.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRatingOpen(true)
    }
  }, [data, myCourseRating, ratingDismissed, ratingOpen])

  if (data === undefined || (rawCourseId?.includes('-') && slugLookup === undefined)) {
    return <CursoInternoSkeleton />
  }

  if (!data) {
    return <CursoInternoSkeleton />
  }

  const { course, creator, modules, completedLessons, totalLessons, percentage, avgScore, nextLesson, nextScheduledLesson, enrollment } = data

  const courseId = rawCourseId ?? ''
  const isInProgress = course.releaseStatus === 'in_progress'

  const nextLessonHref = nextLesson
    ? `/dashboard/meus-cursos/${courseId}/aula/${(nextLesson as { slug?: string })?.slug ?? nextLesson._id}`
    : null

  const certificateStatus = enrollment.certificateIssued
    ? 'emitido'
    : isInProgress
    ? 'em_producao'
    : avgScore !== null && avgScore >= 70 && completedLessons === totalLessons
    ? 'disponivel'
    : 'pendente'

  const formatScheduled = (ts: number) => {
    const d = new Date(ts)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd}/${mm}`
  }

  return (
    <div data-aluno-theme={alunoTheme} className="min-h-screen bg-[#F7F5F2]">
      {/* Banner de sucesso de matrícula */}
      {showSuccess && (
        <div className="bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white animate-fadeIn">
          Matrícula realizada com sucesso. Bom estudo!
        </div>
      )}

      {/* Header do curso */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center justify-between gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-2 min-w-0">
              <Link to="/dashboard/meus-cursos" className="hover:text-gray-600 transition-colors">Meus cursos</Link>
              <span>/</span>
              <span className="text-gray-600 font-medium line-clamp-1">{course.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <StreakIndicatorLight compact />
              <AlunoThemeToggle size="sm" />
            </div>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {course.thumbnail && (
              <div className="sm:w-48 sm:flex-shrink-0">
                <img src={course.thumbnail} alt={course.title} className="w-full rounded-xl object-cover aspect-video sm:aspect-[4/3]" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {course.category}
                </span>
              </div>

              <h1 className="font-display text-2xl font-bold text-gray-900 leading-snug">{course.title}</h1>
              <p className="mt-1.5 text-sm text-gray-500">Por {creator.name}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{completedLessons} de {totalLessons} aulas concluídas</span>
                  <span className="font-bold text-[#F37E20]">{percentage}%</span>
                </div>
                <ProgressBar value={percentage} size="lg" />
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {avgScore !== null && (
                  <span className="text-gray-600">
                    Média atual: <strong className={cn('font-bold', avgScore >= 70 ? 'text-emerald-600' : 'text-red-500')}>{avgScore}%</strong>
                  </span>
                )}
                <span className={cn(
                  'font-semibold',
                  certificateStatus === 'emitido' ? 'text-emerald-600' :
                  certificateStatus === 'disponivel' ? 'text-[#F37E20]' :
                  'text-gray-400'
                )}>
                  {certificateStatus === 'emitido' ? 'Certificado emitido' :
                   certificateStatus === 'disponivel' ? 'Certificado disponível' :
                   certificateStatus === 'em_producao' ? 'Certificado liberado ao final do curso' :
                   'Certificado pendente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isInProgress && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-5xl items-start gap-3 px-4 py-3 sm:px-6">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm leading-6 text-amber-900">
              <strong className="font-semibold">Curso em produção.</strong>{' '}
              {nextScheduledLesson
                ? `Próxima aula prevista para ${formatScheduled(nextScheduledLesson.publishAt)}.`
                : 'O criador está publicando aulas aos poucos. Acompanhe por aqui.'}
              {' '}O certificado será liberado quando o curso for finalizado.
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">

          {/* Módulos, aulas e fórum */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold text-gray-800">Estrutura do curso</h2>
              {modules.map((mod, i) => {
                const hasCurrentLesson = mod.lessons.some((l) => l._id === nextLesson?._id)
                return (
                  <ModuleSection
                    key={mod._id}
                    mod={mod}
                    courseId={courseId ?? ''}
                    nextLessonId={nextLesson?._id}
                    defaultOpen={hasCurrentLesson || i === 0}
                  />
                )
              })}
            </div>

            <CourseForum courseId={course._id as Id<'courses'>} />

            <CursosRelacionados courseId={course._id as Id<'courses'>} limit={4} />
          </div>

          {/* Painel lateral */}
          <div className="space-y-4">

            {/* CTA próxima aula */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              {totalLessons === 0 ? (
                <>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-700">Aulas em breve</p>
                  <p className="mt-1 text-sm text-gray-400">O criador ainda está preparando o conteúdo. Volte em breve.</p>
                </>
              ) : nextLessonHref ? (
                <>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Próxima aula</p>
                  <p className="mb-4 text-sm font-semibold text-gray-800 leading-snug">{nextLesson?.title}</p>
                  <Link
                    to={nextLessonHref}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F37E20] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#e06e10]"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                    </svg>
                    {completedLessons === 0 ? 'Começar primeira aula' : 'Continuar de onde parei'}
                  </Link>
                </>
              ) : isInProgress ? (
                <>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-800">Você está em dia</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {nextScheduledLesson
                      ? `Próxima aula prevista para ${formatScheduled(nextScheduledLesson.publishAt)}.`
                      : 'O criador ainda vai publicar mais aulas. Volte em breve.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-800">Curso concluído!</p>
                  <p className="mt-1 text-sm text-gray-500">Todas as aulas foram assistidas.</p>
                </>
              )}
            </div>

            {/* Regra do certificado */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Certificado</p>
              <div className="space-y-2.5">
                {isInProgress && (
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-gray-200" />
                    <p className="text-sm text-gray-600">Aguardar a finalização do curso</p>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', completedLessons === totalLessons && totalLessons > 0 ? 'bg-emerald-500' : 'bg-gray-200')} />
                  <p className="text-sm text-gray-600">
                    Concluir todas as aulas {course.expectedTotalLessons && isInProgress
                      ? `(${completedLessons}/${course.expectedTotalLessons} previstas)`
                      : `(${completedLessons}/${totalLessons})`}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', avgScore !== null && avgScore >= 70 ? 'bg-emerald-500' : 'bg-gray-200')} />
                  <p className="text-sm text-gray-600">
                    Média mínima de 70% nos quizzes {avgScore !== null ? `(atual: ${avgScore}%)` : ''}
                  </p>
                </div>
              </div>
              {enrollment.certificateIssued && (
                <div className="mt-4">
                  <Link
                    to="/dashboard/certificados"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100"
                  >
                    Ver certificado
                  </Link>
                </div>
              )}
            </div>

            {enrollment.certificateIssued && course.category && (
              <div className="rounded-2xl border border-[#F37E20]/24 bg-[#F37E20]/5 p-5 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#B5560F]">Próximos passos</p>
                <p className="text-sm leading-6 text-gray-700">
                  Você concluiu este curso. Continue aprendendo com outros estudos de
                  <span className="font-semibold"> {course.category}</span>.
                </p>
                <Link
                  to={`/cursos?categoria=${encodeURIComponent(course.category)}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F37E20] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#e06e10]"
                >
                  Ver mais cursos
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            )}

            {enrollment.certificateIssued && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {myCourseRating ? 'Sua avaliação' : 'Avalie este curso'}
                </p>
                {myCourseRating ? (
                  <>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <svg
                          key={n}
                          className={cn(
                            'h-5 w-5',
                            myCourseRating.stars >= n
                              ? 'fill-[#F37E20] text-[#F37E20]'
                              : 'fill-transparent text-gray-300',
                          )}
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      ))}
                    </div>
                    {myCourseRating.review ? (
                      <p className="mt-3 text-sm leading-6 text-gray-700">"{myCourseRating.review}"</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setRatingOpen(true)}
                      className="mt-4 text-xs font-semibold text-[#B5560F] hover:underline"
                    >
                      Editar avaliação
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-6 text-gray-700">
                      Compartilhe o que achou do curso. Sua opinião ajuda outros alunos.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRatingDismissed(false)
                        setRatingOpen(true)
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#F37E20]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#B5560F] transition-all hover:bg-[#F37E20]/5"
                    >
                      Avaliar agora
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Criador */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Professor</p>
              <div className="flex items-center gap-3">
                {creator.avatarUrl ? (
                  <img src={creator.avatarUrl} alt={creator.name} className="h-10 w-10 flex-shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#F37E20] font-bold text-sm">
                    {creator.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{creator.name}</p>
                  {creator.bio && <p className="mt-0.5 text-xs leading-5 text-gray-500 line-clamp-2">{creator.bio}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {resolvedCourseId ? (
        <AvaliacaoCursoModal
          open={ratingOpen}
          onClose={() => {
            setRatingOpen(false)
            setRatingDismissed(true)
          }}
          courseId={resolvedCourseId as Id<'courses'>}
          courseTitle={course.title}
          initialStars={myCourseRating?.stars ?? null}
          initialReview={myCourseRating?.review ?? null}
        />
      ) : null}
    </div>
  )
}
