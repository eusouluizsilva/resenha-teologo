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
      profileVisibility: user.profileVisibility,
      showProgressPublicly: user.showProgressPublicly,
      functions: userFunctions.map((f) => f.function),
    }
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
