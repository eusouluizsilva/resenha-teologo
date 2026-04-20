import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
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
    perfil: v.union(v.literal('aluno'), v.literal('criador'), v.literal('instituicao')),
    avatarUrl: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    institution: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
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
      })
      return existing._id
    }

    return await ctx.db.insert('users', {
      ...args,
      totalDonationsReceived: 0,
    })
  },
})

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    bio: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    institution: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
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
