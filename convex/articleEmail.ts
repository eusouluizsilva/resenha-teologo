// Email diário de artigo. Disparado pelo cron (ver crons.ts) uma vez por dia.
// Para cada usuário com email válido e que não optou por sair, escolhe o
// post publicado MAIS ANTIGO que ainda não foi enviado para ele e envia.
// O log articleEmailLog garante 1 envio por (usuário, post) pra sempre.

import { v } from 'convex/values'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server'
import { internal } from './_generated/api'
import {
  buildUnsubscribeToken,
  verifyUnsubscribeToken as verifyTokenShared,
  convexSiteUrl,
} from './lib/unsubscribeToken'

const MAX_USERS_PER_RUN = 200
// Resend limita free tier a 5 req/seg. Mandamos 4 em paralelo por janela de
// 1100ms pra deixar margem confortável (e evitar erros 429 transientes).
const RATE_BATCH = 4
const RATE_WINDOW_MS = 1100
const SITE_URL = 'https://resenhadoteologo.com'

// Lista usuários candidatos a receber o email de hoje. Filtros:
// - email não vazio
// - emailDailyArticleOptOut !== true
// - já houve envio com status='sent' nas últimas 20 horas → pula (idempotência
//   diária). Logs com status 'error'/'skipped' não bloqueiam (são transientes
//   por rate limit ou config faltante).
export const listCandidates = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').take(500)
    const cutoffTwentyHours = Date.now() - 20 * 60 * 60 * 1000

    const out: { userId: string; email: string; name: string }[] = []
    for (const u of users) {
      if (!u.email) continue
      if (u.emailDailyArticleOptOut === true) continue

      const recentLogs = await ctx.db
        .query('articleEmailLog')
        .withIndex('by_user', (q) => q.eq('userId', u.clerkId))
        .order('desc')
        .take(5)
      const recentlySent = recentLogs.some(
        (l) => l.status === 'sent' && l.sentAt > cutoffTwentyHours,
      )
      if (recentlySent) continue

      out.push({ userId: u.clerkId, email: u.email, name: u.name })
      if (out.length >= MAX_USERS_PER_RUN) break
    }
    return out
  },
})

// Para um usuário, encontra o post publicado mais antigo que ainda NÃO foi
// enviado pra ele. Retorna null se não há candidato (usuário já recebeu todos).
// Apenas logs com status='sent' bloqueiam retry; 'error' e 'skipped' são
// transientes (rate limit, RESEND_API_KEY ausente etc.) e devem ser retentados
// na próxima rodada do cron.
export const pickArticleForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const logs = await ctx.db
      .query('articleEmailLog')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const sentPostIds = new Set(
      logs.filter((l) => l.status === 'sent').map((l) => String(l.postId)),
    )

    // Posts publicados ordenados por publishedAt ASC (mais antigo primeiro).
    // Pega em batch e procura o primeiro não enviado. Limite de 500 cobre o
    // acervo atual com folga; se acervo crescer muito, paginar.
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .order('asc')
      .take(500)

    for (const p of posts) {
      if (sentPostIds.has(String(p._id))) continue
      const author = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', p.authorUserId))
        .unique()
      const handle = author?.handle ?? null
      // Sem handle não há rota válida pro post (BlogPostPage exige handle e
      // slug). Pula e continua a busca, em vez de mandar email com 404.
      if (!handle) continue
      return {
        postId: p._id,
        title: p.title,
        excerpt: p.excerpt,
        slug: p.slug,
        handle,
      }
    }
    return null
  },
})

export const recordSent = internalMutation({
  args: {
    userId: v.string(),
    postId: v.id('posts'),
    status: v.union(v.literal('sent'), v.literal('skipped'), v.literal('error')),
  },
  handler: async (ctx, { userId, postId, status }) => {
    await ctx.db.insert('articleEmailLog', {
      userId,
      postId,
      sentAt: Date.now(),
      status,
    })
  },
})

// Action top-level disparada pelo cron diário. Pré-busca candidatos, escolhe
// o artigo de cada um, envia em paralelo (em batches pra não estourar o Resend).
export const run = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; sent: number; skipped: number; errors: number }> => {
    const candidates = await ctx.runQuery(internal.articleEmail.listCandidates, {})
    if (candidates.length === 0) {
      console.log('[articleEmail] nenhum candidato hoje')
      return { processed: 0, sent: 0, skipped: 0, errors: 0 }
    }

    let sent = 0
    let skipped = 0
    let errors = 0

    type Candidate = { userId: string; email: string; name: string }
    for (let i = 0; i < candidates.length; i += RATE_BATCH) {
      const batch = candidates.slice(i, i + RATE_BATCH) as Candidate[]
      const startedAt = Date.now()
      await Promise.all(
        batch.map(async (c: Candidate) => {
          const post = await ctx.runQuery(internal.articleEmail.pickArticleForUser, {
            userId: c.userId,
          })
          if (!post) {
            // Sem post novo pra este usuário: não loga (não há postId pra logar).
            // Próxima rodada repete a busca (que continuará vazia até publicar
            // novo artigo).
            return
          }

          const token = await buildUnsubscribeToken(c.userId)
          const postUrl = `${SITE_URL}/blog/${post.handle}/${post.slug}?utm_source=email&utm_medium=daily&utm_campaign=artigo_diario`
          const unsubscribeUrl = `${convexSiteUrl()}/api/unsubscribe?u=${encodeURIComponent(c.userId)}&t=${token}&type=daily`

          try {
            const res = await ctx.runAction(internal.email.sendDailyArticle, {
              to: c.email,
              name: c.name,
              postTitle: post.title,
              postExcerpt: post.excerpt,
              postUrl,
              unsubscribeUrl,
            })
            const status = res.success ? 'sent' : res.skipped ? 'skipped' : 'error'
            await ctx.runMutation(internal.articleEmail.recordSent, {
              userId: c.userId,
              postId: post.postId,
              status,
            })
            if (status === 'sent') sent++
            else if (status === 'skipped') skipped++
            else errors++
          } catch (err) {
            console.error('[articleEmail] erro inesperado', err)
            errors++
          }
        }),
      )
      // Rate limit: aguarda o resto da janela de 1100ms antes do próximo batch.
      const elapsed = Date.now() - startedAt
      const remaining = RATE_WINDOW_MS - elapsed
      if (remaining > 0 && i + RATE_BATCH < candidates.length) {
        await new Promise((r) => setTimeout(r, remaining))
      }
    }

    console.log(
      `[articleEmail] candidatos=${candidates.length} sent=${sent} skipped=${skipped} errors=${errors}`,
    )
    return { processed: candidates.length, sent, skipped, errors }
  },
})

// Helper exposto para o http.route validar o token de unsubscribe. Delega
// para o helper compartilhado em lib/unsubscribeToken.ts, que também é usado
// pelos emails semanal e de nova aula.
export const verifyUnsubscribeToken = internalQuery({
  args: { clerkId: v.string(), token: v.string() },
  handler: async (_ctx, { clerkId, token }) => {
    return await verifyTokenShared(clerkId, token)
  },
})
