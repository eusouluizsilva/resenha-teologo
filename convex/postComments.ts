// Comentários em artigos. Padrão idêntico a lessonComments (parentId, soft
// delete via deletedAt, edit com editedAt, isOfficial só pelo autor do post).
// Diferença: leitura é PÚBLICA (qualquer um vê comentários de um post
// publicado). Escrita exige login.

import { v } from 'convex/values'
import { mutation, query, type QueryCtx } from './_generated/server'
import { requireCurrentUser } from './lib/auth'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'

const MAX_COMMENT_LEN = 2000

type AuthorRole = 'aluno' | 'criador' | 'instituicao'

async function deriveAuthorRole(
  ctx: QueryCtx,
  userId: string,
): Promise<AuthorRole> {
  const fns = await ctx.db
    .query('userFunctions')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .collect()
  const set = new Set(fns.map((f) => f.function))
  if (set.has('criador')) return 'criador'
  if (set.has('instituicao')) return 'instituicao'
  return 'aluno'
}

export const create = mutation({
  args: {
    postId: v.id('posts'),
    text: v.string(),
    parentId: v.optional(v.id('postComments')),
  },
  handler: async (ctx, { postId, text, parentId }) => {
    const { identity, user } = await requireCurrentUser(ctx)
    const post = await ctx.db.get(postId)
    if (!post) throw new Error('Artigo não encontrado.')
    if (post.status !== 'published' && post.status !== 'unlisted') {
      throw new Error('Artigo não disponível.')
    }

    const trimmed = text.trim()
    if (!trimmed) throw new Error('Comentário vazio.')
    const safeText = trimmed.slice(0, MAX_COMMENT_LEN)

    if (parentId) {
      const parent = await ctx.db.get(parentId)
      if (!parent || parent.postId !== postId) {
        throw new Error('Comentário pai inválido.')
      }
      if (parent.parentId) {
        throw new Error('Respostas só podem ser em comentários raiz.')
      }
    }

    const isPostAuthor = post.authorUserId === identity.subject
    const authorRole: AuthorRole = isPostAuthor
      ? post.authorIdentity
      : await deriveAuthorRole(ctx, identity.subject)

    const commentId = await ctx.db.insert('postComments', {
      postId,
      authorId: identity.subject,
      authorName: user.name,
      authorAvatarUrl: user.avatarUrl,
      authorRole,
      text: safeText,
      parentId,
      isOfficial: isPostAuthor && parentId !== undefined ? true : undefined,
      helpfulCount: 0,
      createdAt: Date.now(),
    })

    await ctx.db.patch(postId, { commentCount: (post.commentCount ?? 0) + 1 })

    const excerpt = safeText.length > 90 ? `${safeText.slice(0, 87)}...` : safeText

    // Notifica autor do comentário pai quando é uma resposta.
    if (parentId) {
      const parent = await ctx.db.get(parentId)
      if (parent && !parent.deletedAt && parent.authorId !== identity.subject) {
        await ctx.runMutation(internal.notifications.pushInternal, {
          userId: parent.authorId,
          kind: 'post_comment_reply',
          title: isPostAuthor
            ? `${user.name} (autor) respondeu seu comentário`
            : `${user.name} respondeu seu comentário`,
          body: `Em "${post.title}": ${excerpt}`,
          link: `/blog/${await getAuthorHandle(ctx, post.authorUserId) ?? ''}/${post.slug}`,
        })
      }
    }

    // Notifica autor do post quando é comentário raiz de outra pessoa.
    if (!parentId && !isPostAuthor) {
      await ctx.runMutation(internal.notifications.pushInternal, {
        userId: post.authorUserId,
        kind: 'post_comment_new',
        title: `${user.name} comentou em seu artigo`,
        body: `Em "${post.title}": ${excerpt}`,
        link: `/blog/${await getAuthorHandle(ctx, post.authorUserId) ?? ''}/${post.slug}`,
      })
    }

    return commentId
  },
})

async function getAuthorHandle(ctx: QueryCtx, userId: string): Promise<string | null> {
  const u = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', userId))
    .unique()
  return u?.handle ?? null
}

export const editMine = mutation({
  args: { id: v.id('postComments'), text: v.string() },
  handler: async (ctx, { id, text }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(id)
    if (!comment || comment.authorId !== identity.subject) throw new Error('Não autorizado.')
    if (comment.deletedAt) throw new Error('Comentário removido.')
    const trimmed = text.trim()
    if (!trimmed) throw new Error('Comentário vazio.')
    await ctx.db.patch(id, {
      text: trimmed.slice(0, MAX_COMMENT_LEN),
      editedAt: Date.now(),
    })
  },
})

export const softDeleteMine = mutation({
  args: { id: v.id('postComments') },
  handler: async (ctx, { id }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(id)
    if (!comment || comment.deletedAt) return
    const post = await ctx.db.get(comment.postId)
    const isAuthor = comment.authorId === identity.subject
    const isPostOwner = post?.authorUserId === identity.subject
    if (!isAuthor && !isPostOwner) throw new Error('Não autorizado.')
    await ctx.db.patch(id, { deletedAt: Date.now() })
    if (post) {
      await ctx.db.patch(post._id, {
        commentCount: Math.max(0, (post.commentCount ?? 0) - 1),
      })
    }
  },
})

// Apenas o autor do post pode marcar/desmarcar resposta como oficial.
export const setOfficial = mutation({
  args: { id: v.id('postComments'), isOfficial: v.boolean() },
  handler: async (ctx, { id, isOfficial }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(id)
    if (!comment) throw new Error('Comentário não encontrado.')
    if (!comment.parentId) throw new Error('Só respostas podem ser oficiais.')
    const post = await ctx.db.get(comment.postId)
    if (!post || post.authorUserId !== identity.subject) throw new Error('Não autorizado.')
    await ctx.db.patch(id, { isOfficial: isOfficial || undefined })
  },
})

type PublicComment = {
  _id: Doc<'postComments'>['_id']
  authorName: string
  authorAvatarUrl: string | null
  authorRole: AuthorRole
  text: string
  parentId: Doc<'postComments'>['parentId']
  isOfficial: boolean
  helpfulCount: number
  createdAt: number
  editedAt: number | null
  deleted: boolean
  authorHandle: string | null
  // isMine é resolvido no servidor a partir da identidade autenticada do
  // caller. Anônimos sempre recebem false. Evita expor o clerkId do autor
  // do comentário no payload público.
  isMine: boolean
}

async function shapePublic(
  ctx: QueryCtx,
  c: Doc<'postComments'>,
  callerSubject: string | null,
): Promise<PublicComment> {
  const u = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', c.authorId))
    .unique()
  return {
    _id: c._id,
    authorName: c.authorName,
    authorAvatarUrl: c.authorAvatarUrl ?? null,
    authorRole: c.authorRole,
    text: c.deletedAt ? '' : c.text,
    parentId: c.parentId,
    isOfficial: !!c.isOfficial,
    helpfulCount: c.helpfulCount ?? 0,
    createdAt: c.createdAt,
    editedAt: c.editedAt ?? null,
    deleted: !!c.deletedAt,
    authorHandle: u?.handle ?? null,
    isMine: !!callerSubject && callerSubject === c.authorId,
  }
}

// Listagem pública. Não vaza email nem clerkId. authorHandle é o link público
// para o perfil. isMine é derivado server-side a partir da identidade do caller.
export const listByPost = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const identity = await ctx.auth.getUserIdentity()
    const callerSubject = identity?.subject ?? null
    const all = await ctx.db
      .query('postComments')
      .withIndex('by_post', (q) => q.eq('postId', postId))
      .collect()

    const shaped = await Promise.all(all.map((c) => shapePublic(ctx, c, callerSubject)))
    const roots = shaped
      .filter((c) => !c.parentId)
      .sort((a, b) => a.createdAt - b.createdAt)

    const repliesByParent = new Map<string, PublicComment[]>()
    for (const c of shaped) {
      if (c.parentId) {
        const key = c.parentId as unknown as string
        const arr = repliesByParent.get(key) ?? []
        arr.push(c)
        repliesByParent.set(key, arr)
      }
    }

    return roots.map((root) => ({
      ...root,
      replies: (repliesByParent.get(root._id as unknown as string) ?? []).sort(
        (a, b) => a.createdAt - b.createdAt,
      ),
    }))
  },
})
