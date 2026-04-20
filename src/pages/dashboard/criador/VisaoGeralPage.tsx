import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandPanelClass, brandPanelSoftClass, brandPrimaryButtonClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'
import {
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardPageShell,
  DashboardSectionLabel,
  DashboardStatusPill,
} from '@/components/dashboard/PageShell'

const icons = [
  <svg key="courses" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  <svg key="students" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  <svg key="lessons" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" /></svg>,
  <svg key="donations" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
]

const quickActions = [
  {
    title: 'Criar novo curso',
    description: 'Abra uma nova trilha de ensino com um fluxo visual mais refinado.',
    href: '/dashboard/cursos/novo',
    accent: true,
  },
  {
    title: 'Organizar meus cursos',
    description: 'Gerencie capa, módulos, aulas e publicação em um só lugar.',
    href: '/dashboard/cursos',
  },
  {
    title: 'Acompanhar financeiro',
    description: 'Consulte repasses e doações dentro de uma camada mais institucional.',
    href: '/dashboard/financeiro',
  },
]

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function VisaoGeralPage() {
  const creatorId = useCreatorId()
  const statsData = useQuery(api.courses.getStats, creatorId ? { creatorId } : 'skip')
  const courses = useQuery(api.courses.listByCreator, creatorId ? { creatorId } : 'skip') ?? []

  const stats = [
    {
      label: 'Cursos publicados',
      value: statsData ? String(statsData.publishedCourses) : '...',
      sub: statsData ? `${statsData.totalCourses - statsData.publishedCourses} rascunho(s)` : '',
    },
    {
      label: 'Total de alunos',
      value: statsData ? String(statsData.totalStudents) : '...',
      sub: 'alcance acumulado',
    },
    {
      label: 'Total de aulas',
      value: statsData ? String(statsData.totalLessons) : '...',
      sub: 'conteúdo disponível',
    },
    {
      label: 'Doações recebidas',
      value: statsData ? formatBRL(statsData.totalDonationsCents) : '...',
      sub: 'total acumulado',
    },
  ]

  return (
    <DashboardPageShell
      eyebrow="Painel do criador"
      title="Visão geral"
      description="Uma leitura rápida do seu espaço dentro da plataforma, com menos aparência de painel administrativo e mais clareza institucional."
      actions={
        <Link to="/dashboard/cursos/novo" className={brandPrimaryButtonClass}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo curso
        </Link>
      }
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
        <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <DashboardMetricCard key={s.label} icon={icons[i]} label={s.label} value={s.value} sub={s.sub} accent={i === 0} />
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className={cn('p-6', brandPanelClass)}>
            <DashboardSectionLabel>Ações prioritárias</DashboardSectionLabel>
            <div className="mt-5 grid gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  to={action.href}
                  className={cn(
                    'rounded-[1.45rem] border p-5 transition-all duration-200',
                    action.accent
                      ? 'border-[#F37E20]/16 bg-[#F37E20]/10 hover:bg-[#F37E20]/14'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]',
                  )}
                >
                  <p className="font-display text-xl font-bold text-white">{action.title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/56">{action.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className={cn('p-6', brandPanelSoftClass)}>
            <DashboardSectionLabel>Ritmo da plataforma</DashboardSectionLabel>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F2BD8A]">Leitura institucional</p>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  A nova direção visual privilegia respiro, contraste e hierarquia. O criador passa a operar em um ambiente que valoriza seu conteúdo antes do ruído operacional.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/28">Modelo</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">Acesso livre para alunos, com monetização em camadas e percepção mais premium.</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/28">Próximo passo</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">Aprofundar o conteúdo com cursos, materiais e avaliações organizadas com mais clareza.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {courses.length === 0 ? (
          <motion.div variants={fadeUp}>
            <DashboardEmptyState
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              }
              title="Nenhum curso criado ainda"
              description="Crie seu primeiro curso para começar a traduzir a proposta da marca em experiência real de ensino, organização e permanência."
              action={
                <Link to="/dashboard/cursos/novo" className={brandPrimaryButtonClass}>
                  Criar primeiro curso
                </Link>
              }
            />
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className={cn('p-6', brandPanelClass)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <DashboardSectionLabel>Cursos recentes</DashboardSectionLabel>
              <Link to="/dashboard/cursos" className="text-sm font-medium text-[#F2BD8A] transition-colors hover:text-white">
                Ver todos
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {courses.slice(0, 5).map((c: typeof courses[0]) => (
                <Link
                  key={c._id}
                  to={`/dashboard/cursos/${c._id}`}
                  className="group flex flex-col gap-4 rounded-[1.45rem] border border-white/8 bg-white/[0.03] px-5 py-5 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.05] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-[#10161E]">
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <svg className="h-5 w-5 text-white/18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <p className="font-display text-xl font-bold text-white">{c.title}</p>
                      <p className="mt-1 text-sm leading-7 text-white/52">{c.category}, {c.totalLessons} aulas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DashboardStatusPill tone={c.isPublished ? 'success' : 'neutral'}>
                      {c.isPublished ? 'Publicado' : 'Rascunho'}
                    </DashboardStatusPill>
                    <svg className="h-4 w-4 text-white/24 transition-colors duration-200 group-hover:text-[#F2BD8A]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardPageShell>
  )
}
