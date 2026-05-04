import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import { internal } from './_generated/api'
import { checkRateLimit } from './lib/rateLimit'
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

    // Multi-tenant: cursos com visibility='institution' exigem que o aluno
    // permaneça como membro ativo da instituição. Matrícula antiga + remoção
    // posterior do membro não pode dar acesso continuado.
    if (course.visibility === 'institution' && course.institutionId) {
      const member = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', course.institutionId!).eq('userId', identity.subject)
        )
        .unique()
      if (!member || member.status !== 'ativo') return null
    }

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

    // Média só considera quizzes com nota atual válida. Aulas com
    // quizRetryPending (aluno pediu retry e ainda não reassistiu) ficam de fora
    // para não inflar ou rebaixar a nota enquanto a tentativa está aberta.
    const quizScores = progressRecords
      .filter((p) => p.quizScore !== undefined && !p.quizRetryPending)
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

    // Aula agendada mais próxima: aulas que ainda não foram publicadas mas têm
    // publishAt definido. Mostra "próxima aula em DD/MM" ao aluno quando o
    // curso é incremental (releaseStatus='in_progress'). Pega a com publishAt
    // mais cedo entre as não publicadas.
    const scheduled = allLessons
      .filter((l) => !l.isPublished && typeof l.publishAt === 'number')
      .sort((a, b) => (a.publishAt as number) - (b.publishAt as number))
    const nextScheduledLesson = scheduled[0]
      ? { title: scheduled[0].title, publishAt: scheduled[0].publishAt as number }
      : null

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
      nextScheduledLesson,
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

    if (course.visibility === 'institution' && course.institutionId) {
      const member = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', course.institutionId!).eq('userId', identity.subject)
        )
        .unique()
      if (!member || member.status !== 'ativo') return null
    }

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

    // Quiz: só retorna gabarito se a aula foi concluída e não está pendente de
    // retry. Se o aluno pediu retry e ainda não reassistiu (quizRetryPending),
    // o quiz volta a ficar bloqueado como se fosse a primeira vez.
    const quizUnlocked = Boolean(progress?.completed) && !progress?.quizRetryPending
    let quiz = null
    if (lesson.hasMandatoryQuiz) {
      const rawQuiz = await ctx.db
        .query('quizzes')
        .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
        .first()

      if (rawQuiz) {
        if (quizUnlocked) {
          quiz = rawQuiz
        } else {
          // Esconde gabarito até concluir a aula (ou reconcluir, em caso de retry)
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

    const scheduled = allLessons
      .filter((l) => !l.isPublished && typeof l.publishAt === 'number')
      .sort((a, b) => (a.publishAt as number) - (b.publishAt as number))
    const nextScheduledLesson = scheduled[0]
      ? { title: scheduled[0].title, publishAt: scheduled[0].publishAt as number }
      : null

    return {
      lesson,
      course,
      module: mod,
      progress: progress ?? null,
      quiz,
      prevLesson,
      nextLesson,
      nextScheduledLesson,
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
// Marca como concluída automaticamente quando >=95% assistido. Se existir uma
// tentativa de retry de quiz pendente, também limpa o flag ao reatingir 95%.

const COMPLETION_RATIO = 0.95

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
    const reachedThreshold = ratio >= COMPLETION_RATIO
    const completed = alreadyCompleted || reachedThreshold

    const justCompleted = completed && !alreadyCompleted

    if (existing) {
      // Em modo retry, existing.watchedSeconds foi zerado em requestQuizRetry,
      // então o max() preserva o avanço desta nova tentativa sem recuperar o
      // valor antigo.
      const newWatched = Math.max(watchedSeconds, existing.watchedSeconds)
      const clearRetry = existing.quizRetryPending && reachedThreshold

      await ctx.db.patch(existing._id, {
        watchedSeconds: newWatched,
        totalSeconds,
        completed,
        ...(justCompleted ? { completedAt: Date.now() } : {}),
        ...(clearRetry ? { quizRetryPending: undefined } : {}),
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

    // Se o aluno acabou de concluir esta aula, reavalia certificado. Cobre
    // cursos sem quiz obrigatório, que antes nunca passavam pela avaliação
    // (submitQuiz nunca era chamado).
    if (justCompleted) {
      await ctx.runMutation(internal.gamification.recordLessonComplete, {
        studentId: identity.subject,
      })
      await checkAndIssueCertificate(ctx, identity.subject, courseId, enrollment._id)
    }

    return completed
  },
})

// ─── requestQuizRetry ─────────────────────────────────────────────────────────
// Aluno solicita refazer o quiz. Requer que o criador tenha autorizado retry
// (allowQuizRetry=true). Zera watchedSeconds e nota, mantém completed=true
// (histórico de já ter concluído a aula uma vez), marca quizRetryPending=true.
// O aluno precisa reassistir até 95% para destravar o quiz novamente.

export const requestQuizRetry = mutation({
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
    if (!enrollment) throw new Error('Não matriculado')

    const lesson = await ctx.db.get(lessonId)
    if (!lesson || lesson.courseId !== courseId) throw new Error('Aula inválida')
    if (!lesson.hasMandatoryQuiz) throw new Error('Aula não tem quiz')
    if (!lesson.allowQuizRetry) throw new Error('Criador não autorizou refazer este quiz')

    const progress = await ctx.db
      .query('progress')
      .withIndex('by_student_lesson', (q) =>
        q.eq('studentId', identity.subject).eq('lessonId', lessonId)
      )
      .unique()
    if (!progress) throw new Error('Conclua a aula antes de refazer o quiz')
    if (progress.quizScore === undefined) throw new Error('Responda o quiz antes de tentar refazer')
    if (progress.quizRetryPending) throw new Error('Já existe um retry em andamento')

    const now = Date.now()
    await ctx.db.patch(progress._id, {
      watchedSeconds: 0,
      quizScore: undefined,
      quizPassed: undefined,
      quizRetryPending: true,
      watchResetAt: now,
    })

    // Se o aluno já estava certificado, revoga o certificado enquanto a
    // tentativa está aberta. O certificado será reemitido quando o aluno
    // reassistir, refizer o quiz e passar novamente na média mínima.
    if (enrollment.certificateIssued) {
      await ctx.db.patch(enrollment._id, {
        certificateIssued: false,
        completedAt: undefined,
        finalScore: undefined,
      })
    }
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

    // Se há um retry em andamento, o aluno precisa reassistir a aula até 95%
    // (o que limpa quizRetryPending automaticamente em updateProgress) antes
    // de poder submeter de novo.
    if (progress.quizRetryPending) {
      throw new Error('Reassista a aula até o fim antes de refazer o quiz')
    }

    // Quiz já respondido e sem retry pendente: retorna nota existente. O
    // aluno precisa solicitar um retry explícito para poder submeter de novo.
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
    const course = await ctx.db.get(courseId)
    const passingScore = Math.max(70, course?.passingScore ?? 70)
    const passed = score >= passingScore

    await ctx.db.patch(progress._id, {
      quizScore: score,
      quizPassed: passed,
      quizAttempts: (progress.quizAttempts ?? 0) + 1,
    })

    // Verificar emissão de certificado
    await checkAndIssueCertificate(ctx, identity.subject, courseId, enrollment._id)

    return { score, passed, alreadySubmitted: false }
  },
})

// ─── checkAndIssueCertificate ─────────────────────────────────────────────────
// Emite certificado se todas as aulas foram concluídas e média >= passingScore
// do curso (default 70, nunca menor).

export async function checkAndIssueCertificate(
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

  const enrollment = await ctx.db.get(enrollmentId)
  const wasIssued = enrollment?.certificateIssued ?? false

  const course = await ctx.db.get(courseId)

  // Cursos em produção (lançamento incremental) não emitem certificado mesmo
  // que o aluno tenha concluído todas as aulas já publicadas. O certificado
  // sai automaticamente quando o criador marcar o curso como 'complete'.
  if (course?.releaseStatus === 'in_progress') return

  const passingScore = Math.max(70, course?.passingScore ?? 70)

  const lessonsWithQuiz = published.filter((l) => l.hasMandatoryQuiz)

  if (lessonsWithQuiz.length > 0) {
    // Para emitir certificado: cada aula com quiz obrigatório precisa ter
    // progress com quizScore definido e sem retry pendente. Se houver qualquer
    // pendência, adia a emissão até o aluno concluir o retry.
    const quizProgressByLesson = new Map(
      progressRecords
        .filter((p) => p.quizScore !== undefined && !p.quizRetryPending)
        .map((p) => [p.lessonId as Id<'lessons'>, p.quizScore as number])
    )

    const scoresForCert: number[] = []
    for (const lesson of lessonsWithQuiz) {
      const score = quizProgressByLesson.get(lesson._id)
      if (score === undefined) return
      scoresForCert.push(score)
    }

    const avg = Math.round(scoresForCert.reduce((a, b) => a + b, 0) / scoresForCert.length)
    if (avg < passingScore) return

    await ctx.db.patch(enrollmentId, {
      certificateIssued: true,
      completedAt: Date.now(),
      finalScore: avg,
    })
    if (!wasIssued) {
      await ctx.runMutation(internal.gamification.recordCourseComplete, { studentId })
      await flipReferralOnFirstCompletion(ctx, studentId)
    }
    await notifyCertificateIssued(ctx, studentId, courseId)
  } else {
    await ctx.db.patch(enrollmentId, {
      certificateIssued: true,
      completedAt: Date.now(),
    })
    if (!wasIssued) {
      await ctx.runMutation(internal.gamification.recordCourseComplete, { studentId })
      await flipReferralOnFirstCompletion(ctx, studentId)
    }
    await notifyCertificateIssued(ctx, studentId, courseId)
  }
}

// Marca a indicacao do aluno como 'completed' quando ele conclui o primeiro
// curso. Idempotente: so atualiza se a linha estiver em status 'registered'.
async function flipReferralOnFirstCompletion(ctx: MutationCtx, studentId: string) {
  const referral = await ctx.db
    .query('referrals')
    .withIndex('by_referredUserId', (q) => q.eq('referredUserId', studentId))
    .first()
  if (!referral || referral.status !== 'registered') return
  await ctx.db.patch(referral._id, {
    status: 'completed',
    completedAt: Date.now(),
  })
}

async function notifyCertificateIssued(
  ctx: MutationCtx,
  studentId: string,
  courseId: Id<'courses'>,
) {
  const course = await ctx.db.get(courseId)
  if (!course) return

  await ctx.runMutation(internal.notifications.pushInternal, {
    userId: studentId,
    kind: 'certificate_issued',
    title: 'Certificado emitido',
    body: `Parabéns por concluir "${course.title}". Seu certificado já está disponível.`,
    link: '/dashboard/certificados',
  })

  // Envia email (ação assíncrona; se RESEND_API_KEY não estiver setado a action
  // só loga e retorna skipped=true, sem lançar).
  const student = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', studentId))
    .unique()
  if (student?.email) {
    await ctx.scheduler.runAfter(0, internal.email.sendCertificateIssued, {
      to: student.email,
      name: student.name || 'aluno',
      courseTitle: course.title,
    })
  }
}

// ─── rateCourse ───────────────────────────────────────────────────────────────
// Aluno avalia o curso com 1-5 estrelas. Só permite quem está matriculado.

export const rateCourse = mutation({
  args: {
    courseId: v.id('courses'),
    stars: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, { courseId, stars, review }) => {
    const identity = await requireIdentity(ctx)
    await checkRateLimit(ctx, identity.subject, 'course.rate', { max: 5, windowMs: 60_000 })

    if (stars < 1 || stars > 5) throw new Error('Avaliação deve ser entre 1 e 5 estrelas')

    const cleanReview = review?.trim().slice(0, 600) || undefined

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
      await ctx.db.patch(existing._id, { stars, review: cleanReview, updatedAt: Date.now() })
    } else {
      await ctx.db.insert('courseRatings', {
        studentId: identity.subject,
        courseId,
        stars,
        review: cleanReview,
        createdAt: Date.now(),
      })
    }

    // Recalcula avg/contagem denormalizados no curso. Usado pelo catálogo
    // para evitar N+1 sobre courseRatings em cada listagem.
    const all = await ctx.db
      .query('courseRatings')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .collect()
    const count = all.length
    const avg =
      count > 0
        ? Math.round((all.reduce((sum, r) => sum + r.stars, 0) / count) * 10) / 10
        : 0
    await ctx.db.patch(courseId, { avgRating: avg, ratingsCount: count })

    return { stars }
  },
})

// ─── getMyCourseRating ────────────────────────────────────────────────────────
// Retorna a avaliacao deste aluno para o curso (estrelas + comentario), ou
// null se ainda nao avaliou. Usado pelo modal pos-conclusao para prefiller.

export const getMyCourseRating = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const rating = await ctx.db
      .query('courseRatings')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', identity.subject).eq('courseId', courseId),
      )
      .unique()

    if (!rating) return null
    return { stars: rating.stars, review: rating.review ?? null }
  },
})

// ─── getStudentDashboard ──────────────────────────────────────────────────────
// Retorna resumo da tela inicial do aluno: cursos em andamento com progresso,
// próxima aula sugerida, certificados conquistados e total de tempo estudado.
// Usado pelo DashboardIndexPage para substituir o placeholder "área em ativação".

export const getStudentDashboard = query({
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

    const totalWatchSeconds = progressRecords.reduce((s, p) => s + (p.watchedSeconds ?? 0), 0)

    // Para cada matrícula, calcula progresso. Para cursos JÁ concluídos,
    // pulamos lessons/modules (não precisamos da próxima aula). Isso recorta
    // o trabalho pela metade quando o aluno tem muitos cursos concluídos.
    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseProgress = progressRecords.filter((p) => p.courseId === enrollment.courseId)
        const completedLessons = courseProgress.filter((p) => p.completed).length
        const mostRecent = courseProgress.reduce(
          (acc, p) => Math.max(acc, p._creationTime ?? 0),
          0,
        )

        if (enrollment.certificateIssued) {
          const course = await ctx.db.get(enrollment.courseId)
          if (!course) return null
          const totalLessons = course.totalLessons || 1
          return {
            courseId: enrollment.courseId,
            courseTitle: course.title,
            courseThumbnail: course.thumbnail,
            completedLessons,
            totalLessons,
            percentage: 100,
            certificateIssued: true,
            completedAt: enrollment.completedAt,
            nextLessonId: undefined as Id<'lessons'> | undefined,
            nextLessonTitle: undefined as string | undefined,
            lastActivityAt: mostRecent,
          }
        }

        const [course, lessons, modules] = await Promise.all([
          ctx.db.get(enrollment.courseId),
          ctx.db
            .query('lessons')
            .withIndex('by_courseId', (q) => q.eq('courseId', enrollment.courseId))
            .collect(),
          ctx.db
            .query('modules')
            .withIndex('by_courseId', (q) => q.eq('courseId', enrollment.courseId))
            .collect(),
        ])
        if (!course) return null

        const totalLessons = course.totalLessons || 1
        const percentage = Math.round((completedLessons / totalLessons) * 100)

        const moduleOrder = new Map(modules.map((m) => [String(m._id), m.order]))

        const ordered = [...lessons].sort((a, b) => {
          const ma = moduleOrder.get(String(a.moduleId)) ?? 9999
          const mb = moduleOrder.get(String(b.moduleId)) ?? 9999
          if (ma !== mb) return ma - mb
          return (a.order ?? 0) - (b.order ?? 0)
        })

        const progressByLesson = new Map(courseProgress.map((p) => [String(p.lessonId), p]))
        const nextLesson = ordered.find((l) => {
          const p = progressByLesson.get(String(l._id))
          return !p || !p.completed
        })

        return {
          courseId: enrollment.courseId,
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          completedLessons,
          totalLessons,
          percentage,
          certificateIssued: false,
          completedAt: enrollment.completedAt,
          nextLessonId: nextLesson?._id,
          nextLessonTitle: nextLesson?.title,
          lastActivityAt: mostRecent,
        }
      }),
    )

    const valid = courses.filter(
      (c): c is NonNullable<typeof c> => c !== null,
    )

    // "Continue de onde parou": curso mais recentemente interagido que ainda
    // não foi concluído.
    const inProgress = valid
      .filter((c) => !c.certificateIssued && c.nextLessonId)
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt)

    return {
      totalCoursesEnrolled: valid.length,
      totalCoursesCompleted: valid.filter((c) => c.certificateIssued).length,
      totalWatchSeconds,
      continueCourse: inProgress[0] ?? null,
      inProgress: inProgress.slice(0, 6),
      completed: valid.filter((c) => c.certificateIssued).slice(0, 6),
    }
  },
})

// ─── getRecommendations ──────────────────────────────────────────────────────
// Sugestões personalizadas para o aluno: cursos públicos publicados que ele
// AINDA não está matriculado, ranqueados pela proximidade com o que ele já
// estuda (categoria + tags). Fallback: cursos com mais alunos. Usado na home
// do aluno para reduzir a barreira de "e agora, o que estudar?".

export const getRecommendations = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const cap = Math.min(Math.max(limit ?? 4, 1), 12)

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()
    const enrolledCourseIds = new Set(enrollments.map((e) => String(e.courseId)))

    // Constrói perfil do aluno a partir dos cursos em que ele está matriculado.
    const enrolledCourses = await Promise.all(
      enrollments.map((e) => ctx.db.get(e.courseId)),
    )
    const categoryWeights = new Map<string, number>()
    const tagWeights = new Map<string, number>()
    for (const c of enrolledCourses) {
      if (!c) continue
      categoryWeights.set(c.category, (categoryWeights.get(c.category) ?? 0) + 1)
      for (const tag of c.tags ?? []) {
        tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + 1)
      }
    }

    // Pool de candidatos: cursos públicos publicados (catálogo geral). Limita
    // a varredura para não explodir em bases grandes; o ranking abaixo é o que
    // de fato seleciona os melhores.
    const candidates = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .take(200)

    type Scored = {
      course: (typeof candidates)[number]
      score: number
    }
    const scored: Scored[] = []
    for (const course of candidates) {
      if (enrolledCourseIds.has(String(course._id))) continue
      if (course.visibility === 'institution') continue

      let score = 0
      const catWeight = categoryWeights.get(course.category) ?? 0
      score += catWeight * 5
      for (const tag of course.tags ?? []) {
        score += (tagWeights.get(tag) ?? 0) * 2
      }
      // Sinal de popularidade leve: log(students + 1) garante que cursos com
      // muitos alunos não dominem a recomendação.
      score += Math.log10((course.totalStudents ?? 0) + 1)
      // Penaliza cursos sem nenhuma aula publicada.
      if ((course.totalLessons ?? 0) === 0) score -= 10

      scored.push({ course, score })
    }

    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, cap).map(({ course }) => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      slug: course.slug,
      totalLessons: course.totalLessons,
      totalStudents: course.totalStudents,
      tags: course.tags ?? [],
    }))
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
