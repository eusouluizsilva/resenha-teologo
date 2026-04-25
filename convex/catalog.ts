import { v } from 'convex/values'
import { query } from './_generated/server'

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

export const listPublished = query({
  args: {
    category: v.optional(v.string()),
    level: v.optional(v.union(v.literal('iniciante'), v.literal('intermediario'), v.literal('avancado'))),
    language: v.optional(v.string()),
  },
  handler: async (ctx, { category, level, language }) => {
    let courses = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect()

    // Cursos institucionais só aparecem no catálogo para membros ativos da
    // instituição vinculada. Para usuários não logados ou não membros, ficam
    // ocultos. Default (sem visibility) = 'public' e aparece para todos.
    const identity = await ctx.auth.getUserIdentity()
    const userMemberships = identity
      ? await ctx.db
          .query('institutionMembers')
          .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
          .filter((q) => q.neq(q.field('status'), 'removido'))
          .collect()
      : []
    const memberInstitutionIds = new Set(userMemberships.map((m) => m.institutionId as unknown as string))

    courses = courses.filter((c) => {
      if (c.visibility !== 'institution') return true
      if (!c.institutionId) return true
      return memberInstitutionIds.has(c.institutionId as unknown as string)
    })

    if (category) {
      courses = courses.filter((c) => c.category === category)
    }
    if (level) {
      courses = courses.filter((c) => c.level === level)
    }
    if (language) {
      courses = courses.filter((c) => (c.language ?? 'Português') === language)
    }

    const result = await Promise.all(
      courses.map(async (course) => {
        const creator = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
          .unique()

        const courseRatings = await ctx.db
          .query('courseRatings')
          .withIndex('by_courseId', (q) => q.eq('courseId', course._id))
          .collect()

        const ratingsCount = courseRatings.length
        const avgRating =
          ratingsCount > 0
            ? Math.round((courseRatings.reduce((sum, r) => sum + r.stars, 0) / ratingsCount) * 10) / 10
            : null

        return {
          ...course,
          creatorName: creator?.name ?? 'Professor',
          ratingsCount,
          avgRating,
        }
      })
    )

    return result
  },
})

export const getPublicById = query({
  args: { id: v.id('courses') },
  handler: async (ctx, { id }) => {
    const course = await ctx.db.get(id)
    if (!course || !course.isPublished) return null

    // Curso institucional só é visível a membros ativos da instituição vinculada
    // (ou ao próprio criador/dono, tratado abaixo).
    if (course.visibility === 'institution' && course.institutionId) {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) return null
      const isCreator = identity.subject === course.creatorId
      if (!isCreator) {
        const membership = await ctx.db
          .query('institutionMembers')
          .withIndex('by_institution_user', (q) =>
            q.eq('institutionId', course.institutionId!).eq('userId', identity.subject)
          )
          .unique()
        if (!membership || membership.status === 'removido') return null
      }
    }

    const creator = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
      .unique()

    const modules = await ctx.db
      .query('modules')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .order('asc')
      .collect()

    const modulesWithLessons = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await ctx.db
          .query('lessons')
          .withIndex('by_moduleId', (q) => q.eq('moduleId', mod._id))
          .order('asc')
          .collect()
        return { ...mod, lessons: lessons.filter((l) => l.isPublished) }
      })
    )

    return {
      ...course,
      creatorName: creator?.name ?? 'Criador',
      creatorBio: creator?.bio,
      creatorAvatarUrl: creator?.avatarUrl,
      modules: modulesWithLessons,
    }
  },
})
