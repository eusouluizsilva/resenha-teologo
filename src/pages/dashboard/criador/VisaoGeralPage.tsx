import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { useCreatorId } from '@/lib/useCreatorId'

const icons = [
  <svg key="courses" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  <svg key="students" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  <svg key="lessons" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" /></svg>,
  <svg key="donations" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
]

const quickActions = [
  { title: 'Criar novo curso', description: 'Comece a construir seu próximo curso teológico', href: '/dashboard/cursos/novo', primary: true },
  { title: 'Ver meus cursos', description: 'Gerencie cursos, módulos e aulas', href: '/dashboard/cursos', primary: false },
  { title: 'Financeiro', description: 'Acompanhe doações e repasses', href: '/dashboard/financeiro', primary: false },
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
      sub: 'em todos os cursos',
    },
    {
      label: 'Total de aulas',
      value: statsData ? String(statsData.totalLessons) : '...',
      sub: 'em todos os módulos',
    },
    {
      label: 'Doações recebidas',
      value: statsData ? formatBRL(statsData.totalDonationsCents) : '...',
      sub: 'total acumulado',
    },
  ]

  return (
    <div className="p-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto">
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-2xl font-bold text-white font-display">Visão geral</h1>
          <p className="text-white/50 mt-1 text-sm">Acompanhe o desempenho da sua plataforma</p>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={s.label} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-[#F37E20]/10 text-[#F37E20]">{icons[i]}</div>
              </div>
              <p className="text-2xl font-bold text-white font-display">{s.value}</p>
              <p className="text-sm font-medium text-white/70 mt-0.5">{s.label}</p>
              <p className="text-xs text-white/30 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="text-base font-semibold text-white/80 mb-4">Ações rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                to={a.href}
                className={`rounded-xl p-5 border transition-all duration-200 ${
                  a.primary
                    ? 'bg-[#F37E20] border-[#F37E20] hover:bg-[#e06e10]'
                    : 'bg-[#151B23] border-[#2A313B] hover:border-[#F37E20]/30 hover:bg-[#1B2430]'
                }`}
              >
                <p className="font-semibold text-white mb-1">{a.title}</p>
                <p className={`text-sm ${a.primary ? 'text-white/80' : 'text-white/50'}`}>{a.description}</p>
              </Link>
            ))}
          </div>
        </motion.div>

        {courses.length === 0 ? (
          <motion.div variants={fadeUp}>
            <div className="bg-[#151B23] border border-[#2A313B] rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F37E20]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-display">Nenhum curso criado ainda</h3>
              <p className="text-white/50 text-sm mb-5 max-w-sm mx-auto">
                Crie seu primeiro curso e comece a compartilhar conhecimento teológico com alunos de todo o Brasil.
              </p>
              <Link
                to="/dashboard/cursos/novo"
                className="inline-flex items-center gap-2 bg-[#F37E20] hover:bg-[#e06e10] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Criar primeiro curso
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp}>
            <h2 className="text-base font-semibold text-white/80 mb-4">Cursos recentes</h2>
            <div className="space-y-2">
              {courses.slice(0, 5).map((c: typeof courses[0]) => (
                <Link
                  key={c._id}
                  to={`/dashboard/cursos/${c._id}`}
                  className="flex items-center justify-between bg-[#151B23] border border-[#2A313B] rounded-xl px-5 py-4 hover:border-[#F37E20]/20 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1B2430] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {c.thumbnail
                        ? <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                        : <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{c.title}</p>
                      <p className="text-xs text-white/40">{c.category} · {c.totalLessons} aulas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${
                      c.isPublished
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {c.isPublished ? 'Publicado' : 'Rascunho'}
                    </span>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-[#F37E20] transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
