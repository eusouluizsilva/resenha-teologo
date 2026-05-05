// "Cursos relacionados" para a área do aluno em modo claro (CursoInternoPage,
// AulaPage). Variante light do CursosRecomendados.tsx (que renderiza em dark
// no dashboard). Contextual: pega courseId e mostra cursos similares.

import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'

type Related = {
  _id: Id<'courses'>
  title: string
  description: string
  thumbnail?: string
  category: string
  level: 'iniciante' | 'intermediario' | 'avancado'
  slug?: string
  totalLessons: number
  totalStudents: number
  tags: string[]
}

const levelLabel: Record<Related['level'], string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export function CursosRelacionados({
  courseId,
  limit = 4,
  className,
}: {
  courseId: Id<'courses'>
  limit?: number
  className?: string
}) {
  const data = useQuery(api.student.getRelatedCourses, { courseId, limit }) as
    | Related[]
    | undefined

  if (data === undefined) {
    return (
      <section className={cn('mt-10', className)}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
          Cursos relacionados
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </section>
    )
  }

  if (data.length === 0) return null

  return (
    <section className={cn('mt-10', className)}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
          Cursos relacionados
        </p>
        <Link to="/cursos" className="text-xs font-semibold text-[#B5560F] hover:underline">
          Ver catálogo
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((course) => {
          const href = course.slug ? `/cursos/${course.slug}` : `/cursos/${course._id}`
          return (
            <Link
              key={String(course._id)}
              to={href}
              className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#F37E20]/40 hover:shadow-md"
            >
              <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{course.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-500">
                  {course.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 uppercase tracking-[0.12em]">
                    {course.category}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 uppercase tracking-[0.12em]">
                    {levelLabel[course.level]}
                  </span>
                  <span>{course.totalLessons} aulas</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
