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

// LGPD: o titular pode revogar a qualquer momento. Não apagamos o registro para
// manter a prova de aceite histórico; apenas marcamos revokedAt. A revogação
// abrange todos os consentimentos ativos do usuário de uma só vez, simplificando
// a UX (um botão só). Após revogar, o sistema deve bloquear funcionalidades que
// exigem consentimento até que o usuário aceite novamente.
export const revokeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)

    const active = await ctx.db
      .query('consents')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()

    const now = Date.now()
    let count = 0
    for (const c of active) {
      if (c.revokedAt === undefined) {
        await ctx.db.patch(c._id, { revokedAt: now })
        count++
      }
    }
    return { revoked: count }
  },
})
