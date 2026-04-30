import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

const optionValidator = v.object({ id: v.string(), text: v.string() })

export const list = query({
  args: { tag: v.optional(v.string()) },
  handler: async (ctx, { tag }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const rows = await ctx.db
      .query('questionBank')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .order('desc')
      .collect()

    if (!tag) return rows
    return rows.filter((r) => r.tags?.includes(tag))
  },
})

export const listTags = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const rows = await ctx.db
      .query('questionBank')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .collect()
    const tags = new Set<string>()
    for (const r of rows) {
      for (const t of r.tags ?? []) tags.add(t)
    }
    return Array.from(tags).sort()
  },
})

export const create = mutation({
  args: {
    text: v.string(),
    options: v.array(optionValidator),
    correctOptionId: v.string(),
    explanation: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    if (args.text.trim().length < 5) throw new Error('Pergunta muito curta.')
    if (args.options.length < 2) throw new Error('Adicione ao menos 2 opções.')
    if (!args.options.find((o) => o.id === args.correctOptionId)) {
      throw new Error('A opção correta precisa estar entre as alternativas.')
    }

    const now = Date.now()
    return await ctx.db.insert('questionBank', {
      creatorId: identity.subject,
      text: args.text.trim(),
      options: args.options,
      correctOptionId: args.correctOptionId,
      explanation: args.explanation?.trim() || undefined,
      tags: args.tags?.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0),
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('questionBank'),
    text: v.optional(v.string()),
    options: v.optional(v.array(optionValidator)),
    correctOptionId: v.optional(v.string()),
    explanation: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    const row = await ctx.db.get(args.id)
    if (!row || row.creatorId !== identity.subject) {
      throw new Error('Não autorizado.')
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (args.text !== undefined) {
      if (args.text.trim().length < 5) throw new Error('Pergunta muito curta.')
      patch.text = args.text.trim()
    }
    if (args.options !== undefined) {
      if (args.options.length < 2) throw new Error('Adicione ao menos 2 opções.')
      patch.options = args.options
    }
    if (args.correctOptionId !== undefined) {
      const opts = (args.options ?? row.options) as { id: string; text: string }[]
      if (!opts.find((o) => o.id === args.correctOptionId)) {
        throw new Error('A opção correta precisa estar entre as alternativas.')
      }
      patch.correctOptionId = args.correctOptionId
    }
    if (args.explanation !== undefined) {
      patch.explanation = args.explanation.trim() || undefined
    }
    if (args.tags !== undefined) {
      patch.tags = args.tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0)
    }

    await ctx.db.patch(args.id, patch)
  },
})

export const remove = mutation({
  args: { id: v.id('questionBank') },
  handler: async (ctx, { id }) => {
    const identity = await requireIdentity(ctx)
    const row = await ctx.db.get(id)
    if (!row || row.creatorId !== identity.subject) return
    await ctx.db.delete(id)
  },
})
