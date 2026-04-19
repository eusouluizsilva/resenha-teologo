import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { useCreatorId } from '@/lib/useCreatorId'

const levelLabel: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

const levelColor: Record<string, string> = {
  iniciante: 'text-emerald-400 bg-emerald-400/10',
  intermediario: 'text-blue-400 bg-blue-400/10',
  avancado: 'text-purple-400 bg-purple-400/10',
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
    <div className="bg-[#151B23] border border-[#2A313B] rounded-xl overflow-hidden hover:border-[#F37E20]/20 transition-all duration-200 group">
      <div className="aspect-video bg-[#1B2430] relative overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white/10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            course.isPublished
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
              : 'bg-white/5 text-white/40 border border-white/10'
          }`}>
            {course.isPublished ? 'Publicado' : 'Rascunho'}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColor[course.level]}`}>
            {levelLabel[course.level]}
          </span>
          <span className="text-xs text-white/30">{course.category}</span>
        </div>

        <h3 className="font-semibold text-white text-sm leading-snug mb-3 line-clamp-2 font-display">
          {course.title}
        </h3>

        <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            {course.totalLessons} aulas
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {course.totalStudents} alunos
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/dashboard/cursos/${course._id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-[#2A313B] text-white/60 hover:border-[#F37E20]/40 hover:text-[#F37E20] text-sm font-medium transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Editar
          </Link>
          <button
            onClick={() => { if (confirm('Excluir este curso?')) onDelete(course._id) }}
            className="p-2 rounded-lg border border-[#2A313B] text-white/30 hover:border-red-500/30 hover:text-red-400 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
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
    <div className="p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Meus cursos</h1>
            <p className="text-white/50 mt-1 text-sm">Gerencie seus cursos, módulos e aulas</p>
          </div>
          <Link
            to="/dashboard/cursos/novo"
            className="flex items-center gap-2 bg-[#F37E20] hover:bg-[#e06e10] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo curso
          </Link>
        </motion.div>

        {courses.length === 0 ? (
          <motion.div variants={fadeUp}>
            <div className="bg-[#151B23] border border-[#2A313B] rounded-xl p-12 text-center">
              <div className="w-14 h-14 rounded-xl bg-[#F37E20]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-display">Nenhum curso criado</h3>
              <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
                Crie seu primeiro curso teológico e comece a compartilhar conhecimento.
              </p>
              <Link
                to="/dashboard/cursos/novo"
                className="inline-flex items-center gap-2 bg-[#F37E20] hover:bg-[#e06e10] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Criar curso
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c: Course) => (
              <CourseCard key={c._id} course={c} onDelete={handleDelete} />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
