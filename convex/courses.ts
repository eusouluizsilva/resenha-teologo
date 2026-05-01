import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { ensureIdentityMatches, requireUserFunction } from './lib/auth'
import { autoEnrollAllUsersInCourse } from './lib/autoEnroll'
import { toSlug } from './lib/slug'
import { checkAndIssueCertificate } from './student'

export const listByCreator = query({
  args: { creatorId: v.string() },
  handler: async (ctx, { creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    return await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) return null
    return course
  },
})

export const create = mutation({
  args: {
    creatorId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    level: v.union(v.literal('iniciante'), v.literal('intermediario'), v.literal('avancado')),
    thumbnail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    institutionId: v.optional(v.id('institutions')),
    visibility: v.optional(v.union(v.literal('public'), v.literal('institution'))),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, args.creatorId)

    if (args.institutionId) {
      const membership = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', args.institutionId!).eq('userId', identity.subject)
        )
        .unique()
      if (!membership || !['dono', 'admin'].includes(membership.role) || membership.status === 'removido') {
        throw new Error('Você não administra esta instituição.')
      }
    }

    return await ctx.db.insert('courses', {
      ...args,
      creatorId: identity.subject,
      isPublished: false,
      totalLessons: 0,
      totalStudents: 0,
      totalModules: 0,
      slug: toSlug(args.title),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('courses'),
    creatorId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    level: v.optional(v.union(v.literal('iniciante'), v.literal('intermediario'), v.literal('avancado'))),
    thumbnail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublished: v.optional(v.boolean()),
    language: v.optional(v.string()),
    passingScore: v.optional(v.number()),
    hasLiveStream: v.optional(v.boolean()),
    liveStreamUrl: v.optional(v.string()),
    institutionId: v.optional(v.union(v.id('institutions'), v.null())),
    visibility: v.optional(v.union(v.literal('public'), v.literal('institution'))),
    expectedTotalLessons: v.optional(v.number()),
    nextLessonScheduleText: v.optional(v.string()),
    faq: v.optional(
      v.array(v.object({ question: v.string(), answer: v.string() })),
    ),
  },
  handler: async (ctx, { id, creatorId, ...fields }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    if (fields.nextLessonScheduleText !== undefined && fields.nextLessonScheduleText.length > 200) {
      throw new Error('Texto do cronograma não pode passar de 200 caracteres.')
    }

    if (fields.faq !== undefined) {
      if (fields.faq.length > 12) {
        throw new Error('Máximo de 12 perguntas no FAQ.')
      }
      for (const entry of fields.faq) {
        if (!entry.question.trim() || !entry.answer.trim()) {
          throw new Error('Pergunta e resposta não podem ficar vazias.')
        }
        if (entry.question.length > 200) {
          throw new Error('Cada pergunta deve ter no máximo 200 caracteres.')
        }
        if (entry.answer.length > 800) {
          throw new Error('Cada resposta deve ter no máximo 800 caracteres.')
        }
      }
    }

    if (fields.passingScore !== undefined) {
      if (fields.passingScore < 70 || fields.passingScore > 100) {
        throw new Error('A nota mínima deve estar entre 70 e 100.')
      }
    }

    // Para vincular curso a instituição, o professor precisa ser dono ou admin
    // dela. Enviar null remove o vínculo.
    if (fields.institutionId !== undefined && fields.institutionId !== null) {
      const membership = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', fields.institutionId as NonNullable<typeof fields.institutionId>).eq('userId', identity.subject)
        )
        .unique()
      if (!membership || !['dono', 'admin'].includes(membership.role) || membership.status === 'removido') {
        throw new Error('Você não administra esta instituição.')
      }
    }

    const updates: Record<string, unknown> = { ...fields }
    if (fields.title) updates.slug = toSlug(fields.title)
    // institutionId: null explícito remove vínculo.
    if (fields.institutionId === null) {
      updates.institutionId = undefined
      updates.visibility = 'public'
    }
    await ctx.db.patch(id, updates)

    // Auto-enroll: se o curso acabou de ser publicado pelo admin, matricula
    // todos os usuarios existentes. autoEnrollAllUsersInCourse e idempotente
    // e ignora cursos institucionais ou nao publicados, entao chamada e segura
    // mesmo que o status nao tenha mudado.
    const becamePublished = fields.isPublished === true && course.isPublished === false
    if (becamePublished) {
      await autoEnrollAllUsersInCourse(ctx, id)
    }
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const course = await ctx.db
      .query('courses')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    return course ?? null
  },
})

// Backfill de slugs em cursos antigos. Era mutation pública sem auth (mesma
// natureza do bug em lessons.generateLessonSlugs corrigido em #36). Convertido
// pra internalMutation: só roda via Convex Dashboard ou ctx.runMutation.
export const generateSlugs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query('courses').collect()
    for (const course of courses) {
      if (!course.slug) {
        await ctx.db.patch(course._id, { slug: toSlug(course.title) })
      }
    }
  },
})

// Publica o curso e todas as suas aulas de uma vez (evita o passo manual de publicar cada aula)
export const publishWithLessons = mutation({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    const wasPublished = course.isPublished

    // Publica o curso
    await ctx.db.patch(id, { isPublished: true })

    // Publica todas as aulas ainda em rascunho
    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()

    for (const lesson of lessons) {
      if (!lesson.isPublished) {
        await ctx.db.patch(lesson._id, { isPublished: true })
      }
    }

    if (!wasPublished) {
      await autoEnrollAllUsersInCourse(ctx, id)
    }

    if (course.slug) {
      const SITE = 'https://resenhadoteologo.com'
      const urls = [`${SITE}/cursos/${course.slug}`]
      for (const lesson of lessons) {
        if (lesson.slug) urls.push(`${SITE}/cursos/${course.slug}/${lesson.slug}`)
      }
      await ctx.scheduler.runAfter(0, internal.indexnow.submitUrls, { urls })
    }
  },
})

// Marca o curso como em produção (lançamento incremental). Bloqueia a emissão
// de certificados mesmo que o aluno conclua todas as aulas já publicadas. Útil
// para criadores que publicam aulas aos poucos (ex. duas por semana).
export const markInProgress = mutation({
  args: {
    id: v.id('courses'),
    creatorId: v.string(),
    expectedTotalLessons: v.optional(v.number()),
    nextLessonScheduleText: v.optional(v.string()),
  },
  handler: async (ctx, { id, creatorId, expectedTotalLessons, nextLessonScheduleText }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    if (expectedTotalLessons !== undefined && expectedTotalLessons < 1) {
      throw new Error('Total previsto de aulas precisa ser pelo menos 1.')
    }
    if (nextLessonScheduleText !== undefined && nextLessonScheduleText.length > 200) {
      throw new Error('Texto do cronograma não pode passar de 200 caracteres.')
    }

    await ctx.db.patch(id, {
      releaseStatus: 'in_progress',
      ...(expectedTotalLessons !== undefined ? { expectedTotalLessons } : {}),
      ...(nextLessonScheduleText !== undefined ? { nextLessonScheduleText } : {}),
    })
  },
})

// Marca o curso como concluído. Reavalia todas as matrículas para emitir
// certificados que estavam represados pelo gate de 'in_progress'.
export const markComplete = mutation({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    await ctx.db.patch(id, { releaseStatus: 'complete' })

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()

    const courseRef = course.slug ?? id
    // Notificações em paralelo. checkAndIssueCertificate continua sequencial
    // pois faz writes no mesmo enrollment e dispara fluxos secundários.
    await Promise.all(
      enrollments
        .filter((enrollment) => !enrollment.certificateIssued)
        .map((enrollment) =>
          ctx.runMutation(internal.notifications.pushInternal, {
            userId: enrollment.studentId,
            kind: 'course_marked_complete',
            title: 'Curso finalizado',
            body: `O curso "${course.title}" foi finalizado. Conclua as aulas restantes para receber seu certificado.`,
            link: `/dashboard/meus-cursos/${courseRef}`,
          }),
        ),
    )
    for (const enrollment of enrollments) {
      await checkAndIssueCertificate(ctx, enrollment.studentId, id, enrollment._id)
    }
  },
})

export const remove = mutation({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()

    await Promise.all(
      lessons.map(async (lesson) => {
        const quiz = await ctx.db
          .query('quizzes')
          .withIndex('by_lessonId', (q) => q.eq('lessonId', lesson._id))
          .first()
        if (quiz) await ctx.db.delete(quiz._id)
        await ctx.db.delete(lesson._id)
      }),
    )

    const modules = await ctx.db
      .query('modules')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    await Promise.all(modules.map((mod) => ctx.db.delete(mod._id)))

    // Cascade nas tabelas filhas do curso. Materiais R2 são apagados via
    // scheduler (internalDeleteObject) para não bloquear a mutation.
    const materials = await ctx.db
      .query('lessonMaterials')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    for (const mat of materials) {
      if (mat.storageId) await ctx.storage.delete(mat.storageId)
      if (mat.r2Key) {
        await ctx.scheduler.runAfter(0, internal.r2.internalDeleteObject, { key: mat.r2Key })
      }
      await ctx.db.delete(mat._id)
    }

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    await Promise.all(enrollments.map((e) => ctx.db.delete(e._id)))

    const progresses = await ctx.db
      .query('progress')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    await Promise.all(progresses.map((p) => ctx.db.delete(p._id)))

    const cComments = await ctx.db
      .query('courseComments')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    await Promise.all(cComments.map((c) => ctx.db.delete(c._id)))

    // lessonComments tem by_lessonId mas não by_courseId; iterar por aula
    // (lessons já estão coletadas no início da mutation).
    for (const lesson of lessons) {
      const lComments = await ctx.db
        .query('lessonComments')
        .withIndex('by_lessonId', (q) => q.eq('lessonId', lesson._id))
        .collect()
      await Promise.all(lComments.map((c) => ctx.db.delete(c._id)))
    }

    const ratings = await ctx.db
      .query('courseRatings')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    await Promise.all(ratings.map((r) => ctx.db.delete(r._id)))

    const questions = await ctx.db
      .query('courseQuestions')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    await Promise.all(questions.map((q) => ctx.db.delete(q._id)))

    const coauthors = await ctx.db
      .query('courseCoauthors')
      .withIndex('by_courseId', (q) => q.eq('courseId', id))
      .collect()
    await Promise.all(coauthors.map((c) => ctx.db.delete(c._id)))

    // courses.thumbnail é uma URL pública R2. Sem o key armazenado, a capa
    // continua no bucket após delete (sobrescrita acontece em re-upload).
    await ctx.db.delete(id)
  },
})

export const getStats = query({
  args: { creatorId: v.string() },
  handler: async (ctx, { creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .collect()

    const totalCourses = courses.length
    const publishedCourses = courses.filter((c) => c.isPublished).length
    const totalStudents = courses.reduce((acc, c) => acc + c.totalStudents, 0)
    const totalLessons = courses.reduce((acc, c) => acc + c.totalLessons, 0)

    const donations = await ctx.db
      .query('donations')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .collect()

    const totalDonationsCents = donations
      .filter((d) => d.status === 'completed')
      .reduce((acc, d) => acc + d.amountCents, 0)

    return { totalCourses, publishedCourses, totalStudents, totalLessons, totalDonationsCents }
  },
})
