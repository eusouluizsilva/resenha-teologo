import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireLessonAccess } from './lib/auth'

// Curtidas internas de aula. Apenas alunos matriculados ou o próprio criador
// dono podem curtir. O toggle é idempotente: chamar duas vezes alterna entre
// curtido e não curtido.

export const getStatus = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    const all = await ctx.db
      .query('lessonLikes')
      .withIndex('by_lesson', (q) => q.eq('lessonId', lessonId))
      .collect()

    const identity = await ctx.auth.getUserIdentity()
    const liked = identity
      ? all.some((row) => row.userId === identity.subject)
      : false

    return { count: all.length, liked }
  },
})

export const toggle = mutation({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    const { identity, lesson } = await requireLessonAccess(ctx, lessonId)

    const existing = await ctx.db
      .query('lessonLikes')
      .withIndex('by_lesson_user', (q) =>
        q.eq('lessonId', lessonId).eq('userId', identity.subject)
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
      return { liked: false }
    }

    await ctx.db.insert('lessonLikes', {
      lessonId,
      courseId: lesson.courseId,
      userId: identity.subject,
      at: Date.now(),
    })
    return { liked: true }
  },
})
