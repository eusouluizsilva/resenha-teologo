import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { ensureIdentityMatches, requirePerfil } from './lib/auth'

export const listByCreator = query({
  args: { creatorId: v.string() },
  handler: async (ctx, { creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    return await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) return null
    return course
  },
})

export const create = mutation({
  args: {
    creatorId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    level: v.union(v.literal('iniciante'), v.literal('intermediario'), v.literal('avancado')),
    thumbnail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, args.creatorId)

    return await ctx.db.insert('courses', {
      ...args,
      creatorId: identity.subject,
      isPublished: false,
      totalLessons: 0,
      totalStudents: 0,
      totalModules: 0,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('courses'),
    creatorId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    level: v.optional(v.union(v.literal('iniciante'), v.literal('intermediario'), v.literal('avancado'))),
    thumbnail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublished: v.optional(v.boolean()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, { id, creatorId, ...fields }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')
    await ctx.db.patch(id, fields)
  },
})

export const remove = mutation({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()

    for (const lesson of lessons) {
      const quiz = await ctx.db
        .query('quizzes')
        .withIndex('by_lessonId', (q) => q.eq('lessonId', lesson._id))
        .first()
      if (quiz) await ctx.db.delete(quiz._id)
      await ctx.db.delete(lesson._id)
    }

    const modules = await ctx.db
      .query('modules')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    for (const mod of modules) {
      await ctx.db.delete(mod._id)
    }

    await ctx.db.delete(id)
  },
})

export const getStats = query({
  args: { creatorId: v.string() },
  handler: async (ctx, { creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .collect()

    const totalCourses = courses.length
    const publishedCourses = courses.filter((c) => c.isPublished).length
    const totalStudents = courses.reduce((acc, c) => acc + c.totalStudents, 0)
    const totalLessons = courses.reduce((acc, c) => acc + c.totalLessons, 0)

    const donations = await ctx.db
      .query('donations')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .collect()

    const totalDonationsCents = donations
      .filter((d) => d.status === 'completed')
      .reduce((acc, d) => acc + d.amountCents, 0)

    return { totalCourses, publishedCourses, totalStudents, totalLessons, totalDonationsCents }
  },
})
