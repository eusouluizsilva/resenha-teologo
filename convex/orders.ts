import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireCurrentUser, requireIdentity } from './lib/auth'

const shippingValidator = v.object({
  name: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  postalCode: v.string(),
  country: v.string(),
})

// Cria um pedido pendente. Por enquanto nao chama Stripe (Live mode ainda
// nao foi liberado). O pedido fica registrado e o criador pode marcar
// manualmente como pago/enviado. Quando Stripe for ligado, esta mutation
// criara o PaymentIntent e gravara stripePaymentIntentId.
export const create = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id('products'),
        quantity: v.number(),
      }),
    ),
    shippingAddress: v.optional(shippingValidator),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { items, shippingAddress, notes }) => {
    const { identity } = await requireCurrentUser(ctx)
    if (items.length === 0) throw new Error('Carrinho vazio')

    const products = await Promise.all(
      items.map(async (i) => {
        const p = await ctx.db.get(i.productId)
        if (!p) throw new Error('Produto não encontrado')
        if (p.status !== 'published') throw new Error('Produto indisponível')
        return { product: p, quantity: i.quantity }
      }),
    )

    const creatorIds = new Set(products.map((x) => x.product.creatorId))
    if (creatorIds.size > 1) {
      throw new Error('Pedido só pode conter produtos de um mesmo criador')
    }
    const creatorId = products[0].product.creatorId

    const snapshot = products.map((x) => ({
      productId: x.product._id as Id<'products'>,
      title: x.product.title,
      priceCents: x.product.priceCents,
      quantity: Math.max(1, Math.floor(x.quantity)),
    }))

    const amountCents = snapshot.reduce(
      (acc, it) => acc + it.priceCents * it.quantity,
      0,
    )

    const now = Date.now()
    const orderId = await ctx.db.insert('orders', {
      userId: identity.subject,
      creatorId,
      items: snapshot,
      amountCents,
      currency: 'BRL',
      status: 'pending',
      shippingAddress,
      notes,
      createdAt: now,
      updatedAt: now,
    })
    return orderId
  },
})

// Pedidos do comprador.
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    return ctx.db
      .query('orders')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(100)
  },
})

// Pedidos recebidos pelo criador.
export const listReceived = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const orders = await ctx.db
      .query('orders')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .order('desc')
      .take(100)

    const userIds = Array.from(new Set(orders.map((o) => o.userId)))
    const buyers = await Promise.all(
      userIds.map(async (uid) => {
        const u = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', uid))
          .unique()
        return u ? { clerkId: uid, name: u.name, email: u.email } : null
      }),
    )
    const byId = new Map(buyers.filter(Boolean).map((b) => [b!.clerkId, b!]))

    return orders.map((o) => ({
      ...o,
      buyerName: byId.get(o.userId)?.name ?? 'Cliente',
      buyerEmail: byId.get(o.userId)?.email ?? null,
    }))
  },
})

// Atualizacao manual de status pelo criador. Quando Stripe Live estiver
// ligado, paid sera marcado pelo webhook automaticamente, mas shipped/
// delivered/cancelled continuam manuais.
export const setStatus = mutation({
  args: {
    orderId: v.id('orders'),
    status: v.union(
      v.literal('pending'),
      v.literal('paid'),
      v.literal('shipped'),
      v.literal('delivered'),
      v.literal('cancelled'),
      v.literal('refunded'),
    ),
    trackingCode: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, status, trackingCode }) => {
    const identity = await requireIdentity(ctx)
    const order = await ctx.db.get(orderId)
    if (!order) throw new Error('Pedido não encontrado')
    if (order.creatorId !== identity.subject) {
      throw new Error('Não autorizado')
    }

    const now = Date.now()
    const patch: Record<string, unknown> = { status, updatedAt: now }
    if (status === 'paid' && !order.paidAt) patch.paidAt = now
    if (status === 'shipped') {
      patch.shippedAt = now
      if (trackingCode) patch.trackingCode = trackingCode
    }
    await ctx.db.patch(orderId, patch as any)
  },
})
