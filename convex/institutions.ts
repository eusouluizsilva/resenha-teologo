import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const memberships = await ctx.db
      .query('institutionMembers')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .filter((q) => q.neq(q.field('status'), 'removido'))
      .collect()

    const institutions = await Promise.all(
      memberships.map((m) => ctx.db.get(m.institutionId))
    )

    return institutions
      .filter(Boolean)
      .map((inst, i) => ({ ...inst, memberRole: memberships[i].role }))
  },
})

export const getById = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const membership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject)
      )
      .unique()

    if (!membership || membership.status === 'removido') return null

    return ctx.db.get(institutionId)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal('igreja'), v.literal('ensino'), v.literal('empresa')),
    email: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)

    const institutionId = await ctx.db.insert('institutions', {
      name: args.name,
      type: args.type,
      createdByUserId: identity.subject,
      email: args.email,
      cnpj: args.cnpj,
      phone: args.phone,
    })

    await ctx.db.insert('institutionMembers', {
      institutionId,
      userId: identity.subject,
      role: 'dono',
      addedAt: Date.now(),
      addedByUserId: identity.subject,
      status: 'ativo',
    })

    return institutionId
  },
})

export const update = mutation({
  args: {
    institutionId: v.id('institutions'),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    denomination: v.optional(v.string()),
    denominationName: v.optional(v.string()),
    responsibleRole: v.optional(v.string()),
  },
  handler: async (ctx, { institutionId, ...fields }) => {
    const identity = await requireIdentity(ctx)

    const membership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject)
      )
      .unique()

    if (!membership || !['dono', 'admin'].includes(membership.role)) {
      throw new Error('Sem permissão para editar esta instituição')
    }

    await ctx.db.patch(institutionId, fields)
  },
})

export const listMembers = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const myMembership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject)
      )
      .unique()

    if (!myMembership || myMembership.status === 'removido') return []

    const members = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .filter((q) => q.neq(q.field('status'), 'removido'))
      .collect()

    const users = await Promise.all(
      members.map((m) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', m.userId))
          .unique()
      )
    )

    return members.map((m, i) => ({
      ...m,
      user: users[i],
    }))
  },
})
