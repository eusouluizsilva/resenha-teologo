import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { ensureIdentityMatches, requireIdentity } from './lib/auth'

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

    return await ctx.db.insert('users', {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      country: args.country,
      phone: args.phone,
      phoneCountry: args.phoneCountry,
      totalDonationsReceived: 0,
    })
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
      return
    }
    await ctx.db.patch(existing._id, {
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
    })
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
