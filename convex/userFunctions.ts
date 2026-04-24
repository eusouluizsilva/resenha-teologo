import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import { internal } from './_generated/api'

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

    // Contagem ANTES do insert para decidir se é a primeira função ativada.
    const current = await ctx.db
      .query('userFunctions')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()

    const id = await ctx.db.insert('userFunctions', {
      userId: identity.subject,
      function: fn,
      enabledAt: Date.now(),
    })

    // Primeira ativação: notificação in-app + email de boas-vindas.
    if (current.length === 0) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
        .unique()

      await ctx.runMutation(internal.notifications.pushInternal, {
        userId: identity.subject,
        kind: 'welcome',
        title: 'Bem-vindo à Resenha do Teólogo',
        body: 'Sua função foi ativada. Explore o catálogo e comece a estudar no seu ritmo.',
        link: fn === 'criador' ? '/dashboard/cursos' : fn === 'instituicao' ? '/dashboard' : '/cursos',
      })

      if (user?.email) {
        await ctx.scheduler.runAfter(0, internal.email.sendWelcome, {
          to: user.email,
          name: user.name || 'aluno',
        })
      }
    }

    return id
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
