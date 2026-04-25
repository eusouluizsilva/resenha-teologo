// Notificações in-app. Listagem e contagem são queries públicas filtradas pelo
// clerkId do usuário autenticado; não existe endpoint que permita ler
// notificações de outra pessoa. A inserção é feita por mutations internas
// chamadas pelos fluxos de negócio (curso concluído, resposta em comentário,
// certificado emitido). Retenção: mantemos as 100 mais recentes por usuário,
// as mais antigas são removidas na criação.

import { v } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'

const MAX_PER_USER = 100

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(20)
    return rows
  },
})

export const countUnread = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return 0
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .take(100)
    return rows.filter((n) => !n.readAt).length
  },
})

export const markRead = mutation({
  args: { id: v.id('notifications') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado.')
    const n = await ctx.db.get(id)
    if (!n) return
    if (n.userId !== identity.subject) throw new Error('Proibido.')
    if (n.readAt) return
    await ctx.db.patch(id, { readAt: Date.now() })
  },
})

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado.')
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .take(100)
    const now = Date.now()
    for (const n of rows) {
      if (!n.readAt) await ctx.db.patch(n._id, { readAt: now })
    }
  },
})

// Interna: insere notificação e poda as mais antigas para manter MAX_PER_USER.
// Chamada por fluxos internos (enrollments.markComplete, comments.replyTo).
export const pushInternal = internalMutation({
  args: {
    userId: v.string(),
    kind: v.union(
      v.literal('course_completed'),
      v.literal('certificate_issued'),
      v.literal('comment_reply'),
      v.literal('comment_new'),
      v.literal('course_published'),
      v.literal('welcome'),
      v.literal('reengagement'),
      v.literal('generic'),
    ),
    title: v.string(),
    body: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.userId,
      kind: args.kind,
      title: args.title,
      body: args.body,
      link: args.link,
      createdAt: Date.now(),
    })

    const all = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
    if (all.length > MAX_PER_USER) {
      const toDelete = all.slice(MAX_PER_USER)
      for (const row of toDelete) await ctx.db.delete(row._id)
    }
  },
})
