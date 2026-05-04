import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'
import { ComentarioMarkdown } from '@/components/comentarios/ComentarioMarkdown'
import { useCurrentAppUser } from '@/lib/currentUser'
import type { CommentItem } from './types'

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

function CommentRow({
  comment,
  isReply = false,
  canModerate = false,
  currentUserId,
}: {
  comment: CommentItem
  isReply?: boolean
  canModerate?: boolean
  currentUserId: string | null
}) {
  const deleted = Boolean(comment.deletedAt)
  const softDelete = useMutation(api.lessonComments.softDelete)
  const setOfficial = useMutation(api.lessonComments.setOfficial)
  const markHelpful = useMutation(api.lessonComments.markHelpful)
  const [moderating, setModerating] = useState(false)
  const isAuthor = currentUserId === comment.authorId

  async function handleRemove() {
    if (moderating) return
    if (!window.confirm('Remover este comentário? Essa ação não pode ser desfeita.')) return
    setModerating(true)
    try {
      await softDelete({ id: comment._id })
    } finally {
      setModerating(false)
    }
  }

  async function handleToggleOfficial() {
    if (moderating) return
    setModerating(true)
    try {
      await setOfficial({ id: comment._id, isOfficial: !comment.isOfficial })
    } finally {
      setModerating(false)
    }
  }

  async function handleToggleHelpful() {
    if (moderating || !currentUserId) return
    setModerating(true)
    try {
      await markHelpful({ commentId: comment._id })
    } finally {
      setModerating(false)
    }
  }

  return (
    <div className={cn('flex gap-3', isReply && 'mt-3 ml-10')}>
      <div className="flex-shrink-0">
        {comment.authorAvatarUrl ? (
          <img
            src={comment.authorAvatarUrl}
            alt={comment.authorName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {comment.authorName}
          </span>
          {comment.authorRole === 'criador' && (
            <span className="rounded-full bg-[#F37E20]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F37E20]">
              Professor
            </span>
          )}
          {comment.isOfficial && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Resposta oficial
            </span>
          )}
          <span className="text-xs text-gray-400">
            {timeAgo(comment.createdAt)}
            {comment.editedAt ? ' (editado)' : ''}
          </span>
        </div>
        {deleted ? (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 italic text-gray-400">
            Comentário removido.
          </p>
        ) : (
          <ComentarioMarkdown text={comment.text} variant="light" className="mt-1 break-words" />
        )}
        {!deleted && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {currentUserId && !isAuthor && (
              <button
                type="button"
                onClick={handleToggleHelpful}
                disabled={moderating}
                aria-pressed={comment.isHelpfulByMe}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60',
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
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                </svg>
                <span>{comment.helpfulCount} útil</span>
              </span>
            )}
            {canModerate && isReply && (
              <button
                type="button"
                onClick={handleToggleOfficial}
                disabled={moderating}
                className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-60"
              >
                {comment.isOfficial ? 'Remover marcação oficial' : 'Marcar como resposta oficial'}
              </button>
            )}
            {canModerate && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={moderating}
                className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-60"
              >
                {moderating ? 'Processando...' : 'Remover'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ForumSection({ lessonId }: { lessonId: Id<'lessons'> }) {
  const { currentUser } = useCurrentAppUser()
  const currentUserId = currentUser?.clerkId ?? null
  const threadData = useQuery(api.lessonComments.listByLesson, { lessonId })
  const thread = threadData?.threads
  const canModerate = threadData?.viewerRole === 'criador'
  const create = useMutation(api.lessonComments.create)

  const [rootText, setRootText] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'lessonComments'> | null>(
    null
  )
  const [replyText, setReplyText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handlePostRoot() {
    const trimmed = rootText.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await create({ lessonId, text: trimmed })
      setRootText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePostReply(parentId: Id<'lessonComments'>) {
    const trimmed = replyText.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await create({ lessonId, text: trimmed, parentId })
      setReplyText('')
      setReplyingTo(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao responder')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">
            Discussão
          </h2>
          <p className="text-xs text-gray-500">
            Pergunte ao criador, compartilhe reflexões, ou responda colegas.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <textarea
          value={rootText}
          onChange={(e) => setRootText(e.target.value)}
          placeholder="Escreva uma dúvida ou reflexão..."
          maxLength={2000}
          className="min-h-[80px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-4 py-3 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">
              {rootText.length} / 2.000
            </span>
            <span className="text-[11px] text-gray-400">
              Markdown: **negrito**, *itálico*, `código`, &gt; citação, listas com - ou 1.
            </span>
          </div>
          <button
            type="button"
            onClick={handlePostRoot}
            disabled={submitting || !rootText.trim()}
            className="rounded-xl bg-[#F37E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-60"
          >
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      <div className="mt-4 space-y-5">
        {thread === undefined ? (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-xs text-gray-400">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
            Carregando discussão...
          </div>
        ) : thread.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-xs text-gray-400">
            Nenhum comentário ainda. Seja o primeiro a comentar.
          </p>
        ) : (
          thread.map((root) => (
            <div
              key={root._id}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <CommentRow
                comment={root as CommentItem}
                canModerate={canModerate}
                currentUserId={currentUserId}
              />
              {root.replies.map((reply) => (
                <CommentRow
                  key={reply._id}
                  comment={reply as CommentItem}
                  isReply
                  canModerate={canModerate}
                  currentUserId={currentUserId}
                />
              ))}

              {replyingTo === root._id ? (
                <div className="ml-10 mt-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva uma resposta..."
                    maxLength={2000}
                    autoFocus
                    className="min-h-[60px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePostReply(root._id)}
                      disabled={submitting || !replyText.trim()}
                      className="rounded-lg bg-[#F37E20] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e06e10] disabled:opacity-60"
                    >
                      {submitting ? 'Enviando...' : 'Responder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyText('')
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(root._id)
                    setReplyText('')
                  }}
                  className="ml-10 mt-2 text-xs font-semibold text-[#F37E20] hover:underline"
                >
                  Responder
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
