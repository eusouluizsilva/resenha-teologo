import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  DashboardPageShell,
  DashboardSectionLabel,
} from '@/components/dashboard/PageShell'
import { brandInputClass, brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'

type Source = 'lesson' | 'course' | 'post'

const SOURCE_LABEL: Record<Source, string> = {
  lesson: 'Aula',
  course: 'Curso',
  post: 'Artigo',
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts
  const min = 60 * 1000
  const hour = 60 * min
  const day = 24 * hour
  if (diff < min) return 'agora'
  if (diff < hour) return `${Math.floor(diff / min)} min`
  if (diff < day) return `${Math.floor(diff / hour)} h`
  if (diff < 7 * day) return `${Math.floor(diff / day)} d`
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

type CommentItem = {
  _id: string
  source: Source
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  authorRole: string
  text: string
  createdAt: number
  deletedAt: number | null
  editedAt: number | null
  contextTitle: string
  contextLink: string | null
  parentId: string | null
}

function CommentCard({ comment }: { comment: CommentItem }) {
  const softDelete = useMutation(api.admin.softDeleteCommentAsAdmin)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm('Remover este comentário? A ação é reversível apenas via banco.')) return
    setBusy(true)
    setError(null)
    try {
      await softDelete({ source: comment.source, commentId: comment._id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
    } finally {
      setBusy(false)
    }
  }

  const isDeleted = comment.deletedAt !== null

  return (
    <div className={cn('p-4', isDeleted && 'opacity-50')}>
      <div className="flex items-start gap-3">
        {comment.authorAvatarUrl ? (
          <img
            src={comment.authorAvatarUrl}
            alt={comment.authorName}
            className="h-9 w-9 flex-shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-white/62">
            {comment.authorName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-sm font-medium text-white">{comment.authorName}</span>
            <span className="text-white/24">·</span>
            <span className="text-white/52">{formatRelative(comment.createdAt)}</span>
            {comment.editedAt && (
              <>
                <span className="text-white/24">·</span>
                <span className="italic text-white/42">editado</span>
              </>
            )}
            {comment.parentId && <span className={brandStatusPillClass('neutral')}>Resposta</span>}
            <span className={brandStatusPillClass('accent')}>{SOURCE_LABEL[comment.source]}</span>
            {isDeleted && <span className={brandStatusPillClass('neutral')}>Removido</span>}
          </div>

          <p className="whitespace-pre-wrap text-sm text-white/82">
            {isDeleted ? <span className="italic text-white/42">[removido]</span> : comment.text}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="min-w-0 flex-1 text-[11px] text-white/52">
              {comment.contextLink ? (
                <Link
                  to={comment.contextLink}
                  target="_blank"
                  className="truncate text-[#F2BD8A] hover:text-[#F37E20]"
                >
                  {comment.contextTitle} →
                </Link>
              ) : (
                <span>{comment.contextTitle}</span>
              )}
            </div>
            {!isDeleted && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-200 transition hover:border-rose-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Remover
              </button>
            )}
          </div>
          {error && <p className="text-[11px] text-rose-300/80">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export function ComentariosAdminPage() {
  const isAdmin = useQuery(api.admin.amIAdmin, {})
  const comments = useQuery(
    api.admin.listRecentCommentsAcrossPlatform,
    isAdmin ? {} : 'skip',
  )
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | Source>('all')
  const [showDeleted, setShowDeleted] = useState(true)

  const filtered = useMemo<CommentItem[]>(() => {
    if (!comments) return []
    const q = search.trim().toLowerCase()
    return comments.filter((c) => {
      if (!showDeleted && c.deletedAt !== null) return false
      if (sourceFilter !== 'all' && c.source !== sourceFilter) return false
      if (q) {
        const matches =
          c.text.toLowerCase().includes(q) ||
          c.authorName.toLowerCase().includes(q) ||
          c.contextTitle.toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [comments, search, sourceFilter, showDeleted])

  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardPageShell
      eyebrow="Administração"
      title="Moderação de comentários"
      description="Feed unificado dos comentários mais recentes em aulas, fóruns de cursos e artigos do blog. Use para retirar conteúdo abusivo do ar."
    >
      <div>
        <DashboardSectionLabel>
          {comments ? `${comments.length} comentários recentes` : 'Carregando'}
        </DashboardSectionLabel>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por texto, autor ou contexto"
            className={cn(brandInputClass, 'flex-1')}
          />
          <label className="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/72">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[#F37E20]"
            />
            Mostrar removidos
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {([
            { value: 'all', label: 'Todos' },
            { value: 'lesson', label: 'Aulas' },
            { value: 'course', label: 'Fóruns de curso' },
            { value: 'post', label: 'Artigos' },
          ] as const).map((f) => {
            const active = sourceFilter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setSourceFilter(f.value)}
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

        <div className={cn('mt-4 divide-y divide-white/6', brandPanelClass)}>
          {comments === undefined ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-12 text-center text-sm text-white/42">Nenhum comentário encontrado.</p>
          ) : (
            filtered.map((c) => <CommentCard key={`${c.source}:${c._id}`} comment={c} />)
          )}
        </div>
      </div>
    </DashboardPageShell>
  )
}
