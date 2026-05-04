import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireCurrentUser, requireCourseAccess } from './lib/auth'
import { internal } from './_generated/api'
import { checkRateLimit } from './lib/rateLimit'

// Fórum de discussão por curso. Thread de um nível: comentário raiz (parentId
// ausente) pode receber respostas com parentId apontando para ele. Professor
// dono do curso pode marcar respostas como oficiais e moderar qualquer
// comentário; autor pode editar/apagar o próprio.

const MAX_COMMENT_LEN = 2000

export const create = mutation({
  args: {
    courseId: v.id('courses'),
    text: v.string(),
    parentId: v.optional(v.id('courseComments')),
  },
  handler: async (ctx, { courseId, text, parentId }) => {
    const { identity, user } = await requireCurrentUser(ctx)
    await checkRateLimit(ctx, identity.subject, 'comment.create', { max: 10, windowMs: 60_000 })
    const trimmed = text.trim()
    if (!trimmed) throw new Error('Comentário vazio')
    const safeText = trimmed.slice(0, MAX_COMMENT_LEN)

    const { course } = await requireCourseAccess(ctx, courseId)

    if (parentId) {
      const parent = await ctx.db.get(parentId)
      if (!parent || parent.courseId !== courseId) {
        throw new Error('Comentário pai inválido')
      }
      if (parent.parentId) {
        throw new Error('Respostas só podem ser em comentários raiz')
      }
    }

    const isCourseCreator = course.creatorId === identity.subject
    const authorRole: 'aluno' | 'criador' = isCourseCreator ? 'criador' : 'aluno'

    const commentId = await ctx.db.insert('courseComments', {
      courseId,
      authorId: identity.subject,
      authorName: user.name,
      authorAvatarUrl: user.avatarUrl,
      authorRole,
      text: safeText,
      parentId,
      isOfficial: isCourseCreator && parentId !== undefined ? true : undefined,
      helpfulCount: 0,
      createdAt: Date.now(),
    })

    const excerpt = safeText.length > 90 ? `${safeText.slice(0, 87)}...` : safeText

    if (parentId) {
      const parent = await ctx.db.get(parentId)
      if (parent && !parent.deletedAt && parent.authorId !== identity.subject) {
        await ctx.runMutation(internal.notifications.pushInternal, {
          userId: parent.authorId,
          kind: 'comment_reply',
          title: isCourseCreator
            ? `${user.name} (professor) respondeu no fórum de ${course.title}`
            : `${user.name} respondeu no fórum de ${course.title}`,
          body: excerpt,
          link: `/cursos/${course.slug ?? courseId}`,
        })
      }
    }

    if (!parentId && !isCourseCreator) {
      await ctx.runMutation(internal.notifications.pushInternal, {
        userId: course.creatorId,
        kind: 'comment_new',
        title: `${user.name} abriu uma discussão em ${course.title}`,
        body: excerpt,
        link: `/cursos/${course.slug ?? courseId}`,
      })
    }

    return commentId
  },
})

export const edit = mutation({
  args: { id: v.id('courseComments'), text: v.string() },
  handler: async (ctx, { id, text }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(id)
    if (!comment || comment.authorId !== identity.subject) throw new Error('Não autorizado')
    if (comment.deletedAt) throw new Error('Comentário removido')

    const trimmed = text.trim()
    if (!trimmed) throw new Error('Comentário vazio')

    await ctx.db.patch(id, {
      text: trimmed.slice(0, MAX_COMMENT_LEN),
      editedAt: Date.now(),
    })
  },
})

export const softDelete = mutation({
  args: { id: v.id('courseComments') },
  handler: async (ctx, { id }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(id)
    if (!comment) throw new Error('Não encontrado')

    const course = await ctx.db.get(comment.courseId)
    const isAuthor = comment.authorId === identity.subject
    const isCourseCreator = course?.creatorId === identity.subject
    if (!isAuthor && !isCourseCreator) throw new Error('Não autorizado')

    await ctx.db.patch(id, { deletedAt: Date.now() })
  },
})

export const setOfficial = mutation({
  args: { id: v.id('courseComments'), isOfficial: v.boolean() },
  handler: async (ctx, { id, isOfficial }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(id)
    if (!comment) throw new Error('Não encontrado')

    const course = await ctx.db.get(comment.courseId)
    if (!course || course.creatorId !== identity.subject) throw new Error('Não autorizado')
    if (!comment.parentId) throw new Error('Só respostas podem ser marcadas como oficiais')

    await ctx.db.patch(id, { isOfficial: isOfficial || undefined })
  },
})

export const listByCourse = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const { role } = await requireCourseAccess(ctx, courseId)
    const identity = await ctx.auth.getUserIdentity()
    const callerSubject = identity?.subject ?? null

    const all = await ctx.db
      .query('courseComments')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .collect()

    // Set de comentários marcados como úteis pelo viewer (server-side, não
    // expõe outras marcações).
    const myHelpful = new Set<string>()
    if (callerSubject) {
      for (const c of all) {
        const found = await ctx.db
          .query('courseCommentHelpful')
          .withIndex('by_comment_user', (q) =>
            q.eq('commentId', c._id).eq('userId', callerSubject),
          )
          .unique()
        if (found) myHelpful.add(c._id as unknown as string)
      }
    }

    const shaped = all.map((c) => ({
      ...c,
      helpfulCount: c.helpfulCount ?? 0,
      isHelpfulByMe: myHelpful.has(c._id as unknown as string),
    }))

    const roots = shaped
      .filter((c) => !c.parentId)
      .sort((a, b) => a.createdAt - b.createdAt)

    const repliesByParent = new Map<string, typeof shaped>()
    for (const c of shaped) {
      if (c.parentId) {
        const key = c.parentId as unknown as string
        const arr = repliesByParent.get(key) ?? []
        arr.push(c)
        repliesByParent.set(key, arr)
      }
    }

    return {
      viewerRole: role,
      threads: roots.map((root) => ({
        ...root,
        replies: (repliesByParent.get(root._id as unknown as string) ?? []).sort(
          (a, b) => a.createdAt - b.createdAt
        ),
      })),
    }
  },
})

// "Útil" em comentário do fórum do curso. Idempotente, toggle. Apenas
// usuários com acesso ao curso (matriculados ou criador) podem marcar.
export const markHelpful = mutation({
  args: { commentId: v.id('courseComments') },
  handler: async (ctx, { commentId }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(commentId)
    if (!comment) throw new Error('Comentário não encontrado.')
    await requireCourseAccess(ctx, comment.courseId)

    const existing = await ctx.db
      .query('courseCommentHelpful')
      .withIndex('by_comment_user', (q) =>
        q.eq('commentId', commentId).eq('userId', identity.subject),
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
      const next = Math.max(0, (comment.helpfulCount ?? 0) - 1)
      await ctx.db.patch(commentId, { helpfulCount: next })
      return { helpful: false }
    }

    await ctx.db.insert('courseCommentHelpful', {
      commentId,
      userId: identity.subject,
      at: Date.now(),
    })
    await ctx.db.patch(commentId, {
      helpfulCount: (comment.helpfulCount ?? 0) + 1,
    })
    return { helpful: true }
  },
})
