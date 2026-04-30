import { v } from 'convex/values'
import type { MutationCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import { requireCurrentUser, requireIdentity } from './lib/auth'

const productTypeValidator = v.union(
  v.literal('fisico'),
  v.literal('digital'),
  v.literal('servico'),
)

const productStatusValidator = v.union(
  v.literal('draft'),
  v.literal('published'),
  v.literal('archived'),
)

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function uniqueSlug(ctx: MutationCtx, base: string): Promise<string> {
  let candidate = base || 'produto'
  for (let i = 0; i < 10; i++) {
    const existing = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', candidate))
      .unique()
    if (!existing) return candidate
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }
  return `${base}-${Date.now().toString(36)}`
}

// Catalogo publico. Retorna apenas produtos publicados, ordenados por
// publishedAt desc. Sem auth, exposto na pagina /loja.
export const listPublic = query({
  args: {
    type: v.optional(productTypeValidator),
    creatorId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { type, creatorId, limit }) => {
    let products = await ctx.db
      .query('products')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(Math.min(limit ?? 60, 200))

    if (type) products = products.filter((p) => p.type === type)
    if (creatorId) products = products.filter((p) => p.creatorId === creatorId)

    const creatorIds = Array.from(new Set(products.map((p) => p.creatorId)))
    const creators = await Promise.all(
      creatorIds.map(async (cid) => {
        const u = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', cid))
          .unique()
        return u ? { clerkId: cid, name: u.name, handle: u.handle ?? null } : null
      }),
    )
    const byId = new Map(creators.filter(Boolean).map((c) => [c!.clerkId, c!]))

    return products.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription ?? null,
      type: p.type,
      priceCents: p.priceCents,
      compareAtCents: p.compareAtCents ?? null,
      coverUrl: p.coverUrl ?? null,
      stock: p.stock ?? null,
      creatorName: byId.get(p.creatorId)?.name ?? 'Criador',
      creatorHandle: byId.get(p.creatorId)?.handle ?? null,
    }))
  },
})

// Detalhe publico. Apenas produtos publicados. Retorna null se nao existir
// ou estiver em draft/archived.
export const getBySlugPublic = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const product = await ctx.db
      .query('products')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()

    if (!product || product.status !== 'published') return null

    const creator = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', product.creatorId))
      .unique()

    return {
      _id: product._id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription ?? null,
      type: product.type,
      priceCents: product.priceCents,
      compareAtCents: product.compareAtCents ?? null,
      coverUrl: product.coverUrl ?? null,
      galleryUrls: product.galleryUrls ?? [],
      stock: product.stock ?? null,
      externalUrl: product.externalUrl ?? null,
      creatorName: creator?.name ?? 'Criador',
      creatorHandle: creator?.handle ?? null,
      creatorAvatar: creator?.avatarUrl ?? null,
    }
  },
})

// Lista para o painel do criador (inclui draft e archived).
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const products = await ctx.db
      .query('products')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .order('desc')
      .collect()

    return products
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    type: productTypeValidator,
    priceCents: v.number(),
    compareAtCents: v.optional(v.number()),
    coverUrl: v.optional(v.string()),
    galleryUrls: v.optional(v.array(v.string())),
    sku: v.optional(v.string()),
    stock: v.optional(v.number()),
    weightGrams: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireCurrentUser(ctx)

    if (args.priceCents < 0) throw new Error('Preço inválido')
    if (args.title.trim().length < 3) throw new Error('Título muito curto')

    const baseSlug = slugify(args.title)
    const slug = await uniqueSlug(ctx, baseSlug)

    const now = Date.now()
    const id = await ctx.db.insert('products', {
      creatorId: identity.subject,
      title: args.title.trim(),
      slug,
      description: args.description,
      shortDescription: args.shortDescription,
      type: args.type,
      priceCents: Math.round(args.priceCents),
      compareAtCents: args.compareAtCents,
      coverUrl: args.coverUrl,
      galleryUrls: args.galleryUrls,
      sku: args.sku,
      stock: args.stock,
      weightGrams: args.weightGrams,
      fileUrl: args.fileUrl,
      externalUrl: args.externalUrl,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
    return id
  },
})

export const update = mutation({
  args: {
    productId: v.id('products'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    compareAtCents: v.optional(v.number()),
    coverUrl: v.optional(v.string()),
    galleryUrls: v.optional(v.array(v.string())),
    sku: v.optional(v.string()),
    stock: v.optional(v.number()),
    weightGrams: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
  },
  handler: async (ctx, { productId, ...patch }) => {
    const identity = await requireIdentity(ctx)
    const product = await ctx.db.get(productId)
    if (!product) throw new Error('Produto não encontrado')
    if (product.creatorId !== identity.subject) {
      throw new Error('Não autorizado')
    }

    if (patch.priceCents !== undefined && patch.priceCents < 0) {
      throw new Error('Preço inválido')
    }

    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) cleaned[k] = v
    }
    cleaned.updatedAt = Date.now()
    await ctx.db.patch(productId, cleaned as any)
  },
})

export const setStatus = mutation({
  args: {
    productId: v.id('products'),
    status: productStatusValidator,
  },
  handler: async (ctx, { productId, status }) => {
    const identity = await requireIdentity(ctx)
    const product = await ctx.db.get(productId)
    if (!product) throw new Error('Produto não encontrado')
    if (product.creatorId !== identity.subject) {
      throw new Error('Não autorizado')
    }
    const now = Date.now()
    const patch: Record<string, unknown> = { status, updatedAt: now }
    if (status === 'published' && !product.publishedAt) {
      patch.publishedAt = now
    }
    await ctx.db.patch(productId, patch as any)
  },
})

export const remove = mutation({
  args: { productId: v.id('products') },
  handler: async (ctx, { productId }) => {
    const identity = await requireIdentity(ctx)
    const product = await ctx.db.get(productId)
    if (!product) return
    if (product.creatorId !== identity.subject) {
      throw new Error('Não autorizado')
    }
    await ctx.db.delete(productId)
  },
})
