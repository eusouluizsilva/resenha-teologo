import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const listByCourse = query({
  args: { courseId: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { courseId, creatorId }) => {
    const course = await ctx.db.get(courseId)
    if (!course || course.creatorId !== creatorId) return []

    return await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .order('asc')
      .collect()
  },
})

export const listByModule = query({
  args: { moduleId: v.id('modules'), creatorId: v.string() },
  handler: async (ctx, { moduleId, creatorId }) => {
    return await ctx.db
      .query('lessons')
      .withIndex('by_moduleId', (q) => q.eq('moduleId', moduleId))
      .order('asc')
      .collect()
  },
})

export const create = mutation({
  args: {
    moduleId: v.id('modules'),
    courseId: v.id('courses'),
    creatorId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    youtubeUrl: v.string(),
    durationSeconds: v.optional(v.number()),
    order: v.number(),
    hasMandatoryQuiz: v.boolean(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId)
    if (!course || course.creatorId !== args.creatorId) throw new Error('Não autorizado')

    const lessonId = await ctx.db.insert('lessons', { ...args, isPublished: false })
    await ctx.db.patch(args.courseId, { totalLessons: course.totalLessons + 1 })
    return lessonId
  },
})

export const update = mutation({
  args: {
    id: v.id('lessons'),
    creatorId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    hasMandatoryQuiz: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, creatorId, ...fields }) => {
    const lesson = await ctx.db.get(id)
    if (!lesson || lesson.creatorId !== creatorId) throw new Error('Não autorizado')
    await ctx.db.patch(id, fields)
  },
})

export const remove = mutation({
  args: { id: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const lesson = await ctx.db.get(id)
    if (!lesson || lesson.creatorId !== creatorId) throw new Error('Não autorizado')
    const course = await ctx.db.get(lesson.courseId)
    if (course) {
      await ctx.db.patch(lesson.courseId, { totalLessons: Math.max(0, course.totalLessons - 1) })
    }
    await ctx.db.delete(id)
  },
})
