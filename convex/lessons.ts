import { v } from 'convex/values'
import { mutation, query, type MutationCtx } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { ensureIdentityMatches, requireUserFunction } from './lib/auth'
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
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const lesson = await ctx.db.get(id)
    if (!lesson || lesson.creatorId !== identity.subject) return null
    return lesson
  },
})

export const listByCourse = query({
  args: { courseId: v.id('courses'), creatorId: v.string() },
  handler: async (ctx, { courseId, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const course = await ctx.db.get(courseId)
    if (!course || course.creatorId !== identity.subject) return []

    return await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .order('asc')
      .collect()
  },
})

export const listByModule = query({
  args: { moduleId: v.id('modules'), creatorId: v.string() },
  handler: async (ctx, { moduleId, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const mod = await ctx.db.get(moduleId)
    if (!mod || mod.creatorId !== identity.subject) return []

    return await ctx.db
      .query('lessons')
      .withIndex('by_moduleId', (q) => q.eq('moduleId', moduleId))
      .order('asc')
      .collect()
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
    ensureIdentityMatches(identity.subject, args.creatorId)

    const course = await ctx.db.get(args.courseId)
    const mod = await ctx.db.get(args.moduleId)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')
    if (!mod || mod.creatorId !== identity.subject || mod.courseId !== args.courseId) {
      throw new Error('Módulo inválido')
    }

    await ensureUniqueYouTubeUrl(ctx, identity.subject, args.youtubeUrl)

    const lessonId = await ctx.db.insert('lessons', {
      ...args,
      creatorId: identity.subject,
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
  handler: async (ctx, { id, creatorId, ...fields }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const lesson = await ctx.db.get(id)
    if (!lesson || lesson.creatorId !== identity.subject) throw new Error('Não autorizado')

    if (fields.youtubeUrl !== undefined && fields.youtubeUrl !== lesson.youtubeUrl) {
      await ensureUniqueYouTubeUrl(ctx, identity.subject, fields.youtubeUrl, id)
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

    // Quando uma aula que estava agendada (tinha publishAt) é publicada agora,
    // notifica todos os matriculados do curso. Filtra por transição
    // false→true para não disparar em edições subsequentes.
    const wasUnpublished = !lesson.isPublished
    const becamePublished = fields.isPublished === true
    const wasScheduled = typeof lesson.publishAt === 'number'
    if (wasUnpublished && becamePublished && wasScheduled) {
      const course = await ctx.db.get(lesson.courseId)
      if (course) {
        const enrollments = await ctx.db
          .query('enrollments')
          .withIndex('by_courseId', (q) => q.eq('courseId', lesson.courseId))
          .collect()
        const courseRef = course.slug ?? course._id
        const lessonRef = (fields.title ? toSlug(fields.title) : lesson.slug) ?? lesson._id
        const lessonTitle = fields.title ?? lesson.title
        for (const enrollment of enrollments) {
          await ctx.runMutation(internal.notifications.pushInternal, {
            userId: enrollment.studentId,
            kind: 'lesson_scheduled_published',
            title: 'Nova aula publicada',
            body: `A aula "${lessonTitle}" foi publicada em "${course.title}".`,
            link: `/dashboard/meus-cursos/${courseRef}/aula/${lessonRef}`,
          })
        }
      }
    }
  },
})

export const generateLessonSlugs = mutation({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db.query('lessons').collect()
    for (const lesson of lessons) {
      if (!lesson.slug) {
        await ctx.db.patch(lesson._id, { slug: toSlug(lesson.title) })
      }
    }
  },
})

export const remove = mutation({
  args: { id: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const lesson = await ctx.db.get(id)
    if (!lesson || lesson.creatorId !== identity.subject) throw new Error('Não autorizado')

    const course = await ctx.db.get(lesson.courseId)
    if (course) {
      await ctx.db.patch(lesson.courseId, { totalLessons: Math.max(0, course.totalLessons - 1) })
    }

    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .first()
    if (quiz) await ctx.db.delete(quiz._id)

    // Cascata: materiais (com storage), anotações de caderno e comentários
    // da aula. Removidos para não deixar dados órfãos após exclusão da aula.
    const materials = await ctx.db
      .query('lessonMaterials')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', id))
      .collect()
    for (const mat of materials) {
      await ctx.storage.delete(mat.storageId)
      await ctx.db.delete(mat._id)
    }

    // Remoção em cascata de notebookEntries desta aula. O índice
    // by_student_lesson começa por studentId; como aqui varremos por lessonId
    // e esta mutation é rara (apenas quando criador exclui aula), usamos
    // filter() simples.
    const notebookEntries = await ctx.db
      .query('notebookEntries')
      .filter((q) => q.eq(q.field('lessonId'), id))
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
