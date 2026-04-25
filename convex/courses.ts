import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { ensureIdentityMatches, requireUserFunction } from './lib/auth'
import { toSlug } from './lib/slug'

export const listByCreator = query({
  args: { creatorId: v.string() },
  handler: async (ctx, { creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
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
    const { identity } = await requireUserFunction(ctx, ['criador'])
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
    institutionId: v.optional(v.id('institutions')),
    visibility: v.optional(v.union(v.literal('public'), v.literal('institution'))),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, args.creatorId)

    if (args.institutionId) {
      const membership = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', args.institutionId!).eq('userId', identity.subject)
        )
        .unique()
      if (!membership || !['dono', 'admin'].includes(membership.role) || membership.status === 'removido') {
        throw new Error('Você não administra esta instituição.')
      }
    }

    return await ctx.db.insert('courses', {
      ...args,
      creatorId: identity.subject,
      isPublished: false,
      totalLessons: 0,
      totalStudents: 0,
      totalModules: 0,
      slug: toSlug(args.title),
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
    passingScore: v.optional(v.number()),
    hasLiveStream: v.optional(v.boolean()),
    liveStreamUrl: v.optional(v.string()),
    institutionId: v.optional(v.union(v.id('institutions'), v.null())),
    visibility: v.optional(v.union(v.literal('public'), v.literal('institution'))),
  },
  handler: async (ctx, { id, creatorId, ...fields }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    if (fields.passingScore !== undefined) {
      if (fields.passingScore < 70 || fields.passingScore > 100) {
        throw new Error('A nota mínima deve estar entre 70 e 100.')
      }
    }

    // Para vincular curso a instituição, o professor precisa ser dono ou admin
    // dela. Enviar null remove o vínculo.
    if (fields.institutionId !== undefined && fields.institutionId !== null) {
      const membership = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', fields.institutionId as NonNullable<typeof fields.institutionId>).eq('userId', identity.subject)
        )
        .unique()
      if (!membership || !['dono', 'admin'].includes(membership.role) || membership.status === 'removido') {
        throw new Error('Você não administra esta instituição.')
      }
    }

    const updates: Record<string, unknown> = { ...fields }
    if (fields.title) updates.slug = toSlug(fields.title)
    // institutionId: null explícito remove vínculo.
    if (fields.institutionId === null) {
      updates.institutionId = undefined
      updates.visibility = 'public'
    }
    await ctx.db.patch(id, updates)
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const course = await ctx.db
      .query('courses')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    return course ?? null
  },
})

export const generateSlugs = mutation({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query('courses').collect()
    for (const course of courses) {
      if (!course.slug) {
        await ctx.db.patch(course._id, { slug: toSlug(course.title) })
      }
    }
  },
})

// Publica o curso e todas as suas aulas de uma vez (evita o passo manual de publicar cada aula)
export const publishWithLessons = mutation({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    // Publica o curso
    await ctx.db.patch(id, { isPublished: true })

    // Publica todas as aulas ainda em rascunho
    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()

    for (const lesson of lessons) {
      if (!lesson.isPublished) {
        await ctx.db.patch(lesson._id, { isPublished: true })
      }
    }
  },
})

export const remove = mutation({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
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
    const { identity } = await requireUserFunction(ctx, ['criador'])
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
