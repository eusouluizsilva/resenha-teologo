import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { ensureIdentityMatches, requirePerfil } from './lib/auth'

export const getById = query({
  args: { id: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const lesson = await ctx.db.get(id)
    if (!lesson || lesson.creatorId !== identity.subject) return null
    return lesson
  },
})

export const listByCourse = query({
  args: { courseId: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { courseId, creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(courseId)
    if (!course || course.creatorId !== identity.subject) return []

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
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const mod = await ctx.db.get(moduleId)
    if (!mod || mod.creatorId !== identity.subject) return []

    return await ctx.db
      .query('lessons')
      .withIndex('by_moduleId', (q) => q.eq('moduleId', moduleId))
      .order('asc')
      .collect()
  },
})

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

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
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, args.creatorId)

    const course = await ctx.db.get(args.courseId)
    const mod = await ctx.db.get(args.moduleId)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')
    if (!mod || mod.creatorId !== identity.subject || mod.courseId !== args.courseId) {
      throw new Error('Módulo inválido')
    }

    const lessonId = await ctx.db.insert('lessons', {
      ...args,
      creatorId: identity.subject,
      isPublished: false,
    })

    const newTotal = course.totalLessons + 1
    if (!course.thumbnail) {
      const videoId = extractYouTubeId(args.youtubeUrl)
      const thumbnail = videoId
        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
        : undefined
      await ctx.db.patch(args.courseId, { totalLessons: newTotal, ...(thumbnail ? { thumbnail } : {}) })
    } else {
      await ctx.db.patch(args.courseId, { totalLessons: newTotal })
    }

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
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const lesson = await ctx.db.get(id)
    if (!lesson || lesson.creatorId !== identity.subject) throw new Error('Não autorizado')
    await ctx.db.patch(id, fields)
  },
})

export const remove = mutation({
  args: { id: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const lesson = await ctx.db.get(id)
    if (!lesson || lesson.creatorId !== identity.subject) throw new Error('Não autorizado')

    const course = await ctx.db.get(lesson.courseId)
    if (course) {
      await ctx.db.patch(lesson.courseId, { totalLessons: Math.max(0, course.totalLessons - 1) })
    }

    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .first()
    if (quiz) await ctx.db.delete(quiz._id)

    await ctx.db.delete(id)
  },
})
