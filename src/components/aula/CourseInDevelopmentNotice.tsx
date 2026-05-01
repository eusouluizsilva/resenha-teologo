// Aviso mostrado na ultima aula publicada de um curso 'in_progress'. Combina:
// 1. Mensagem editorial de "voce esta em dia"
// 2. Cronograma livre do criador (course.nextLessonScheduleText), com fallback
// 3. Carrossel de cursos recomendados (mesmo criador primeiro, depois mesma
//    categoria) consumindo catalog.listRecommendedForInProgress.
// Reutilizavel por qualquer criador. Light mode (combina com a area do aluno).

import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'

interface CourseInDevelopmentNoticeProps {
  courseId: Id<'courses'>
  scheduleText?: string | null
  nextScheduledLessonAt?: number | null
}

export function CourseInDevelopmentNotice({
  courseId,
  scheduleText,
  nextScheduledLessonAt,
}: CourseInDevelopmentNoticeProps) {
  const recommended = useQuery(api.catalog.listRecommendedForInProgress, {
    courseId,
    limit: 6,
  })

  const trimmedSchedule = scheduleText?.trim() ?? ''
  const fallbackText = nextScheduledLessonAt
    ? `Proxima aula em ${formatDate(nextScheduledLessonAt)}.`
    : 'Voce sera notificado quando uma nova aula sair.'

  return (
    <section
      className={cn(
        'mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-5 w-5 text-amber-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900">
            Voce concluiu tudo que esta disponivel
          </h3>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            {trimmedSchedule || fallbackText}
          </p>
          {trimmedSchedule && nextScheduledLessonAt ? (
            <p className="mt-1 text-xs text-amber-700">
              Proxima aula prevista em {formatDate(nextScheduledLessonAt)}.
            </p>
          ) : null}
        </div>
      </div>

      {recommended && recommended.length > 0 ? (
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
              Enquanto voce espera
            </h4>
            <span className="text-xs text-amber-700">
              {recommended.length} {recommended.length === 1 ? 'recomendacao' : 'recomendacoes'}
            </span>
          </div>
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-3 px-1">
              {recommended.map((course) => (
                <RecommendedCard key={course._id} course={course} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

interface RecommendedCardProps {
  course: {
    _id: Id<'courses'>
    slug: string | null
    title: string
    thumbnail: string | null
    category: string
    level: string
    totalLessons: number
    avgRating: number | null
    ratingsCount: number
    creatorName: string
    creatorHandle: string | null
    sameCreator: boolean
  }
}

function RecommendedCard({ course }: RecommendedCardProps) {
  const ref = course.slug ?? (course._id as unknown as string)
  return (
    <Link
      to={`/cursos/${ref}`}
      className={cn(
        'group flex w-64 flex-shrink-0 flex-col overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm transition-all hover:border-amber-300 hover:shadow-md',
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-amber-50">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-amber-700/60">
            Sem capa
          </div>
        )}
        {course.sameCreator ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#F37E20] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Mesmo professor
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          {course.category}
        </span>
        <h5 className="line-clamp-2 text-sm font-bold leading-snug text-gray-800">
          {course.title}
        </h5>
        <p className="text-xs text-gray-500">{course.creatorName}</p>
        <div className="mt-auto flex items-center justify-between pt-1 text-[11px] text-gray-500">
          <span>{course.totalLessons} aulas</span>
          {course.avgRating !== null ? (
            <span className="flex items-center gap-1 text-amber-600">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
              {course.avgRating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
