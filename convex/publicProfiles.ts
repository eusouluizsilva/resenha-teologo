import { v } from 'convex/values'
import { query } from './_generated/server'

export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', handle))
      .unique()

    if (!user) return null
    if (user.profileVisibility === 'unlisted') return null

    const userFunctions = await ctx.db
      .query('userFunctions')
      .withIndex('by_userId', (q) => q.eq('userId', user.clerkId))
      .collect()

    return {
      clerkId: user.clerkId,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      handle: user.handle,
      website: user.website,
      instagram: user.instagram,
      facebook: user.facebook,
      linkedin: user.linkedin,
      twitter: user.twitter,
      youtubeChannel: user.youtubeChannel,
      denomination: user.denomination,
      churchName: user.churchName,
      churchRole: user.churchRole,
      churchInstagram: user.churchInstagram,
      profileVisibility: user.profileVisibility,
      showProgressPublicly: user.showProgressPublicly,
      functions: userFunctions.map((f) => f.function),
      followerCount: user.followerCount ?? 0,
    }
  },
})

// Cursos publicos do criador. Filtra cursos institucionais conforme regras
// de visibilidade do catalogo. Usado na aba "Cursos" do perfil publico.
export const listCoursesByCreator = query({
  args: { authorUserId: v.string() },
  handler: async (ctx, { authorUserId }) => {
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', authorUserId))
      .collect()

    const identity = await ctx.auth.getUserIdentity()
    const memberships = identity
      ? await ctx.db
          .query('institutionMembers')
          .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
          .filter((q) => q.neq(q.field('status'), 'removido'))
          .collect()
      : []
    const memberInstIds = new Set(memberships.map((m) => m.institutionId as unknown as string))

    const visible = courses
      .filter((c) => c.isPublished)
      .filter((c) => {
        if (c.visibility !== 'institution') return true
        if (!c.institutionId) return true
        return memberInstIds.has(c.institutionId as unknown as string)
      })
      .sort((a, b) => (b.totalStudents ?? 0) - (a.totalStudents ?? 0))

    return visible.map((c) => ({
      _id: c._id,
      slug: c.slug,
      title: c.title,
      shortDescription: c.description.slice(0, 180),
      thumbnail: c.thumbnail,
      level: c.level,
      category: c.category,
      totalLessons: c.totalLessons ?? 0,
      totalStudents: c.totalStudents ?? 0,
    }))
  },
})

// Destaque do perfil: artigo mais recente publicado e curso com mais
// matriculas. Retorna null para campos quando nao houver dados.
export const getProfileSpotlight = query({
  args: { authorUserId: v.string() },
  handler: async (ctx, { authorUserId }) => {
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorUserId', authorUserId))
      .collect()

    const published = posts.filter((p) => p.status === 'published')

    let topPost = null as null | {
      _id: typeof posts[number]['_id']
      slug: string
      title: string
      excerpt: string
      coverImageUrl: string | null
      publishedAt: number | null
      likeCount: number
      commentCount: number
      shareCount: number
      viewCount: number
    }
    if (published.length > 0) {
      const score = (p: (typeof published)[number]) =>
        p.likeCount * 2 + p.commentCount * 3 + p.shareCount * 4 + p.viewCount
      const sorted = [...published].sort((a, b) => {
        const sa = score(a)
        const sb = score(b)
        if (sa !== sb) return sb - sa
        return (b.publishedAt ?? 0) - (a.publishedAt ?? 0)
      })
      const t = sorted[0]
      const cover = t.coverImageStorageId
        ? await ctx.storage.getUrl(t.coverImageStorageId)
        : null
      topPost = {
        _id: t._id,
        slug: t.slug,
        title: t.title,
        excerpt: t.excerpt,
        coverImageUrl: cover,
        publishedAt: t.publishedAt ?? null,
        likeCount: t.likeCount,
        commentCount: t.commentCount,
        shareCount: t.shareCount,
        viewCount: t.viewCount,
      }
    }

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', authorUserId))
      .collect()

    const publicCourses = courses
      .filter((c) => c.isPublished && c.visibility !== 'institution')

    let topCourse = null as null | {
      _id: typeof courses[number]['_id']
      slug: string | undefined
      title: string
      shortDescription: string
      thumbnail: string | undefined
      totalStudents: number
      totalLessons: number
    }
    if (publicCourses.length > 0) {
      const sorted = [...publicCourses].sort(
        (a, b) => (b.totalStudents ?? 0) - (a.totalStudents ?? 0),
      )
      const c = sorted[0]
      topCourse = {
        _id: c._id,
        slug: c.slug,
        title: c.title,
        shortDescription: c.description.slice(0, 180),
        thumbnail: c.thumbnail,
        totalStudents: c.totalStudents ?? 0,
        totalLessons: c.totalLessons ?? 0,
      }
    }

    return { topPost, topCourse }
  },
})

// Query privada para o dashboard interno — não verifica showProgressPublicly
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()

    const progressRecords = await ctx.db
      .query('progress')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()

    const totalWatchSeconds = progressRecords.reduce((sum, p) => sum + (p.watchedSeconds ?? 0), 0)

    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId)
        if (!course) return null

        const courseProgress = progressRecords.filter((p) => p.courseId === enrollment.courseId)
        const completedLessons = courseProgress.filter((p) => p.completed).length
        const totalLessons = course.totalLessons || 1
        const percentage = Math.round((completedLessons / totalLessons) * 100)

        return {
          courseId: enrollment.courseId,
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          completedLessons,
          totalLessons,
          percentage,
          certificateIssued: enrollment.certificateIssued,
          completedAt: enrollment.completedAt,
        }
      })
    )

    const validCourses = courses.filter(Boolean) as NonNullable<(typeof courses)[0]>[]

    return {
      totalCoursesEnrolled: validCourses.length,
      totalCoursesCompleted: validCourses.filter((c) => c.certificateIssued).length,
      totalWatchSeconds,
      certificateCount: validCourses.filter((c) => c.certificateIssued).length,
      courses: validCourses,
    }
  },
})

export const getPublicStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', userId))
      .unique()

    if (!user || user.showProgressPublicly === false) return null

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', userId))
      .collect()

    const progressRecords = await ctx.db
      .query('progress')
      .withIndex('by_studentId', (q) => q.eq('studentId', userId))
      .collect()

    const totalWatchSeconds = progressRecords.reduce((sum, p) => sum + (p.watchedSeconds ?? 0), 0)

    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId)
        if (!course) return null

        const courseProgress = progressRecords.filter(
          (p) => p.courseId === enrollment.courseId
        )
        const completedLessons = courseProgress.filter((p) => p.completed).length
        const totalLessons = course.totalLessons || 1
        const percentage = Math.round((completedLessons / totalLessons) * 100)

        return {
          courseId: enrollment.courseId,
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          completedLessons,
          totalLessons,
          percentage,
          certificateIssued: enrollment.certificateIssued,
          completedAt: enrollment.completedAt,
        }
      })
    )

    const validCourses = courses.filter(Boolean) as NonNullable<(typeof courses)[0]>[]

    return {
      totalCoursesEnrolled: validCourses.length,
      totalCoursesCompleted: validCourses.filter((c) => c.certificateIssued).length,
      totalWatchSeconds,
      certificateCount: validCourses.filter((c) => c.certificateIssued).length,
      courses: validCourses,
    }
  },
})
