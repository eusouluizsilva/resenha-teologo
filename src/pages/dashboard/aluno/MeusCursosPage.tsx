import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { brandPanelClass, brandPanelSoftClass, brandStatusPillClass, cn } from '@/lib/brand'
import { BannerCursosObrigatorios } from '@/components/aluno/BannerCursosObrigatorios'
import { CursosRecomendados } from '@/components/aluno/CursosRecomendados'
import { EmptyBooksIllustration } from '@/components/ui/EmptyIllustration'

function levelLabel(level: string) {
  if (level === 'iniciante') return 'Iniciante'
  if (level === 'intermediario') return 'Intermediario'
  return 'Avancado'
}

function levelTone(level: string): 'success' | 'info' | 'accent' {
  if (level === 'iniciante') return 'success'
  if (level === 'intermediario') return 'info'
  return 'accent'
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full bg-[#F37E20] transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}

type CourseRowProps = {
  course: {
    _id: string
    title: string
    category: string
    level: string
    totalLessons: number
    thumbnail?: string
    slug?: string
  }
  completedLessons: number
  totalLessons: number
  percentage: number
  certificateIssued: boolean
}

function CourseCard({ course, completedLessons, totalLessons, percentage, certificateIssued }: CourseRowProps) {
  const thumb = course.thumbnail ?? null

  return (
    <Link
      to={`/dashboard/meus-cursos/${course.slug ?? course._id}`}
      className={cn(
        'group flex flex-col overflow-hidden transition-all duration-200 hover:border-white/14 hover:shadow-[0_32px_80px_rgba(0,0,0,0.35)]',
        brandPanelClass,
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#111820]">
        {thumb ? (
          <img src={thumb} alt={course.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-white/14" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
            </svg>
          </div>
        )}
        {certificateIssued && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-emerald-400/22 bg-[#0F141A]/80 px-2.5 py-1 backdrop-blur-sm">
            <svg className="h-3.5 w-3.5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.58 3.737 3.745 3.745 0 01-3.596 1.436 3.745 3.745 0 01-2.807 1.324 3.745 3.745 0 01-2.807-1.324 3.745 3.745 0 01-3.597-1.436 3.745 3.745 0 01-.58-3.737A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.58-3.737 3.745 3.745 0 013.597-1.436 3.745 3.745 0 012.807-1.324 3.745 3.745 0 012.807 1.324 3.745 3.745 0 013.596 1.436 3.745 3.745 0 01.58 3.737A3.745 3.745 0 0121 12z" />
            </svg>
            <span className="text-[10px] font-semibold text-emerald-300">Certificado</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={brandStatusPillClass(levelTone(course.level))}>{levelLabel(course.level)}</span>
          <span className={brandStatusPillClass('neutral')}>{course.category}</span>
        </div>

        <h3 className="font-display text-base font-semibold leading-snug text-white group-hover:text-[#F2BD8A] transition-colors duration-200">
          {course.title}
        </h3>

        <div className="mt-auto pt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-white/42">{completedLessons} de {totalLessons} aulas</span>
            <span className="text-xs font-semibold text-[#F2BD8A]">{percentage}%</span>
          </div>
          <ProgressBar value={percentage} />
        </div>
      </div>
    </Link>
  )
}

export function MeusCursosPage() {
  const data = useQuery(api.enrollments.listByStudent)

  const isLoading = data === undefined

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Meus cursos"
      description="Todos os cursos em que voce esta matriculado, com progresso e acesso rapido a proxima aula."
      maxWidthClass="max-w-6xl"
      actions={
        <Link
          to="/cursos"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-semibold text-white/86 transition-all duration-200 hover:border-white/20 hover:bg-white/8"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Explorar cursos
        </Link>
      }
    >
      <div className="mb-6">
        <BannerCursosObrigatorios />
      </div>
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn('animate-pulse overflow-hidden', brandPanelClass)}>
              <div className="aspect-video w-full bg-white/6" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 rounded-full bg-white/8" />
                <div className="h-5 w-3/4 rounded-lg bg-white/8" />
                <div className="h-3 w-full rounded-full bg-white/6" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <DashboardEmptyState
          illustration={<EmptyBooksIllustration />}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="Nenhum curso ainda"
          description="Explore o catalogo e matricule-se gratuitamente em cursos de teologia, historia biblica e muito mais."
          action={
            <Link
              to="/cursos"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#F37E20] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#e06e10]"
            >
              Ver catalogo de cursos
            </Link>
          }
        />
      ) : (
        <>
          <div className={cn('grid grid-cols-3 gap-px overflow-hidden text-center', brandPanelSoftClass)}>
            {[
              { label: 'Matriculado em', value: data.length, sub: data.length === 1 ? 'curso' : 'cursos' },
              { label: 'Aulas concluidas', value: data.reduce((acc: number, d) => acc + (d?.completedLessons ?? 0), 0), sub: 'no total' },
              { label: 'Certificados', value: data.filter((d) => d?.enrollment.certificateIssued).length, sub: 'emitidos' },
            ].map((stat) => (
              <div key={stat.label} className="px-5 py-6">
                <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-white/48">{stat.label}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-white/28">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {data.map((item: NonNullable<typeof data>[number]) => {
              if (!item) return null
              return (
                <CourseCard
                  key={item.enrollment._id}
                  course={item.course}
                  completedLessons={item.completedLessons}
                  totalLessons={item.totalLessons}
                  percentage={item.percentage}
                  certificateIssued={item.enrollment.certificateIssued}
                />
              )
            })}
          </div>

          <div className="mt-8">
            <CursosRecomendados limit={4} />
          </div>
        </>
      )}
    </DashboardPageShell>
  )
}
