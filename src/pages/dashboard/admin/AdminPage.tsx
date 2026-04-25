import { Link, Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  DashboardPageShell,
  DashboardSectionLabel,
} from '@/components/dashboard/PageShell'
import { brandPanelClass, cn } from '@/lib/brand'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={cn('p-5', brandPanelClass, accent && 'border-[#F37E20]/22 bg-[#F37E20]/[0.06]')}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/48">{sub}</p>}
    </div>
  )
}

export function AdminPage() {
  const isAdmin = useQuery(api.admin.amIAdmin, {})
  const stats = useQuery(api.admin.getStats, isAdmin ? {} : 'skip')
  const recentUsers = useQuery(api.admin.listRecentUsers, isAdmin ? {} : 'skip')
  const recentCourses = useQuery(api.admin.listRecentCourses, isAdmin ? {} : 'skip')

  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardPageShell
      eyebrow="Administração"
      title="Painel da plataforma"
      description="Visão geral de usuários, cursos, matrículas e doações. Área restrita ao dono da plataforma."
    >
      {stats === undefined ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
        </div>
      ) : (
        <>
          <div>
            <DashboardSectionLabel>Usuários</DashboardSectionLabel>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Total de usuários"
                value={String(stats.totalUsers)}
                sub={`+${stats.newUsers30d} em 30 dias`}
                accent
              />
              <StatTile label="Alunos" value={String(stats.totalStudents)} />
              <StatTile label="Professores" value={String(stats.totalProfessors)} />
              <StatTile label="Instituições" value={String(stats.totalInstitutions)} />
            </div>
          </div>

          <div>
            <DashboardSectionLabel>Conteúdo e matrículas</DashboardSectionLabel>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Cursos publicados"
                value={String(stats.publishedCourses)}
                sub={`${stats.totalCourses} no total`}
              />
              <StatTile
                label="Matrículas"
                value={String(stats.totalEnrollments)}
                sub={`+${stats.newEnrollments30d} em 30 dias`}
              />
              <StatTile
                label="Certificados emitidos"
                value={String(stats.certificatesIssued)}
              />
              <StatTile
                label="Doações"
                value={formatCurrency(stats.totalDonationCents)}
                sub={`${stats.donationCount} ${stats.donationCount === 1 ? 'doação concluída' : 'doações concluídas'}`}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <DashboardSectionLabel>Usuários recentes</DashboardSectionLabel>
              <div className={cn('mt-4 divide-y divide-white/6', brandPanelClass)}>
                {recentUsers === undefined || recentUsers.length === 0 ? (
                  <p className="p-5 text-sm text-white/42">Nenhum usuário ainda.</p>
                ) : (
                  recentUsers.slice(0, 10).map((u) => (
                    <div key={u._id} className="flex items-center gap-3 p-4">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="h-9 w-9 flex-shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-white/62">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        {u.handle ? (
                          <Link
                            to={`/${u.handle}`}
                            target="_blank"
                            className="text-sm font-medium text-white hover:text-[#F2BD8A]"
                          >
                            {u.name}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium text-white">{u.name}</p>
                        )}
                        <p className="truncate text-xs text-white/42">{u.email}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-white/36">
                        {formatDate(u.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <DashboardSectionLabel>Cursos recentes</DashboardSectionLabel>
              <div className={cn('mt-4 divide-y divide-white/6', brandPanelClass)}>
                {recentCourses === undefined || recentCourses.length === 0 ? (
                  <p className="p-5 text-sm text-white/42">Nenhum curso ainda.</p>
                ) : (
                  recentCourses.slice(0, 10).map((c) => (
                    <div key={c._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {c.title}
                          </p>
                          <p className="mt-0.5 text-xs text-white/42">
                            por {c.creatorName}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                            c.isPublished
                              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                              : 'border-white/10 bg-white/4 text-white/46'
                          )}
                        >
                          {c.isPublished ? 'Publicado' : 'Rascunho'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-white/42">
                        <span>{c.totalLessons} aulas</span>
                        <span>{c.totalStudents} alunos</span>
                        <span>{formatDate(c.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardPageShell>
  )
}
