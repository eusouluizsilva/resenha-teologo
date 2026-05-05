// Email de "nova aula publicada". Disparado pela mutation lessons.update
// (publicação manual) e pelo cron lessons.runScheduledPublish (agendada). Para
// cada aluno matriculado no curso, manda um email avisando da nova aula.
//
// Idempotência: tabela newLessonEmailLog garante 1 envio por (aluno, aula)
// pra sempre. Status 'sent' bloqueia retry; 'error'/'skipped' permitem nova
// tentativa em runs futuros.

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

const RATE_BATCH = 4
const RATE_WINDOW_MS = 1100
const SITE_URL = 'https://resenhadoteologo.com'

// Lista alunos matriculados no curso da aula que ainda não receberam email
// dessa aula específica E não optaram por sair de avisos de novas aulas.
export const listEnrolledForLesson = internalQuery({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    const lesson = await ctx.db.get(lessonId)
    if (!lesson) return null
    const course = await ctx.db.get(lesson.courseId)
    if (!course) return null

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_courseId', (q) => q.eq('courseId', lesson.courseId))
      .collect()

    const out: { userId: string; email: string; name: string }[] = []
    for (const enrollment of enrollments) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', enrollment.studentId))
        .unique()
      if (!user || !user.email) continue
      if (user.emailNewLessonOptOut === true) continue

      // Idempotência: pula quem já recebeu (status='sent') esta aula.
      const log = await ctx.db
        .query('newLessonEmailLog')
        .withIndex('by_user_lesson', (q) =>
          q.eq('userId', enrollment.studentId).eq('lessonId', lessonId),
        )
        .first()
      if (log?.status === 'sent') continue

      out.push({ userId: enrollment.studentId, email: user.email, name: user.name })
    }

    return {
      courseId: lesson.courseId,
      courseTitle: course.title,
      courseRef: course.slug ?? course._id,
      lessonTitle: lesson.title,
      lessonRef: lesson.slug ?? lesson._id,
      recipients: out,
    }
  },
})

export const recordSent = internalMutation({
  args: {
    userId: v.string(),
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    status: v.union(v.literal('sent'), v.literal('skipped'), v.literal('error')),
  },
  handler: async (ctx, { userId, lessonId, courseId, status }) => {
    await ctx.db.insert('newLessonEmailLog', {
      userId,
      lessonId,
      courseId,
      sentAt: Date.now(),
      status,
    })
  },
})

// Action top-level disparada após uma aula virar isPublished=true. Itera os
// alunos matriculados em batches respeitando o rate limit do Resend.
export const notifyEnrolled = internalAction({
  args: { lessonId: v.id('lessons') },
  handler: async (
    ctx,
    { lessonId },
  ): Promise<{ processed: number; sent: number; skipped: number; errors: number }> => {
    const data = await ctx.runQuery(internal.newLessonEmail.listEnrolledForLesson, {
      lessonId,
    })
    if (!data) return { processed: 0, sent: 0, skipped: 0, errors: 0 }
    const { courseId, courseTitle, courseRef, lessonTitle, lessonRef, recipients } = data
    if (recipients.length === 0) return { processed: 0, sent: 0, skipped: 0, errors: 0 }

    let sent = 0
    let skipped = 0
    let errors = 0

    type Recipient = { userId: string; email: string; name: string }
    for (let i = 0; i < recipients.length; i += RATE_BATCH) {
      const batch = recipients.slice(i, i + RATE_BATCH) as Recipient[]
      const startedAt = Date.now()
      await Promise.all(
        batch.map(async (r: Recipient) => {
          const token = await buildUnsubscribeToken(r.userId)
          const lessonUrl = `${SITE_URL}/dashboard/meus-cursos/${courseRef}/aula/${lessonRef}?utm_source=email&utm_medium=new_lesson&utm_campaign=nova_aula`
          const unsubscribeUrl = `${convexSiteUrl()}/api/unsubscribe?u=${encodeURIComponent(r.userId)}&t=${token}&type=new_lesson`

          try {
            const res = await ctx.runAction(internal.email.sendNewLesson, {
              to: r.email,
              name: r.name,
              courseTitle,
              lessonTitle,
              lessonUrl,
              unsubscribeUrl,
            })
            const status = res.success ? 'sent' : res.skipped ? 'skipped' : 'error'
            await ctx.runMutation(internal.newLessonEmail.recordSent, {
              userId: r.userId,
              lessonId,
              courseId,
              status,
            })
            if (status === 'sent') sent++
            else if (status === 'skipped') skipped++
            else errors++
          } catch (err) {
            console.error('[newLessonEmail] erro inesperado', err)
            errors++
          }
        }),
      )
      const elapsed = Date.now() - startedAt
      const remaining = RATE_WINDOW_MS - elapsed
      if (remaining > 0 && i + RATE_BATCH < recipients.length) {
        await new Promise((r) => setTimeout(r, remaining))
      }
    }

    console.log(
      `[newLessonEmail] lesson=${lessonId} alunos=${recipients.length} sent=${sent} skipped=${skipped} errors=${errors}`,
    )
    return { processed: recipients.length, sent, skipped, errors }
  },
})
