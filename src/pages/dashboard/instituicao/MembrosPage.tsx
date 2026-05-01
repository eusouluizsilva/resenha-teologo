import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPrimaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import type { Id } from '@convex/_generated/dataModel'

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
  const [showCreate, setShowCreate] = useState(false)
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
      setShowCreate(false)
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ownedOrAdmin.map((inst) => (
          <button
            key={inst._id}
            type="button"
            onClick={() => {
              setActiveId(inst._id)
              setShowCreate(false)
            }}
            className={cn(
              'rounded-2xl border px-4 py-2 text-sm font-medium transition-all',
              currentId === inst._id && !showCreate
                ? 'border-[#F37E20]/40 bg-[#F37E20]/10 text-[#F2BD8A]'
                : 'border-white/10 bg-white/4 text-white/72 hover:border-white/20 hover:bg-white/8',
            )}
          >
            {inst.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className={cn(
            'rounded-2xl border border-dashed px-4 py-2 text-sm font-medium transition-all',
            showCreate
              ? 'border-[#F37E20]/40 bg-[#F37E20]/10 text-[#F2BD8A]'
              : 'border-white/14 text-white/62 hover:border-[#F37E20]/30 hover:text-[#F2BD8A]',
          )}
        >
          + Nova instituição
        </button>
      </div>

      {showCreate ? (
        <form onSubmit={handleCreate} className={cn('space-y-4 p-6', brandPanelClass)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2BD8A]">
            Criar nova instituição
          </p>
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
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating || createForm.name.trim().length < 3}
              className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
            >
              {creating ? 'Criando...' : 'Criar instituição'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-medium text-white/62 hover:border-white/20 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        currentId && <InstitutionSection institutionId={currentId} />
      )}
    </DashboardPageShell>
  )
}

function InstitutionSection({ institutionId }: { institutionId: Id<'institutions'> }) {
  const members = useQuery(api.institutions.listMembers, { institutionId })
  const invites = useQuery(api.institutions.listInvites, { institutionId })
  const institution = useQuery(api.institutions.getById, { institutionId })

  const createInvite = useMutation(api.institutions.createInvite)
  const createInvitesBulk = useMutation(api.institutions.createInvitesBulk)
  const revokeInvite = useMutation(api.institutions.revokeInvite)
  const removeMember = useMutation(api.institutions.removeMember)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [bulkResult, setBulkResult] = useState<{
    created: number
    alreadyInvited: number
    alreadyMember: number
    invalid: number
    duplicates: number
  } | null>(null)

  function parseEmails(text: string): string[] {
    return text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const parsedEmails = parseEmails(bulkText)
  const overLimit = parsedEmails.length > 200

  async function handleBulkFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      setBulkText((prev) => (prev.trim().length > 0 ? `${prev}\n${text}` : text))
    } catch {
      setBulkError('Não foi possível ler o arquivo.')
    } finally {
      e.target.value = ''
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (overLimit || parsedEmails.length === 0) return
    setBulkSending(true)
    setBulkError('')
    setBulkResult(null)
    try {
      const res = await createInvitesBulk({ institutionId, emails: parsedEmails })
      setBulkResult(res)
      if (res.created > 0) {
        setBulkText('')
      }
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Falha ao processar a lista.')
    } finally {
      setBulkSending(false)
    }
  }

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

      <div className={cn('p-6', brandPanelClass)}>
        <button
          type="button"
          onClick={() => setBulkOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5M5.25 5.25h13.5a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5z" />
              </svg>
            </span>
            Importar lista (CSV)
          </span>
          <span className="text-xs text-white/52">{bulkOpen ? 'Fechar' : 'Abrir'}</span>
        </button>

        {bulkOpen && (
          <form onSubmit={handleBulkSubmit} className="mt-5 space-y-3">
            <p className="text-xs text-white/56">
              Cole emails (um por linha ou separados por vírgula) ou envie um arquivo
              {' '}.csv/.txt. Máximo de 200 emails por envio.
            </p>
            <textarea
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'pessoa1@email.com\npessoa2@email.com'}
              className={cn(brandInputClass, 'font-mono text-xs')}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium text-white/72 transition-all hover:border-white/22 hover:bg-white/8">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Carregar arquivo
                <input type="file" accept=".csv,.txt" onChange={handleBulkFile} className="hidden" />
              </label>
              <span className={cn(
                'text-xs',
                overLimit ? 'text-red-300' : 'text-white/56',
              )}>
                {parsedEmails.length} email(s) {overLimit && '— acima do limite de 200'}
              </span>
            </div>

            {bulkError && (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {bulkError}
              </p>
            )}

            {bulkResult && (
              <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                <p className="mb-2 text-xs font-semibold text-white/82">Resultado</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-300">
                    Enviados: {bulkResult.created}
                  </span>
                  <span className="rounded-full border border-yellow-400/24 bg-yellow-400/10 px-3 py-1 text-yellow-200">
                    Já convidados: {bulkResult.alreadyInvited}
                  </span>
                  <span className="rounded-full border border-blue-400/24 bg-blue-400/10 px-3 py-1 text-blue-200">
                    Já membros: {bulkResult.alreadyMember}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-white/62">
                    Duplicados na lista: {bulkResult.duplicates}
                  </span>
                  <span className="rounded-full border border-red-500/24 bg-red-500/10 px-3 py-1 text-red-300">
                    Inválidos: {bulkResult.invalid}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={bulkSending || overLimit || parsedEmails.length === 0}
              className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
            >
              {bulkSending
                ? 'Enviando...'
                : `Enviar ${parsedEmails.length || ''} convite(s)`}
            </button>
          </form>
        )}
      </div>

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
                        onClick={() => {
                          if (!window.confirm(`Revogar o convite enviado para ${inv.email}? O destinatário não poderá mais aceitar.`)) return
                          revokeInvite({ inviteId: inv._id })
                        }}
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
                      onClick={() => {
                        const label = m.user?.name ?? m.user?.email ?? 'este membro'
                        if (!window.confirm(`Remover ${label} da instituição? Esta ação não pode ser desfeita.`)) return
                        removeMember({ memberId: m._id })
                      }}
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
