import { v } from 'convex/values'
import { mutation, query, internalMutation, type MutationCtx } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { canEditCourse, requireUserFunction } from './lib/auth'
import { scheduleBulkNotifications, type NotifyTarget } from './lib/notifications'
import { toSlug } from './lib/slug'

// Validador do formato estruturado de versículos (espelha schema.ts).
const verseRefValidator = v.object({
  bookSlug: v.string(),
  chapter: v.number(),
  verseStart: v.number(),
  verseEnd: v.number(),
  testament: v.union(v.literal('old'), v.literal('new')),
})

export const getById = query({
  args: { id: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { id }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const lesson = await ctx.db.get(id)
    if (!lesson) return null
    if (!(await canEditCourse(ctx, lesson.courseId, identity.subject))) return null
    return lesson
  },
})

// Preview da aula para o criador. Retorna lesson, course e siblings na ordem
// do curso. Acessivel mesmo se isPublished=false (criador testa rascunhos).
export const getForCreatorPreview = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    const lesson = await ctx.db.get(lessonId)
    if (!lesson) return null
    if (!(await canEditCourse(ctx, lesson.courseId, identity.subject))) return null

    const course = await ctx.db.get(lesson.courseId)
    if (!course) return null

    const siblings = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', lesson.courseId))
      .order('asc')
      .collect()

    return {
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description ?? null,
        youtubeUrl: lesson.youtubeUrl,
        durationSeconds: lesson.durationSeconds ?? null,
        slug: lesson.slug ?? null,
        order: lesson.order,
        isPublished: lesson.isPublished,
        publishAt: lesson.publishAt ?? null,
        hasMandatoryQuiz: lesson.hasMandatoryQuiz,
        versesRefs: lesson.versesRefs ?? [],
      },
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug ?? null,
        totalLessons: course.totalLessons,
      },
      siblings: siblings.map((l) => ({
        _id: l._id,
        title: l.title,
        order: l.order,
        isPublished: l.isPublished,
        durationSeconds: l.durationSeconds ?? null,
        isCurrent: l._id === lesson._id,
      })),
    }
  },
})

export const listByCourse = query({
  args: { courseId: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { courseId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    if (!(await canEditCourse(ctx, courseId, identity.subject))) return []

    return await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .order('asc')
      .collect()
  },
})

export const listByModule = query({
  args: { moduleId: v.id('modules'), creatorId: v.string() },
  handler: async (ctx, { moduleId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const mod = await ctx.db.get(moduleId)
    if (!mod) return []
    if (!(await canEditCourse(ctx, mod.courseId, identity.subject))) return []

    return await ctx.db
      .query('lessons')
      .withIndex('by_moduleId', (q) => q.eq('moduleId', moduleId))
      .order('asc')
      .collect()
  },
})

export const reorderInModule = mutation({
  args: {
    moduleId: v.id('modules'),
    creatorId: v.string(),
    orderedIds: v.array(v.id('lessons')),
  },
  handler: async (ctx, { moduleId, orderedIds }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const mod = await ctx.db.get(moduleId)
    if (!mod) throw new Error('Módulo não encontrado')
    if (!(await canEditCourse(ctx, mod.courseId, identity.subject))) {
      throw new Error('Não autorizado')
    }

    const all = await ctx.db
      .query('lessons')
      .withIndex('by_moduleId', (q) => q.eq('moduleId', moduleId))
      .collect()
    const allIds = new Set(all.map((l) => l._id))
    if (orderedIds.length !== all.length || !orderedIds.every((id) => allIds.has(id))) {
      throw new Error('Lista de aulas inválida.')
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i + 1 })
    }
  },
})

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// Chave canonical para comparar URLs de vídeo. Para YouTube usamos o id de 11
// caracteres (ignora parâmetros como ?t=30 ou playlists). Para outros links
// usamos a URL bruta em lowercase.
function canonicalVideoKey(url: string): string {
  const ytId = extractYouTubeId(url)
  if (ytId) return `yt:${ytId}`
  return `raw:${url.trim().toLowerCase()}`
}

// Verifica se o mesmo link de vídeo já está em uso por outra aula do mesmo
// criador. Recusa duplicatas dentro do tenant (sem impacto cross-tenant).
async function ensureUniqueYouTubeUrl(
  ctx: MutationCtx,
  creatorId: string,
  youtubeUrl: string,
  excludeLessonId?: Id<'lessons'>,
) {
  const key = canonicalVideoKey(youtubeUrl)
  const lessons = await ctx.db
    .query('lessons')
    .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
    .collect()

  for (const other of lessons) {
    if (excludeLessonId && other._id === excludeLessonId) continue
    if (canonicalVideoKey(other.youtubeUrl) === key) {
      throw new Error('Este vídeo já está sendo usado em outra aula sua. Cada URL só pode aparecer uma vez.')
    }
  }
}

export const create = mutation({
  args: {
    moduleId: v.id('modules'),
    courseId: v.id('courses'),
    creatorId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    youtubeUrl: v.string(),
    durationSeconds: v.optional(v.number()),
    order: v.number(),
    hasMandatoryQuiz: v.boolean(),
    versesRefs: v.optional(v.array(verseRefValidator)),
    allowQuizRetry: v.optional(v.boolean()),
    publishAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const course = await ctx.db.get(args.courseId)
    const mod = await ctx.db.get(args.moduleId)
    if (!course || !(await canEditCourse(ctx, args.courseId, identity.subject))) {
      throw new Error('Não autorizado')
    }
    if (!mod || mod.courseId !== args.courseId) {
      throw new Error('Módulo inválido')
    }

    await ensureUniqueYouTubeUrl(ctx, course.creatorId, args.youtubeUrl)

    const { creatorId: _ownerHint, ...rest } = args
    void _ownerHint
    const lessonId = await ctx.db.insert('lessons', {
      ...rest,
      creatorId: course.creatorId,
      isPublished: false,
      slug: toSlug(args.title),
    })

    const newTotal = course.totalLessons + 1
    if (!course.thumbnail) {
      const videoId = extractYouTubeId(args.youtubeUrl)
      const thumbnail = videoId
        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
        : undefined
      await ctx.db.patch(args.courseId, { totalLessons: newTotal, ...(thumbnail ? { thumbnail } : {}) })
    } else {
      await ctx.db.patch(args.courseId, { totalLessons: newTotal })
    }

    return lessonId
  },
})

export const update = mutation({
  args: {
    id: v.id('lessons'),
    creatorId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    hasMandatoryQuiz: v.optional(v.boolean()),
    versesRefs: v.optional(v.array(verseRefValidator)),
    allowQuizRetry: v.optional(v.boolean()),
    publishAt: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { id, creatorId: _ownerHint, ...fields }) => {
    void _ownerHint
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const lesson = await ctx.db.get(id)
    if (!lesson || !(await canEditCourse(ctx, lesson.courseId, identity.subject))) {
      throw new Error('Não autorizado')
    }

    // Apenas o dono do curso pode publicar/despublicar (gating editorial).
    // Co-autores editores podem alterar todos os outros campos, mas não
    // mudar o estado de publicação.
    if (fields.isPublished !== undefined && fields.isPublished !== lesson.isPublished) {
      if (lesson.creatorId !== identity.subject) {
        throw new Error('Apenas o dono do curso pode alterar o estado de publicação.')
      }
    }

    if (fields.youtubeUrl !== undefined && fields.youtubeUrl !== lesson.youtubeUrl) {
      await ensureUniqueYouTubeUrl(ctx, lesson.creatorId, fields.youtubeUrl, id)
    }

    const { publishAt: rawPublishAt, ...rest } = fields
    const updates: Record<string, unknown> = { ...rest }
    if (fields.title) updates.slug = toSlug(fields.title)
    // null explícito limpa a data agendada; undefined mantém o valor atual.
    if (rawPublishAt === null) {
      updates.publishAt = undefined
    } else if (rawPublishAt !== undefined) {
      updates.publishAt = rawPublishAt
    }
    await ctx.db.patch(id, updates)

    // Transição false→true em isPublished: notifica todos os matriculados e
    // dispara IndexNow. Vale tanto para aulas que vinham agendadas via
    // publishAt quanto para publicação manual sem agendamento.
    const wasUnpublished = !lesson.isPublished
    const becamePublished = fields.isPublished === true
    if (wasUnpublished && becamePublished) {
      const course = await ctx.db.get(lesson.courseId)
      const lessonSlug = (fields.title ? toSlug(fields.title) : lesson.slug) ?? null
      if (course?.slug && lessonSlug && course.visibility !== 'institution') {
        await ctx.scheduler.runAfter(0, internal.indexnow.submitUrls, {
          urls: [`https://resenhadoteologo.com/cursos/${course.slug}/${lessonSlug}`],
        })
      }
      if (course) {
        const enrollments = await ctx.db
          .query('enrollments')
          .withIndex('by_courseId', (q) => q.eq('courseId', lesson.courseId))
          .collect()
        const courseRef = course.slug ?? course._id
        const lessonRef = (fields.title ? toSlug(fields.title) : lesson.slug) ?? lesson._id
        const lessonTitle = fields.title ?? lesson.title
        const targets: NotifyTarget[] = enrollments.map((enrollment) => ({
          userId: enrollment.studentId,
          title: 'Nova aula publicada',
          body: `A aula "${lessonTitle}" foi publicada em "${course.title}".`,
          link: `/dashboard/meus-cursos/${courseRef}/aula/${lessonRef}`,
        }))
        await scheduleBulkNotifications(ctx, 'lesson_scheduled_published', targets)
      }
    }
  },
})

// Cron: a cada 5 minutos, varre aulas com publishAt vencido (e ainda em
// rascunho) e publica automaticamente. Notificações vão por scheduler em
// chunks de 100 (lib/notifications.scheduleBulkNotifications) para isolar
// orçamento de writes quando há cursos com milhares de matriculados.
// Tolerância: até 5 min de atraso por design.
export const runScheduledPublish = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const candidates = await ctx.db
      .query('lessons')
      .withIndex('by_published_publishAt', (q) =>
        q.eq('isPublished', false).lte('publishAt', now),
      )
      .take(50)

    // Cache de cursos: várias aulas do mesmo curso podem cair na mesma janela.
    const courseCache = new Map<Id<'courses'>, Awaited<ReturnType<typeof ctx.db.get<'courses'>>>>()
    const indexNowUrls: string[] = []

    for (const lesson of candidates) {
      if (typeof lesson.publishAt !== 'number') continue
      if (lesson.publishAt > now) continue

      await ctx.db.patch(lesson._id, { isPublished: true })

      let course = courseCache.get(lesson.courseId)
      if (course === undefined) {
        course = await ctx.db.get(lesson.courseId)
        courseCache.set(lesson.courseId, course)
      }
      if (!course) continue

      const enrollments = await ctx.db
        .query('enrollments')
        .withIndex('by_courseId', (q) => q.eq('courseId', lesson.courseId))
        .collect()
      const courseRef = course.slug ?? course._id
      const lessonRef = lesson.slug ?? lesson._id
      const targets: NotifyTarget[] = enrollments.map((enrollment) => ({
        userId: enrollment.studentId,
        title: 'Nova aula publicada',
        body: `A aula "${lesson.title}" foi publicada em "${course!.title}".`,
        link: `/dashboard/meus-cursos/${courseRef}/aula/${lessonRef}`,
      }))
      await scheduleBulkNotifications(ctx, 'lesson_scheduled_published', targets)

      if (course.slug && lesson.slug && course.visibility !== 'institution') {
        indexNowUrls.push(`https://resenhadoteologo.com/cursos/${course.slug}/${lesson.slug}`)
      }
    }

    if (indexNowUrls.length > 0) {
      await ctx.scheduler.runAfter(0, internal.indexnow.submitUrls, { urls: indexNowUrls })
    }
  },
})

// Migração one-shot: gera slug para aulas legadas sem slug. Internal-only,
// não exposta ao cliente. Rodar via `npx convex run lessons:generateLessonSlugs`.
export const generateLessonSlugs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db.query('lessons').collect()
    await Promise.all(
      lessons
        .filter((l) => !l.slug)
        .map((l) => ctx.db.patch(l._id, { slug: toSlug(l.title) })),
    )
  },
})

export const remove = mutation({
  args: { id: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { id }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const lesson = await ctx.db.get(id)
    if (!lesson) throw new Error('Não autorizado')
    // Excluir aula é ação destrutiva: apenas o dono do curso pode.
    if (lesson.creatorId !== identity.subject) throw new Error('Não autorizado')

    const course = await ctx.db.get(lesson.courseId)
    if (course) {
      await ctx.db.patch(lesson.courseId, { totalLessons: Math.max(0, course.totalLessons - 1) })
    }

    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .first()
    if (quiz) await ctx.db.delete(quiz._id)

    // Cascata: materiais (com storage/R2), anotações de caderno, comentários,
    // perguntas privadas, timestamps e progresso da aula. Removidos para não
    // deixar dados órfãos após exclusão da aula.
    const materials = await ctx.db
      .query('lessonMaterials')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .collect()
    for (const mat of materials) {
      if (mat.storageId) await ctx.storage.delete(mat.storageId)
      if (mat.r2Key) {
        await ctx.scheduler.runAfter(0, internal.r2.internalDeleteObject, { key: mat.r2Key })
      }
      await ctx.db.delete(mat._id)
    }

    const notebookEntries = await ctx.db
      .query('notebookEntries')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .collect()
    for (const entry of notebookEntries) {
      await ctx.db.delete(entry._id)
    }

    const comments = await ctx.db
      .query('lessonComments')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .collect()
    for (const c of comments) {
      await ctx.db.delete(c._id)
    }

    const questions = await ctx.db
      .query('courseQuestions')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .collect()
    for (const q of questions) await ctx.db.delete(q._id)

    const timestamps = await ctx.db
      .query('lessonTimestamps')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .collect()
    for (const t of timestamps) await ctx.db.delete(t._id)

    const progresses = await ctx.db
      .query('progress')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .collect()
    for (const p of progresses) await ctx.db.delete(p._id)

    await ctx.db.delete(id)
  },
})

// Preview público de aula. Anon-safe. NUNCA retorna youtubeUrl (apenas o ID
// do vídeo para gerar thumbnail) nem materiais. Se o curso for institucional
// (visibility='institution'), retorna null para não vazar para fora do tenant.
//
// Usado pela rota pública /cursos/:courseSlug/:lessonSlug que mostra um
// overlay "Entrar para assistir" sobre a thumbnail.
export const getPublicPreview = query({
  args: {
    courseSlug: v.string(),
    lessonSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query('courses')
      .withIndex('by_slug', (q) => q.eq('slug', args.courseSlug))
      .unique()
    if (!course || !course.isPublished) return null
    if (course.visibility === 'institution') return null

    const lesson = await ctx.db
      .query('lessons')
      .withIndex('by_courseId_slug', (q) =>
        q.eq('courseId', course._id).eq('slug', args.lessonSlug),
      )
      .unique()
    if (!lesson || !lesson.isPublished) return null

    const ytId = extractYouTubeId(lesson.youtubeUrl)

    const creator = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
      .unique()

    const allLessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', course._id))
      .order('asc')
      .collect()
    const publishedLessons = allLessons
      .filter((l) => l.isPublished)
      .map((l) => ({
        _id: l._id,
        slug: l.slug ?? null,
        title: l.title,
        durationSeconds: l.durationSeconds ?? null,
        isCurrent: l._id === lesson._id,
      }))

    return {
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description ?? null,
        durationSeconds: lesson.durationSeconds ?? null,
        slug: lesson.slug ?? null,
        order: lesson.order,
        // Thumbnail do YouTube derivada do ID. NUNCA expomos youtubeUrl.
        youtubeVideoId: ytId,
        verses: lesson.verses ?? [],
        versesRefs: lesson.versesRefs ?? [],
      },
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        slug: course.slug ?? null,
        thumbnail: course.thumbnail ?? null,
        category: course.category,
        level: course.level,
        creatorId: course.creatorId,
        creatorName: creator?.name ?? 'Criador',
        creatorAvatarUrl: creator?.avatarUrl ?? null,
        creatorHandle: creator?.handle ?? null,
        totalLessons: course.totalLessons,
        totalModules: course.totalModules,
      },
      siblingLessons: publishedLessons,
    }
  },
})
