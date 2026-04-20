import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { ensureIdentityMatches, requirePerfil } from './lib/auth'

export const getByLesson = query({
  args: { lessonId: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { lessonId, creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .first()
    if (!quiz || quiz.creatorId !== identity.subject) return null
    return quiz
  },
})

export const upsert = mutation({
  args: {
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    creatorId: v.string(),
    questions: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        options: v.array(v.object({ id: v.string(), text: v.string() })),
        correctOptionId: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, args.creatorId)

    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson || lesson.creatorId !== identity.subject) throw new Error('Não autorizado')
    if (lesson.courseId !== args.courseId) throw new Error('Curso inválido')

    const existing = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', args.lessonId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { questions: args.questions })
      return existing._id
    }
    return await ctx.db.insert('quizzes', {
      ...args,
      creatorId: identity.subject,
    })
  },
})

export const remove = mutation({
  args: { lessonId: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { lessonId, creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .first()
    if (!quiz || quiz.creatorId !== identity.subject) return
    await ctx.db.delete(quiz._id)
  },
})
