import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { ensureIdentityMatches, requireIdentity } from './lib/auth'
import {
  OFFICIAL_HANDLE,
  autoEnrollUserInOfficialCourses,
  autoFollowOfficial,
  getOfficialUser,
} from './lib/autoEnroll'

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const identity = await requireIdentity(ctx)
    ensureIdentityMatches(identity.subject, clerkId)

    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
  },
})

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
  },
})

export const upsert = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    ensureIdentityMatches(identity.subject, args.clerkId)

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        // Sync from Clerk metadata only if profile field is still empty
        ...(args.phone && !existing.phone ? { phone: args.phone } : {}),
        ...(args.phoneCountry && !existing.phoneCountry ? { phoneCountry: args.phoneCountry } : {}),
        ...(args.country && !existing.country ? { country: args.country } : {}),
      })
      return existing._id
    }

    const newId = await ctx.db.insert('users', {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      country: args.country,
      phone: args.phone,
      phoneCountry: args.phoneCountry,
      totalDonationsReceived: 0,
    })
    await autoFollowOfficial(ctx, args.clerkId)
    await autoEnrollUserInOfficialCourses(ctx, args.clerkId)
    return newId
  },
})

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    country: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneCountry: v.optional(v.string()),
    instagram: v.optional(v.string()),
    facebook: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    address: v.optional(v.string()),
    addressNumber: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    cep: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    institution: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    denomination: v.optional(v.string()),
    churchRole: v.optional(v.string()),
    churchName: v.optional(v.string()),
    churchInstagram: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, ...fields }) => {
    const identity = await requireIdentity(ctx)
    ensureIdentityMatches(identity.subject, clerkId)

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
    if (!user) throw new Error('Usuário não encontrado')
    await ctx.db.patch(user._id, fields)
  },
})

// Chamado pelo webhook do Clerk quando o perfil é atualizado fora do frontend
// (ex.: admin muda email no dashboard do Clerk). Mantém name/email/avatar em dia.
export const syncFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique()
    if (!existing) {
      // Usuário ainda não existe no Convex: cria para manter consistência.
      await ctx.db.insert('users', {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        totalDonationsReceived: 0,
      })
      await autoFollowOfficial(ctx, args.clerkId)
      await autoEnrollUserInOfficialCourses(ctx, args.clerkId)
      return
    }
    await ctx.db.patch(existing._id, {
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
    })
  },
})

// Backfill: faz todos os usuarios existentes seguirem o @resenhadoteologo.
// Idempotente. Disparar manualmente via:
//   npx convex run --prod users:backfillResenhaFollows '{}'
export const backfillResenhaFollows = internalMutation({
  args: {},
  handler: async (ctx) => {
    const target = await getOfficialUser(ctx)
    if (!target) throw new Error(`Perfil @${OFFICIAL_HANDLE} nao encontrado`)

    const allUsers = await ctx.db.query('users').collect()
    const now = Date.now()
    let added = 0

    for (const u of allUsers) {
      if (u.clerkId === target.clerkId) continue
      const exists = await ctx.db
        .query('profileFollows')
        .withIndex('by_pair', (q) =>
          q.eq('followerUserId', u.clerkId).eq('authorUserId', target.clerkId),
        )
        .unique()
      if (exists) continue
      await ctx.db.insert('profileFollows', {
        followerUserId: u.clerkId,
        authorUserId: target.clerkId,
        notifyArticles: true,
        notifyCourses: true,
        notifyLessons: false,
        emailDigest: false,
        createdAt: now,
      })
      added += 1
    }

    if (added > 0) {
      const fresh = await ctx.db.get(target._id)
      if (fresh) {
        await ctx.db.patch(target._id, {
          followerCount: (fresh.followerCount ?? 0) + added,
        })
      }
    }
    return { added, totalUsers: allUsers.length }
  },
})

// Busca de perfis publicos (lupa do dashboard). Filtra in-memory porque o
// volume atual e pequeno; quando crescer, migrar para searchIndex no Convex.
// Esconde perfis sem handle (nao tem URL publica) e perfis 'unlisted'.
// Esconde tambem o proprio usuario dos resultados.
export const searchPublic = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const term = q.trim().toLowerCase().replace(/^@/, '')
    if (term.length < 2) return []

    const identity = await ctx.auth.getUserIdentity()
    const myClerkId = identity?.subject ?? null

    const all = await ctx.db.query('users').collect()
    const matches = all
      .filter((u) => !!u.handle)
      .filter((u) => u.profileVisibility !== 'unlisted')
      .filter((u) => u.clerkId !== myClerkId)
      .filter((u) => {
        const handle = (u.handle ?? '').toLowerCase()
        const name = (u.name ?? '').toLowerCase()
        return handle.includes(term) || name.includes(term)
      })

    matches.sort((a, b) => {
      const aHandle = (a.handle ?? '').toLowerCase()
      const bHandle = (b.handle ?? '').toLowerCase()
      const aHandleStarts = aHandle.startsWith(term) ? 0 : 1
      const bHandleStarts = bHandle.startsWith(term) ? 0 : 1
      if (aHandleStarts !== bHandleStarts) return aHandleStarts - bHandleStarts
      return (b.followerCount ?? 0) - (a.followerCount ?? 0)
    })

    return matches.slice(0, 10).map((u) => ({
      handle: u.handle!,
      name: u.name,
      avatarUrl: u.avatarUrl ?? null,
      bio: u.bio ?? null,
      followerCount: u.followerCount ?? 0,
    }))
  },
})

// Chamado pelo webhook do Clerk quando a conta é deletada fora do app.
// Remove apenas o registro do usuário; dados vinculados (cursos, doações, etc.)
// ficam órfãos mas preservados — a deleção LGPD completa deve ser feita via
// account.deleteAccount (pelo próprio usuário no app).
export const deleteFromWebhook = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
    if (existing) await ctx.db.delete(existing._id)
  },
})
