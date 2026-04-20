import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    return await ctx.db
      .query('userFunctions')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()
  },
})

export const enable = mutation({
  args: {
    function: v.union(v.literal('aluno'), v.literal('criador'), v.literal('instituicao')),
  },
  handler: async (ctx, { function: fn }) => {
    const identity = await requireIdentity(ctx)

    const existing = await ctx.db
      .query('userFunctions')
      .withIndex('by_userId_function', (q) =>
        q.eq('userId', identity.subject).eq('function', fn)
      )
      .unique()

    if (existing) return existing._id

    return await ctx.db.insert('userFunctions', {
      userId: identity.subject,
      function: fn,
      enabledAt: Date.now(),
    })
  },
})

export const disable = mutation({
  args: {
    function: v.union(v.literal('aluno'), v.literal('criador'), v.literal('instituicao')),
  },
  handler: async (ctx, { function: fn }) => {
    const identity = await requireIdentity(ctx)

    const existing = await ctx.db
      .query('userFunctions')
      .withIndex('by_userId_function', (q) =>
        q.eq('userId', identity.subject).eq('function', fn)
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})

export const migrateFromPerfil = mutation({
  args: {
    perfil: v.union(v.literal('aluno'), v.literal('criador'), v.literal('instituicao')),
  },
  handler: async (ctx, { perfil }) => {
    const identity = await requireIdentity(ctx)

    const existing = await ctx.db
      .query('userFunctions')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()

    if (existing.length > 0) return

    await ctx.db.insert('userFunctions', {
      userId: identity.subject,
      function: perfil,
      enabledAt: Date.now(),
    })
  },
})
