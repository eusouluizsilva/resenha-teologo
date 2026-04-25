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

    // Curso institucional exige que o aluno seja membro ativo da instituição.
    if (course.visibility === 'institution' && course.institutionId) {
      const membership = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', course.institutionId!).eq('userId', user.clerkId)
        )
        .unique()
      if (!membership || membership.status === 'removido') {
        throw new Error('Este curso é exclusivo para membros da instituição.')
      }
    }

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

// Lista todos os alunos matriculados em qualquer curso do professor, com
// progresso agregado. Útil para o dashboard do professor acompanhar quem está
// estudando seus cursos. Multi-tenant: filtra pelos cursos do creatorId.
export const listStudentsByCreator = query({
  args: { creatorId: v.string() },
  handler: async (ctx, { creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    if (identity.subject !== creatorId) throw new Error('Não autorizado')

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .collect()

    if (courses.length === 0) return []

    const courseById = new Map(courses.map((c) => [c._id as string, c]))

    // Reúne todas as matrículas dos cursos do professor.
    const allEnrollments: {
      studentId: string
      courseId: string
      certificateIssued: boolean
      finalScore?: number
      completedAt?: number
      courseTitle: string
      totalLessons: number
      _creationTime: number
    }[] = []

    for (const course of courses) {
      const enrollments = await ctx.db
        .query('enrollments')
        .withIndex('by_courseId', (q) => q.eq('courseId', course._id))
        .collect()

      for (const e of enrollments) {
        allEnrollments.push({
          studentId: e.studentId,
          courseId: course._id as string,
          certificateIssued: e.certificateIssued,
          finalScore: e.finalScore,
          completedAt: e.completedAt,
          courseTitle: course.title,
          totalLessons: course.totalLessons || 1,
          _creationTime: e._creationTime,
        })
      }
    }

    if (allEnrollments.length === 0) return []

    // Agrupar por studentId.
    const byStudent = new Map<string, typeof allEnrollments>()
    for (const e of allEnrollments) {
      const arr = byStudent.get(e.studentId) ?? []
      arr.push(e)
      byStudent.set(e.studentId, arr)
    }

    // Progresso por aluno em cada curso.
    const students = await Promise.all(
      Array.from(byStudent.entries()).map(async ([studentId, enrolls]) => {
        const user = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', studentId))
          .unique()

        const studentCourses = await Promise.all(
          enrolls.map(async (e) => {
            const progressRecords = await ctx.db
              .query('progress')
              .withIndex('by_student_course', (q) =>
                q.eq('studentId', studentId).eq('courseId', courseById.get(e.courseId)!._id)
              )
              .collect()
            const completedLessons = progressRecords.filter((p) => p.completed).length
            const percentage = Math.round((completedLessons / e.totalLessons) * 100)

            return {
              courseId: e.courseId,
              courseTitle: e.courseTitle,
              percentage,
              certificateIssued: e.certificateIssued,
              finalScore: e.finalScore,
              completedAt: e.completedAt,
              enrolledAt: e._creationTime,
            }
          })
        )

        return {
          studentId,
          name: user?.name ?? 'Aluno',
          email: user?.email ?? '',
          avatarUrl: user?.avatarUrl,
          handle: user?.handle,
          coursesEnrolled: studentCourses.length,
          coursesCompleted: studentCourses.filter((c) => c.certificateIssued).length,
          courses: studentCourses,
          lastEnrolledAt: Math.max(...studentCourses.map((c) => c.enrolledAt)),
        }
      })
    )

    return students.sort((a, b) => b.lastEnrolledAt - a.lastEnrolledAt)
  },
})

export const listCertificates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)

    const student = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()

    const certs = enrollments.filter((e) => e.certificateIssued)

    return await Promise.all(
      certs.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId)
        const creator = course
          ? await ctx.db
              .query('users')
              .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
              .unique()
          : null
        return {
          enrollment,
          course,
          studentName: student?.name ?? '',
          creatorName: creator?.name ?? '',
        }
      })
    )
  },
})
