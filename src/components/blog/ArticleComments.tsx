// Comentários públicos do artigo. Leitura aberta a todos. Compor exige login
// (anônimos veem o aviso "Entre para comentar"). 1 nível de respostas, com
// soft delete e edição. Usa visual light, padrão do /blog.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

const MAX_LEN = 2000

interface ArticleCommentsProps {
  postId: Id<'posts'>
  postAuthorUserId: string
}

export function ArticleComments({ postId, postAuthorUserId }: ArticleCommentsProps) {
  const { user, isSignedIn } = useUser()
  const threads = useQuery(api.postComments.listByPost, { postId }) ?? []
  const reactionState = useQuery(
    api.postReactions.myReactionState,
    isSignedIn ? { postId } : 'skip',
  )
  const create = useMutation(api.postComments.create)
  const editMine = useMutation(api.postComments.editMine)
  const softDelete = useMutation(api.postComments.softDeleteMine)
  const setOfficial = useMutation(api.postComments.setOfficial)
  const helpful = useMutation(api.postReactions.markCommentHelpful)

  const helpfulSet = new Set(reactionState?.helpfulCommentIds ?? [])

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold text-[#111827]">
          Comentários
          <span className="ml-2 text-sm font-medium text-[#6B7280]">
            ({threads.reduce((acc, t) => acc + 1 + t.replies.length, 0)})
          </span>
        </h2>
      </div>

      <Composer postId={postId} parentId={undefined} onSubmit={(text) => create({ postId, text })} />

      <div className="space-y-6">
        {threads.length === 0 && (
          <p className="font-serif italic text-[#6B7280]">Seja o primeiro a comentar.</p>
        )}
        {threads.map((thread) => (
          <CommentBlock
            key={thread._id as unknown as string}
            comment={thread}
            postAuthorUserId={postAuthorUserId}
            currentUserId={user?.id ?? null}
            isHelpful={helpfulSet.has(thread._id as unknown as string)}
            onReply={(text) => create({ postId, text, parentId: thread._id })}
            onEdit={(id, text) => editMine({ id, text })}
            onDelete={(id) => softDelete({ id })}
            onMarkHelpful={(id) => helpful({ commentId: id })}
            onSetOfficial={(id, v) => setOfficial({ id, isOfficial: v })}
            replies={thread.replies.map((r) => ({
              ...r,
              isHelpfulByMe: helpfulSet.has(r._id as unknown as string),
            }))}
          />
        ))}
      </div>
    </section>
  )
}

type ThreadComment = NonNullable<ReturnType<typeof useQuery<typeof api.postComments.listByPost>>>[number]
type ReplyComment = ThreadComment['replies'][number] & { isHelpfulByMe: boolean }

interface CommentBlockProps {
  comment: ThreadComment
  postAuthorUserId: string
  currentUserId: string | null
  isHelpful: boolean
  replies: ReplyComment[]
  onReply: (text: string) => Promise<unknown>
  onEdit: (id: Id<'postComments'>, text: string) => Promise<unknown>
  onDelete: (id: Id<'postComments'>) => Promise<unknown>
  onMarkHelpful: (id: Id<'postComments'>) => Promise<unknown>
  onSetOfficial: (id: Id<'postComments'>, v: boolean) => Promise<unknown>
}

function CommentBlock({
  comment,
  postAuthorUserId,
  currentUserId,
  isHelpful,
  replies,
  onReply,
  onEdit,
  onDelete,
  onMarkHelpful,
  onSetOfficial,
}: CommentBlockProps) {
  const [showReply, setShowReply] = useState(false)

  return (
    <div className="rounded-2xl border border-[#E6DBCF] bg-white p-5">
      <CommentRow
        comment={comment}
        postAuthorUserId={postAuthorUserId}
        currentUserId={currentUserId}
        isHelpful={isHelpful}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkHelpful={onMarkHelpful}
        onSetOfficial={onSetOfficial}
      />

      {!comment.deleted && (
        <button
          type="button"
          onClick={() => setShowReply((s) => !s)}
          className="mt-3 text-xs font-semibold text-[#F37E20] hover:underline"
        >
          {showReply ? 'Cancelar' : 'Responder'}
        </button>
      )}

      {showReply && (
        <div className="mt-3">
          <Composer
            postId={comment._id as unknown as Id<'posts'>}
            parentId={comment._id}
            onSubmit={async (t) => {
              await onReply(t)
              setShowReply(false)
            }}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-4 space-y-3 border-l-2 border-[#F1E7D8] pl-4">
          {replies.map((r) => (
            <CommentRow
              key={r._id as unknown as string}
              comment={r}
              postAuthorUserId={postAuthorUserId}
              currentUserId={currentUserId}
              isHelpful={r.isHelpfulByMe}
              onEdit={onEdit}
              onDelete={onDelete}
              onMarkHelpful={onMarkHelpful}
              onSetOfficial={onSetOfficial}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentRowProps {
  comment: ThreadComment | ReplyComment
  postAuthorUserId: string
  currentUserId: string | null
  isHelpful: boolean
  onEdit: (id: Id<'postComments'>, text: string) => Promise<unknown>
  onDelete: (id: Id<'postComments'>) => Promise<unknown>
  onMarkHelpful: (id: Id<'postComments'>) => Promise<unknown>
  onSetOfficial: (id: Id<'postComments'>, v: boolean) => Promise<unknown>
}

function CommentRow({
  comment,
  postAuthorUserId,
  currentUserId,
  isHelpful,
  onEdit,
  onDelete,
  onMarkHelpful,
  onSetOfficial,
}: CommentRowProps) {
  const [isEditing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const isMine = comment.isMine
  const isPostOwner = currentUserId === postAuthorUserId
  const isReply = !!comment.parentId

  if (comment.deleted) {
    return (
      <p className="text-sm italic text-[#9CA3AF]">comentário removido</p>
    )
  }

  return (
    <div className="flex gap-3">
      {comment.authorAvatarUrl ? (
        <img src={comment.authorAvatarUrl} alt={comment.authorName} loading="lazy" decoding="async" className="h-9 w-9 rounded-2xl object-cover" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F37E20]/10 text-xs font-semibold text-[#F37E20]">
          {comment.authorName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {comment.authorHandle ? (
            <Link to={`/${comment.authorHandle}`} className="text-sm font-semibold text-[#111827] hover:underline">
              {comment.authorName}
            </Link>
          ) : (
            <p className="text-sm font-semibold text-[#111827]">{comment.authorName}</p>
          )}
          {comment.authorRole === 'criador' && (
            <span className="rounded-full bg-[#F37E20]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
              Professor
            </span>
          )}
          {comment.isOfficial && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Oficial
            </span>
          )}
          <span className="text-xs text-[#9CA3AF]">
            {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            {comment.editedAt && ' · editado'}
          </span>
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-xl border border-[#DED4C7] bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#F37E20]/40 focus:outline-none"
              rows={3}
              maxLength={MAX_LEN}
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await onEdit(comment._id, draft)
                  setEditing(false)
                }}
                className="rounded-xl bg-[#F37E20] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06e10]"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setDraft(comment.text)
                  setEditing(false)
                }}
                className="rounded-xl border border-[#DED4C7] bg-white px-3 py-1.5 text-xs font-semibold text-[#4B5563] hover:bg-[#F7F5F2]"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap font-serif text-[15px] leading-7 text-[#1F2937]">{comment.text}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => onMarkHelpful(comment._id)}
            disabled={!currentUserId}
            className={
              isHelpful
                ? 'inline-flex items-center gap-1.5 rounded-full bg-[#F37E20]/10 px-3 py-1 text-[#F37E20]'
                : 'inline-flex items-center gap-1.5 rounded-full border border-[#E6DBCF] bg-white px-3 py-1 text-[#6B7280] hover:border-[#F37E20]/30 hover:text-[#F37E20] disabled:opacity-40'
            }
            title={currentUserId ? 'Marcar como útil' : 'Entre para reagir'}
          >
            <svg className="h-3.5 w-3.5" fill={isHelpful ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
            </svg>
            <span>Útil · {comment.helpfulCount}</span>
          </button>

          {isMine && !isEditing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[#6B7280] hover:text-[#F37E20]"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Remover este comentário?')) onDelete(comment._id)
                }}
                className="text-[#6B7280] hover:text-red-600"
              >
                Remover
              </button>
            </>
          )}
          {isPostOwner && !isMine && isReply && (
            <button
              type="button"
              onClick={() => onSetOfficial(comment._id, !comment.isOfficial)}
              className="text-[#6B7280] hover:text-[#F37E20]"
            >
              {comment.isOfficial ? 'Remover destaque' : 'Marcar como oficial'}
            </button>
          )}
          {isPostOwner && !isMine && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Moderar e remover este comentário?')) onDelete(comment._id)
              }}
              className="text-[#6B7280] hover:text-red-600"
            >
              Moderar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ComposerProps {
  postId: Id<'posts'>
  parentId: Id<'postComments'> | undefined
  onSubmit: (text: string) => Promise<unknown>
}

function Composer({ onSubmit }: ComposerProps) {
  const navigate = useNavigate()
  const { isSignedIn } = useUser()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isSignedIn) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E6DBCF] bg-[#FCF9F4] p-5 text-center">
        <p className="font-serif text-[#4B5563]">
          Entre para participar da conversa.
        </p>
        <button
          onClick={() => {
            const next = encodeURIComponent(window.location.pathname + window.location.search)
            navigate(`/entrar?return=${next}`)
          }}
          className="mt-3 inline-flex rounded-2xl bg-[#F37E20] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e06e10]"
        >
          Entrar
        </button>
      </div>
    )
  }

  async function handleSubmit() {
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit(text.trim())
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#E6DBCF] bg-white p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Compartilhe sua leitura. Seja claro, gentil e direto."
        rows={3}
        maxLength={MAX_LEN}
        className="w-full rounded-xl border border-[#DED4C7] bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#F37E20]/40 focus:outline-none"
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-[#9CA3AF]">{text.length}/{MAX_LEN}</span>
        <button
          onClick={handleSubmit}
          disabled={busy || !text.trim()}
          className="inline-flex rounded-2xl bg-[#F37E20] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e06e10] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Enviando...' : 'Comentar'}
        </button>
      </div>
    </div>
  )
}
