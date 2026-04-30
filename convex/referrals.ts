import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

// Programa de indicacao. Cada usuario recebe um codigo curto unico que
// pode compartilhar via /cadastro?ref=CODIGO. Quando outro usuario se
// cadastra usando esse link, criamos um registro em referrals com status
// 'registered'. Quando ele conclui o primeiro curso, viramos para
// 'completed'. Recompensa monetaria fica para Fase 4; por enquanto e so
// tracking + ranking de indicadores.

function generateCode(seed: string): string {
  // Codigo determinístico curto a partir do clerkId. Cresce ate 7 chars
  // usando hash simples; tem ~36^6 = 2 bilhoes de combinacoes, suficiente.
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  const positive = Math.abs(hash) % 36 ** 7
  return positive.toString(36).toUpperCase().padStart(6, '0').slice(0, 7)
}

// Garante que o usuario tem um codigo de indicacao. Idempotente. Chamado
// pela UI quando o usuario abre a pagina de indicacao pela primeira vez.
export const ensureMyCode = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)

    const me = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!me) throw new Error('Usuário não encontrado')

    if (me.referralCode) return me.referralCode

    let code = generateCode(identity.subject)
    let suffix = 0
    while (true) {
      const conflict = await ctx.db
        .query('users')
        .withIndex('by_referralCode', (q) => q.eq('referralCode', code))
        .unique()
      if (!conflict) break
      suffix += 1
      code = generateCode(identity.subject + suffix)
      if (suffix > 12) {
        code = generateCode(identity.subject + Date.now())
        break
      }
    }

    await ctx.db.patch(me._id, { referralCode: code })
    return code
  },
})

// Estatisticas resumidas para o painel do usuario: total de indicados,
// quantos completaram pelo menos um curso, e os 5 mais recentes.
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const me = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!me) return null

    const all = await ctx.db
      .query('referrals')
      .withIndex('by_referrerUserId', (q) => q.eq('referrerUserId', identity.subject))
      .collect()

    const total = all.length
    const completed = all.filter((r) => r.status === 'completed').length

    const recent = await Promise.all(
      all
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(async (r) => {
          if (!r.referredUserId) return { name: 'Em aberto', status: r.status, createdAt: r.createdAt }
          const u = await ctx.db
            .query('users')
            .withIndex('by_clerkId', (qb) => qb.eq('clerkId', r.referredUserId!))
            .unique()
          return {
            name: u?.name ?? 'Indicado',
            handle: u?.handle ?? null,
            status: r.status,
            createdAt: r.createdAt,
          }
        }),
    )

    return {
      code: me.referralCode ?? null,
      total,
      completed,
      recent,
    }
  },
})

// Vincula um usuario recem-cadastrado a um indicador a partir do codigo.
// Idempotente: se ja existe linha referrals com este referredUserId, ignora.
// Chamado pelo cliente apos a criacao do user no Convex, com o codigo
// armazenado em localStorage durante a navegacao.
export const linkOnSignup = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const identity = await requireIdentity(ctx)
    const cleaned = code.trim().toUpperCase()
    if (cleaned.length < 4 || cleaned.length > 12) return null

    const referrer = await ctx.db
      .query('users')
      .withIndex('by_referralCode', (q) => q.eq('referralCode', cleaned))
      .unique()
    if (!referrer) return null
    if (referrer.clerkId === identity.subject) return null

    const existing = await ctx.db
      .query('referrals')
      .withIndex('by_referredUserId', (q) => q.eq('referredUserId', identity.subject))
      .first()
    if (existing) return existing._id

    return ctx.db.insert('referrals', {
      referrerUserId: referrer.clerkId,
      referredUserId: identity.subject,
      code: cleaned,
      status: 'registered',
      createdAt: Date.now(),
    })
  },
})
