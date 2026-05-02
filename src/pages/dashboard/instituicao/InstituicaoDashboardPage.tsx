import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { brandPanelClass, brandPrimaryButtonClass, cn } from '@/lib/brand'

type InstitutionRow = {
  _id: Id<'institutions'>
  name: string
  type: 'igreja' | 'ensino' | 'empresa'
  memberRole: 'dono' | 'admin' | 'membro'
  themeColor?: string
  logoUrl?: string
  description?: string
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: boolean
}) {
  return (
    <div className={cn('p-5', brandPanelClass, accent && 'border-[#F37E20]/22 bg-[#F37E20]/[0.06]')}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">{label}</p>
      <p className={cn('mt-2 font-display text-3xl font-bold', accent ? 'text-[#F2BD8A]' : 'text-white')}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-white/48">{hint}</p>}
    </div>
  )
}

export function InstituicaoDashboardPage() {
  const institutions = useQuery(api.institutions.listByUser) as InstitutionRow[] | undefined
  const ownedOrAdmin = institutions?.filter((i) => i.memberRole !== 'membro') ?? []
  const [activeId, setActiveId] = useState<Id<'institutions'> | null>(null)
  const currentId = activeId ?? ownedOrAdmin[0]?._id ?? null
  const stats = useQuery(
    api.institutions.getStats,
    currentId ? { institutionId: currentId } : 'skip',
  )
  const institution = useQuery(
    api.institutions.getById,
    currentId ? { institutionId: currentId } : 'skip',
  )

  if (institutions === undefined) {
    return (
      <DashboardPageShell eyebrow="Instituição" title="Painel" description="Visão geral da sua comunidade">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      </DashboardPageShell>
    )
  }

  if (ownedOrAdmin.length === 0) {
    return (
      <DashboardPageShell
        eyebrow="Instituição"
        title="Painel"
        description="Crie sua instituição para começar a acompanhar membros e cursos."
      >
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
          title="Sem instituição cadastrada"
          description="Crie sua igreja, seminário ou empresa para começar a convidar membros."
          action={
            <Link to="/dashboard/membros" className={brandPrimaryButtonClass}>
              Criar instituição
            </Link>
          }
        />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Instituição"
      title="Painel da instituição"
      description="Acompanhe engajamento, certificados emitidos e cursos vinculados."
    >
      {ownedOrAdmin.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {ownedOrAdmin.map((inst) => (
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

      {institution && (
        <div
          className={cn('mb-6 p-5', brandPanelClass)}
          style={
            institution.themeColor
              ? { borderColor: `${institution.themeColor}33` }
              : undefined
          }
        >
          <div className="flex flex-wrap items-center gap-4">
            {institution.logoUrl ? (
              <img
                src={institution.logoUrl}
                alt={institution.name}
                className="h-14 w-14 rounded-xl object-contain"
                style={{
                  backgroundColor: institution.themeColor
                    ? `${institution.themeColor}14`
                    : 'rgba(255,255,255,0.04)',
                  padding: '6px',
                }}
              />
            ) : null}
            <div className="min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: institution.themeColor ?? '#F2BD8A' }}
              >
                {institution.type === 'igreja' ? 'Igreja' : institution.type === 'ensino' ? 'Instituição de ensino' : 'Empresa'}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">{institution.name}</h2>
              {institution.description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
                  {institution.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {stats === undefined || stats === null ? (
        <div className={cn('animate-pulse p-6', brandPanelClass)}>
          <div className="h-4 w-32 rounded-full bg-white/8" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Membros ativos" value={stats.members} hint={`${stats.pendingInvites} convite${stats.pendingInvites === 1 ? '' : 's'} pendente${stats.pendingInvites === 1 ? '' : 's'}`} />
            <StatCard label="Cursos vinculados" value={stats.totalCourses} hint={`${stats.publishedCourses} publicado${stats.publishedCourses === 1 ? '' : 's'}`} />
            <StatCard label="Matrículas" value={stats.totalEnrollments} hint={`${stats.totalCertificates} certificado${stats.totalCertificates === 1 ? '' : 's'} emitido${stats.totalCertificates === 1 ? '' : 's'}`} />
            <StatCard label="Conclusão" value={`${stats.completionRate}%`} hint="Cursos concluídos / matrículas" accent />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Aulas concluídas"
              value={stats.totalLessonsCompleted}
              hint="Total acumulado pelos membros"
            />
            <StatCard
              label="Atividade recente"
              value={stats.lessonsCompletedLast30d}
              hint="Aulas concluídas nos últimos 30 dias"
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Link
              to="/dashboard/membros"
              className={cn('group flex flex-col gap-2 p-5 transition-all hover:border-[#F37E20]/30', brandPanelClass)}
            >
              <p className="text-sm font-semibold text-white">Membros e convites</p>
              <p className="text-xs text-white/48">Gerencie quem participa, envie convites e altere papéis.</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#F2BD8A] group-hover:text-[#F37E20]">
                Abrir
                <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </Link>
            <Link
              to="/dashboard/cursos-instituicao"
              className={cn('group flex flex-col gap-2 p-5 transition-all hover:border-[#F37E20]/30', brandPanelClass)}
            >
              <p className="text-sm font-semibold text-white">Cursos da instituição</p>
              <p className="text-xs text-white/48">Veja os cursos vinculados, criadores e estado de publicação.</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#F2BD8A] group-hover:text-[#F37E20]">
                Abrir
                <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </Link>
            <Link
              to="/dashboard/relatorios"
              className={cn('group flex flex-col gap-2 p-5 transition-all hover:border-[#F37E20]/30', brandPanelClass)}
            >
              <p className="text-sm font-semibold text-white">Relatórios</p>
              <p className="text-xs text-white/48">Engajamento por membro, conclusões e última atividade.</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#F2BD8A] group-hover:text-[#F37E20]">
                Abrir
                <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              to="/dashboard/cursos-obrigatorios"
              className={cn('group flex items-center justify-between gap-4 p-5 transition-all hover:border-[#F37E20]/30', brandPanelClass)}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Cursos obrigatórios</p>
                <p className="mt-0.5 text-xs text-white/48">
                  Defina cursos que membros devem concluir, com banner de destaque.
                </p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-white/40 group-hover:text-[#F2BD8A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link
              to="/dashboard/branding"
              className={cn('group flex items-center justify-between gap-4 p-5 transition-all hover:border-[#F37E20]/30', brandPanelClass)}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Branding da instituição</p>
                <p className="mt-0.5 text-xs text-white/48">
                  Personalize cor, logo e descrição mostradas nos espaços da instituição.
                </p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-white/40 group-hover:text-[#F2BD8A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </DashboardPageShell>
  )
}
