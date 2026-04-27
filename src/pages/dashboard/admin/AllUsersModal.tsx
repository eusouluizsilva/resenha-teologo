import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import {
  brandGhostButtonClass,
  brandInputClass,
  brandPanelClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import { VerifiedBadge } from '@/components/VerifiedBadge'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function functionLabel(fn: string) {
  if (fn === 'criador') return 'Professor'
  if (fn === 'aluno') return 'Aluno'
  if (fn === 'instituicao') return 'Instituição'
  return fn
}

function statusTone(status: string) {
  if (status === 'published' || status === 'completed') return 'success' as const
  if (status === 'draft' || status === 'pending') return 'neutral' as const
  return 'info' as const
}

function statusLabel(status: string) {
  if (status === 'published') return 'Publicado'
  if (status === 'draft') return 'Rascunho'
  if (status === 'unlisted') return 'Não listado'
  if (status === 'scheduled') return 'Agendado'
  if (status === 'removed') return 'Removido'
  if (status === 'completed') return 'Concluída'
  if (status === 'pending') return 'Pendente'
  if (status === 'failed') return 'Falhou'
  return status
}

function CountTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/36">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function UserDetail({
  userId,
  onBack,
}: {
  userId: Id<'users'>
  onBack: () => void
}) {
  const detail = useQuery(api.admin.getUserDetail, { userId })
  const simulate = useMutation(api.admin.simulateCompleteEnrollmentsForUser)
  const [simState, setSimState] = useState<
    | { status: 'idle' }
    | { status: 'running' }
    | { status: 'done'; touched: number; issued: number; total: number }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  async function runSimulate() {
    if (!confirm('Marcar TODAS as matriculas deste usuario como 100% concluidas? Sobrescreve progresso existente.')) return
    setSimState({ status: 'running' })
    try {
      const r = await simulate({ userId })
      setSimState({
        status: 'done',
        touched: r.touchedLessons,
        issued: r.issuedCertificates,
        total: r.enrollments,
      })
    } catch (err) {
      setSimState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Erro ao simular',
      })
    }
  }

  if (detail === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-7 w-7 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  const { user, functions, counts, enrollments, ownedCourses, posts, donations } = detail
  const location = [user.city, user.state, user.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className={cn(brandGhostButtonClass, 'px-4 py-2 text-xs')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar à lista
        </button>
        {user.handle && (
          <Link
            to={`/${user.handle}`}
            target="_blank"
            className="text-xs font-semibold text-[#F2BD8A] hover:text-[#F37E20]"
          >
            Ver perfil público →
          </Link>
        )}
      </div>

      <div className="flex items-start gap-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-base font-semibold text-white/62">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 font-display text-xl font-bold text-white">
            <span className="truncate">{user.name}</span>
            <VerifiedBadge handle={user.handle} size="md" />
          </h3>
          <p className="truncate text-sm text-white/62">{user.email}</p>
          <p className="mt-1 text-xs text-white/42">
            Cadastrado em {formatDate(user.createdAt)}
            {location ? ` · ${location}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {functions.length === 0 ? (
              <span className={brandStatusPillClass('neutral')}>Sem função ativa</span>
            ) : (
              functions.map((f) => (
                <span key={f.function} className={brandStatusPillClass('accent')}>
                  {functionLabel(f.function)}
                </span>
              ))
            )}
            {user.isPremium && (
              <span className={brandStatusPillClass('success')}>Premium</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <CountTile label="Matrículas" value={String(counts.enrollments)} />
        <CountTile label="Aulas assistidas" value={String(counts.lessonsCompleted)} />
        <CountTile label="Certificados" value={String(counts.certificates)} />
        <CountTile label="Cursos criados" value={String(counts.ownedCourses)} />
        <CountTile label="Artigos" value={`${counts.publishedPosts}/${counts.posts}`} />
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Simular conclusão (100%)</p>
          <p className="mt-0.5 text-xs text-white/52">
            Marca todas as matrículas como concluídas com nota 100 para visualizar a tela de certificados. Apenas para teste.
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-stretch gap-1 sm:items-end">
          <button
            type="button"
            onClick={runSimulate}
            disabled={simState.status === 'running' || counts.enrollments === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200 transition hover:border-amber-400/50 hover:bg-amber-400/16 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {simState.status === 'running' ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-200/30 border-t-amber-200" />
                Simulando
              </>
            ) : (
              'Simular agora'
            )}
          </button>
          {simState.status === 'done' && (
            <p className="text-[11px] text-emerald-300/80">
              {simState.touched} aulas marcadas · {simState.issued} novos certificados em {simState.total} matrículas.
            </p>
          )}
          {simState.status === 'error' && (
            <p className="text-[11px] text-rose-300/80">{simState.message}</p>
          )}
        </div>
      </div>

      {(user.churchName || user.denomination) && (
        <div className={cn('p-4', brandPanelClass)}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/36">
            Vínculo eclesiástico
          </p>
          <p className="mt-2 text-sm text-white/82">
            {user.churchName || 'Igreja não informada'}
            {user.denomination ? ` · ${user.denomination}` : ''}
            {user.churchRole ? ` · ${user.churchRole}` : ''}
          </p>
        </div>
      )}

      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
          Cadastros em cursos ({counts.enrollments})
        </h4>
        <div className={cn('divide-y divide-white/6', brandPanelClass)}>
          {enrollments.length === 0 ? (
            <p className="p-4 text-sm text-white/42">Sem matrículas.</p>
          ) : (
            enrollments.map((e) => (
              <div key={e._id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{e.courseTitle}</p>
                  <p className="mt-0.5 text-xs text-white/42">
                    Matriculado em {formatDate(e.enrolledAt)}
                    {e.completedAt ? ` · concluído em ${formatDate(e.completedAt)}` : ''}
                    {e.finalScore !== null ? ` · nota ${Math.round(e.finalScore)}` : ''}
                  </p>
                </div>
                {e.certificateIssued && (
                  <span className={brandStatusPillClass('success')}>Certificado</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {counts.ownedCourses > 0 && (
        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
            Cursos criados ({counts.ownedCourses})
          </h4>
          <div className={cn('divide-y divide-white/6', brandPanelClass)}>
            {ownedCourses.map((c) => (
              <div key={c._id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{c.title}</p>
                  <p className="mt-0.5 text-xs text-white/42">
                    {c.totalLessons} aulas · {c.totalStudents} alunos · criado em {formatDate(c.createdAt)}
                  </p>
                </div>
                <span className={brandStatusPillClass(c.isPublished ? 'success' : 'neutral')}>
                  {c.isPublished ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {counts.posts > 0 && (
        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
            Artigos ({counts.posts})
          </h4>
          <div className={cn('divide-y divide-white/6', brandPanelClass)}>
            {posts.map((p) => (
              <div key={p._id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  {user.handle && p.status === 'published' ? (
                    <Link
                      to={`/blog/${user.handle}/${p.slug}`}
                      target="_blank"
                      className="block truncate text-sm font-medium text-white hover:text-[#F2BD8A]"
                    >
                      {p.title}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-medium text-white">{p.title}</p>
                  )}
                  <p className="mt-0.5 text-xs text-white/42">
                    {p.publishedAt ? `Publicado em ${formatDate(p.publishedAt)}` : 'Sem data'} · {p.viewCount} views · {p.likeCount} curtidas
                  </p>
                </div>
                <span className={brandStatusPillClass(statusTone(p.status))}>
                  {statusLabel(p.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {counts.donations > 0 && (
        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
            Doações realizadas ({counts.donations}) · total {formatCurrency(counts.totalDonatedCents)}
          </h4>
          <div className={cn('divide-y divide-white/6', brandPanelClass)}>
            {donations.map((d) => (
              <div key={d._id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{formatCurrency(d.amountCents)}</p>
                  <p className="mt-0.5 text-xs text-white/42">{formatDate(d.createdAt)}</p>
                </div>
                <span className={brandStatusPillClass(statusTone(d.status))}>
                  {statusLabel(d.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

type SortKey =
  | 'recent'
  | 'oldest'
  | 'lessons'
  | 'enrollments'
  | 'courses'
  | 'name'

type RoleFilter = 'all' | 'aluno' | 'criador' | 'instituicao' | 'premium' | 'none'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'lessons', label: 'Mais aulas assistidas' },
  { value: 'enrollments', label: 'Mais matrículas' },
  { value: 'courses', label: 'Mais cursos criados' },
  { value: 'name', label: 'Nome (A-Z)' },
]

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'aluno', label: 'Alunos' },
  { value: 'criador', label: 'Professores' },
  { value: 'instituicao', label: 'Instituições' },
  { value: 'premium', label: 'Premium' },
  { value: 'none', label: 'Sem função' },
]

export function AllUsersModal({ onClose }: { onClose: () => void }) {
  const users = useQuery(api.admin.listAllUsers, {})
  const backfill = useMutation(api.admin.backfillAdminEnrollments)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('recent')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [selectedId, setSelectedId] = useState<Id<'users'> | null>(null)
  const [backfillState, setBackfillState] = useState<
    | { status: 'idle' }
    | { status: 'running' }
    | { status: 'done'; enrollments: number; follows: number; users: number }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  async function runBackfill() {
    setBackfillState({ status: 'running' })
    try {
      const result = await backfill()
      setBackfillState({
        status: 'done',
        enrollments: result.totalEnrollmentsCreated,
        follows: result.totalFollowsCreated,
        users: result.usersWithNewEnrollments,
      })
    } catch (err) {
      setBackfillState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Erro ao sincronizar',
      })
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selectedId) {
          setSelectedId(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, selectedId])

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.trim().toLowerCase()
    let list = users.filter((u) => {
      if (q) {
        const matchesSearch =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.handle ?? '').toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (roleFilter === 'all') return true
      if (roleFilter === 'premium') return u.isPremium
      if (roleFilter === 'none') return u.functions.length === 0
      return u.functions.includes(roleFilter)
    })

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt - a.createdAt
        case 'oldest':
          return a.createdAt - b.createdAt
        case 'lessons':
          return b.lessonsCompletedCount - a.lessonsCompletedCount
        case 'enrollments':
          return b.enrollmentsCount - a.enrollmentsCount
        case 'courses':
          return b.ownedCoursesCount - a.ownedCoursesCount
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR')
        default:
          return 0
      }
    })

    return list
  }, [users, search, sortBy, roleFilter])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0E14]/90 px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={cn('flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden', brandPanelClass)}>
        <div className="flex items-center justify-between gap-3 border-b border-white/6 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F2BD8A]">
              Administração
            </p>
            <h2 className="mt-1 truncate font-display text-lg font-bold text-white">
              {selectedId ? 'Detalhes do usuário' : 'Todos os usuários'}
              {!selectedId && users && (
                <span className="ml-2 text-sm font-normal text-white/42">
                  {users.length} no total
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/62 transition hover:border-white/20 hover:text-white"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {selectedId ? (
            <UserDetail userId={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#F37E20]/16 bg-[#F37E20]/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Matrícula e follow automáticos no @resenhadoteologo
                  </p>
                  <p className="mt-0.5 text-xs text-white/52">
                    Todo cadastro novo já entra matriculado nos cursos do perfil
                    oficial e passa a seguir o perfil. Use o botão para
                    sincronizar usuários e cursos antigos.
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={runBackfill}
                    disabled={backfillState.status === 'running'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F37E20] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#e06e10] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {backfillState.status === 'running' ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sincronizando
                      </>
                    ) : (
                      'Sincronizar agora'
                    )}
                  </button>
                  {backfillState.status === 'done' && (
                    <p className="text-[11px] text-emerald-300/80">
                      {backfillState.enrollments === 0 && backfillState.follows === 0
                        ? 'Tudo já sincronizado.'
                        : `${backfillState.enrollments} matrículas e ${backfillState.follows} follows criados em ${backfillState.users} usuários.`}
                    </p>
                  )}
                  {backfillState.status === 'error' && (
                    <p className="text-[11px] text-rose-300/80">{backfillState.message}</p>
                  )}
                </div>
              </div>
              <div className="mb-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, email ou handle"
                    className={cn(brandInputClass, 'flex-1')}
                  />
                  <label className="relative flex-shrink-0 sm:w-64">
                    <span className="sr-only">Ordenar por</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className={cn(brandInputClass, 'cursor-pointer pr-9 appearance-none')}
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-[#151B23] text-white">
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/52">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ROLE_FILTERS.map((f) => {
                    const active = roleFilter === f.value
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setRoleFilter(f.value)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition',
                          active
                            ? 'border-[#F37E20] bg-[#F37E20]/14 text-[#F2BD8A]'
                            : 'border-white/10 bg-white/[0.03] text-white/52 hover:border-white/20 hover:text-white/82',
                        )}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>
                {users && (search || roleFilter !== 'all') && (
                  <p className="text-[11px] text-white/42">
                    Exibindo {filtered.length} de {users.length} usuários.
                  </p>
                )}
              </div>

              {users === undefined ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-7 w-7 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-white/42">
                  {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                </p>
              ) : (
                <div className="divide-y divide-white/6 rounded-2xl border border-white/8 bg-white/[0.02]">
                  {filtered.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => setSelectedId(u._id)}
                      className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-white/[0.04]"
                    >
                      <div className="flex w-full items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="h-10 w-10 flex-shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-white/62">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-white">
                            <span className="truncate">{u.name}</span>
                            <VerifiedBadge handle={u.handle} size="xs" />
                          </p>
                          <p className="truncate text-xs text-white/42">{u.email}</p>
                        </div>
                        <div className="hidden flex-shrink-0 flex-wrap justify-end gap-1 sm:flex">
                          {u.functions.length === 0 ? (
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/42">
                              sem função
                            </span>
                          ) : (
                            u.functions.map((f) => (
                              <span
                                key={f}
                                className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#F2BD8A]"
                              >
                                {functionLabel(f)}
                              </span>
                            ))
                          )}
                        </div>
                        <span className="flex-shrink-0 text-xs text-white/36">
                          {formatDate(u.createdAt)}
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 flex-shrink-0 text-white/36">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[3.25rem] text-[11px] text-white/52">
                        {u.ownedCoursesCount > 0 && (
                          <span>
                            <strong className="font-semibold text-white/72">{u.ownedCoursesCount}</strong>{' '}
                            {u.ownedCoursesCount === 1 ? 'curso criado' : 'cursos criados'}
                          </span>
                        )}
                        <span>
                          <strong className="font-semibold text-white/72">{u.enrollmentsCount}</strong>{' '}
                          {u.enrollmentsCount === 1 ? 'matrícula' : 'matrículas'}
                        </span>
                        <span>
                          <strong className="font-semibold text-white/72">{u.lessonsCompletedCount}</strong>{' '}
                          {u.lessonsCompletedCount === 1 ? 'aula assistida' : 'aulas assistidas'}
                        </span>
                        {u.enrolledCourses.length > 0 && (
                          <span className="line-clamp-1 min-w-0 max-w-full text-white/42">
                            {u.enrolledCourses.map((c) => c.title).join(' · ')}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
