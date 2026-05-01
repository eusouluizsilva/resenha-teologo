// Rate limiting de mutations sensíveis. Sliding window: guarda timestamps das
// últimas N chamadas de (userId, action) e rejeita quando exceder o limite na
// janela. Não há TTL nativo no Convex; o helper poda timestamps fora da janela
// a cada gravação, mantendo o array enxuto.
//
// Uso típico em uma mutation:
//   await checkRateLimit(ctx, identity.subject, 'comment.create', { max: 10, windowMs: 60_000 })

import type { MutationCtx } from '../_generated/server'

type RateLimitOptions = {
  max: number
  windowMs: number
}

export async function checkRateLimit(
  ctx: MutationCtx,
  userId: string,
  action: string,
  { max, windowMs }: RateLimitOptions,
): Promise<void> {
  const key = `${userId}:${action}`
  const now = Date.now()
  const cutoff = now - windowMs

  const existing = await ctx.db
    .query('rateLimits')
    .withIndex('by_key', (q) => q.eq('key', key))
    .unique()

  const recent = (existing?.timestamps ?? []).filter((t) => t >= cutoff)

  if (recent.length >= max) {
    const oldest = recent[0]
    const retryInSec = Math.ceil((oldest + windowMs - now) / 1000)
    throw new Error(
      `Limite atingido. Tente novamente em ${retryInSec}s.`,
    )
  }

  recent.push(now)

  if (existing) {
    await ctx.db.patch(existing._id, { timestamps: recent, updatedAt: now })
  } else {
    await ctx.db.insert('rateLimits', { key, timestamps: recent, updatedAt: now })
  }
}
