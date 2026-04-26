import { v } from 'convex/values'
import { query } from './_generated/server'

// Resolução pura de slug → id. Não retorna conteúdo do curso para caller
// anônimo. Para detalhes públicos use getPublicByIdOrSlug; para o player
// autenticado use student.getEnrolledCourse (ambos aplicam visibilidade
// e enrollment). Cursos institucionais só resolvem para membros ativos da
// instituição vinculada (ou para o próprio criador), evitando enumeração de
// slugs privados por anônimos.
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const course = await ctx.db
      .query('courses')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!course || !course.isPublished) return null

    if (course.visibility === 'institution' && course.institutionId) {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) return null
      const isCreator = identity.subject === course.creatorId
      if (!isCreator) {
        const membership = await ctx.db
          .query('institutionMembers')
          .withIndex('by_institution_user', (q) =>
            q.eq('institutionId', course.institutionId!).eq('userId', identity.subject),
          )
          .unique()
        if (!membership || membership.status === 'removido') return null
      }
    }

    return { _id: course._id, slug: course.slug ?? slug }
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

    // Lookup de criadores deduplicado: um Convex query por criador único, não
     // por curso. Antes este map disparava N queries de users + N queries de
     // courseRatings. Ratings vêm denormalizados em course.avgRating /
     // course.ratingsCount (mantidos por student.rateCourse).
    const uniqueCreatorIds = Array.from(new Set(courses.map((c) => c.creatorId)))
    const creators = await Promise.all(
      uniqueCreatorIds.map((cid) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', cid))
          .unique(),
      ),
    )
    const creatorByClerkId = new Map<string, string>()
    creators.forEach((u, i) => {
      if (u?.name) creatorByClerkId.set(uniqueCreatorIds[i], u.name)
    })

    const result = courses.map((course) => ({
      ...course,
      creatorName: creatorByClerkId.get(course.creatorId) ?? 'Professor',
      ratingsCount: course.ratingsCount ?? 0,
      avgRating: (course.ratingsCount ?? 0) > 0 ? course.avgRating ?? null : null,
    }))

    return result
  },
})

export const getPublicByIdOrSlug = query({
  args: { idOrSlug: v.string() },
  handler: async (ctx, { idOrSlug }) => {
    const normalized = ctx.db.normalizeId('courses', idOrSlug)
    const course = normalized
      ? await ctx.db.get(normalized)
      : await ctx.db
          .query('courses')
          .withIndex('by_slug', (q) => q.eq('slug', idOrSlug))
          .unique()
    if (!course || !course.isPublished) return null

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
      .withIndex('by_courseId', (q) => q.eq('courseId', course._id))
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
