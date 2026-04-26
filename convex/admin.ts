import { v } from 'convex/values'
import { internalMutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireAdmin } from './lib/auth'

// Verifica se o usuário atual é admin da plataforma. Usado pelo front para
// decidir se exibe a aba Admin. Retorna false (sem lançar) para usuários
// comuns, para não poluir logs de erro.
export const amIAdmin = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requireAdmin(ctx)
      return true
    } catch {
      return false
    }
  },
})

// Métricas globais da plataforma. Visíveis apenas para admin. Propositalmente
// usa collect() em tabelas inteiras, aceitável nesta escala inicial. Se o
// volume crescer, migrar para contadores denormalizados em tabela separada.
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const users = await ctx.db.query('users').collect()
    const courses = await ctx.db.query('courses').collect()
    const enrollments = await ctx.db.query('enrollments').collect()
    const donations = await ctx.db.query('donations').collect()
    const userFunctions = await ctx.db.query('userFunctions').collect()
    const posts = await ctx.db.query('posts').collect()

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const newUsers30d = users.filter((u) => u._creationTime >= thirtyDaysAgo).length
    const newEnrollments30d = enrollments.filter((e) => e._creationTime >= thirtyDaysAgo).length

    const publishedCourses = courses.filter((c) => c.isPublished).length
    const certificatesIssued = enrollments.filter((e) => e.certificateIssued).length

    const publishedPosts = posts.filter((p) => p.status === 'published').length
    const draftPosts = posts.filter((p) => p.status === 'draft').length
    const newPosts30d = posts.filter(
      (p) => p.status === 'published' && (p.publishedAt ?? 0) >= thirtyDaysAgo,
    ).length

    const completedDonations = donations.filter((d) => d.status === 'completed')
    const totalDonationCents = completedDonations.reduce((acc, d) => acc + d.amountCents, 0)
    const donationCount = completedDonations.length

    const countsByFunction = userFunctions.reduce<Record<string, number>>((acc, f) => {
      acc[f.function] = (acc[f.function] ?? 0) + 1
      return acc
    }, {})

    return {
      totalUsers: users.length,
      newUsers30d,
      totalProfessors: countsByFunction['criador'] ?? 0,
      totalStudents: countsByFunction['aluno'] ?? 0,
      totalInstitutions: countsByFunction['instituicao'] ?? 0,
      totalCourses: courses.length,
      publishedCourses,
      totalEnrollments: enrollments.length,
      newEnrollments30d,
      certificatesIssued,
      totalDonationCents,
      donationCount,
      totalPosts: posts.length,
      publishedPosts,
      draftPosts,
      newPosts30d,
    }
  },
})

// Lista os usuários mais recentes (últimos 50). Útil para o admin acompanhar
// novos cadastros e bloquear contas suspeitas quando necessário.
export const listRecentUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const users = await ctx.db.query('users').order('desc').take(50)
    return users.map((u) => ({
      _id: u._id,
      clerkId: u.clerkId,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      handle: u.handle,
      createdAt: u._creationTime,
    }))
  },
})

// Lista os cursos mais recentes (últimos 30) com nome do professor dono.
export const listRecentCourses = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const courses = await ctx.db.query('courses').order('desc').take(30)
    return await Promise.all(
      courses.map(async (c) => {
        const creator = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', c.creatorId))
          .unique()
        return {
          _id: c._id,
          title: c.title,
          slug: c.slug,
          isPublished: c.isPublished,
          totalLessons: c.totalLessons,
          totalStudents: c.totalStudents,
          createdAt: c._creationTime,
          creatorName: creator?.name ?? 'Professor',
          creatorHandle: creator?.handle,
        }
      })
    )
  },
})

// Apaga em cascata todos os dados associados a um clerkId. Usado pelo dono da
// plataforma para remover contas de teste ou banidas. Internal: nao expor ao
// cliente. Rodar via `npx convex run admin:deleteUserCascade '{"clerkId":"..."}'`.
export const deleteUserCascade = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const log: Record<string, number> = {}

    // 1. Cursos do criador (cascata em modules, lessons, quizzes, materials,
    // enrollments, progress, courseQuestions, courseComments, courseRatings)
    const ownedCourses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', clerkId))
      .collect()

    for (const course of ownedCourses) {
      const courseId = course._id as Id<'courses'>

      const lessons = await ctx.db.query('lessons').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const lesson of lessons) {
        const lessonId = lesson._id as Id<'lessons'>
        const materials = await ctx.db.query('lessonMaterials').withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId)).collect()
        for (const m of materials) await ctx.db.delete(m._id)
        log.lessonMaterials = (log.lessonMaterials ?? 0) + materials.length

        const quizzesByLesson = await ctx.db.query('quizzes').withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId)).collect()
        for (const q of quizzesByLesson) await ctx.db.delete(q._id)
        log.quizzes = (log.quizzes ?? 0) + quizzesByLesson.length

        const lessonComments = await ctx.db.query('lessonComments').withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId)).collect()
        for (const c of lessonComments) await ctx.db.delete(c._id)
        log.lessonComments = (log.lessonComments ?? 0) + lessonComments.length

        const timestamps = await ctx.db.query('lessonTimestamps').withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId)).collect()
        for (const t of timestamps) await ctx.db.delete(t._id)
        log.lessonTimestamps = (log.lessonTimestamps ?? 0) + timestamps.length

        await ctx.db.delete(lessonId)
      }
      log.lessons = (log.lessons ?? 0) + lessons.length

      const modules = await ctx.db.query('modules').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const m of modules) await ctx.db.delete(m._id)
      log.modules = (log.modules ?? 0) + modules.length

      const enrollments = await ctx.db.query('enrollments').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const e of enrollments) await ctx.db.delete(e._id)
      log.enrollments = (log.enrollments ?? 0) + enrollments.length

      const courseQuestions = await ctx.db.query('courseQuestions').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const cq of courseQuestions) await ctx.db.delete(cq._id)
      log.courseQuestions = (log.courseQuestions ?? 0) + courseQuestions.length

      const courseComments = await ctx.db.query('courseComments').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const cc of courseComments) await ctx.db.delete(cc._id)
      log.courseComments = (log.courseComments ?? 0) + courseComments.length

      const courseRatings = await ctx.db.query('courseRatings').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const cr of courseRatings) await ctx.db.delete(cr._id)
      log.courseRatings = (log.courseRatings ?? 0) + courseRatings.length

      await ctx.db.delete(courseId)
    }
    log.courses = ownedCourses.length

    // 2. Instituicoes onde o usuario e dono (cascata em members + invites)
    const ownedInstitutions = await ctx.db
      .query('institutions')
      .withIndex('by_createdByUserId', (q) => q.eq('createdByUserId', clerkId))
      .collect()

    for (const inst of ownedInstitutions) {
      const instId = inst._id
      const members = await ctx.db.query('institutionMembers').withIndex('by_institutionId', (q) => q.eq('institutionId', instId)).collect()
      for (const m of members) await ctx.db.delete(m._id)
      log.institutionMembers = (log.institutionMembers ?? 0) + members.length

      const invites = await ctx.db.query('institutionInvites').withIndex('by_institutionId', (q) => q.eq('institutionId', instId)).collect()
      for (const i of invites) await ctx.db.delete(i._id)
      log.institutionInvites = (log.institutionInvites ?? 0) + invites.length

      await ctx.db.delete(instId)
    }
    log.institutions = ownedInstitutions.length

    // 3. Membros em outras instituicoes
    const memberships = await ctx.db.query('institutionMembers').withIndex('by_userId', (q) => q.eq('userId', clerkId)).collect()
    for (const m of memberships) await ctx.db.delete(m._id)
    log.institutionMembershipsAsMember = memberships.length

    // 4. Dados do aluno
    const enrollmentsAsStudent = await ctx.db.query('enrollments').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const e of enrollmentsAsStudent) await ctx.db.delete(e._id)
    log.enrollmentsAsStudent = enrollmentsAsStudent.length

    const progress = await ctx.db.query('progress').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const p of progress) await ctx.db.delete(p._id)
    log.progress = progress.length

    const notebooks = await ctx.db.query('notebooks').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const nb of notebooks) {
      const entries = await ctx.db.query('notebookEntries').withIndex('by_notebook', (q) => q.eq('notebookId', nb._id)).collect()
      for (const en of entries) await ctx.db.delete(en._id)
      log.notebookEntries = (log.notebookEntries ?? 0) + entries.length
      await ctx.db.delete(nb._id)
    }
    log.notebooks = notebooks.length

    const flashcardDecks = await ctx.db.query('flashcardDecks').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const deck of flashcardDecks) {
      const cards = await ctx.db.query('flashcards').withIndex('by_deckId', (q) => q.eq('deckId', deck._id)).collect()
      for (const c of cards) await ctx.db.delete(c._id)
      log.flashcards = (log.flashcards ?? 0) + cards.length
      await ctx.db.delete(deck._id)
    }
    log.flashcardDecks = flashcardDecks.length

    const studentTimestamps = await ctx.db.query('lessonTimestamps').withIndex('by_student_lesson', (q) => q.eq('studentId', clerkId)).collect()
    for (const t of studentTimestamps) await ctx.db.delete(t._id)
    log.lessonTimestampsAsStudent = studentTimestamps.length

    const stats = await ctx.db.query('studentStats').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const s of stats) await ctx.db.delete(s._id)
    log.studentStats = stats.length

    // 5. Comentarios e avaliacoes onde o usuario e autor
    const lessonCommentsByAuthor = await ctx.db.query('lessonComments').withIndex('by_authorId', (q) => q.eq('authorId', clerkId)).collect()
    for (const c of lessonCommentsByAuthor) await ctx.db.delete(c._id)
    log.lessonCommentsByAuthor = lessonCommentsByAuthor.length

    const courseCommentsByAuthor = await ctx.db.query('courseComments').withIndex('by_authorId', (q) => q.eq('authorId', clerkId)).collect()
    for (const c of courseCommentsByAuthor) await ctx.db.delete(c._id)
    log.courseCommentsByAuthor = courseCommentsByAuthor.length

    // 6. Outros
    const userFns = await ctx.db.query('userFunctions').withIndex('by_userId', (q) => q.eq('userId', clerkId)).collect()
    for (const f of userFns) await ctx.db.delete(f._id)
    log.userFunctions = userFns.length

    const consents = await ctx.db.query('consents').withIndex('by_userId', (q) => q.eq('userId', clerkId)).collect()
    for (const c of consents) await ctx.db.delete(c._id)
    log.consents = consents.length

    const creatorProfile = await ctx.db.query('creatorProfiles').withIndex('by_userId', (q) => q.eq('userId', clerkId)).collect()
    for (const cp of creatorProfile) await ctx.db.delete(cp._id)
    log.creatorProfiles = creatorProfile.length

    const notifications = await ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', clerkId)).collect()
    for (const n of notifications) await ctx.db.delete(n._id)
    log.notifications = notifications.length

    // 7. Users (registro principal)
    const userDoc = await ctx.db.query('users').withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId)).unique()
    if (userDoc) {
      await ctx.db.delete(userDoc._id)
      log.users = 1
    } else {
      log.users = 0
    }

    return { clerkId, deleted: log }
  },
})
