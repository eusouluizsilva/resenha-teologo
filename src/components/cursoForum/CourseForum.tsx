import { useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useCurrentAppUser } from '@/lib/currentUser'
import { cn } from '@/lib/brand'
import { ComentarioMarkdown } from '@/components/comentarios/ComentarioMarkdown'
import { MarkdownToolbar } from '@/components/comentarios/MarkdownToolbar'

type Comment = {
  _id: Id<'courseComments'>
  authorId: string
  authorName: string
  authorAvatarUrl?: string
  authorRole: 'aluno' | 'criador'
  text: string
  parentId?: Id<'courseComments'>
  isOfficial?: boolean
  helpfulCount: number
  isHelpfulByMe: boolean
  createdAt: number
  editedAt?: number
  deletedAt?: number
}

type Thread = Comment & { replies: Comment[] }

function Avatar({ url, name, size = 10 }: { url?: string; name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const sz = size === 10 ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs'
  if (url) {
    return <img src={url} alt={name} className={cn('flex-shrink-0 rounded-xl object-cover', sz)} />
  }
  return (
    <div className={cn('flex flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 font-bold text-[#F37E20]', sz)}>
      {initials || '?'}
    </div>
  )
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'agora'
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d} d`
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(ts))
}

function CommentRow({
  comment,
  canModerate,
  currentUserId,
  courseId,
}: {
  comment: Comment
  canModerate: boolean
  currentUserId: string | null
  courseId: Id<'courses'>
}) {
  const edit = useMutation(api.courseComments.edit)
  const softDelete = useMutation(api.courseComments.softDelete)
  const setOfficial = useMutation(api.courseComments.setOfficial)
  const markHelpful = useMutation(api.courseComments.markHelpful)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const [busy, setBusy] = useState(false)

  const isAuthor = comment.authorId === currentUserId
  const isReply = !!comment.parentId

  if (comment.deletedAt) {
    return (
      <div className="flex gap-3 opacity-60">
        <Avatar name="?" size={8} />
        <p className="text-sm italic text-gray-400">Comentário removido</p>
      </div>
    )
  }

  async function handleSaveEdit() {
    if (!draft.trim() || busy) return
    setBusy(true)
    try {
      await edit({ id: comment._id, text: draft.trim() })
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (busy) return
    if (!confirm('Remover este comentário?')) return
    setBusy(true)
    try {
      await softDelete({ id: comment._id })
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleOfficial() {
    if (busy) return
    setBusy(true)
    try {
      await setOfficial({ id: comment._id, isOfficial: !comment.isOfficial })
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleHelpful() {
    if (busy || !currentUserId) return
    setBusy(true)
    try {
      await markHelpful({ commentId: comment._id })
    } finally {
      setBusy(false)
    }
  }

  // Evita warning de unused var quando ainda não integrou reply inline.
  void courseId

  return (
    <div className="flex gap-3">
      <Avatar url={comment.authorAvatarUrl} name={comment.authorName} size={isReply ? 8 : 10} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-semibold text-gray-800">{comment.authorName}</p>
          {comment.authorRole === 'criador' && (
            <span className="rounded-full border border-[#F37E20]/30 bg-[#F37E20]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F37E20]">
              Professor
            </span>
          )}
          {comment.isOfficial && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Resposta oficial
            </span>
          )}
          <span className="text-xs text-gray-400">{formatRelative(comment.createdAt)}{comment.editedAt ? ' · editado' : ''}</span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#F37E20] focus:outline-none"
              maxLength={2000}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={busy || !draft.trim()}
                className="rounded-xl bg-[#F37E20] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#e06e10] disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setDraft(comment.text)
                }}
                className="rounded-xl border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <ComentarioMarkdown text={comment.text} variant="light" className="mt-1" />
        )}
        {!editing && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            {currentUserId && !isAuthor && (
              <button
                type="button"
                onClick={handleToggleHelpful}
                aria-pressed={comment.isHelpfulByMe}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold transition-colors',
                  comment.isHelpfulByMe
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:text-emerald-600',
                )}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                </svg>
                <span>
                  Útil{comment.helpfulCount > 0 ? ` · ${comment.helpfulCount}` : ''}
                </span>
              </button>
            )}
            {comment.helpfulCount > 0 && (!currentUserId || isAuthor) && (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                </svg>
                <span className="font-semibold">{comment.helpfulCount} útil</span>
              </span>
            )}
            {isAuthor && (
              <button type="button" onClick={() => setEditing(true)} className="font-semibold text-gray-500 hover:text-[#F37E20]">
                Editar
              </button>
            )}
            {(isAuthor || canModerate) && (
              <button type="button" onClick={handleDelete} className="font-semibold text-gray-500 hover:text-red-500">
                {canModerate && !isAuthor ? 'Remover' : 'Apagar'}
              </button>
            )}
            {canModerate && isReply && (
              <button type="button" onClick={handleToggleOfficial} className="font-semibold text-gray-500 hover:text-emerald-600">
                {comment.isOfficial ? 'Desmarcar como oficial' : 'Marcar como oficial'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ReplyComposer({ courseId, parentId }: { courseId: Id<'courses'>; parentId: Id<'courseComments'> }) {
  const create = useMutation(api.courseComments.create)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      await create({ courseId, parentId, text: text.trim() })
      setText('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Responder..."
        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#F37E20] focus:outline-none"
        maxLength={2000}
      />
      <button
        type="submit"
        disabled={!text.trim() || busy}
        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {busy ? '...' : 'Enviar'}
      </button>
    </form>
  )
}

export function CourseForum({ courseId }: { courseId: Id<'courses'> }) {
  const { currentUser } = useCurrentAppUser()
  const data = useQuery(api.courseComments.listByCourse, { courseId })
  const create = useMutation(api.courseComments.create)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLTextAreaElement>(null)

  const canModerate = data?.viewerRole === 'criador'
  const threads: Thread[] = (data?.threads ?? []) as Thread[]

  async function handleRootSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      await create({ courseId, text: text.trim() })
      setText('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">Fórum do curso</h2>
          <p className="mt-0.5 text-xs text-gray-500">Tire dúvidas e discuta o curso com o professor e outros alunos.</p>
        </div>
        {data !== undefined && (
          <span className="text-xs font-semibold text-gray-400">
            {threads.length} {threads.length === 1 ? 'discussão' : 'discussões'}
          </span>
        )}
      </div>

      <form onSubmit={handleRootSubmit} className="mb-6 flex flex-col gap-2">
        <MarkdownToolbar textareaRef={rootRef} value={text} onChange={setText} />
        <textarea
          ref={rootRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Comece uma nova discussão..."
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#F37E20] focus:outline-none"
          maxLength={2000}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-gray-400">
            Markdown: **negrito**, *itálico*, `código`, &gt; citação, listas com - ou 1.
          </p>
          <button
            type="submit"
            disabled={!text.trim() || busy}
            className="rounded-xl bg-[#F37E20] px-5 py-2 text-sm font-bold text-white hover:bg-[#e06e10] disabled:opacity-50"
          >
            {busy ? 'Enviando...' : 'Publicar'}
          </button>
        </div>
      </form>

      {data === undefined ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      ) : threads.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Ainda sem discussões neste curso.</p>
      ) : (
        <ul className="space-y-8">
          {threads.map((thread) => (
            <li key={thread._id} className="space-y-4">
              <CommentRow
                comment={thread}
                canModerate={canModerate}
                currentUserId={currentUser?.clerkId ?? null}
                courseId={courseId}
              />
              {thread.replies.length > 0 && (
                <div className="ml-13 space-y-4 border-l border-gray-100 pl-5">
                  {thread.replies.map((reply) => (
                    <CommentRow
                      key={reply._id}
                      comment={reply}
                      canModerate={canModerate}
                      currentUserId={currentUser?.clerkId ?? null}
                      courseId={courseId}
                    />
                  ))}
                </div>
              )}
              <div className="ml-13 pl-5">
                <ReplyComposer courseId={courseId} parentId={thread._id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
