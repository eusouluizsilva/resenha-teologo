import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getByLesson = query({
  args: { lessonId: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { lessonId, creatorId }) => {
    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .first()
    if (!quiz || quiz.creatorId !== creatorId) return null
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
    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson || lesson.creatorId !== args.creatorId) throw new Error('Não autorizado')

    const existing = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', args.lessonId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { questions: args.questions })
      return existing._id
    }
    return await ctx.db.insert('quizzes', args)
  },
})

export const remove = mutation({
  args: { lessonId: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { lessonId, creatorId }) => {
    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .first()
    if (!quiz || quiz.creatorId !== creatorId) return
    await ctx.db.delete(quiz._id)
  },
})
