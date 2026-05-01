import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import {
  DashboardEmptyState,
  DashboardPageShell,
} from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandPrimaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

type InstitutionRow = {
  _id: Id<'institutions'>
  name: string
  type: 'igreja' | 'ensino' | 'empresa'
  memberRole: 'dono' | 'admin' | 'membro'
}

type AssignmentRow = {
  _id: Id<'requiredAssignments'>
  courseId: Id<'courses'>
  memberRole?: 'dono' | 'admin' | 'membro'
  addedAt: number
  courseTitle: string
  courseSlug?: string
  coursePublished: boolean
}

type InstitutionCourseRow = {
  _id: Id<'courses'>
  title: string
  slug?: string
  isPublished: boolean
  creatorName: string
}

function roleLabel(r?: 'dono' | 'admin' | 'membro') {
  if (!r) return 'Todos os papéis'
  if (r === 'dono') return 'Apenas donos'
  if (r === 'admin') return 'Apenas admins'
  return 'Apenas membros'
}

export function CursosObrigatoriosPage() {
  const institutions = useQuery(api.institutions.listByUser) as
    | InstitutionRow[]
    | undefined
  const ownedOrAdmin = institutions?.filter((i) => i.memberRole !== 'membro') ?? []
  const [activeId, setActiveId] = useState<Id<'institutions'> | null>(null)
  const currentId = activeId ?? ownedOrAdmin[0]?._id ?? null

  const assignments = useQuery(
    api.requiredAssignments.listForInstitution,
    currentId ? { institutionId: currentId } : 'skip',
  ) as AssignmentRow[] | undefined

  const institutionCourses = useQuery(
    api.institutions.listCourses,
    currentId ? { institutionId: currentId } : 'skip',
  ) as InstitutionCourseRow[] | undefined

  const addAssignment = useMutation(api.requiredAssignments.add)
  const removeAssignment = useMutation(api.requiredAssignments.remove)

  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'all' | 'dono' | 'admin' | 'membro'>('all')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const selectableCourses = useMemo(() => {
    if (!institutionCourses) return [] as InstitutionCourseRow[]
    const taken = new Set(assignments?.map((a) => a.courseId) ?? [])
    return institutionCourses.filter((c) => !taken.has(c._id))
  }, [institutionCourses, assignments])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!currentId || !selectedCourseId) return
    setAdding(true)
    setError('')
    try {
      await addAssignment({
        institutionId: currentId,
        courseId: selectedCourseId as Id<'courses'>,
        memberRole: selectedRole === 'all' ? undefined : selectedRole,
      })
      setSelectedCourseId('')
      setSelectedRole('all')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao adicionar curso obrigatório.')
    } finally {
      setAdding(false)
    }
  }

  if (institutions === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Instituição"
        title="Cursos obrigatórios"
        description="Defina cursos que membros devem concluir."
      >
        <div className={cn('h-32 animate-pulse', brandPanelClass)} />
      </DashboardPageShell>
    )
  }

  if (ownedOrAdmin.length === 0) {
    return (
      <DashboardPageShell
        eyebrow="Instituição"
        title="Cursos obrigatórios"
        description="Você precisa ser dono ou admin de uma instituição para definir cursos obrigatórios."
      >
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
          title="Sem instituição cadastrada"
          description="Crie sua igreja ou seminário primeiro para gerenciar cursos obrigatórios."
        />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Instituição"
      title="Cursos obrigatórios"
      description="Defina cursos que todos os membros, ou um papel específico, devem concluir. O curso aparece destacado para o aluno membro."
    >
      {ownedOrAdmin.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {ownedOrAdmin.map((inst) => (
            <button
              key={inst._id}
              type="button"
              onClick={() => setActiveId(inst._id)}
              className={cn(
                'rounded-2xl border px-4 py-2 text-sm font-medium transition-all',
                currentId === inst._id
                  ? 'border-[#F37E20]/40 bg-[#F37E20]/10 text-[#F2BD8A]'
                  : 'border-white/10 bg-white/4 text-white/72 hover:border-white/20 hover:bg-white/8',
              )}
            >
              {inst.name}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className={cn('space-y-3 p-6', brandPanelClass)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2BD8A]">
          Marcar curso como obrigatório
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#10161E] px-4 py-3 text-base text-white"
            disabled={selectableCourses.length === 0}
          >
            <option value="">
              {selectableCourses.length === 0
                ? 'Nenhum curso disponível na instituição'
                : 'Selecione um curso vinculado à instituição'}
            </option>
            {selectableCourses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} — {c.creatorName}
              </option>
            ))}
          </select>
          <select
            value={selectedRole}
            onChange={(e) =>
              setSelectedRole(e.target.value as 'all' | 'dono' | 'admin' | 'membro')
            }
            className="rounded-2xl border border-white/10 bg-[#10161E] px-4 py-3 text-base text-white"
          >
            <option value="all">Todos os papéis</option>
            <option value="membro">Apenas membros</option>
            <option value="admin">Apenas admins</option>
            <option value="dono">Apenas donos</option>
          </select>
          <button
            type="submit"
            disabled={!selectedCourseId || adding}
            className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
          >
            {adding ? 'Adicionando...' : 'Marcar obrigatório'}
          </button>
        </div>
        {error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </p>
        )}
        {institutionCourses !== undefined && institutionCourses.length === 0 && (
          <p className="text-xs text-white/52">
            Vincule cursos à sua instituição (em "Cursos da instituição") antes de marcá-los como obrigatórios.
          </p>
        )}
      </form>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Cursos obrigatórios</h3>
          <span className="text-xs text-white/48">
            {assignments ? assignments.length : 0} curso(s)
          </span>
        </div>
        {assignments === undefined ? (
          <div className={cn('p-6 text-sm text-white/48', brandPanelClass)}>
            Carregando...
          </div>
        ) : assignments.length === 0 ? (
          <DashboardEmptyState
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Nenhum curso obrigatório"
            description="Quando você marcar um curso como obrigatório, ele aparecerá aqui e será destacado para os membros."
          />
        ) : (
          <ul className={cn('divide-y divide-white/6 overflow-hidden', brandPanelClass)}>
            {assignments.map((a) => (
              <li
                key={a._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.courseSlug ? (
                      <Link
                        to={`/cursos/${a.courseSlug}`}
                        className="font-medium text-white hover:text-[#F2BD8A]"
                      >
                        {a.courseTitle}
                      </Link>
                    ) : (
                      <span className="font-medium text-white">{a.courseTitle}</span>
                    )}
                    <span className={brandStatusPillClass('accent')}>
                      Obrigatório
                    </span>
                    {!a.coursePublished && (
                      <span className={brandStatusPillClass('neutral')}>Rascunho</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/48">{roleLabel(a.memberRole)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Remover "${a.courseTitle}" da lista de obrigatórios?`))
                      return
                    removeAssignment({ assignmentId: a._id })
                  }}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardPageShell>
  )
}
