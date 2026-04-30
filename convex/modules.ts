import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { canEditCourse, requireUserFunction } from './lib/auth'

export const listByCourse = query({
  args: { courseId: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { courseId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    if (!(await canEditCourse(ctx, courseId, identity.subject))) return []

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
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const course = await ctx.db.get(args.courseId)
    if (!course || !(await canEditCourse(ctx, args.courseId, identity.subject))) {
      throw new Error('Não autorizado')
    }

    const moduleId = await ctx.db.insert('modules', {
      courseId: args.courseId,
      title: args.title,
      order: args.order,
      // Sempre o dono do curso, independente de quem (co-autor) está criando.
      // Garante consistência das queries multi-tenant que filtram por creatorId.
      creatorId: course.creatorId,
    })
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
  handler: async (ctx, { id, creatorId: _ownerHint, ...patch }) => {
    void _ownerHint
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const mod = await ctx.db.get(id)
    if (!mod || !(await canEditCourse(ctx, mod.courseId, identity.subject))) {
      throw new Error('Não autorizado')
    }
    await ctx.db.patch(id, patch)
  },
})

export const reorder = mutation({
  args: {
    courseId: v.id('courses'),
    creatorId: v.string(),
    orderedIds: v.array(v.id('modules')),
  },
  handler: async (ctx, { courseId, orderedIds }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    if (!(await canEditCourse(ctx, courseId, identity.subject))) {
      throw new Error('Não autorizado')
    }

    const all = await ctx.db
      .query('modules')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .collect()
    const allIds = new Set(all.map((m) => m._id))
    if (orderedIds.length !== all.length || !orderedIds.every((id) => allIds.has(id))) {
      throw new Error('Lista de módulos inválida.')
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i + 1 })
    }
  },
})

export const remove = mutation({
  args: { id: v.id('modules'), creatorId: v.string() },
  handler: async (ctx, { id }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const mod = await ctx.db.get(id)
    if (!mod || !(await canEditCourse(ctx, mod.courseId, identity.subject))) {
      throw new Error('Não autorizado')
    }

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
