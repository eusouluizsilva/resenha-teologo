import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'

type InstitutionRow = {
  _id: Id<'institutions'>
  name: string
  memberRole: 'dono' | 'admin' | 'membro'
}

function levelLabel(l: 'iniciante' | 'intermediario' | 'avancado') {
  if (l === 'iniciante') return 'Iniciante'
  if (l === 'intermediario') return 'Intermediário'
  return 'Avançado'
}

export function CursosInstituicaoPage() {
  const institutions = useQuery(api.institutions.listByUser) as InstitutionRow[] | undefined
  const accessible = institutions ?? []
  const [activeId, setActiveId] = useState<Id<'institutions'> | null>(null)
  const currentId = activeId ?? accessible[0]?._id ?? null
  const courses = useQuery(
    api.institutions.listCourses,
    currentId ? { institutionId: currentId } : 'skip',
  )

  if (institutions === undefined) {
    return (
      <DashboardPageShell eyebrow="Instituição" title="Cursos da instituição" description="">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      </DashboardPageShell>
    )
  }

  if (accessible.length === 0) {
    return (
      <DashboardPageShell
        eyebrow="Instituição"
        title="Cursos da instituição"
        description="Você ainda não faz parte de nenhuma instituição."
      >
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
          title="Nenhuma instituição"
          description="Crie ou peça para ser convidado para uma instituição."
        />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Instituição"
      title="Cursos da instituição"
      description="Cursos publicados pelos professores vinculados à sua instituição. Membros ativos podem acessar."
    >
      {accessible.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {accessible.map((inst) => (
            <button
              key={inst._id}
              type="button"
              onClick={() => setActiveId(inst._id)}
              className={cn(
                'rounded-2xl border px-4 py-2 text-sm font-medium transition-all',
                currentId === inst._id
                  ? 'border-[#F37E20]/40 bg-[#F37E20]/10 text-[#F2BD8A]'
                  : 'border-white/10 bg-white/4 text-white/72 hover:border-white/20 hover:bg-white/8',
              )}
            >
              {inst.name}
            </button>
          ))}
        </div>
      )}

      {courses === undefined ? (
        <div className={cn('animate-pulse p-6', brandPanelClass)}>
          <div className="h-4 w-32 rounded-full bg-white/8" />
        </div>
      ) : courses.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="Nenhum curso vinculado"
          description="Quando um professor publicar um curso vinculado a esta instituição, ele aparecerá aqui."
        />
      ) : (
        <ul className={cn('divide-y divide-white/6 overflow-hidden', brandPanelClass)}>
          {courses.map((c) => (
            <li
              key={c._id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
            >
              {c.thumbnail ? (
                <img
                  src={c.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-16 w-28 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="h-16 w-28 flex-shrink-0 rounded-xl bg-white/8" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-white">{c.title}</p>
                <p className="mt-0.5 text-xs text-white/48">
                  {c.creatorHandle ? (
                    <Link to={`/${c.creatorHandle}`} className="text-[#F2BD8A] hover:text-[#F37E20]">
                      {c.creatorName}
                    </Link>
                  ) : (
                    c.creatorName
                  )}{' '}
                  · {c.totalLessons} aulas · {levelLabel(c.level)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={brandStatusPillClass(c.isPublished ? 'success' : 'neutral')}>
                    {c.isPublished ? 'Publicado' : 'Rascunho'}
                  </span>
                  {c.releaseStatus === 'in_progress' && (
                    <span className={brandStatusPillClass('accent')}>Em produção</span>
                  )}
                  <span className={brandStatusPillClass('neutral')}>
                    {c.visibility === 'institution' ? 'Apenas membros' : 'Público'}
                  </span>
                </div>
              </div>
              {c.isPublished && c.slug && (
                <Link
                  to={`/cursos/${c.slug}`}
                  className="flex-shrink-0 rounded-xl border border-white/12 bg-white/4 px-3 py-2 text-xs font-medium text-white/82 transition-all hover:border-white/22 hover:bg-white/8"
                >
                  Ver curso
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  )
}
