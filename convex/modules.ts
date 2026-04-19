import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const listByCourse = query({
  args: { courseId: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { courseId, creatorId }) => {
    const course = await ctx.db.get(courseId)
    if (!course || course.creatorId !== creatorId) return []

    return await ctx.db
      .query('modules')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .order('asc')
      .collect()
  },
})

export const create = mutation({
  args: {
    courseId: v.id('courses'),
    creatorId: v.string(),
    title: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId)
    if (!course || course.creatorId !== args.creatorId) throw new Error('Não autorizado')

    const moduleId = await ctx.db.insert('modules', args)
    await ctx.db.patch(args.courseId, { totalModules: course.totalModules + 1 })
    return moduleId
  },
})

export const update = mutation({
  args: {
    id: v.id('modules'),
    creatorId: v.string(),
    title: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, creatorId, ...fields }) => {
    const mod = await ctx.db.get(id)
    if (!mod || mod.creatorId !== creatorId) throw new Error('Não autorizado')
    await ctx.db.patch(id, fields)
  },
})

export const remove = mutation({
  args: { id: v.id('modules'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const mod = await ctx.db.get(id)
    if (!mod || mod.creatorId !== creatorId) throw new Error('Não autorizado')

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_moduleId', (q) => q.eq('moduleId', id))
      .collect()

    for (const lesson of lessons) {
      const quiz = await ctx.db
        .query('quizzes')
        .withIndex('by_lessonId', (q) => q.eq('lessonId', lesson._id))
        .first()
      if (quiz) await ctx.db.delete(quiz._id)
      await ctx.db.delete(lesson._id)
    }

    const course = await ctx.db.get(mod.courseId)
    if (course) {
      await ctx.db.patch(mod.courseId, {
        totalModules: Math.max(0, course.totalModules - 1),
        totalLessons: Math.max(0, course.totalLessons - lessons.length),
      })
    }

    await ctx.db.delete(id)
  },
})
