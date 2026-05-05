// Mutations para gerenciar preferências de email do usuário. Centralizado
// aqui pra ficar fácil de auditar quem mexe em opt-out de qual email.
//
// O http.route /api/unsubscribe chama setOptOutByType com o type vindo da
// query string. Painel de preferências do usuário (futuro) chama o mesmo
// helper diretamente do cliente autenticado.

import { v } from 'convex/values'
import { internalMutation, mutation } from './_generated/server'
import { requireIdentity } from './lib/auth'

const TYPE_TO_FIELD: Record<string, string> = {
  daily: 'emailDailyArticleOptOut',
  new_lesson: 'emailNewLessonOptOut',
  weekly: 'emailWeeklyDigestOptOut',
}

// internalMutation chamada pelo http.route. Recebe clerkId já validado por
// HMAC. O 'all' marca todos os opt-outs ao mesmo tempo (link "parar de
// receber qualquer email" no rodapé).
export const setOptOutByType = internalMutation({
  args: {
    clerkId: v.string(),
    type: v.union(
      v.literal('daily'),
      v.literal('new_lesson'),
      v.literal('weekly'),
      v.literal('all'),
    ),
    value: v.boolean(),
  },
  handler: async (ctx, { clerkId, type, value }) => {
    const u = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .first()
    if (!u) return false

    if (type === 'all') {
      await ctx.db.patch(u._id, {
        emailDailyArticleOptOut: value,
        emailNewLessonOptOut: value,
        emailWeeklyDigestOptOut: value,
      })
      return true
    }

    const field = TYPE_TO_FIELD[type]
    if (!field) return false
    await ctx.db.patch(u._id, { [field]: value } as Record<string, boolean>)
    return true
  },
})

// Versão autenticada para o painel do usuário. Mesma lógica, mas pega o
// clerkId da identity em vez de receber por parâmetro.
export const setMyEmailPreference = mutation({
  args: {
    type: v.union(
      v.literal('daily'),
      v.literal('new_lesson'),
      v.literal('weekly'),
    ),
    optOut: v.boolean(),
  },
  handler: async (ctx, { type, optOut }) => {
    const identity = await requireIdentity(ctx)
    const u = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .first()
    if (!u) throw new Error('Usuário não encontrado')
    const field = TYPE_TO_FIELD[type]
    if (!field) throw new Error('Tipo de preferência inválido')
    await ctx.db.patch(u._id, { [field]: optOut } as Record<string, boolean>)
    return { ok: true }
  },
})
