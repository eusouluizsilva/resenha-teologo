import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import {
  DashboardEmptyState,
  DashboardPageShell,
} from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPrimaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

type PathRow = {
  _id: Id<'learningPaths'>
  title: string
  slug: string
  description: string
  coverUrl?: string
  isPublished: boolean
  institutionId?: Id<'institutions'>
  itemsCount: number
}

type InstitutionRow = {
  _id: Id<'institutions'>
  name: string
  memberRole: 'dono' | 'admin' | 'membro'
}

export function TrilhasPage() {
  const paths = useQuery(api.learningPaths.listMine, {}) as
    | PathRow[]
    | undefined
  const institutions = useQuery(api.institutions.listByUser) as
    | InstitutionRow[]
    | undefined

  const create = useMutation(api.learningPaths.create)
  const formId = useId()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    institutionId: '' as string,
    coverUrl: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const adminInsts =
    institutions?.filter((i) => i.memberRole !== 'membro') ?? []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await create({
        title: form.title.trim(),
        description: form.description.trim(),
        institutionId: form.institutionId
          ? (form.institutionId as Id<'institutions'>)
          : undefined,
        coverUrl: form.coverUrl.trim() || undefined,
      })
      setForm({ title: '', description: '', institutionId: '', coverUrl: '' })
      setShowCreate(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar trilha.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Trilhas e planos de estudo"
      title="Suas trilhas e planos"
      description="Sequências ordenadas de cursos. Trilhas pessoais para alunos no geral; planos institucionais para matricular membros específicos da igreja ou escola."
      actions={
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className={brandPrimaryButtonClass}
        >
          {showCreate ? 'Cancelar' : 'Novo plano de estudo'}
        </button>
      }
    >
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className={cn('mb-6 space-y-4 p-6', brandPanelClass)}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2BD8A]">
            Criar nova trilha
          </p>
          <div>
            <label htmlFor={`${formId}-title`} className="mb-1.5 block text-xs font-medium text-white/52">
              Título
            </label>
            <input
              id={`${formId}-title`}
              type="text"
              required
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Fundamentos da Teologia Sistemática"
              className={brandInputClass}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-description`} className="mb-1.5 block text-xs font-medium text-white/52">
              Descrição (até 2000 caracteres)
            </label>
            <textarea
              id={`${formId}-description`}
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Para quem está começando do zero, esta trilha cobre..."
              className={brandInputClass}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {adminInsts.length > 0 && (
              <div>
                <label htmlFor={`${formId}-institutionId`} className="mb-1.5 block text-xs font-medium text-white/52">
                  Instituição (opcional)
                </label>
                <select
                  id={`${formId}-institutionId`}
                  value={form.institutionId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, institutionId: e.target.value }))
                  }
                  className={brandInputClass}
                >
                  <option value="">Pessoal (sem instituição)</option>
                  {adminInsts.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor={`${formId}-coverUrl`} className="mb-1.5 block text-xs font-medium text-white/52">
                URL da capa (opcional)
              </label>
              <input
                id={`${formId}-coverUrl`}
                type="url"
                value={form.coverUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverUrl: e.target.value }))
                }
                placeholder="https://..."
                className={brandInputClass}
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={creating || form.title.trim().length < 3}
            className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
          >
            {creating ? 'Criando...' : 'Criar trilha'}
          </button>
        </form>
      )}

      {paths === undefined ? (
        <div className={cn('h-32 animate-pulse', brandPanelClass)} />
      ) : paths.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          }
          title="Nenhuma trilha criada"
          description="Crie sua primeira trilha para sequenciar cursos em um caminho de aprendizagem."
        />
      ) : (
        <ul className="space-y-3">
          {paths.map((p) => (
            <li
              key={p._id}
              className={cn(
                'flex flex-col gap-3 p-4 transition-all hover:border-[#F37E20]/22 sm:flex-row sm:items-center sm:gap-4',
                brandPanelClass,
              )}
            >
              {p.coverUrl ? (
                <img
                  src={p.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-16 w-28 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-28 flex-shrink-0 items-center justify-center rounded-xl bg-white/8">
                  <svg
                    className="h-5 w-5 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/dashboard/trilhas/${p._id}`}
                    className="font-medium text-white hover:text-[#F2BD8A]"
                  >
                    {p.title}
                  </Link>
                  <span className={brandStatusPillClass(p.isPublished ? 'success' : 'neutral')}>
                    {p.isPublished ? 'Publicado' : 'Rascunho'}
                  </span>
                  {p.institutionId && (
                    <span className={brandStatusPillClass('info')}>Institucional</span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-white/56">
                  {p.description}
                </p>
                <p className="mt-1 text-[11px] text-white/40">
                  {p.itemsCount} curso(s)
                </p>
              </div>
              <Link
                to={`/dashboard/trilhas/${p._id}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/72 transition-colors hover:border-[#F37E20]/30 hover:bg-[#F37E20]/8 hover:text-[#F2BD8A]"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  )
}
