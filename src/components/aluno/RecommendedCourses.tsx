import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { brandEyebrowClass, brandPanelSoftClass, cn } from '@/lib/brand'

type Recommendation = {
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

const levelLabel: Record<Recommendation['level'], string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export function RecommendedCourses({ limit = 4 }: { limit?: number }) {
  const data = useQuery(api.student.getRecommendations, { limit }) as
    | Recommendation[]
    | undefined

  if (data === undefined) {
    return (
      <div>
        <p className={cn('mb-4', brandEyebrowClass)}>Recomendado para você</p>
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/4" />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) return null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className={brandEyebrowClass}>Recomendado para você</p>
        <Link to="/cursos" className="text-xs text-[#F2BD8A] hover:underline">
          Ver catálogo
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((course) => {
          const href = course.slug ? `/cursos/${course.slug}` : `/cursos/${course._id}`
          return (
            <Link
              key={String(course._id)}
              to={href}
              className={cn(
                'flex gap-4 p-4 transition-all hover:border-[#F37E20]/24 hover:brightness-110',
                brandPanelSoftClass,
              )}
            >
              <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-white/8 bg-black/30">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{course.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-white/48">
                  {course.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-white/40">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 uppercase tracking-[0.12em]">
                    {course.category}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 uppercase tracking-[0.12em]">
                    {levelLabel[course.level]}
                  </span>
                  <span>{course.totalLessons} aulas</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
