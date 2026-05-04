import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import { brandEyebrowClass, brandPanelClass, brandPanelSoftClass, cn } from '@/lib/brand'
import type { Id } from '@convex/_generated/dataModel'
import { ReferralCard } from '@/components/aluno/ReferralCard'
import { BannerCursosObrigatorios } from '@/components/aluno/BannerCursosObrigatorios'
import { CursosRecomendados } from '@/components/aluno/CursosRecomendados'

function formatHours(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  if (totalSeconds < 3600) return `${Math.round(totalSeconds / 60)}min`
  const hours = totalSeconds / 3600
  return `${hours.toFixed(1)}h`
}

function StatBlock({ label, value, accent = false, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div
      className={cn(
        'rounded-[1.4rem] border p-5',
        accent
          ? 'border-[#F37E20]/24 bg-[#F37E20]/10'
          : 'border-white/7 bg-white/[0.025]',
      )}
    >
      <p className={cn('font-display text-2xl font-bold', accent ? 'text-[#F2BD8A]' : 'text-white')}>{value}</p>
      <p className="mt-1 text-xs text-white/48">{label}</p>
      {sub ? <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/36">{sub}</p> : null}
    </div>
  )
}

// Card "Sua jornada hoje". Ritualiza o hábito diário do aluno: confirma se já
// estudou hoje (com base em studentStats.lastStudyDate vs. data UTC atual),
// mostra o estado da sequência e oferece o atalho mais relevante (continuar
// próxima aula ou explorar catálogo). É uma camada acima do "Continue de onde
// parou": foca em manter o dia ativo, não no curso em si.
function JornadaHojeCard({
  streak,
  bestStreak,
  lastStudyDate,
  hasNextLesson,
  nextLink,
}: {
  streak: number
  bestStreak: number
  lastStudyDate: string | null
  hasNextLesson: boolean
  nextLink: string
}) {
  // Dia atual em UTC (mesmo formato usado em gamification.utcDateKey).
  const todayUtc = new Date().toISOString().slice(0, 10)
  const studiedToday = lastStudyDate === todayUtc
  const showRecord = bestStreak > streak && bestStreak > 0

  return (
    <div className={cn('p-6', brandPanelClass)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={cn('mb-3', brandEyebrowClass)}>Sua jornada hoje</p>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border',
                studiedToday
                  ? 'border-emerald-400/24 bg-emerald-400/10 text-emerald-300'
                  : 'border-[#F37E20]/24 bg-[#F37E20]/10 text-[#F37E20]',
              )}
            >
              {studiedToday ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold text-white">
                {studiedToday
                  ? 'Você já estudou hoje'
                  : streak > 0
                    ? 'Estude hoje para manter sua sequência'
                    : 'Comece sua sequência hoje'}
              </p>
              <p className="mt-0.5 text-sm text-white/56">
                {streak > 0 ? (
                  <>
                    {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
                    {showRecord ? <span className="text-white/36"> · recorde {bestStreak}</span> : null}
                  </>
                ) : (
                  'Cada dia conta. Concluir uma aula já garante o dia.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={nextLink}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#F37E20] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#E06A10]"
        >
          {hasNextLesson ? 'Continuar próxima aula' : 'Explorar catálogo'}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
        <Link
          to="/dashboard/conquistas"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/72 transition-all hover:border-white/24 hover:bg-white/[0.06] hover:text-white"
        >
          Ver conquistas
        </Link>
      </div>
    </div>
  )
}

function CourseProgressCard({
  courseId,
  courseTitle,
  courseThumbnail,
  percentage,
  completedLessons,
  totalLessons,
  nextLessonId,
  nextLessonTitle,
  certificateIssued,
}: {
  courseId: Id<'courses'>
  courseTitle: string
  courseThumbnail?: string
  percentage: number
  completedLessons: number
  totalLessons: number
  nextLessonId?: Id<'lessons'>
  nextLessonTitle?: string
  certificateIssued: boolean
}) {
  const href = nextLessonId
    ? `/dashboard/meus-cursos/${courseId}/aula/${nextLessonId}`
    : `/dashboard/meus-cursos/${courseId}`

  return (
    <Link
      to={href}
      className={cn(
        'flex gap-4 p-4 transition-all hover:border-[#F37E20]/24 hover:brightness-110',
        brandPanelSoftClass,
      )}
    >
      <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-white/8 bg-black/30">
        {courseThumbnail ? (
          <img src={courseThumbnail} alt={courseTitle} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-medium text-white">{courseTitle}</p>
          {certificateIssued && (
            <span className="flex-shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
              Concluído
            </span>
          )}
        </div>
        {nextLessonTitle && !certificateIssued && (
          <p className="mt-0.5 truncate text-xs text-white/40">
            Próxima: {nextLessonTitle}
          </p>
        )}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
            <span>
              {completedLessons} de {totalLessons} aulas
            </span>
            <span>{percentage}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-[#F37E20] transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

export function AlunoDashboardPage() {
  const data = useQuery(api.student.getStudentDashboard, {})
  const stats = useQuery(api.gamification.getMyStats, {})

  if (data === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Painel do aluno"
        title="Bem-vindo de volta"
        description="Carregando seus cursos e progresso..."
        maxWidthClass="max-w-5xl"
      >
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      </DashboardPageShell>
    )
  }

  if (!data) {
    return null
  }

  const { totalCoursesEnrolled, totalCoursesCompleted, totalWatchSeconds, continueCourse, inProgress, completed } = data

  // Aluno sem matrículas: CTA direto para o catálogo.
  if (totalCoursesEnrolled === 0) {
    return (
      <DashboardPageShell
        eyebrow="Painel do aluno"
        title="Comece sua jornada"
        description="Você ainda não está matriculado em nenhum curso. Explore o catálogo e matricule-se gratuitamente."
        maxWidthClass="max-w-4xl"
      >
        <div className={cn('p-8 text-center', brandPanelClass)}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">Nenhum curso ainda</h3>
          <p className="mt-3 text-sm leading-7 text-white/56">
            Todos os cursos são gratuitos. Encontre conteúdo de teologia, hermenêutica, história da Igreja e muito mais.
          </p>
          <Link
            to="/cursos"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#F37E20] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#E06A10]"
          >
            Explorar catálogo
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Painel do aluno"
      title="Bem-vindo de volta"
      description="Continue de onde parou, acompanhe seu progresso e acesse seus certificados."
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-8">
        <BannerCursosObrigatorios />
        <JornadaHojeCard
          streak={stats?.streak ?? 0}
          bestStreak={stats?.bestStreak ?? 0}
          lastStudyDate={stats?.lastStudyDate ?? null}
          hasNextLesson={!!continueCourse?.nextLessonId}
          nextLink={
            continueCourse?.nextLessonId
              ? `/dashboard/meus-cursos/${continueCourse.courseId}/aula/${continueCourse.nextLessonId}`
              : '/cursos'
          }
        />
        {/* Continue de onde parou */}
        {continueCourse && continueCourse.nextLessonId && (
          <div className={cn('p-6', brandPanelClass)}>
            <p className={cn('mb-4', brandEyebrowClass)}>Continue de onde parou</p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="h-28 w-44 flex-shrink-0 overflow-hidden rounded-xl border border-white/8 bg-black/30">
                {continueCourse.courseThumbnail ? (
                  <img src={continueCourse.courseThumbnail} alt={continueCourse.courseTitle} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-white">{continueCourse.courseTitle}</p>
                {continueCourse.nextLessonTitle && (
                  <p className="mt-1 text-sm text-white/52">
                    Próxima aula: <span className="text-white/72">{continueCourse.nextLessonTitle}</span>
                  </p>
                )}
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
                    <span>{continueCourse.completedLessons} de {continueCourse.totalLessons} aulas</span>
                    <span>{continueCourse.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-[#F37E20] transition-all"
                      style={{ width: `${continueCourse.percentage}%` }}
                    />
                  </div>
                </div>
                <Link
                  to={`/dashboard/meus-cursos/${continueCourse.courseId}/aula/${continueCourse.nextLessonId}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#F37E20] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#E06A10]"
                >
                  Continuar estudando
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock
            label="Sequência de estudos"
            value={`${stats?.streak ?? 0} ${(stats?.streak ?? 0) === 1 ? 'dia' : 'dias'}`}
            accent={(stats?.streak ?? 0) >= 3}
            sub={stats && stats.bestStreak > (stats.streak ?? 0) ? `Recorde ${stats.bestStreak}` : undefined}
          />
          <StatBlock label="Pontos acumulados" value={String(stats?.points ?? 0)} />
          <StatBlock label="Cursos concluídos" value={String(totalCoursesCompleted)} />
          <StatBlock label="Tempo estudado" value={formatHours(totalWatchSeconds)} />
        </div>

        {/* Em andamento */}
        {inProgress.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className={brandEyebrowClass}>Em andamento</p>
              <Link to="/dashboard/meus-cursos" className="text-xs text-[#F2BD8A] hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {inProgress.map((course) => (
                <CourseProgressCard
                  key={String(course.courseId)}
                  courseId={course.courseId}
                  courseTitle={course.courseTitle}
                  courseThumbnail={course.courseThumbnail}
                  percentage={course.percentage}
                  completedLessons={course.completedLessons}
                  totalLessons={course.totalLessons}
                  nextLessonId={course.nextLessonId}
                  nextLessonTitle={course.nextLessonTitle}
                  certificateIssued={course.certificateIssued}
                />
              ))}
            </div>
          </div>
        )}

        {/* Concluídos */}
        {completed.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className={brandEyebrowClass}>Concluídos</p>
              <Link to="/dashboard/certificados" className="text-xs text-[#F2BD8A] hover:underline">
                Certificados
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {completed.map((course) => (
                <CourseProgressCard
                  key={String(course.courseId)}
                  courseId={course.courseId}
                  courseTitle={course.courseTitle}
                  courseThumbnail={course.courseThumbnail}
                  percentage={course.percentage}
                  completedLessons={course.completedLessons}
                  totalLessons={course.totalLessons}
                  certificateIssued={course.certificateIssued}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recomendações personalizadas */}
        <CursosRecomendados limit={4} />

        {/* Programa de indicacao */}
        <ReferralCard />

        {/* CTA para explorar mais */}
        <div className={cn('p-5 text-center', brandPanelSoftClass)}>
          <p className="text-sm text-white/56">
            Procurando novos estudos?{' '}
            <Link to="/cursos" className="font-semibold text-[#F2BD8A] hover:underline">
              Explorar catálogo
            </Link>
          </p>
        </div>
      </div>
    </DashboardPageShell>
  )
}
