import { v } from 'convex/values'
import { query } from './_generated/server'

export const listPublished = query({
  args: {
    category: v.optional(v.string()),
    level: v.optional(v.union(v.literal('iniciante'), v.literal('intermediario'), v.literal('avancado'))),
  },
  handler: async (ctx, { category, level }) => {
    let courses = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect()

    if (category) {
      courses = courses.filter((c) => c.category === category)
    }
    if (level) {
      courses = courses.filter((c) => c.level === level)
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
          creatorName: creator?.name ?? 'Criador',
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
