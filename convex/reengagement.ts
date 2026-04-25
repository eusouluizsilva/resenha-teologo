// Reengajamento de alunos inativos. Disparado pelo cron diário (ver crons.ts).
// Critério: aluno tem matrícula em curso não concluído E não estuda há 7+ dias E
// nunca foi reengajado nos últimos 14 dias. Para cada candidato, envia email
// transacional via Resend e cria notificação no sino. Throttle persistido em
// studentStats.lastReengagementAt evita spam.

import { v } from 'convex/values'
import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
const MAX_PER_RUN = 50

// Lista candidatos a receber reengajamento. Não envia nada — apenas filtra.
// O internalAction abaixo itera essa lista e dispara email/notificação.
export const listInactiveCandidates = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const cutoffInactivity = now - SEVEN_DAYS_MS
    const cutoffThrottle = now - FOURTEEN_DAYS_MS

    const stats = await ctx.db.query('studentStats').take(500)
    const candidates: {
      studentId: string
      lastStudyDateMs: number
    }[] = []

    for (const s of stats) {
      // Throttle: já reengajado nos últimos 14 dias → pula.
      if (s.lastReengagementAt && s.lastReengagementAt > cutoffThrottle) continue
      // Sem data de último estudo → assume novo, ignora (welcome cuida disso).
      if (!s.lastStudyDate) continue
      const lastStudyMs = Date.parse(s.lastStudyDate + 'T12:00:00.000Z')
      if (Number.isNaN(lastStudyMs)) continue
      // Estudou nos últimos 7 dias → não está inativo.
      if (lastStudyMs > cutoffInactivity) continue

      // Tem ao menos uma matrícula incompleta?
      const enrollments = await ctx.db
        .query('enrollments')
        .withIndex('by_studentId', (q) => q.eq('studentId', s.studentId))
        .take(20)
      const hasIncomplete = enrollments.some((e) => !e.completedAt)
      if (!hasIncomplete) continue

      candidates.push({ studentId: s.studentId, lastStudyDateMs: lastStudyMs })

      if (candidates.length >= MAX_PER_RUN) break
    }

    return candidates
  },
})

// Marca o studentStats como reengajado e cria notificação. O envio do email
// fica no action (porque internalAction com 'use node' acessa fetch).
export const markReengaged = internalMutation({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, { studentId }) => {
    const stats = await ctx.db
      .query('studentStats')
      .withIndex('by_studentId', (q) => q.eq('studentId', studentId))
      .first()
    if (!stats) return
    await ctx.db.patch(stats._id, { lastReengagementAt: Date.now() })

    await ctx.runMutation(internal.notifications.pushInternal, {
      userId: studentId,
      kind: 'reengagement',
      title: 'Que tal continuar de onde parou?',
      body: 'Você tem cursos esperando. Volta lá quando puder, sua jornada não tem prazo.',
      link: '/dashboard',
    })
  },
})

// Busca dados do usuário para o email (nome + email).
export const getUserForEmail = internalQuery({
  args: { studentId: v.string() },
  handler: async (ctx, { studentId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', studentId))
      .first()
    if (!user) return null
    return { name: user.name, email: user.email }
  },
})

// Action top-level disparada pelo cron. Roda em Node (precisa do fetch do Resend).
export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.runQuery(internal.reengagement.listInactiveCandidates, {})
    if (candidates.length === 0) {
      console.log('[reengagement] nenhum candidato hoje')
      return { processed: 0 }
    }

    let sent = 0
    for (const c of candidates) {
      const user = await ctx.runQuery(internal.reengagement.getUserForEmail, { studentId: c.studentId })
      if (!user) continue
      // Marca antes de enviar — evita duplicar caso email falhe e o cron rode de novo
      // antes do throttle expirar; um email perdido é melhor que dois enviados.
      await ctx.runMutation(internal.reengagement.markReengaged, { studentId: c.studentId })
      await ctx.runAction(internal.email.sendReengagement, {
        to: user.email,
        name: user.name,
      })
      sent++
    }

    console.log(`[reengagement] candidatos=${candidates.length} emails=${sent}`)
    return { processed: sent }
  },
})
