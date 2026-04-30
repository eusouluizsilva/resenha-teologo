import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import {
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardPageShell,
} from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandSecondaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

type LessonMetric = {
  _id: Id<'lessons'>
  title: string
  order: number
  isPublished: boolean
  durationSeconds: number | null
  hasMandatoryQuiz: boolean
  viewers: number
  completers: number
  completionRate: number
  avgWatchedSeconds: number
  avgQuizScore: number | null
  quizAttempts: number
  passRate: number | null
}

type Data = {
  course: { _id: Id<'courses'>; title: string; slug: string | null; totalLessons: number }
  summary: {
    enrolledCount: number
    totalCompletions: number
    overallAvgQuiz: number | null
  }
  lessons: LessonMetric[]
}

function formatDurationShort(s: number | null) {
  if (!s || s <= 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`
  if (m > 0) return `${m}min`
  return `${s}s`
}

export function MetricasCursoPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const data = useQuery(
    api.courseAnalytics.getCourseLessonMetrics,
    courseId ? { courseId: courseId as Id<'courses'> } : 'skip',
  ) as Data | null | undefined

  if (data === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Métricas"
        title="Carregando dados"
        description="Aguarde um instante."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn('h-28 animate-pulse', brandPanelClass)} />
          ))}
        </div>
      </DashboardPageShell>
    )
  }

  if (data === null) {
    return (
      <DashboardPageShell
        eyebrow="Métricas"
        title="Curso não encontrado"
        description="Este curso não existe ou não pertence à sua conta."
      >
        <Link to="/dashboard/cursos" className={brandSecondaryButtonClass}>
          Voltar para cursos
        </Link>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Métricas do curso"
      title={data.course.title}
      description="Indicadores agregados por aula. Use para identificar onde o aluno trava ou onde a explicação precisa de ajuste."
      maxWidthClass="max-w-6xl"
      actions={
        <Link
          to={`/dashboard/cursos/${courseId}/modulos`}
          className={brandSecondaryButtonClass}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardMetricCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          label="Alunos matriculados"
          value={data.summary.enrolledCount.toString()}
        />
        <DashboardMetricCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          }
          label="Conclusões registradas"
          value={data.summary.totalCompletions.toString()}
          sub={`em ${data.lessons.length} aulas`}
        />
        <DashboardMetricCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          label="Nota média geral do quiz"
          value={
            data.summary.overallAvgQuiz === null
              ? '—'
              : `${data.summary.overallAvgQuiz}%`
          }
          accent
        />
      </div>

      {data.lessons.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          title="Sem aulas no curso"
          description="Adicione aulas para começar a acompanhar métricas."
        />
      ) : (
        <div className={cn('overflow-hidden p-0', brandPanelClass)}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/8 bg-white/3 text-xs uppercase tracking-[0.14em] text-white/40">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Aula</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Iniciaram</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Concluíram</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">% conclusão</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Tempo médio</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Quiz médio</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">% aprovados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {data.lessons.map((l) => (
                  <tr key={l._id} className="hover:bg-white/3">
                    <td className="whitespace-nowrap px-4 py-3 text-white/52 tabular-nums">
                      {l.order}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/dashboard/cursos/${courseId}/aula/${l._id}`}
                          className="font-medium text-white hover:text-[#F2BD8A]"
                        >
                          {l.title}
                        </Link>
                        {!l.isPublished ? (
                          <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
                            Rascunho
                          </span>
                        ) : null}
                        {l.hasMandatoryQuiz ? (
                          <span className={brandStatusPillClass('accent')}>Quiz</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-white/40">
                        Duração: {formatDurationShort(l.durationSeconds)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-white/82">
                      {l.viewers}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-white/82">
                      {l.completers}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <CompletionPill rate={l.completionRate} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-white/72 tabular-nums">
                      {formatDurationShort(l.avgWatchedSeconds || null)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-white/82">
                      {l.avgQuizScore === null ? '—' : `${l.avgQuizScore}%`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-white/82">
                      {l.passRate === null ? '—' : `${l.passRate}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardPageShell>
  )
}

function CompletionPill({ rate }: { rate: number }) {
  const tone = rate >= 70 ? 'success' : rate >= 40 ? 'info' : rate > 0 ? 'accent' : 'neutral'
  return <span className={brandStatusPillClass(tone)}>{rate}%</span>
}
