import { brandEyebrowClass, cn } from '@/lib/brand'
import type { FunctionReturnType } from 'convex/server'
import type { api } from '@convex/_generated/api'
import { StatCard } from '../components/StatCard'
import { CourseProgressRow } from '../components/CourseProgressRow'

type Stats = FunctionReturnType<typeof api.publicProfiles.getMyStats>

export function ConquistasTab({ myStats }: { myStats: Stats | undefined }) {
  return (
    <div className="space-y-6">
      {myStats === undefined ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      ) : myStats === null || myStats.totalCoursesEnrolled === 0 ? (
        <div className="rounded-[1.6rem] border border-white/7 bg-white/[0.025] px-8 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/28">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-white/62">Nenhum curso iniciado ainda</p>
          <p className="mt-2 text-xs text-white/36">Acesse o catálogo para começar sua jornada de estudos.</p>
        </div>
      ) : (
        <>
          <div>
            <p className={cn('mb-4', brandEyebrowClass)}>Resumo geral</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Horas assistidas" value={`${Math.round(myStats.totalWatchSeconds / 3600)}h`} />
              <StatCard label="Cursos matriculados" value={String(myStats.totalCoursesEnrolled)} />
              <StatCard label="Cursos concluídos" value={String(myStats.totalCoursesCompleted)} />
              <StatCard label="Certificados" value={String(myStats.certificateCount)} />
            </div>
          </div>

          <div>
            <p className={cn('mb-4', brandEyebrowClass)}>Progresso por curso</p>
            <div className="space-y-3">
              {myStats.courses.map((course) => (
                <CourseProgressRow
                  key={String(course.courseId)}
                  courseTitle={course.courseTitle}
                  percentage={course.percentage}
                  completedLessons={course.completedLessons}
                  totalLessons={course.totalLessons}
                  certificateIssued={course.certificateIssued}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
