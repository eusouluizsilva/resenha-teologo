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

const MAX_USERS_PER_RUN = 200
const PROCESS_BATCH = 25
const SITE_URL = 'https://resenhadoteologo.com'
// Convex injeta CONVEX_SITE_URL no runtime das functions. Apontando pra ele
// resolvemos o /api/unsubscribe sem hardcodar o nome do deployment. Em prod
// vira https://blessed-platypus-993.convex.site.
function convexSiteUrl(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (globalThis as any).process?.env ?? {}
  return env.CONVEX_SITE_URL ?? 'https://blessed-platypus-993.convex.site'
}

// Lista usuários candidatos a receber o email de hoje. Filtros:
// - email não vazio
// - emailDailyArticleOptOut !== true
// - já houve envio nas últimas 20 horas → pula (idempotência diária)
export const listCandidates = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').take(500)
    const cutoffTwentyHours = Date.now() - 20 * 60 * 60 * 1000

    const out: { userId: string; email: string; name: string }[] = []
    for (const u of users) {
      if (!u.email) continue
      if (u.emailDailyArticleOptOut === true) continue

      const lastLog = await ctx.db
        .query('articleEmailLog')
        .withIndex('by_user', (q) => q.eq('userId', u.clerkId))
        .order('desc')
        .first()
      if (lastLog && lastLog.sentAt > cutoffTwentyHours) continue

      out.push({ userId: u.clerkId, email: u.email, name: u.name })
      if (out.length >= MAX_USERS_PER_RUN) break
    }
    return out
  },
})

// Para um usuário, encontra o post publicado mais antigo que ainda NÃO foi
// enviado pra ele. Retorna null se não há candidato (usuário já recebeu todos).
export const pickArticleForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Logs anteriores deste usuário: postIds já enviados.
    const logs = await ctx.db
      .query('articleEmailLog')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    const sentPostIds = new Set(logs.map((l) => String(l.postId)))

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
      return {
        postId: p._id,
        title: p.title,
        excerpt: p.excerpt,
        slug: p.slug,
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

// Marca opt-out a partir do clerkId. Usado pelo http.route /unsubscribe.
export const setOptOut = internalMutation({
  args: { clerkId: v.string(), value: v.boolean() },
  handler: async (ctx, { clerkId, value }) => {
    const u = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .first()
    if (!u) return false
    await ctx.db.patch(u._id, { emailDailyArticleOptOut: value })
    return true
  },
})

// Token HMAC-SHA256 para o link de unsubscribe. Estável (não expira) e único
// por usuário. Reutilizado pelo http.route que valida e seta o opt-out.
async function buildUnsubscribeToken(clerkId: string): Promise<string> {
  const secret =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).process?.env?.UNSUBSCRIBE_HMAC_SECRET ??
    'rdt-fallback-unsubscribe-secret'
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(clerkId))
  const bytes = new Uint8Array(sig)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  // base64url (sem +, /, =) pra ficar URL-safe sem encode adicional
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

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
    for (let i = 0; i < candidates.length; i += PROCESS_BATCH) {
      const batch = candidates.slice(i, i + PROCESS_BATCH) as Candidate[]
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
          const postUrl = `${SITE_URL}/blog/${post.slug}?utm_source=email&utm_medium=daily&utm_campaign=artigo_diario`
          const unsubscribeUrl = `${convexSiteUrl()}/api/unsubscribe?u=${encodeURIComponent(c.userId)}&t=${token}`

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
    }

    console.log(
      `[articleEmail] candidatos=${candidates.length} sent=${sent} skipped=${skipped} errors=${errors}`,
    )
    return { processed: candidates.length, sent, skipped, errors }
  },
})

// Helper exposto para o http.route validar o token de unsubscribe.
export const verifyUnsubscribeToken = internalQuery({
  args: { clerkId: v.string(), token: v.string() },
  handler: async (_ctx, { clerkId, token }) => {
    const expected = await buildUnsubscribeToken(clerkId)
    // timing-safe-ish: lengths primeiro
    if (expected.length !== token.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
    }
    return diff === 0
  },
})
