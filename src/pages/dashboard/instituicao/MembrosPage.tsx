import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPrimaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import type { Id } from '../../../../convex/_generated/dataModel'

// Gestão mínima de instituição: escolhe a instituição ativa (primeira em que o
// usuário é dono/admin), lista membros ativos e convites pendentes, permite
// enviar novo convite por email e revogar convite ou remover membro.
// O convite é aceito pelo destinatário via link público /convite/:token.

type InstitutionRow = {
  _id: Id<'institutions'>
  name: string
  type: 'igreja' | 'ensino' | 'empresa'
  memberRole: 'dono' | 'admin' | 'membro'
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ts))
}

function typeLabel(t: string) {
  if (t === 'igreja') return 'Igreja'
  if (t === 'ensino') return 'Instituição de ensino'
  if (t === 'empresa') return 'Empresa'
  return t
}

export function MembrosPage() {
  const institutions = useQuery(api.institutions.listByUser) as InstitutionRow[] | undefined

  const [createForm, setCreateForm] = useState({ name: '', type: 'igreja' as 'igreja' | 'ensino' | 'empresa' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const createInstitution = useMutation(api.institutions.create)

  const ownedOrAdmin = institutions?.filter((i) => i.memberRole !== 'membro') ?? []
  const [activeId, setActiveId] = useState<Id<'institutions'> | null>(null)
  const currentId = activeId ?? ownedOrAdmin[0]?._id ?? null

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const id = await createInstitution({
        name: createForm.name.trim(),
        type: createForm.type,
      })
      setActiveId(id)
      setCreateForm({ name: '', type: 'igreja' })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Falha ao criar instituição.')
    } finally {
      setCreating(false)
    }
  }

  if (institutions === undefined) {
    return (
      <DashboardPageShell eyebrow="Instituição" title="Membros" description="Gerencie membros e convites da sua instituição.">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      </DashboardPageShell>
    )
  }

  if (ownedOrAdmin.length === 0) {
    return (
      <DashboardPageShell
        eyebrow="Instituição"
        title="Membros"
        description="Crie sua instituição para começar a convidar membros."
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreate} className={cn('space-y-4 p-6', brandPanelClass)}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/52">Nome da instituição</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Igreja Batista Central, Seminário Teológico..."
              className={brandInputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/52">Tipo</label>
            <select
              value={createForm.type}
              onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as 'igreja' | 'ensino' | 'empresa' }))}
              className={brandInputClass}
            >
              <option value="igreja">Igreja</option>
              <option value="ensino">Instituição de ensino</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>
          {createError && (
            <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {createError}
            </p>
          )}
          <button
            type="submit"
            disabled={creating || createForm.name.trim().length < 3}
            className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
          >
            {creating ? 'Criando...' : 'Criar instituição'}
          </button>
        </form>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Instituição"
      title="Membros e convites"
      description="Envie convites por email, acompanhe o status e gerencie os membros ativos."
    >
      {ownedOrAdmin.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
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

      {currentId && <InstitutionSection institutionId={currentId} />}
    </DashboardPageShell>
  )
}

function InstitutionSection({ institutionId }: { institutionId: Id<'institutions'> }) {
  const members = useQuery(api.institutions.listMembers, { institutionId })
  const invites = useQuery(api.institutions.listInvites, { institutionId })
  const institution = useQuery(api.institutions.getById, { institutionId })

  const createInvite = useMutation(api.institutions.createInvite)
  const revokeInvite = useMutation(api.institutions.revokeInvite)
  const removeMember = useMutation(api.institutions.removeMember)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      await createInvite({ institutionId, email: inviteEmail.trim() })
      setInviteSuccess(`Convite enviado para ${inviteEmail.trim()}. Compartilhe o link de aceite gerado abaixo.`)
      setInviteEmail('')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Falha ao enviar convite.')
    } finally {
      setInviting(false)
    }
  }

  async function handleCopyLink(token: string) {
    const link = `${window.location.origin}/convite/${token}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // noop
    }
  }

  return (
    <div className="space-y-6">
      {institution && (
        <div className={cn('p-5', brandPanelClass)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
            {typeLabel(institution.type)}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold text-white">{institution.name}</h2>
        </div>
      )}

      <form onSubmit={handleInvite} className={cn('space-y-3 p-6', brandPanelClass)}>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/52">Convidar membro por email</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="membro@email.com"
              className={cn(brandInputClass, 'sm:flex-1')}
            />
            <button
              type="submit"
              disabled={inviting || inviteEmail.trim().length === 0}
              className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
            >
              {inviting ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
        </label>
        {inviteError && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {inviteError}
          </p>
        )}
        {inviteSuccess && (
          <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-300">
            {inviteSuccess}
          </p>
        )}
      </form>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Convites pendentes</h3>
          <span className="text-xs text-white/48">
            {invites ? invites.filter((i) => i.status === 'pendente').length : 0} pendente(s)
          </span>
        </div>
        {invites === undefined ? (
          <div className={cn('p-6 text-sm text-white/48', brandPanelClass)}>Carregando...</div>
        ) : invites.length === 0 ? (
          <DashboardEmptyState
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            }
            title="Nenhum convite enviado"
            description="Use o formulário acima para convidar membros."
          />
        ) : (
          <ul className={cn('divide-y divide-white/6 overflow-hidden', brandPanelClass)}>
            {invites.map((inv) => (
              <li key={inv._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{inv.email}</p>
                  <p className="mt-1 text-xs text-white/48">
                    Expira em {formatDate(inv.expiresAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={brandStatusPillClass(
                    inv.status === 'pendente' ? 'accent' : inv.status === 'aceito' ? 'success' : 'neutral',
                  )}>
                    {inv.status === 'pendente' ? 'Pendente' : inv.status === 'aceito' ? 'Aceito' : 'Expirado'}
                  </span>
                  {inv.status === 'pendente' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(inv.token)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/4 px-3 py-1.5 text-xs font-medium text-white/82 transition-all hover:border-white/22 hover:bg-white/8"
                      >
                        Copiar link
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeInvite({ inviteId: inv._id })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20"
                      >
                        Revogar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Membros ativos</h3>
          <span className="text-xs text-white/48">{members?.length ?? 0} membro(s)</span>
        </div>
        {members === undefined ? (
          <div className={cn('p-6 text-sm text-white/48', brandPanelClass)}>Carregando...</div>
        ) : members.length === 0 ? (
          <DashboardEmptyState
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
            title="Nenhum membro além de você"
            description="Envie convites para começar a formar sua comunidade."
          />
        ) : (
          <ul className={cn('divide-y divide-white/6 overflow-hidden', brandPanelClass)}>
            {members.map((m) => (
              <li key={m._id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-white/82">
                    {(m.user?.name ?? m.user?.email ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{m.user?.name ?? m.user?.email ?? 'Membro'}</p>
                    {m.user?.email && <p className="truncate text-xs text-white/48">{m.user.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={brandStatusPillClass(m.role === 'dono' ? 'accent' : m.role === 'admin' ? 'info' : 'neutral')}>
                    {m.role === 'dono' ? 'Dono' : m.role === 'admin' ? 'Admin' : 'Membro'}
                  </span>
                  {m.role !== 'dono' && (
                    <button
                      type="button"
                      onClick={() => removeMember({ memberId: m._id })}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
