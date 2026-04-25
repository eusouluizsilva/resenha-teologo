import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireCourseAccess, requireCurrentUser } from './lib/auth'

// Perguntas privadas do aluno ao professor. Pergunta é sempre do aluno;
// professor responde. Aluno só vê as próprias; professor dono vê todas do seu
// curso. Para contexto, a pergunta pode opcionalmente apontar para uma aula.

const MAX_Q_LEN = 2000
const MAX_A_LEN = 4000

export const ask = mutation({
  args: {
    courseId: v.id('courses'),
    lessonId: v.optional(v.id('lessons')),
    question: v.string(),
  },
  handler: async (ctx, { courseId, lessonId, question }) => {
    const { identity, course, role } = await requireCourseAccess(ctx, courseId)
    if (role !== 'aluno') {
      throw new Error('Apenas alunos matriculados podem perguntar')
    }

    const trimmed = question.trim()
    if (!trimmed) throw new Error('Pergunta vazia')

    if (lessonId) {
      const lesson = await ctx.db.get(lessonId)
      if (!lesson || lesson.courseId !== courseId) {
        throw new Error('Aula não pertence ao curso')
      }
    }

    const userRec = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    return await ctx.db.insert('courseQuestions', {
      courseId,
      creatorId: course.creatorId,
      studentId: identity.subject,
      studentName: userRec?.name ?? 'Aluno',
      studentAvatarUrl: userRec?.avatarUrl,
      lessonId: lessonId ?? undefined,
      question: trimmed.slice(0, MAX_Q_LEN),
      askedAt: Date.now(),
    })
  },
})

export const answer = mutation({
  args: {
    id: v.id('courseQuestions'),
    answer: v.string(),
  },
  handler: async (ctx, { id, answer }) => {
    const { identity } = await requireCurrentUser(ctx)
    const entry = await ctx.db.get(id)
    if (!entry) throw new Error('Pergunta não encontrada')
    if (entry.creatorId !== identity.subject) throw new Error('Não autorizado')

    const trimmed = answer.trim()
    if (!trimmed) throw new Error('Resposta vazia')

    await ctx.db.patch(id, {
      answer: trimmed.slice(0, MAX_A_LEN),
      answeredAt: Date.now(),
    })
  },
})

export const editQuestion = mutation({
  args: {
    id: v.id('courseQuestions'),
    question: v.string(),
  },
  handler: async (ctx, { id, question }) => {
    const { identity } = await requireCurrentUser(ctx)
    const entry = await ctx.db.get(id)
    if (!entry) throw new Error('Pergunta não encontrada')
    if (entry.studentId !== identity.subject) throw new Error('Não autorizado')
    if (entry.answeredAt) {
      throw new Error('Pergunta já respondida não pode ser editada')
    }

    const trimmed = question.trim()
    if (!trimmed) throw new Error('Pergunta vazia')

    await ctx.db.patch(id, { question: trimmed.slice(0, MAX_Q_LEN) })
  },
})

export const remove = mutation({
  args: { id: v.id('courseQuestions') },
  handler: async (ctx, { id }) => {
    const { identity } = await requireCurrentUser(ctx)
    const entry = await ctx.db.get(id)
    if (!entry) throw new Error('Pergunta não encontrada')
    const isAuthor = entry.studentId === identity.subject
    const isCreator = entry.creatorId === identity.subject
    if (!isAuthor && !isCreator) throw new Error('Não autorizado')
    // Aluno não pode apagar depois de respondida (fica como registro para o
    // professor). Criador pode apagar a qualquer momento (moderação).
    if (isAuthor && !isCreator && entry.answeredAt) {
      throw new Error('Pergunta já respondida')
    }
    await ctx.db.delete(id)
  },
})

export const listMyByCourse = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const entries = await ctx.db
      .query('courseQuestions')
      .withIndex('by_course_student', (q) =>
        q.eq('courseId', courseId).eq('studentId', identity.subject)
      )
      .collect()

    return entries.sort((a, b) => b.askedAt - a.askedAt)
  },
})

export const listForCreator = query({
  args: {
    courseId: v.optional(v.id('courses')),
    filter: v.optional(v.union(v.literal('all'), v.literal('pending'), v.literal('answered'))),
  },
  handler: async (ctx, { courseId, filter }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    let entries
    if (courseId) {
      const course = await ctx.db.get(courseId)
      if (!course || course.creatorId !== identity.subject) return []
      entries = await ctx.db
        .query('courseQuestions')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .collect()
    } else {
      entries = await ctx.db
        .query('courseQuestions')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
        .collect()
    }

    const filtered =
      filter === 'pending'
        ? entries.filter((e) => !e.answeredAt)
        : filter === 'answered'
          ? entries.filter((e) => e.answeredAt)
          : entries

    // Join simples com título do curso e da aula para não exigir N queries no
    // cliente. Como este é um painel do criador, cardinalidade é baixa.
    const courseCache = new Map<string, string>()
    const lessonCache = new Map<string, string>()

    const enriched = await Promise.all(
      filtered.map(async (e) => {
        let courseTitle = courseCache.get(e.courseId)
        if (!courseTitle) {
          const c = await ctx.db.get(e.courseId)
          courseTitle = c?.title ?? 'Curso'
          courseCache.set(e.courseId, courseTitle)
        }
        let lessonTitle: string | undefined
        if (e.lessonId) {
          lessonTitle = lessonCache.get(e.lessonId)
          if (!lessonTitle) {
            const l = await ctx.db.get(e.lessonId)
            lessonTitle = l?.title
            if (lessonTitle) lessonCache.set(e.lessonId, lessonTitle)
          }
        }
        return { ...e, courseTitle, lessonTitle }
      })
    )

    return enriched.sort((a, b) => {
      // Pendentes primeiro, depois por data mais recente
      const aPending = a.answeredAt ? 1 : 0
      const bPending = b.answeredAt ? 1 : 0
      if (aPending !== bPending) return aPending - bPending
      return b.askedAt - a.askedAt
    })
  },
})

export const countPendingForCreator = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return 0

    const entries = await ctx.db
      .query('courseQuestions')
      .withIndex('by_creator_answered', (q) =>
        q.eq('creatorId', identity.subject).eq('answeredAt', undefined)
      )
      .collect()

    return entries.length
  },
})
