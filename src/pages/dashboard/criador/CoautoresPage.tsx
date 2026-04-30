import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import {
  DashboardEmptyState,
  DashboardPageShell,
} from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'

type Coauthor = {
  _id: Id<'courseCoauthors'>
  userId: string
  role: 'editor' | 'reviewer'
  addedAt: number
  name: string
  email?: string
  avatarUrl?: string
  handle?: string
}

function roleLabel(role: 'editor' | 'reviewer') {
  return role === 'editor' ? 'Editor' : 'Revisor'
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function CoautoresPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const creatorId = useCreatorId()
  const cId = (courseId ?? '') as Id<'courses'>
  const list = useQuery(
    api.courseCoauthors.list,
    courseId ? { courseId: cId } : 'skip',
  ) as Coauthor[] | undefined
  const course = useQuery(
    api.courses.getById,
    courseId && creatorId ? { id: cId, creatorId } : 'skip',
  )

  const add = useMutation(api.courseCoauthors.addByEmail)
  const setRole = useMutation(api.courseCoauthors.setRole)
  const remove = useMutation(api.courseCoauthors.remove)

  const [email, setEmail] = useState('')
  const [role, setRoleState] = useState<'editor' | 'reviewer'>('editor')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId) return
    setError(null)
    setSuccess(null)
    if (!email.trim()) {
      setError('Informe o email do co-autor.')
      return
    }
    setAdding(true)
    try {
      await add({ courseId: cId, email: email.trim(), role })
      setEmail('')
      setSuccess('Co-autor adicionado.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar co-autor')
    } finally {
      setAdding(false)
    }
  }

  if (course === undefined || list === undefined) {
    return (
      <DashboardPageShell eyebrow="Co-autoria" title="Carregando" description="Aguarde um instante.">
        <div className={cn('h-28 animate-pulse', brandPanelClass)} />
      </DashboardPageShell>
    )
  }

  if (course === null) {
    return (
      <DashboardPageShell
        eyebrow="Co-autoria"
        title="Curso não encontrado"
        description="Este curso não existe ou não pertence à sua conta."
      >
        <Link to="/dashboard/cursos" className={brandSecondaryButtonClass}>
          Voltar para cursos
        </Link>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Co-autoria"
      title="Co-autores do curso"
      description="Convide outros criadores para editar módulos, aulas e quiz deste curso. Apenas o dono pode publicar, despublicar ou excluir."
      maxWidthClass="max-w-4xl"
      actions={
        <Link to={`/dashboard/cursos/${courseId}`} className={brandSecondaryButtonClass}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </Link>
      }
    >
      <section className={cn('p-6', brandPanelClass)}>
        <h2 className="font-display text-lg font-bold text-white">Adicionar co-autor</h2>
        <p className="mt-1 text-sm text-white/52">
          O convidado precisa já ter conta na plataforma. Como editor, ele pode criar
          e editar módulos, aulas e quiz, mas não pode publicar nem excluir o curso.
        </p>
        <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/28 focus:border-[#F37E20]/40 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
            required
          />
          <select
            value={role}
            onChange={(e) => setRoleState(e.target.value as 'editor' | 'reviewer')}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[#F37E20]/40 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
          >
            <option value="editor">Editor (pode editar)</option>
            <option value="reviewer">Revisor (apenas leitura)</option>
          </select>
          <button
            type="submit"
            disabled={adding}
            className={cn(brandPrimaryButtonClass, adding && 'opacity-60')}
          >
            {adding ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-300">{success}</p>}
      </section>

      <section className="mt-6">
        {list.length === 0 ? (
          <DashboardEmptyState
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
            title="Nenhum co-autor ainda"
            description="Convide outros criadores para colaborar na produção deste curso."
          />
        ) : (
          <div className={cn('overflow-hidden p-0', brandPanelClass)}>
            <ul className="divide-y divide-white/8">
              {list.map((c) => (
                <li key={c._id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F37E20]/15 text-sm font-bold text-[#F2BD8A]">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{c.name}</p>
                    <p className="truncate text-xs text-white/48">
                      {c.email ?? c.handle ?? '—'}
                      <span className="text-white/28"> · adicionado em {formatDate(c.addedAt)}</span>
                    </p>
                  </div>
                  <span className={brandStatusPillClass(c.role === 'editor' ? 'accent' : 'info')}>
                    {roleLabel(c.role)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRole({
                          coauthorId: c._id,
                          role: c.role === 'editor' ? 'reviewer' : 'editor',
                        })
                      }
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/72 transition-colors hover:border-[#F37E20]/30 hover:bg-[#F37E20]/8 hover:text-[#F2BD8A]"
                      title={c.role === 'editor' ? 'Tornar revisor' : 'Tornar editor'}
                    >
                      {c.role === 'editor' ? 'Tornar revisor' : 'Tornar editor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remover ${c.name} dos co-autores deste curso?`)) {
                          remove({ coauthorId: c._id })
                        }
                      }}
                      className="rounded-xl border border-red-400/12 bg-red-400/6 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-400/12"
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </DashboardPageShell>
  )
}
