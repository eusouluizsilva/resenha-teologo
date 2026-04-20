import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'
import {
  DashboardEmptyState,
  DashboardPageShell,
  DashboardSectionLabel,
  DashboardStatusPill,
} from '@/components/dashboard/PageShell'

const levelLabel: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

const levelTone: Record<string, 'success' | 'info' | 'accent'> = {
  iniciante: 'success',
  intermediario: 'info',
  avancado: 'accent',
}

type Course = {
  _id: Id<'courses'>
  title: string
  description: string
  category: string
  level: 'iniciante' | 'intermediario' | 'avancado'
  thumbnail?: string
  isPublished: boolean
  totalLessons: number
  totalStudents: number
  totalModules: number
}

function CourseCard({ course, onDelete }: { course: Course; onDelete: (id: Id<'courses'>) => void }) {
  return (
    <div className={cn('overflow-hidden p-5 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.05]', brandPanelClass)}>
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#111821]">
        <div className="aspect-[16/10]">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#171E28_0%,#10161E_100%)]">
              <svg className="h-10 w-10 text-white/12" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          )}
        </div>

        <div className="absolute left-4 top-4">
          <DashboardStatusPill tone={course.isPublished ? 'success' : 'neutral'}>
            {course.isPublished ? 'Publicado' : 'Rascunho'}
          </DashboardStatusPill>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <DashboardStatusPill tone={levelTone[course.level] ?? 'neutral'}>
          {levelLabel[course.level]}
        </DashboardStatusPill>
        <span className="text-xs uppercase tracking-[0.16em] text-white/28">{course.category}</span>
      </div>

      <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-white">{course.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/52">{course.description}</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] px-3 py-3">
          <p className="font-display text-lg font-bold text-white">{course.totalModules}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/28">Módulos</p>
        </div>
        <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] px-3 py-3">
          <p className="font-display text-lg font-bold text-white">{course.totalLessons}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/28">Aulas</p>
        </div>
        <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] px-3 py-3">
          <p className="font-display text-lg font-bold text-white">{course.totalStudents}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/28">Alunos</p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Link to={`/dashboard/cursos/${course._id}`} className={cn('flex-1', brandSecondaryButtonClass)}>
          Editar curso
        </Link>
        <button
          onClick={() => {
            if (confirm('Excluir este curso?')) onDelete(course._id)
          }}
          className="inline-flex items-center justify-center rounded-2xl border border-red-400/12 bg-red-400/6 px-4 py-3 text-sm font-semibold text-red-200 transition-colors duration-200 hover:bg-red-400/12"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

export function CursosPage() {
  const creatorId = useCreatorId()
  const courses = useQuery(api.courses.listByCreator, creatorId ? { creatorId } : 'skip') ?? []
  const removeCourse = useMutation(api.courses.remove)

  async function handleDelete(id: Id<'courses'>) {
    if (!creatorId) return
    await removeCourse({ id, creatorId })
  }

  return (
    <DashboardPageShell
      eyebrow="Catálogo do criador"
      title="Meus cursos"
      description="Organize seu catálogo em uma linguagem visual mais sóbria, com melhor hierarquia entre capa, status e estrutura do conteúdo."
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
        {courses.length === 0 ? (
          <motion.div variants={fadeUp}>
            <DashboardEmptyState
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              }
              title="Nenhum curso criado"
              description="Comece seu catálogo com uma apresentação mais institucional e uma estrutura visual pronta para crescer com módulos, aulas e avaliações."
              action={
                <Link to="/dashboard/cursos/novo" className={brandPrimaryButtonClass}>
                  Criar curso
                </Link>
              }
            />
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="space-y-4">
            <DashboardSectionLabel>Catálogo atual</DashboardSectionLabel>
            <div className="grid gap-5 xl:grid-cols-2">
              {courses.map((course: Course) => (
                <CourseCard key={course._id} course={course} onDelete={handleDelete} />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardPageShell>
  )
}
