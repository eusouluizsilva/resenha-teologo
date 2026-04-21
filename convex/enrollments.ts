import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUserFunction, requireIdentity } from './lib/auth'

export const listByStudent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()

    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId)
        if (!course) return null

        const progressRecords = await ctx.db
          .query('progress')
          .withIndex('by_student_course', (q) =>
            q.eq('studentId', identity.subject).eq('courseId', enrollment.courseId)
          )
          .collect()

        const completedLessons = progressRecords.filter((p) => p.completed).length
        const totalLessons = course.totalLessons || 1
        const percentage = Math.round((completedLessons / totalLessons) * 100)

        return {
          enrollment,
          course,
          completedLessons,
          totalLessons,
          percentage,
        }
      })
    )

    return result.filter(Boolean)
  },
})

export const enroll = mutation({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const { user } = await requireUserFunction(ctx, ['aluno'])

    const existing = await ctx.db
      .query('enrollments')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', user.clerkId).eq('courseId', courseId)
      )
      .unique()

    if (existing) return existing._id

    const course = await ctx.db.get(courseId)
    if (!course || !course.isPublished) throw new Error('Curso não encontrado')

    await ctx.db.patch(courseId, { totalStudents: (course.totalStudents || 0) + 1 })

    return await ctx.db.insert('enrollments', {
      courseId,
      studentId: user.clerkId,
      certificateIssued: false,
    })
  },
})

export const isEnrolled = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const identity = await requireIdentity(ctx)

    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .unique()

    return enrollment ?? null
  },
})

export const listCertificates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()

    const certs = enrollments.filter((e) => e.certificateIssued)

    return await Promise.all(
      certs.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId)
        return { enrollment, course }
      })
    )
  },
})
