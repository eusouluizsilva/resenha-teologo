import { v } from 'convex/values'
import { internalAction, internalMutation, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { ensureIdentityMatches, requireUserFunction } from './lib/auth'
import { autoEnrollAllUsersInCourse } from './lib/autoEnroll'
import { scheduleBulkNotifications, type NotifyTarget } from './lib/notifications'
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
// certificados que estavam represados pelo gate de 'in_progress'. Notifica
// e checa certificado em chunks via scheduler (cada chunk = mutation isolada),
// para suportar cursos com milhares de matriculados sem estourar 8s/8000 writes.
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
    const pending = enrollments.filter((e) => !e.certificateIssued)

    const targets: NotifyTarget[] = pending.map((enrollment) => ({
      userId: enrollment.studentId,
      title: 'Curso finalizado',
      body: `O curso "${course.title}" foi finalizado. Conclua as aulas restantes para receber seu certificado.`,
      link: `/dashboard/meus-cursos/${courseRef}`,
    }))
    await scheduleBulkNotifications(ctx, 'course_marked_complete', targets)

    // Checagem de certificado é cara (3 collects + writes secundários). Dispara
    // em mutations agendadas, 25 matrículas por chunk (cada uma faz N reads).
    const CHUNK = 25
    for (let i = 0; i < enrollments.length; i += CHUNK) {
      const slice = enrollments.slice(i, i + CHUNK).map((e) => e._id)
      await ctx.scheduler.runAfter(0, internal.courses.checkCertificatesForEnrollments, {
        enrollmentIds: slice,
      })
    }
  },
})

// Chunked certificate check disparado por markComplete via scheduler. Cada
// invocação processa até 25 matrículas; cada checkAndIssueCertificate gera
// reads pesados, então o limite por execução fica abaixo do orçamento de
// 8000 reads/mutation.
export const checkCertificatesForEnrollments = internalMutation({
  args: { enrollmentIds: v.array(v.id('enrollments')) },
  handler: async (ctx, { enrollmentIds }) => {
    for (const enrollmentId of enrollmentIds) {
      const enrollment = await ctx.db.get(enrollmentId)
      if (!enrollment) continue
      await checkAndIssueCertificate(ctx, enrollment.studentId, enrollment.courseId, enrollment._id)
    }
  },
})

// Item 35 da auditoria 2026-05-04: cascade de delete de curso em chunks.
// Mutation pública valida + despublica + agenda cleanup async em pedaços de 200
// docs por mutation, evitando estourar 4096 docs/transação em curso popular.
export const remove = mutation({
  args: { id: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(id)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')

    // Despublica imediato pra sumir das listagens públicas. Cleanup async
    // pode demorar segundos a minutos em curso popular.
    if (course.isPublished) {
      await ctx.db.patch(id, { isPublished: false, totalStudents: 0 })
    }

    await ctx.scheduler.runAfter(0, internal.courses._cascadeDeleteCourse, {
      courseId: id,
    })
  },
})

// Internal mutation que apaga até CHUNK docs por chamada e retorna se ainda há
// trabalho. Limite escolhido bem abaixo dos 4096 docs/tx do Convex pra deixar
// folga e cumprir o limit de 8MB de bandwidth por transação.
const CASCADE_CHUNK = 200

export const _deleteCourseChunk = internalMutation({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }): Promise<{ deleted: number; done: boolean }> => {
    let budget = CASCADE_CHUNK
    let deleted = 0

    // Não dá pra extrair em helper genérico: ctx.db.delete exige
    // Id<TableName>. Inline em cada bloco.

    // Ordem do mais "leaf" pro mais raiz: materiais → progresso →
    // matrículas → comments → ratings → questions → coauthors → quizzes →
    // lessons → modules → curso.

    if (budget > 0) {
      const materials = await ctx.db
        .query('lessonMaterials')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const mat of materials) {
        if (budget <= 0) break
        if (mat.storageId) await ctx.storage.delete(mat.storageId)
        if (mat.r2Key) {
          await ctx.scheduler.runAfter(0, internal.r2.internalDeleteObject, { key: mat.r2Key })
        }
        await ctx.db.delete(mat._id)
        budget--
        deleted++
      }
    }

    if (budget > 0) {
      const progresses = await ctx.db
        .query('progress')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const d of progresses) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
    }

    if (budget > 0) {
      const enrollments = await ctx.db
        .query('enrollments')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const d of enrollments) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
    }

    if (budget > 0) {
      const cComments = await ctx.db
        .query('courseComments')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const d of cComments) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
    }

    // lessonComments só tem by_lessonId, não by_courseId. Pega em batch via
    // lessons do curso. Se o curso tem 1000 aulas com comentários esparsos,
    // ainda assim o orçamento limita o total deletado.
    if (budget > 0) {
      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(50)
      for (const lesson of lessons) {
        if (budget <= 0) break
        const lComments = await ctx.db
          .query('lessonComments')
          .withIndex('by_lessonId', (q) => q.eq('lessonId', lesson._id))
          .take(budget)
        for (const d of lComments) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
      }
    }

    if (budget > 0) {
      const ratings = await ctx.db
        .query('courseRatings')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const d of ratings) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
    }

    if (budget > 0) {
      const questions = await ctx.db
        .query('courseQuestions')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const d of questions) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
    }

    if (budget > 0) {
      const coauthors = await ctx.db
        .query('courseCoauthors')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const d of coauthors) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
    }

    // Quizzes vinculados às aulas (sem by_courseId direto).
    if (budget > 0) {
      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(50)
      for (const lesson of lessons) {
        if (budget <= 0) break
        const quizzes = await ctx.db
          .query('quizzes')
          .withIndex('by_lessonId', (q) => q.eq('lessonId', lesson._id))
          .take(budget)
        for (const d of quizzes) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
      }
    }

    if (budget > 0) {
      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const d of lessons) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
    }

    if (budget > 0) {
      const modules = await ctx.db
        .query('modules')
        .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
        .take(budget)
      for (const d of modules) { if (budget <= 0) break; await ctx.db.delete(d._id); budget--; deleted++ }
    }

    // Done quando nada foi deletado nesse chunk: todos os filhos sumiram.
    if (deleted === 0) {
      const stillCourse = await ctx.db.get(courseId)
      if (stillCourse) await ctx.db.delete(courseId)
      return { deleted: 0, done: true }
    }

    return { deleted, done: false }
  },
})

export const _cascadeDeleteCourse = internalAction({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }): Promise<{ totalDeleted: number; chunks: number }> => {
    let totalDeleted = 0
    let chunks = 0
    // Limite de segurança: 100 chunks × 200 = 20k docs. Curso teológico real
    // não chega perto. Se chegar, registra warn e desiste pra evitar loop.
    while (chunks < 100) {
      const result: { deleted: number; done: boolean } = await ctx.runMutation(
        internal.courses._deleteCourseChunk,
        { courseId },
      )
      totalDeleted += result.deleted
      chunks++
      if (result.done) break
    }
    if (chunks >= 100) {
      console.warn(
        `[courses._cascadeDeleteCourse] atingiu limite de 100 chunks pro courseId ${courseId}; restante deve ser apagado manualmente`,
      )
    }
    return { totalDeleted, chunks }
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
