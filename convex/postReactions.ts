// Reactions de blog: like (autenticado, idempotente), share-click (anon ok,
// dedup por sessão), e helpful em comentário (autenticado, idempotente).
//
// IMPORTANTE: nenhum retorno público pode incluir userId/email/clerkId. As
// queries devolvem apenas booleanos e contagens; a auditoria fica nas tabelas.

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import { checkRateLimit } from './lib/rateLimit'

export const like = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const identity = await requireIdentity(ctx)
    const post = await ctx.db.get(postId)
    if (!post) throw new Error('Artigo não encontrado.')
    if (post.status !== 'published' && post.status !== 'unlisted') {
      throw new Error('Artigo não disponível.')
    }

    const existing = await ctx.db
      .query('postLikes')
      .withIndex('by_post_user', (q) =>
        q.eq('postId', postId).eq('userId', identity.subject),
      )
      .unique()

    if (existing) return // idempotente

    await ctx.db.insert('postLikes', {
      postId,
      userId: identity.subject,
      at: Date.now(),
    })
    await ctx.db.patch(postId, { likeCount: (post.likeCount ?? 0) + 1 })
  },
})

export const unlike = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const identity = await requireIdentity(ctx)
    const post = await ctx.db.get(postId)
    if (!post) return

    const existing = await ctx.db
      .query('postLikes')
      .withIndex('by_post_user', (q) =>
        q.eq('postId', postId).eq('userId', identity.subject),
      )
      .unique()
    if (!existing) return

    await ctx.db.delete(existing._id)
    const next = Math.max(0, (post.likeCount ?? 0) - 1)
    await ctx.db.patch(postId, { likeCount: next })
  },
})

// share-click. Funciona anônimo: caller passa sessionId (UUID por aba). Dedup
// por sessionId+postId garante 1 contagem por sessão por artigo, ainda que o
// usuário clique 3 vezes no botão de compartilhar.
export const share = mutation({
  args: {
    postId: v.id('posts'),
    sessionId: v.string(),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) return
    if (post.status !== 'published') return

    // Rate-limit por sessionId (max 10 shares por minuto): backstop ao dedup
    // por (sessionId, postId), impede flood automatizado pra inflar shareCount.
    await checkRateLimit(ctx, args.sessionId, 'post.share', {
      max: 10,
      windowMs: 60_000,
    })

    const dedup = await ctx.db
      .query('postShares')
      .withIndex('by_session_post', (q) =>
        q.eq('sessionId', args.sessionId).eq('postId', args.postId),
      )
      .unique()
    if (dedup) return

    const identity = await ctx.auth.getUserIdentity()
    await ctx.db.insert('postShares', {
      postId: args.postId,
      userId: identity?.subject,
      sessionId: args.sessionId,
      channel: args.channel,
      at: Date.now(),
    })
    await ctx.db.patch(args.postId, { shareCount: (post.shareCount ?? 0) + 1 })
  },
})

// "Útil" em comentário (não dislike). Idempotente. Toggle: chamada repetida
// remove o helpful do mesmo usuário.
export const markCommentHelpful = mutation({
  args: { commentId: v.id('postComments') },
  handler: async (ctx, { commentId }) => {
    const identity = await requireIdentity(ctx)
    const comment = await ctx.db.get(commentId)
    if (!comment) throw new Error('Comentário não encontrado.')

    const existing = await ctx.db
      .query('postCommentHelpful')
      .withIndex('by_comment_user', (q) =>
        q.eq('commentId', commentId).eq('userId', identity.subject),
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
      const next = Math.max(0, (comment.helpfulCount ?? 0) - 1)
      await ctx.db.patch(commentId, { helpfulCount: next })
      return { helpful: false }
    }

    await ctx.db.insert('postCommentHelpful', {
      commentId,
      userId: identity.subject,
      at: Date.now(),
    })
    await ctx.db.patch(commentId, { helpfulCount: (comment.helpfulCount ?? 0) + 1 })
    return { helpful: true }
  },
})

// Estado de reações do viewer atual para um post: { liked, helpfulCommentIds }.
// Usado pelo client para hidratar UI sem expor histórico de outros usuários.
export const myReactionState = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { liked: false, helpfulCommentIds: [] as string[] }

    const like = await ctx.db
      .query('postLikes')
      .withIndex('by_post_user', (q) =>
        q.eq('postId', postId).eq('userId', identity.subject),
      )
      .unique()

    const comments = await ctx.db
      .query('postComments')
      .withIndex('by_post', (q) => q.eq('postId', postId))
      .collect()

    const helpfulIds: string[] = []
    for (const c of comments) {
      const helpful = await ctx.db
        .query('postCommentHelpful')
        .withIndex('by_comment_user', (q) =>
          q.eq('commentId', c._id).eq('userId', identity.subject),
        )
        .unique()
      if (helpful) helpfulIds.push(c._id as unknown as string)
    }

    return { liked: !!like, helpfulCommentIds: helpfulIds }
  },
})
