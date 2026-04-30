import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'

type RequiredRow = {
  courseId: string
  courseTitle: string
  courseSlug?: string
  isPublished: boolean
  institutions: { institutionId: string; institutionName: string }[]
  enrolled: boolean
  completed: boolean
}

// Banner mostrado ao aluno que é membro ativo de uma instituição com cursos
// marcados como obrigatórios. Se ele já concluiu todos, esconde. Se há
// pendências, lista cursos com link direto para a página do curso público.
export function RequiredCoursesBanner() {
  const data = useQuery(api.requiredAssignments.listForStudent, {}) as
    | RequiredRow[]
    | undefined

  if (!data || data.length === 0) return null

  const pending = data.filter((r) => r.isPublished && !r.completed)
  if (pending.length === 0) return null

  return (
    <div className={cn('p-5', brandPanelClass, 'border-[#F37E20]/24 bg-[#F37E20]/[0.06]')}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F37E20]/12 text-[#F37E20]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </span>
          <p className="text-sm font-semibold text-white">
            {pending.length === 1
              ? 'Curso obrigatório pendente'
              : `${pending.length} cursos obrigatórios pendentes`}
          </p>
        </div>
        <span className={brandStatusPillClass('accent')}>Sua instituição</span>
      </div>
      <ul className="space-y-2">
        {pending.map((r) => (
          <li
            key={r.courseId}
            className="flex flex-col gap-1 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {r.courseTitle}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/52">
                Pedido por {r.institutions.map((i) => i.institutionName).join(', ')}
                {r.enrolled ? ' · Você já está matriculado' : ''}
              </p>
            </div>
            <Link
              to={
                r.enrolled
                  ? `/dashboard/meus-cursos/${r.courseId}`
                  : r.courseSlug
                    ? `/cursos/${r.courseSlug}`
                    : `/cursos/${r.courseId}`
              }
              className="mt-1 flex-shrink-0 self-start rounded-xl border border-[#F37E20]/30 bg-[#F37E20]/12 px-3 py-1.5 text-xs font-semibold text-[#F2BD8A] transition-all hover:border-[#F37E20]/50 hover:bg-[#F37E20]/20 sm:mt-0"
            >
              {r.enrolled ? 'Continuar' : 'Acessar curso'}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
