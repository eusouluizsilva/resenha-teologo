import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireUserFunction } from './lib/auth'

// Métricas por aula para o criador. Agrega dados de progress e enrollments
// para cada aula publicada do curso. Multi-tenant: filtra por creatorId.
//
// Por aula retornamos:
// - viewers: alunos que iniciaram (watchedSeconds > 0)
// - completers: alunos que concluiram (completed = true)
// - completionRate: completers / matriculados
// - avgWatchedSeconds: tempo medio assistido entre quem iniciou
// - quizAttempts: total de tentativas registradas
// - avgQuizScore: media dos scores nao nulos
// - passRate: completers com quizPassed === true / completers

export const getCourseLessonMetrics = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    const course = await ctx.db.get(courseId)
    if (!course || course.creatorId !== identity.subject) return null

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .order('asc')
      .collect()

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .collect()
    const enrolledCount = enrollments.length

    const allProgress = await ctx.db
      .query('progress')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .collect()

    const byLesson = new Map<string, typeof allProgress>()
    for (const p of allProgress) {
      const arr = byLesson.get(p.lessonId) ?? []
      arr.push(p)
      byLesson.set(p.lessonId, arr)
    }

    const lessonMetrics = lessons.map((lesson) => {
      const rows = byLesson.get(lesson._id) ?? []
      const viewers = rows.filter((r) => r.watchedSeconds > 0).length
      const completers = rows.filter((r) => r.completed).length
      const watchedTotal = rows.reduce(
        (acc, r) => acc + Math.max(0, r.watchedSeconds),
        0,
      )
      const avgWatchedSeconds = viewers > 0 ? Math.round(watchedTotal / viewers) : 0

      const quizScores = rows
        .map((r) => r.quizScore)
        .filter((v): v is number => typeof v === 'number')
      const avgQuizScore =
        quizScores.length > 0
          ? Math.round(
              (quizScores.reduce((acc, v) => acc + v, 0) / quizScores.length) * 10,
            ) / 10
          : null

      const quizAttempts = rows.reduce(
        (acc, r) => acc + (r.quizAttempts ?? 0),
        0,
      )

      const quizPassed = rows.filter((r) => r.quizPassed === true).length
      const passRate =
        completers > 0 ? Math.round((quizPassed / completers) * 100) : null

      const completionRate =
        enrolledCount > 0 ? Math.round((completers / enrolledCount) * 100) : 0

      return {
        _id: lesson._id,
        title: lesson.title,
        order: lesson.order,
        isPublished: lesson.isPublished,
        durationSeconds: lesson.durationSeconds ?? null,
        hasMandatoryQuiz: lesson.hasMandatoryQuiz,
        viewers,
        completers,
        completionRate,
        avgWatchedSeconds,
        avgQuizScore,
        quizAttempts,
        passRate,
      }
    })

    // Totais consolidados do curso (tudo agregado).
    const totalCompleters = allProgress.filter((p) => p.completed).length
    const allQuizScores = allProgress
      .map((r) => r.quizScore)
      .filter((v): v is number => typeof v === 'number')
    const overallAvgQuiz =
      allQuizScores.length > 0
        ? Math.round(
            (allQuizScores.reduce((acc, v) => acc + v, 0) /
              allQuizScores.length) *
              10,
          ) / 10
        : null

    return {
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug ?? null,
        totalLessons: course.totalLessons,
      },
      summary: {
        enrolledCount,
        totalCompletions: totalCompleters,
        overallAvgQuiz,
      },
      lessons: lessonMetrics,
    }
  },
})
