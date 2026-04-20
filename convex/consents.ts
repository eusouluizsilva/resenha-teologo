import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    return await ctx.db
      .query('consents')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()
  },
})

export const record = mutation({
  args: {
    type: v.union(
      v.literal('geral'),
      v.literal('aluno'),
      v.literal('criador'),
      v.literal('instituicao')
    ),
    documentVersion: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)

    return await ctx.db.insert('consents', {
      userId: identity.subject,
      type: args.type,
      documentVersion: args.documentVersion,
      acceptedAt: Date.now(),
      userAgent: args.userAgent,
    })
  },
})
