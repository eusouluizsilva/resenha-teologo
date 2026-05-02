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
        // Course + progress em paralelo: 2 round-trips por matricula viram 1.
        const [course, progressRecords] = await Promise.all([
          ctx.db.get(enrollment.courseId),
          ctx.db
            .query('progress')
            .withIndex('by_student_course', (q) =>
              q.eq('studentId', identity.subject).eq('courseId', enrollment.courseId),
            )
            .collect(),
        ])
        if (!course) return null

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

    const enrollmentId = await ctx.db.insert('enrollments', {
      courseId,
      studentId: user.clerkId,
      certificateIssued: false,
    })

    // Auto-follow: ao se matricular, o aluno passa a seguir o criador do curso.
    // Se ja segue, nao duplica. Se for o proprio criador (caso raro), pula.
    if (user.clerkId !== course.creatorId) {
      const alreadyFollows = await ctx.db
        .query('profileFollows')
        .withIndex('by_pair', (q) =>
          q.eq('followerUserId', user.clerkId).eq('authorUserId', course.creatorId),
        )
        .unique()

      if (!alreadyFollows) {
        await ctx.db.insert('profileFollows', {
          followerUserId: user.clerkId,
          authorUserId: course.creatorId,
          notifyArticles: true,
          notifyCourses: true,
          notifyLessons: false,
          emailDigest: false,
          createdAt: Date.now(),
        })

        const author = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
          .unique()
        if (author) {
          await ctx.db.patch(author._id, {
            followerCount: (author.followerCount ?? 0) + 1,
          })
        }
      }
    }

    return enrollmentId
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

    if (courses.length === 0) return { courses: [], students: [] }

    const courseById = new Map(courses.map((c) => [c._id as string, c]))

    // Pré-carrega lessons + enrollments de TODOS os cursos em paralelo.
    // Substitui dois loops sequenciais (2N round-trips) por 2 Promise.all.
    const [lessonsByCourse, enrollmentsByCourse] = await Promise.all([
      Promise.all(
        courses.map((c) =>
          ctx.db
            .query('lessons')
            .withIndex('by_courseId', (q) => q.eq('courseId', c._id))
            .collect(),
        ),
      ),
      Promise.all(
        courses.map((c) =>
          ctx.db
            .query('enrollments')
            .withIndex('by_courseId', (q) => q.eq('courseId', c._id))
            .collect(),
        ),
      ),
    ])

    const lessonTitleById = new Map<string, string>()
    const totalLessonsByCourseId = new Map<string, number>()
    courses.forEach((c, idx) => {
      const lessons = lessonsByCourse[idx]
      for (const l of lessons) lessonTitleById.set(l._id as string, l.title)
      const publishedCount = lessons.filter((l) => l.isPublished).length
      totalLessonsByCourseId.set(c._id as string, publishedCount || c.totalLessons || 1)
    })

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

    courses.forEach((course, idx) => {
      const enrollments = enrollmentsByCourse[idx]
      for (const e of enrollments) {
        allEnrollments.push({
          studentId: e.studentId,
          courseId: course._id as string,
          certificateIssued: e.certificateIssued,
          finalScore: e.finalScore,
          completedAt: e.completedAt,
          courseTitle: course.title,
          totalLessons: totalLessonsByCourseId.get(course._id as string) || course.totalLessons || 1,
          _creationTime: e._creationTime,
        })
      }
    })

    if (allEnrollments.length === 0) {
      return {
        courses: courses.map((c) => ({ id: c._id as string, title: c.title })),
        students: [],
      }
    }

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
        // user + cada progress de cada matricula em paralelo.
        const [user, ...progressByEnroll] = await Promise.all([
          ctx.db
            .query('users')
            .withIndex('by_clerkId', (q) => q.eq('clerkId', studentId))
            .unique(),
          ...enrolls.map((e) =>
            ctx.db
              .query('progress')
              .withIndex('by_student_course', (q) =>
                q.eq('studentId', studentId).eq('courseId', courseById.get(e.courseId)!._id),
              )
              .collect(),
          ),
        ])

        const studentCourses = await Promise.all(
          enrolls.map(async (e, i) => {
            const progressRecords = progressByEnroll[i]
            const completedLessons = progressRecords.filter((p) => p.completed).length
            const percentage = Math.min(
              100,
              Math.round((completedLessons / e.totalLessons) * 100)
            )

            // Lista de quizzes feitos (nota disponível). Ignora retries
            // pendentes (quizRetryPending) — esses ainda não tem nota válida.
            const quizScores = progressRecords
              .filter((p) => typeof p.quizScore === 'number' && !p.quizRetryPending)
              .map((p) => ({
                lessonId: p.lessonId as string,
                lessonTitle: lessonTitleById.get(p.lessonId as string) ?? 'Aula',
                score: p.quizScore as number,
                passed: p.quizPassed === true,
              }))
              .sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle, 'pt-BR'))

            return {
              courseId: e.courseId,
              courseTitle: e.courseTitle,
              percentage,
              completedLessons,
              totalLessons: e.totalLessons,
              certificateIssued: e.certificateIssued,
              finalScore: e.finalScore,
              completedAt: e.completedAt,
              enrolledAt: e._creationTime,
              quizScores,
            }
          })
        )

        // Stats de topo: média geral de notas finais (cursos com finalScore)
        // e total de quizzes feitos somado entre cursos.
        const finalScores = studentCourses
          .map((c) => c.finalScore)
          .filter((s): s is number => typeof s === 'number')
        const averageScore = finalScores.length
          ? Math.round(finalScores.reduce((acc, s) => acc + s, 0) / finalScores.length)
          : null
        const totalQuizzes = studentCourses.reduce((acc, c) => acc + c.quizScores.length, 0)

        const publicProfile =
          Boolean(user?.handle) && user?.profileVisibility !== 'unlisted'

        return {
          studentId,
          name: user?.name ?? 'Aluno',
          email: user?.email ?? '',
          avatarUrl: user?.avatarUrl,
          handle: user?.handle,
          publicProfile,
          coursesEnrolled: studentCourses.length,
          coursesCompleted: studentCourses.filter((c) => c.certificateIssued).length,
          totalQuizzes,
          averageScore,
          courses: studentCourses,
          lastEnrolledAt: Math.max(...studentCourses.map((c) => c.enrolledAt)),
        }
      })
    )

    return {
      courses: courses.map((c) => ({ id: c._id as string, title: c.title })),
      students: students.sort((a, b) => b.lastEnrolledAt - a.lastEnrolledAt),
    }
  },
})

export const listCertificates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)

    // Student + enrollments em paralelo.
    const [student, enrollments] = await Promise.all([
      ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
        .unique(),
      ctx.db
        .query('enrollments')
        .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
        .collect(),
    ])

    const certs = enrollments.filter((e) => e.certificateIssued)
    if (certs.length === 0) return []

    // Cursos em paralelo.
    const courses = await Promise.all(certs.map((e) => ctx.db.get(e.courseId)))

    // Dedup creators + lessons por curso em paralelo.
    const uniqueCreatorIds = Array.from(
      new Set(courses.filter((c): c is NonNullable<typeof c> => !!c).map((c) => c.creatorId)),
    )
    const [creatorsList, lessonsByCert] = await Promise.all([
      Promise.all(
        uniqueCreatorIds.map((cid) =>
          ctx.db
            .query('users')
            .withIndex('by_clerkId', (q) => q.eq('clerkId', cid))
            .unique(),
        ),
      ),
      Promise.all(
        courses.map((c) =>
          c
            ? ctx.db
                .query('lessons')
                .withIndex('by_courseId', (q) => q.eq('courseId', c._id))
                .collect()
            : Promise.resolve([]),
        ),
      ),
    ])
    const creatorByClerkId = new Map<string, { name: string }>()
    creatorsList.forEach((u, i) => {
      if (u) creatorByClerkId.set(uniqueCreatorIds[i], { name: u.name })
    })

    return certs.map((enrollment, i) => {
      const course = courses[i]
      const creator = course ? creatorByClerkId.get(course.creatorId) : null
      const lessons = lessonsByCert[i]
      let totalDurationSeconds = 0
      let publishedLessonsCount = 0
      for (const l of lessons) {
        if (!l.isPublished) continue
        publishedLessonsCount += 1
        totalDurationSeconds += l.durationSeconds ?? 0
      }
      return {
        enrollment,
        course,
        studentName: student?.name ?? '',
        creatorName: creator?.name ?? '',
        totalDurationSeconds,
        publishedLessonsCount,
      }
    })
  },
})
