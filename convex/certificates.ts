// Verificação pública de certificado + queries/mutations do fluxo paid-only.
//
// MODELO PAID-ONLY (decidido 2026-04-29): certificado custa R$ 29,90 one-time
// via Stripe Checkout. PDF é gerado SERVER-SIDE em internalAction
// (convex/certificatesPdf.ts, runtime Node) disparada pelo webhook
// checkout.session.completed (kind=certificate). Antes do paid, zero bytes do
// PDF real existem; o cliente vê só mockup em CheckoutCertificadoPage.
//
// Validade pública: /verificar/{code} consulta certificateOrders e retorna
// true APENAS quando status='paid' (refunded vira 404). O code é derivado do
// _id do orderDoc (não do enrollmentId, que é o legado gratuito).

import { v } from 'convex/values'
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

function normalizeCode(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export function deriveOrderVerificationCode(orderId: string): string {
  return normalizeCode(orderId).slice(0, 16)
}

// Verificação pública. Estratégia: scan O(N) sobre certificateOrders paid,
// match por prefixo do _id. Aceitável pra Fase 1; quando escalar, indexar
// por hash do code no documento.
//
// Compatibilidade: se nenhum order paid bater, faz fallback no scan legado de
// enrollments com certificateIssued=true (modelo gratuito anterior) pra não
// invalidar certificados emitidos antes desse fluxo entrar no ar.
export const verify = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const normalized = normalizeCode(code)
    if (normalized.length < 8) return null

    const orders = await ctx.db
      .query('certificateOrders')
      .filter((q) => q.eq(q.field('status'), 'paid'))
      .collect()

    const orderMatch = orders.find((o) => {
      const c = deriveOrderVerificationCode(o._id as unknown as string)
      return c === normalized.slice(0, 16)
    })

    if (orderMatch) {
      const course = await ctx.db.get(orderMatch.courseId)
      if (!course) return null
      const enrollment = await ctx.db.get(orderMatch.enrollmentId)
      const student = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', orderMatch.userId))
        .unique()
      const creator = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
        .unique()
      return {
        valid: true as const,
        studentName: student?.name ?? 'Aluno',
        courseTitle: course.title,
        creatorName: creator?.name ?? '',
        completedAt: enrollment?.completedAt ?? orderMatch.paidAt ?? null,
        finalScore: enrollment?.finalScore ?? null,
        verificationCode: deriveOrderVerificationCode(orderMatch._id as unknown as string),
        kind: 'paid' as const,
      }
    }

    // Fallback legado: enrollments com certificateIssued=true (modelo antigo).
    const allCerts = await ctx.db.query('enrollments').collect()
    const match = allCerts.find((e) => {
      if (!e.certificateIssued) return false
      const enrollmentCode = normalizeCode(e._id as unknown as string).slice(0, 16)
      return enrollmentCode === normalized.slice(0, 16)
    })
    if (!match) return null

    const course = await ctx.db.get(match.courseId)
    if (!course) return null

    const student = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', match.studentId))
      .unique()
    const creator = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
      .unique()

    return {
      valid: true as const,
      studentName: student?.name ?? 'Aluno',
      courseTitle: course.title,
      creatorName: creator?.name ?? '',
      completedAt: match.completedAt ?? null,
      finalScore: match.finalScore ?? null,
      verificationCode: normalized.slice(0, 16),
      kind: 'legacy' as const,
    }
  },
})

// Estado do certificado de um aluno num curso. Usado pela CertificadosPage
// pra decidir entre 3 estados (locked / pending-payment / paid).
export const getMyOrderForCourse = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const order = await ctx.db
      .query('certificateOrders')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', identity.subject).eq('courseId', courseId),
      )
      .order('desc')
      .first()

    if (!order) return null

    return {
      _id: order._id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      paidAt: order.paidAt ?? null,
      hasPdf: !!order.certificatePdfStorageId,
      verificationCode: deriveOrderVerificationCode(order._id as unknown as string),
    }
  },
})

// Lista todos os orders pagos do aluno (uma linha por curso). Otimização:
// começa pelo userId (poucos), filtra paid, dedup por courseId mantendo o mais
// recente. Usado na CertificadosPage pra mostrar lista.
export const listMyPaidOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const orders = await ctx.db
      .query('certificateOrders')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .filter((q) => q.eq(q.field('status'), 'paid'))
      .collect()

    const latestByCourse = new Map<string, (typeof orders)[number]>()
    for (const o of orders) {
      const prev = latestByCourse.get(o.courseId)
      if (!prev || (o.paidAt ?? 0) > (prev.paidAt ?? 0)) {
        latestByCourse.set(o.courseId, o)
      }
    }

    return Array.from(latestByCourse.values()).map((o) => ({
      _id: o._id,
      courseId: o.courseId,
      enrollmentId: o.enrollmentId,
      paidAt: o.paidAt ?? 0,
      hasPdf: !!o.certificatePdfStorageId,
      verificationCode: deriveOrderVerificationCode(o._id as unknown as string),
    }))
  },
})

// URL temporária pra baixar o PDF de um order paid. Validamos owner.
export const getMyCertificateDownloadUrl = query({
  args: { orderId: v.id('certificateOrders') },
  handler: async (ctx, { orderId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const order = await ctx.db.get(orderId)
    if (!order || order.userId !== identity.subject) return null
    if (order.status !== 'paid' || !order.certificatePdfStorageId) return null
    const url = await ctx.storage.getUrl(order.certificatePdfStorageId)
    return url
  },
})

// Webhook handler interno: marca order como paid e dispara generatePaidPdf.
// Idempotente: se já estiver paid e tiver PDF, ignora retries.
export const markOrderPaidByWebhook = internalMutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    paidAt: v.number(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query('certificateOrders')
      .withIndex('by_session_id', (q) => q.eq('stripeSessionId', args.stripeSessionId))
      .unique()
    if (!order) {
      console.error('[certificates] markOrderPaidByWebhook: order ausente', args.stripeSessionId)
      return null
    }
    if (order.status === 'paid' && order.certificatePdfStorageId) {
      return order._id
    }
    if (order.status !== 'paid') {
      await ctx.db.patch(order._id, {
        status: 'paid',
        paidAt: args.paidAt,
        stripePaymentIntentId: args.stripePaymentIntentId,
        updatedAt: Date.now(),
      })
    }
    return order._id
  },
})

export const markOrderRefundedByWebhook = internalMutation({
  args: { stripePaymentIntentId: v.string(), refundedAt: v.number() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query('certificateOrders')
      .filter((q) => q.eq(q.field('stripePaymentIntentId'), args.stripePaymentIntentId))
      .collect()
    for (const o of orders) {
      await ctx.db.patch(o._id, {
        status: 'refunded',
        refundedAt: args.refundedAt,
        updatedAt: Date.now(),
      })
    }
    return orders.length
  },
})

export const markOrderExpiredByWebhook = internalMutation({
  args: { stripeSessionId: v.string(), expiredAt: v.number() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query('certificateOrders')
      .withIndex('by_session_id', (q) => q.eq('stripeSessionId', args.stripeSessionId))
      .unique()
    if (!order) return null
    if (order.status === 'pending') {
      await ctx.db.patch(order._id, {
        status: 'expired',
        expiredAt: args.expiredAt,
        updatedAt: Date.now(),
      })
    }
    return order._id
  },
})

// Query interna usada por certificatesPdf.generatePaidPdf pra colher os dados
// que entram no PDF sem expor PII fora do server.
export const getOrderDataForPdf = internalQuery({
  args: { orderId: v.id('certificateOrders') },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId)
    if (!order) return null
    const course = await ctx.db.get(order.courseId)
    if (!course) return null
    const enrollment = await ctx.db.get(order.enrollmentId)
    const student = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', order.userId))
      .unique()
    const creator = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
      .unique()
    return {
      orderId: order._id,
      verificationCode: deriveOrderVerificationCode(order._id as unknown as string),
      studentName: student?.name ?? 'Aluno',
      courseTitle: course.title,
      creatorName: creator?.name ?? 'Resenha do Teólogo',
      completedAt: enrollment?.completedAt ?? order.paidAt ?? Date.now(),
      finalScore: enrollment?.finalScore ?? null,
      paidAt: order.paidAt ?? Date.now(),
    }
  },
})

export const attachPdfStorageId = internalMutation({
  args: {
    orderId: v.id('certificateOrders'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { orderId, storageId }) => {
    await ctx.db.patch(orderId, {
      certificatePdfStorageId: storageId,
      pdfGeneratedAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// Pedido manual de re-geração do PDF (recovery). Reusa o mesmo flow.
// Owner-scoped: só o aluno do próprio order pode rodar.
export const regeneratePdf = action({
  args: { orderId: v.id('certificateOrders') },
  handler: async (ctx, { orderId }): Promise<Id<'_storage'> | null> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado')
    const ok = await ctx.runQuery(internal.certificates.assertOrderOwnerPaid, {
      orderId,
      userId: identity.subject,
    })
    if (!ok) throw new Error('Order não encontrado ou não pago')
    return await ctx.runAction(internal.certificatesPdf.generatePaidPdf, { orderId })
  },
})

export const assertOrderOwnerPaid = internalQuery({
  args: { orderId: v.id('certificateOrders'), userId: v.string() },
  handler: async (ctx, { orderId, userId }) => {
    const order = await ctx.db.get(orderId)
    if (!order) return false
    if (order.userId !== userId) return false
    return order.status === 'paid'
  },
})
