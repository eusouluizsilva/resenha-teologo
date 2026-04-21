import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'

// ─── getEnrolledCourse ────────────────────────────────────────────────────────
// Retorna o curso completo para o aluno matriculado, com módulos, aulas e progresso.

export const getEnrolledCourse = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const identity = await requireIdentity(ctx)

    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .unique()

    if (!enrollment) return null

    const course = await ctx.db.get(courseId)
    if (!course || !course.isPublished) return null

    const creator = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
      .unique()

    const modules = await ctx.db
      .query('modules')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .order('asc')
      .collect()

    const allLessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .collect()
    const publishedLessons = allLessons.filter((l) => l.isPublished)

    const progressRecords = await ctx.db
      .query('progress')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .collect()

    const modulesWithData = modules.map((mod) => {
      const modLessons = publishedLessons
        .filter((l) => l.moduleId === mod._id)
        .sort((a, b) => a.order - b.order)

      const lessonsWithProgress = modLessons.map((lesson) => {
        const progress = progressRecords.find((p) => p.lessonId === lesson._id) ?? null
        return { ...lesson, progress }
      })

      return { ...mod, lessons: lessonsWithProgress }
    })

    const completedLessons = progressRecords.filter((p) => p.completed).length
    const totalLessons = publishedLessons.length
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    const quizScores = progressRecords
      .filter((p) => p.quizScore !== undefined)
      .map((p) => p.quizScore as number)
    const avgScore =
      quizScores.length > 0
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
        : null

    // Próxima aula: primeiro item incompleto na ordem dos módulos
    let nextLesson: (typeof modulesWithData[0]['lessons'][0] & { moduleName: string }) | null = null
    outer: for (const mod of modulesWithData) {
      for (const lesson of mod.lessons) {
        if (!lesson.progress?.completed) {
          nextLesson = { ...lesson, moduleName: mod.title }
          break outer
        }
      }
    }

    return {
      course,
      enrollment,
      creator: {
        name: creator?.name ?? 'Criador',
        bio: creator?.bio ?? null,
        avatarUrl: creator?.avatarUrl ?? null,
      },
      modules: modulesWithData,
      completedLessons,
      totalLessons,
      percentage,
      avgScore,
      nextLesson,
    }
  },
})

// ─── getLessonForPlayer ───────────────────────────────────────────────────────
// Dados completos da aula para o player do aluno.

export const getLessonForPlayer = query({
  args: {
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, { lessonId, courseId }) => {
    const identity = await requireIdentity(ctx)

    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .unique()

    if (!enrollment) return null

    const lesson = await ctx.db.get(lessonId)
    if (!lesson || !lesson.isPublished || lesson.courseId !== courseId) return null

    const course = await ctx.db.get(courseId)
    if (!course || !course.isPublished) return null

    const mod = await ctx.db.get(lesson.moduleId)

    const creatorProfile = await ctx.db
      .query('creatorProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', course.creatorId))
      .unique()

    const progress = await ctx.db
      .query('progress')
      .withIndex('by_student_lesson', (q) =>
        q.eq('studentId', identity.subject).eq('lessonId', lessonId)
      )
      .unique()

    // Quiz: só retorna gabarito se a aula foi concluída
    let quiz = null
    if (lesson.hasMandatoryQuiz) {
      const rawQuiz = await ctx.db
        .query('quizzes')
        .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
        .first()

      if (rawQuiz) {
        if (progress?.completed) {
          quiz = rawQuiz
        } else {
          // Esconde gabarito até concluir a aula
          quiz = {
            ...rawQuiz,
            questions: rawQuiz.questions.map((q) => ({
              ...q,
              correctOptionId: '',
              explanation: undefined,
            })),
          }
        }
      }
    }

    // Navegação entre aulas (na ordem dos módulos)
    const allModules = await ctx.db
      .query('modules')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .order('asc')
      .collect()

    const allLessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .collect()

    const orderedLessons = allModules.flatMap((m) =>
      allLessons
        .filter((l) => l.moduleId === m._id && l.isPublished)
        .sort((a, b) => a.order - b.order)
    )

    const currentIndex = orderedLessons.findIndex((l) => l._id === lessonId)
    const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null
    const nextLesson =
      currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null

    return {
      lesson,
      course,
      module: mod,
      progress: progress ?? null,
      quiz,
      prevLesson,
      nextLesson,
      enrollment,
      lessonIndex: currentIndex + 1,
      totalLessons: orderedLessons.length,
      creatorYoutubeUrl: creatorProfile?.youtubeUrl ?? null,
    }
  },
})

// ─── resolveLesson ────────────────────────────────────────────────────────────
// Resolve slug ou ID para os IDs reais de curso e aula.

export const resolveLesson = query({
  args: { courseRef: v.string(), lessonRef: v.string() },
  handler: async (ctx, { courseRef, lessonRef }) => {
    // Resolve course
    let course
    if (courseRef.includes('-')) {
      course = await ctx.db
        .query('courses')
        .withIndex('by_slug', (q) => q.eq('slug', courseRef))
        .unique()
    } else {
      course = await ctx.db.get(courseRef as Id<'courses'>)
    }
    if (!course) return null

    // Resolve lesson
    let lesson
    if (lessonRef.includes('-')) {
      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_courseId_slug', (q) =>
          q.eq('courseId', course!._id).eq('slug', lessonRef)
        )
        .collect()
      lesson = lessons[0] ?? null
    } else {
      lesson = await ctx.db.get(lessonRef as Id<'lessons'>)
    }
    if (!lesson) return null

    return { courseId: course._id, lessonId: lesson._id }
  },
})

// ─── updateProgress ───────────────────────────────────────────────────────────
// Atualiza o progresso de uma aula (chamado periodicamente pelo player).
// Marca como concluída automaticamente quando >=90% assistido.

export const updateProgress = mutation({
  args: {
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    watchedSeconds: v.number(),
    totalSeconds: v.number(),
  },
  handler: async (ctx, { lessonId, courseId, watchedSeconds, totalSeconds }) => {
    const identity = await requireIdentity(ctx)

    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .unique()

    if (!enrollment) throw new Error('Não matriculado')

    const existing = await ctx.db
      .query('progress')
      .withIndex('by_student_lesson', (q) =>
        q.eq('studentId', identity.subject).eq('lessonId', lessonId)
      )
      .unique()

    const alreadyCompleted = existing?.completed ?? false
    const ratio = totalSeconds > 0 ? watchedSeconds / totalSeconds : 0
    const completed = alreadyCompleted || ratio >= 0.9

    if (existing) {
      const newWatched = Math.max(watchedSeconds, existing.watchedSeconds)
      await ctx.db.patch(existing._id, {
        watchedSeconds: newWatched,
        totalSeconds,
        completed,
        ...(completed && !existing.completed ? { completedAt: Date.now() } : {}),
      })
    } else {
      await ctx.db.insert('progress', {
        studentId: identity.subject,
        lessonId,
        courseId,
        watchedSeconds,
        totalSeconds,
        completed,
        ...(completed ? { completedAt: Date.now() } : {}),
      })
    }

    return completed
  },
})

// ─── submitQuiz ───────────────────────────────────────────────────────────────
// Submete respostas do quiz, calcula nota e verifica emissão de certificado.

export const submitQuiz = mutation({
  args: {
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    answers: v.array(v.object({ questionId: v.string(), optionId: v.string() })),
  },
  handler: async (ctx, { lessonId, courseId, answers }) => {
    const identity = await requireIdentity(ctx)

    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .unique()

    if (!enrollment) throw new Error('Não matriculado')

    const progress = await ctx.db
      .query('progress')
      .withIndex('by_student_lesson', (q) =>
        q.eq('studentId', identity.subject).eq('lessonId', lessonId)
      )
      .unique()

    if (!progress?.completed) throw new Error('Conclua a aula antes de fazer o quiz')

    // Quiz já respondido: retorna nota existente
    if (progress.quizScore !== undefined) {
      return { score: progress.quizScore, passed: progress.quizPassed ?? false, alreadySubmitted: true }
    }

    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .first()

    if (!quiz) throw new Error('Quiz não encontrado')

    let correct = 0
    for (const answer of answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId)
      if (question && question.correctOptionId === answer.optionId) correct++
    }

    const score = quiz.questions.length > 0 ? Math.round((correct / quiz.questions.length) * 100) : 100
    const passed = score >= 70

    await ctx.db.patch(progress._id, { quizScore: score, quizPassed: passed })

    // Verificar emissão de certificado
    await checkAndIssueCertificate(ctx, identity.subject, courseId, enrollment._id)

    return { score, passed, alreadySubmitted: false }
  },
})

// ─── checkAndIssueCertificate ─────────────────────────────────────────────────
// Emite certificado se todas as aulas foram concluídas e média >= 70%.

async function checkAndIssueCertificate(
  ctx: MutationCtx,
  studentId: string,
  courseId: Id<'courses'>,
  enrollmentId: Id<'enrollments'>
) {
  const allLessons = await ctx.db
    .query('lessons')
    .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
    .collect()
  const published = allLessons.filter((l) => l.isPublished)

  const progressRecords = await ctx.db
    .query('progress')
    .withIndex('by_student_course', (q) =>
      q.eq('studentId', studentId).eq('courseId', courseId)
    )
    .collect()

  const allCompleted = published.every((lesson) =>
    progressRecords.some((p) => p.lessonId === lesson._id && p.completed)
  )

  if (!allCompleted) return

  const lessonsWithQuiz = published.filter((l) => l.hasMandatoryQuiz)

  if (lessonsWithQuiz.length > 0) {
    const quizScores = progressRecords
      .filter((p) => p.quizScore !== undefined)
      .map((p) => p.quizScore as number)

    if (quizScores.length < lessonsWithQuiz.length) return

    const avg = Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    if (avg < 70) return

    await ctx.db.patch(enrollmentId, {
      certificateIssued: true,
      completedAt: Date.now(),
      finalScore: avg,
    })
  } else {
    await ctx.db.patch(enrollmentId, {
      certificateIssued: true,
      completedAt: Date.now(),
    })
  }
}

// ─── rateCourse ───────────────────────────────────────────────────────────────
// Aluno avalia o curso com 1-5 estrelas. Só permite quem está matriculado.

export const rateCourse = mutation({
  args: {
    courseId: v.id('courses'),
    stars: v.number(),
  },
  handler: async (ctx, { courseId, stars }) => {
    const identity = await requireIdentity(ctx)

    if (stars < 1 || stars > 5) throw new Error('Avaliação deve ser entre 1 e 5 estrelas')

    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .unique()

    if (!enrollment) throw new Error('Você precisa estar matriculado para avaliar este curso')

    const existing = await ctx.db
      .query('courseRatings')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { stars, updatedAt: Date.now() })
    } else {
      await ctx.db.insert('courseRatings', {
        studentId: identity.subject,
        courseId,
        stars,
        createdAt: Date.now(),
      })
    }

    return { stars }
  },
})

// ─── getCourseRating ──────────────────────────────────────────────────────────
// Retorna a avaliação do aluno para um curso específico.

export const getCourseRating = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const identity = await requireIdentity(ctx)

    const rating = await ctx.db
      .query('courseRatings')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId)
      )
      .unique()

    return rating ?? null
  },
})
