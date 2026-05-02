import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  DashboardPageShell,
  DashboardSectionLabel,
} from '@/components/dashboard/PageShell'
import { brandPanelClass, cn } from '@/lib/brand'
import { AllUsersModal } from './AllUsersModal'

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

function formatNumber(n: number) {
  return n.toLocaleString('pt-BR')
}

function formatDelta(current: number, prev: number) {
  if (prev === 0) {
    return current > 0 ? { label: 'novo período', positive: true } : { label: 'sem dados', positive: false }
  }
  const pct = ((current - prev) / prev) * 100
  const sign = pct >= 0 ? '+' : ''
  return {
    label: `${sign}${pct.toFixed(0)}% vs período anterior`,
    positive: pct >= 0,
  }
}

type AnalyticsData = {
  window: number
  totalViews: number
  totalViewsPrev: number
  uniqueSessions: number
  uniqueSessionsPrev: number
  uniqueUsers: number
  viewsByDay: { date: string; views: number; sessions: number }[]
  topPages: { page: string; views: number }[]
  topReferrers: { host: string; views: number }[]
  deviceCounts: { mobile: number; desktop: number; tablet: number; unknown: number }
}

function Sparkline({ values, color = '#F37E20' }: { values: number[]; color?: string }) {
  if (values.length === 0) return null
  const max = Math.max(...values, 1)
  const w = 100
  const h = 28
  const step = values.length > 1 ? w / (values.length - 1) : w
  const points = values
    .map((v, i) => `${(i * step).toFixed(2)},${(h - (v / max) * h).toFixed(2)}`)
    .join(' ')
  const areaPoints = `0,${h} ${points} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-7 w-full">
      <polygon points={areaPoints} fill={color} fillOpacity="0.12" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function MetricTile({
  label,
  value,
  delta,
  spark,
}: {
  label: string
  value: string
  delta?: { label: string; positive: boolean }
  spark?: number[]
}) {
  return (
    <div className={cn('p-5', brandPanelClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
      {delta && (
        <p
          className={cn(
            'mt-1 text-xs',
            delta.positive ? 'text-emerald-300/80' : 'text-rose-300/80',
          )}
        >
          {delta.label}
        </p>
      )}
      {spark && spark.length > 1 && (
        <div className="mt-3">
          <Sparkline values={spark} />
        </div>
      )}
    </div>
  )
}

function AnalyticsSection({ analytics }: { analytics: AnalyticsData | undefined }) {
  if (analytics === undefined) {
    return (
      <div>
        <DashboardSectionLabel>Analytics, últimos 30 dias</DashboardSectionLabel>
        <div className={cn('mt-4 flex items-center justify-center p-10', brandPanelClass)}>
          <div className="h-6 w-6 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
        </div>
      </div>
    )
  }

  const sparkViews = analytics.viewsByDay.map((d) => d.views)
  const sparkSessions = analytics.viewsByDay.map((d) => d.sessions)
  const totalDevices =
    analytics.deviceCounts.mobile +
    analytics.deviceCounts.desktop +
    analytics.deviceCounts.tablet +
    analytics.deviceCounts.unknown
  const pct = (n: number) =>
    totalDevices === 0 ? '0%' : `${Math.round((n / totalDevices) * 100)}%`

  return (
    <div>
      <DashboardSectionLabel>Analytics, últimos 30 dias</DashboardSectionLabel>
      <p className="mt-1 text-xs text-white/42">
        Dados próprios coletados a cada navegação. Atualiza em tempo real conforme
        o tráfego entra.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Pageviews"
          value={formatNumber(analytics.totalViews)}
          delta={formatDelta(analytics.totalViews, analytics.totalViewsPrev)}
          spark={sparkViews}
        />
        <MetricTile
          label="Sessões únicas"
          value={formatNumber(analytics.uniqueSessions)}
          delta={formatDelta(analytics.uniqueSessions, analytics.uniqueSessionsPrev)}
          spark={sparkSessions}
        />
        <MetricTile
          label="Usuários logados"
          value={formatNumber(analytics.uniqueUsers)}
        />
        <MetricTile
          label="Mobile vs desktop"
          value={pct(analytics.deviceCounts.mobile)}
          delta={{
            label: `${pct(analytics.deviceCounts.desktop)} desktop · ${pct(analytics.deviceCounts.tablet)} tablet`,
            positive: true,
          }}
        />
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
            Top páginas
          </p>
          <div className={cn('mt-3 divide-y divide-white/6', brandPanelClass)}>
            {analytics.topPages.length === 0 ? (
              <p className="p-5 text-sm text-white/42">Sem pageviews ainda.</p>
            ) : (
              analytics.topPages.map((p) => {
                const max = analytics.topPages[0].views
                const pct = (p.views / max) * 100
                return (
                  <div key={p.page} className="relative p-4">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#F37E20]/[0.06]"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <p className="truncate font-mono text-xs text-white/80">{p.page}</p>
                      <span className="flex-shrink-0 font-mono text-xs font-semibold text-white">
                        {formatNumber(p.views)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
            Top referrers
          </p>
          <div className={cn('mt-3 divide-y divide-white/6', brandPanelClass)}>
            {analytics.topReferrers.length === 0 ? (
              <p className="p-5 text-sm text-white/42">
                Sem referrers ainda. Tráfego vem direto ou de mídias sociais via
                app (sem header Referer).
              </p>
            ) : (
              analytics.topReferrers.map((r) => {
                const max = analytics.topReferrers[0].views
                const pct = (r.views / max) * 100
                return (
                  <div key={r.host} className="relative p-4">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#F37E20]/[0.06]"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-white/80">{r.host}</p>
                      <span className="flex-shrink-0 font-mono text-xs font-semibold text-white">
                        {formatNumber(r.views)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsCard({
  label,
  description,
  href,
  badge,
}: {
  label: string
  description: string
  href: string
  badge: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block p-5 transition hover:border-[#F37E20]/35 hover:bg-[#F37E20]/[0.04]',
        brandPanelClass,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
          {label}
        </p>
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F37E20]/10 text-[#F37E20] transition group-hover:bg-[#F37E20]/16">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M21 3l-9 9M5 5h6M5 11h6M5 17h14" />
          </svg>
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/72">{description}</p>
      <p className="mt-4 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-white/36">
        {badge}
      </p>
    </a>
  )
}

export function AdminPage() {
  const isAdmin = useQuery(api.admin.amIAdmin, {})
  const stats = useQuery(api.admin.getStats, isAdmin ? {} : 'skip')
  const recentUsers = useQuery(api.admin.listRecentUsers, isAdmin ? {} : 'skip')
  const recentCourses = useQuery(api.admin.listRecentCourses, isAdmin ? {} : 'skip')
  const topPosts = useQuery(api.admin.listTopPosts, isAdmin ? {} : 'skip')
  const analytics = useQuery(api.admin.getAnalytics, isAdmin ? { days: 30 } : 'skip')
  const [showAllUsers, setShowAllUsers] = useState(false)

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
                label="Artigos publicados"
                value={String(stats.publishedPosts)}
                sub={`${stats.draftPosts} em rascunho, +${stats.newPosts30d} em 30 dias`}
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
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Doações"
                value={formatCurrency(stats.totalDonationCents)}
                sub={`${stats.donationCount} ${stats.donationCount === 1 ? 'doação concluída' : 'doações concluídas'}`}
              />
            </div>
          </div>

          <div>
            <DashboardSectionLabel>Ações administrativas</DashboardSectionLabel>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/dashboard/admin/notificacoes"
                className={cn(
                  'group block p-5 transition hover:border-[#F37E20]/35 hover:bg-[#F37E20]/[0.04]',
                  brandPanelClass,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/52 transition group-hover:bg-[#F37E20]/16 group-hover:text-[#F37E20]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-white">
                  Notificações do sininho
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/64">
                  Envie um aviso in-app para todos ou para um segmento. Anúncios, lançamentos, manutenções, comunicados.
                </p>
              </Link>

              <Link
                to="/dashboard/admin/cursos"
                className={cn(
                  'group block p-5 transition hover:border-[#F37E20]/35 hover:bg-[#F37E20]/[0.04]',
                  brandPanelClass,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/52 transition group-hover:bg-[#F37E20]/16 group-hover:text-[#F37E20]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-white">
                  Cursos da plataforma
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/64">
                  Toggle de publicação, nota mínima, estado de produção e vinculação a instituição com edição inline.
                </p>
              </Link>

              <Link
                to="/dashboard/admin/comentarios"
                className={cn(
                  'group block p-5 transition hover:border-[#F37E20]/35 hover:bg-[#F37E20]/[0.04]',
                  brandPanelClass,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/52 transition group-hover:bg-[#F37E20]/16 group-hover:text-[#F37E20]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-white">
                  Moderação de comentários
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/64">
                  Feed unificado de aulas, fóruns de curso e artigos. Remova conteúdo abusivo em um clique.
                </p>
              </Link>
            </div>
          </div>

          <AnalyticsSection analytics={analytics} />

          <div>
            <DashboardSectionLabel>Plataformas externas</DashboardSectionLabel>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnalyticsCard
                label="Google Analytics 4"
                description="Visitantes, fontes de tráfego, comportamento por página, audiências."
                href="https://analytics.google.com/analytics/web/"
                badge="G-S2QLVX24GB"
              />
              <AnalyticsCard
                label="Vercel Analytics"
                description="Pageviews, top páginas, países e dispositivos em tempo real."
                href="https://vercel.com/luiz-silvas-projects-aaeb9d4d/resenha-teologo-v18/analytics"
                badge="ativo"
              />
              <AnalyticsCard
                label="Vercel Speed Insights"
                description="Core Web Vitals (LCP, INP, CLS) e performance real do usuário."
                href="https://vercel.com/luiz-silvas-projects-aaeb9d4d/resenha-teologo-v18/speed-insights"
                badge="ativo"
              />
              <AnalyticsCard
                label="Meta Pixel (rt)"
                description="Eventos de PageView e conversões para campanhas no Facebook e Instagram Ads."
                href="https://business.facebook.com/events_manager2/list/pixel/1884382392256153/overview"
                badge="1884382392256153"
              />
            </div>
          </div>

          <div>
            <DashboardSectionLabel>Top artigos do blog</DashboardSectionLabel>
            <p className="mt-1 text-xs text-white/42">
              Ordenado por leituras totais. Cada leitura é deduplicada por sessão.
            </p>
            <div className={cn('mt-4 divide-y divide-white/6', brandPanelClass)}>
              {topPosts === undefined ? (
                <div className="flex items-center justify-center p-10">
                  <div className="h-6 w-6 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
                </div>
              ) : topPosts.length === 0 ? (
                <p className="p-5 text-sm text-white/42">Nenhum artigo publicado ainda.</p>
              ) : (
                topPosts.map((p, i) => {
                  const articleHref = p.authorHandle
                    ? `/blog/${p.authorHandle}/${p.slug}`
                    : null
                  const titleNode = (
                    <p className="truncate text-sm font-medium text-white">
                      {p.title}
                    </p>
                  )
                  return (
                    <div key={p._id} className="flex items-center gap-4 p-4">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] font-mono text-xs font-semibold text-white/56">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {articleHref ? (
                          <Link
                            to={articleHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:underline"
                          >
                            {titleNode}
                          </Link>
                        ) : (
                          titleNode
                        )}
                        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-white/42">
                          <span>por {p.authorName}</span>
                          <span className="text-white/24">·</span>
                          <span>{p.categorySlug.replace(/-/g, ' ')}</span>
                          {p.publishedAt && (
                            <>
                              <span className="text-white/24">·</span>
                              <span>{formatDate(p.publishedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-4 font-mono text-[11px] text-white/64">
                        <span title="Leituras" className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 text-white/36" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-semibold text-white">{formatNumber(p.viewCount)}</span>
                        </span>
                        <span title="Curtidas" className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 text-white/36" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                          </svg>
                          {formatNumber(p.likeCount)}
                        </span>
                        <span title="Comentários" className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 text-white/36" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                          {formatNumber(p.commentCount)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-end justify-between gap-3">
                <DashboardSectionLabel>Usuários recentes</DashboardSectionLabel>
                <button
                  type="button"
                  onClick={() => setShowAllUsers(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2BD8A] transition hover:text-[#F37E20]"
                >
                  Ver todos
                  <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowAllUsers(true)}
                className={cn(
                  'mt-4 block w-full divide-y divide-white/6 text-left transition hover:border-[#F37E20]/35',
                  brandPanelClass,
                )}
                aria-label="Ver todos os usuários"
              >
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
                        <p className="truncate text-sm font-medium text-white">{u.name}</p>
                        <p className="truncate text-xs text-white/42">{u.email}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-white/36">
                        {formatDate(u.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </button>
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
      {showAllUsers && <AllUsersModal onClose={() => setShowAllUsers(false)} />}
    </DashboardPageShell>
  )
}
