import { query } from './_generated/server'

// Retorna a subscription do usuário autenticado, ou null se não tiver.
// Quando há múltiplas (caso histórico), prioriza a active/trialing mais recente.
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const all = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()

    if (all.length === 0) return null

    const active = all.find((s) => s.status === 'active' || s.status === 'trialing')
    const chosen = active ?? all.sort((a, b) => b.updatedAt - a.updatedAt)[0]

    return {
      plan: chosen.plan,
      status: chosen.status,
      currentPeriodEnd: chosen.currentPeriodEnd,
      cancelAtPeriodEnd: chosen.cancelAtPeriodEnd ?? false,
    }
  },
})
