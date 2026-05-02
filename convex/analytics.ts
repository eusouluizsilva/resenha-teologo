import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { checkRateLimit } from './lib/rateLimit'

// Mutations leves chamadas pelo frontend para registrar pageviews em páginas
// de criador e impressões de anúncio. Aceita usuário anônimo (sem requireIdentity)
// porque o catálogo público é acessível sem login. sessionId vem do
// sessionStorage do navegador.
//
// Rate-limit por sessionId (max 30/min): impede bots/atacantes de inflar
// metricas e estourar plano Convex via flood de pageviews/impressoes.

export const logPageView = mutation({
  args: {
    page: v.string(),
    sessionId: v.string(),
    creatorId: v.optional(v.string()),
    courseId: v.optional(v.id('courses')),
    lessonId: v.optional(v.id('lessons')),
    referrer: v.optional(v.string()),
    device: v.optional(
      v.union(v.literal('mobile'), v.literal('desktop'), v.literal('tablet')),
    ),
  },
  handler: async (
    ctx,
    { page, sessionId, creatorId, courseId, lessonId, referrer, device },
  ) => {
    await checkRateLimit(ctx, sessionId, 'analytics.pageView', { max: 30, windowMs: 60_000 })
    const identity = await ctx.auth.getUserIdentity()
    await ctx.db.insert('pageViews', {
      page,
      sessionId,
      creatorId,
      courseId,
      lessonId,
      userId: identity?.subject,
      at: Date.now(),
      referrer,
      device,
    })
  },
})

export const logAdImpression = mutation({
  args: {
    slotId: v.string(),
    page: v.string(),
    sessionId: v.string(),
    creatorId: v.string(),
    courseId: v.optional(v.id('courses')),
    lessonId: v.optional(v.id('lessons')),
  },
  handler: async (ctx, { slotId, page, sessionId, creatorId, courseId, lessonId }) => {
    await checkRateLimit(ctx, sessionId, 'analytics.adImpression', { max: 30, windowMs: 60_000 })
    // Dedup: se já existe uma impressão deste slot nesta sessão, ignora.
    // Index by_session_slot torna o lookup barato.
    const existing = await ctx.db
      .query('adImpressions')
      .withIndex('by_session_slot', (q) => q.eq('sessionId', sessionId).eq('slotId', slotId))
      .first()
    if (existing) return

    const identity = await ctx.auth.getUserIdentity()
    await ctx.db.insert('adImpressions', {
      slotId,
      page,
      sessionId,
      creatorId,
      courseId,
      lessonId,
      userId: identity?.subject,
      at: Date.now(),
    })
  },
})
