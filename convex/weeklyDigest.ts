// Digest semanal por email. Cron domingo 13:00 UTC = 10:00 BRT. Para cada
// usuário com email + sem opt-out + sem log da semana atual, monta resumo:
// - streak/pontos
// - aulas concluídas nos últimos 7 dias
// - top 3 artigos publicados na última semana (por likeCount)
//
// Idempotência: tabela weeklyDigestLog com chave (userId, weekKey).

import { v } from 'convex/values'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server'
import { internal } from './_generated/api'
import {
  buildUnsubscribeToken,
  convexSiteUrl,
} from './lib/unsubscribeToken'

const MAX_USERS_PER_RUN = 500
const RATE_BATCH = 4
const RATE_WINDOW_MS = 1100
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const SITE_URL = 'https://resenhadoteologo.com'

// 'YYYY-WW' (ISO week). Garante unicidade em qualquer cron que rode na mesma
// semana sem precisar truncar timestamps.
function isoWeekKey(date: Date): string {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  // Quinta-feira da semana atual (ISO 8601 trick): isoweek é a semana que
  // contém a quinta-feira mais próxima.
  const day = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-${String(weekNum).padStart(2, '0')}`
}

// Top 3 artigos publicados nos últimos 7 dias, ordenados por likeCount desc
// e fallback por publishedAt desc. Se faltar (semana sem publicações), traz
// os 3 mais recentes do acervo.
export const listTopPostsThisWeek = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - WEEK_MS
    const recent = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(40)

    const inWindow = recent.filter((p) => (p.publishedAt ?? 0) >= cutoff)
    const ranked = inWindow.length > 0 ? inWindow : recent.slice(0, 3)
    ranked.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
    const top = ranked.slice(0, 3)

    return top.map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      slug: p.slug,
    }))
  },
})

export const listCandidates = internalQuery({
  args: { weekKey: v.string() },
  handler: async (ctx, { weekKey }) => {
    const users = await ctx.db.query('users').take(MAX_USERS_PER_RUN)
    const out: { userId: string; email: string; name: string }[] = []
    for (const u of users) {
      if (!u.email) continue
      if (u.emailWeeklyDigestOptOut === true) continue

      const log = await ctx.db
        .query('weeklyDigestLog')
        .withIndex('by_user_week', (q) =>
          q.eq('userId', u.clerkId).eq('weekKey', weekKey),
        )
        .first()
      if (log?.status === 'sent') continue

      out.push({ userId: u.clerkId, email: u.email, name: u.name })
    }
    return out
  },
})

export const getStudentSnapshot = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const stats = await ctx.db
      .query('studentStats')
      .withIndex('by_studentId', (q) => q.eq('studentId', userId))
      .unique()

    // Aulas concluídas nos últimos 7 dias. Como progress não tem index por
    // completedAt, varremos os progress do aluno e filtramos. Ok pra volume
    // típico (até centenas de progress por aluno).
    const cutoff = Date.now() - WEEK_MS
    const progressRows = await ctx.db
      .query('progress')
      .withIndex('by_studentId', (q) => q.eq('studentId', userId))
      .collect()
    const lessonsThisWeek = progressRows.filter(
      (p) => p.completed && (p.completedAt ?? 0) >= cutoff,
    ).length

    return {
      streakDays: stats?.streak ?? 0,
      lessonsThisWeek,
    }
  },
})

export const recordSent = internalMutation({
  args: {
    userId: v.string(),
    weekKey: v.string(),
    status: v.union(v.literal('sent'), v.literal('skipped'), v.literal('error')),
  },
  handler: async (ctx, { userId, weekKey, status }) => {
    await ctx.db.insert('weeklyDigestLog', {
      userId,
      weekKey,
      sentAt: Date.now(),
      status,
    })
  },
})

export const run = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ processed: number; sent: number; skipped: number; errors: number }> => {
    const weekKey = isoWeekKey(new Date())
    const candidates = await ctx.runQuery(internal.weeklyDigest.listCandidates, {
      weekKey,
    })
    if (candidates.length === 0) {
      console.log('[weeklyDigest] nenhum candidato esta semana')
      return { processed: 0, sent: 0, skipped: 0, errors: 0 }
    }

    const topPosts = await ctx.runQuery(internal.weeklyDigest.listTopPostsThisWeek, {})
    const topPostsForEmail = topPosts.map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      url: `${SITE_URL}/blog/${p.slug}?utm_source=email&utm_medium=weekly&utm_campaign=resumo_semanal`,
    }))

    let sent = 0
    let skipped = 0
    let errors = 0

    type Candidate = { userId: string; email: string; name: string }
    for (let i = 0; i < candidates.length; i += RATE_BATCH) {
      const batch = candidates.slice(i, i + RATE_BATCH) as Candidate[]
      const startedAt = Date.now()
      await Promise.all(
        batch.map(async (c: Candidate) => {
          const snapshot = await ctx.runQuery(internal.weeklyDigest.getStudentSnapshot, {
            userId: c.userId,
          })
          const token = await buildUnsubscribeToken(c.userId)
          const unsubscribeUrl = `${convexSiteUrl()}/api/unsubscribe?u=${encodeURIComponent(c.userId)}&t=${token}&type=weekly`

          try {
            const res = await ctx.runAction(internal.email.sendWeeklyDigest, {
              to: c.email,
              name: c.name,
              streakDays: snapshot.streakDays,
              lessonsThisWeek: snapshot.lessonsThisWeek,
              topPosts: topPostsForEmail,
              unsubscribeUrl,
            })
            const status = res.success ? 'sent' : res.skipped ? 'skipped' : 'error'
            await ctx.runMutation(internal.weeklyDigest.recordSent, {
              userId: c.userId,
              weekKey,
              status,
            })
            if (status === 'sent') sent++
            else if (status === 'skipped') skipped++
            else errors++
          } catch (err) {
            console.error('[weeklyDigest] erro inesperado', err)
            errors++
          }
        }),
      )
      const elapsed = Date.now() - startedAt
      const remaining = RATE_WINDOW_MS - elapsed
      if (remaining > 0 && i + RATE_BATCH < candidates.length) {
        await new Promise((r) => setTimeout(r, remaining))
      }
    }

    console.log(
      `[weeklyDigest] week=${weekKey} candidatos=${candidates.length} sent=${sent} skipped=${skipped} errors=${errors}`,
    )
    return { processed: candidates.length, sent, skipped, errors }
  },
})
