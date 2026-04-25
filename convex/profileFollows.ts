// Seguir um autor: cria um par (followerUserId, authorUserId) com prefs de
// notificação granulares (artigos / cursos / aulas) e um campo emailDigest
// reservado para wave futura. followerCount em users é mantido em sincronia.
//
// Notificação: o autor recebe 'profile_followed' quando alguém o segue.

import { v } from 'convex/values'
import { mutation, query, type QueryCtx } from './_generated/server'
import { requireCurrentUser } from './lib/auth'
import { internal } from './_generated/api'

async function getPair(
  ctx: QueryCtx,
  followerUserId: string,
  authorUserId: string,
) {
  return await ctx.db
    .query('profileFollows')
    .withIndex('by_pair', (q) =>
      q.eq('followerUserId', followerUserId).eq('authorUserId', authorUserId),
    )
    .unique()
}

export const follow = mutation({
  args: {
    authorUserId: v.string(),
    notifyArticles: v.optional(v.boolean()),
    notifyCourses: v.optional(v.boolean()),
    notifyLessons: v.optional(v.boolean()),
    emailDigest: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { identity, user } = await requireCurrentUser(ctx)
    if (identity.subject === args.authorUserId) {
      throw new Error('Você não pode seguir a si mesmo.')
    }

    const author = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.authorUserId))
      .unique()
    if (!author) throw new Error('Autor não encontrado.')

    const existing = await getPair(ctx, identity.subject, args.authorUserId)
    if (existing) {
      // já segue: aplica eventuais novas prefs em vez de duplicar
      await ctx.db.patch(existing._id, {
        notifyArticles: args.notifyArticles ?? existing.notifyArticles,
        notifyCourses: args.notifyCourses ?? existing.notifyCourses,
        notifyLessons: args.notifyLessons ?? existing.notifyLessons,
        emailDigest: args.emailDigest ?? existing.emailDigest,
      })
      return { followed: true }
    }

    await ctx.db.insert('profileFollows', {
      followerUserId: identity.subject,
      authorUserId: args.authorUserId,
      notifyArticles: args.notifyArticles ?? true,
      notifyCourses: args.notifyCourses ?? true,
      notifyLessons: args.notifyLessons ?? false,
      emailDigest: args.emailDigest ?? false,
      createdAt: Date.now(),
    })

    await ctx.db.patch(author._id, {
      followerCount: (author.followerCount ?? 0) + 1,
    })

    await ctx.runMutation(internal.notifications.pushInternal, {
      userId: args.authorUserId,
      kind: 'profile_followed',
      title: `${user.name} começou a seguir você`,
      body: 'Receba interações desse leitor em seu painel.',
      link: author.handle ? `/${author.handle}` : `/dashboard/perfil`,
    })

    return { followed: true }
  },
})

export const unfollow = mutation({
  args: { authorUserId: v.string() },
  handler: async (ctx, { authorUserId }) => {
    const { identity } = await requireCurrentUser(ctx)
    const existing = await getPair(ctx, identity.subject, authorUserId)
    if (!existing) return { followed: false }
    await ctx.db.delete(existing._id)
    const author = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', authorUserId))
      .unique()
    if (author) {
      await ctx.db.patch(author._id, {
        followerCount: Math.max(0, (author.followerCount ?? 0) - 1),
      })
    }
    return { followed: false }
  },
})

export const updateNotifyPrefs = mutation({
  args: {
    authorUserId: v.string(),
    notifyArticles: v.optional(v.boolean()),
    notifyCourses: v.optional(v.boolean()),
    notifyLessons: v.optional(v.boolean()),
    emailDigest: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireCurrentUser(ctx)
    const existing = await getPair(ctx, identity.subject, args.authorUserId)
    if (!existing) throw new Error('Você não segue este autor.')
    await ctx.db.patch(existing._id, {
      notifyArticles: args.notifyArticles ?? existing.notifyArticles,
      notifyCourses: args.notifyCourses ?? existing.notifyCourses,
      notifyLessons: args.notifyLessons ?? existing.notifyLessons,
      emailDigest: args.emailDigest ?? existing.emailDigest,
    })
  },
})

// Estado de "você segue" para um autor específico. Anônimo retorna false.
export const isFollowing = query({
  args: { authorUserId: v.string() },
  handler: async (ctx, { authorUserId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { following: false, prefs: null as null | {
      notifyArticles: boolean
      notifyCourses: boolean
      notifyLessons: boolean
      emailDigest: boolean
    } }
    const pair = await getPair(ctx, identity.subject, authorUserId)
    if (!pair) return { following: false, prefs: null }
    return {
      following: true,
      prefs: {
        notifyArticles: pair.notifyArticles,
        notifyCourses: pair.notifyCourses,
        notifyLessons: pair.notifyLessons,
        emailDigest: pair.emailDigest,
      },
    }
  },
})

// Lista pública de quem o usuário segue. Retorna apenas dados públicos.
export const listFollowing = query({
  args: { followerUserId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { followerUserId, limit }) => {
    const cap = Math.min(limit ?? 50, 100)
    const rows = await ctx.db
      .query('profileFollows')
      .withIndex('by_follower', (q) => q.eq('followerUserId', followerUserId))
      .take(cap)
    return await Promise.all(
      rows.map(async (r) => {
        const u = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', r.authorUserId))
          .unique()
        return {
          authorUserId: r.authorUserId,
          handle: u?.handle ?? null,
          name: u?.name ?? 'Autor',
          avatarUrl: u?.avatarUrl ?? null,
          followerCount: u?.followerCount ?? 0,
          followedAt: r.createdAt,
        }
      }),
    )
  },
})

export const listFollowers = query({
  args: { authorUserId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { authorUserId, limit }) => {
    const cap = Math.min(limit ?? 50, 100)
    const rows = await ctx.db
      .query('profileFollows')
      .withIndex('by_author', (q) => q.eq('authorUserId', authorUserId))
      .take(cap)
    return await Promise.all(
      rows.map(async (r) => {
        const u = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', r.followerUserId))
          .unique()
        return {
          followerUserId: r.followerUserId,
          handle: u?.handle ?? null,
          name: u?.name ?? 'Leitor',
          avatarUrl: u?.avatarUrl ?? null,
          followedAt: r.createdAt,
        }
      }),
    )
  },
})
