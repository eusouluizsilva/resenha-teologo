import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireCurrentUser, requireLessonAccess } from './lib/auth'
import { internal } from './_generated/api'
import { checkRateLimit } from './lib/rateLimit'

// Comentários em aulas. Thread de um nível: um comentário raiz (parentId
// ausente) pode receber respostas com parentId apontando para ele. Respostas
// não têm respostas próprias (a UI força isso). O criador do curso pode marcar
// qualquer resposta como "oficial" para destacá-la na UI.

const MAX_COMMENT_LEN = 2000

export const create = mutation({
  args: {
    lessonId: v.id('lessons'),
    text: v.string(),
    parentId: v.optional(v.id('lessonComments')),
  },
  handler: async (ctx, { lessonId, text, parentId }) => {
    const { identity, user } = await requireCurrentUser(ctx)
    await checkRateLimit(ctx, identity.subject, 'comment.create', { max: 10, windowMs: 60_000 })
    const trimmed = text.trim()
    if (!trimmed) throw new Error('Comentário vazio')
    const safeText = trimmed.slice(0, MAX_COMMENT_LEN)

    // Acesso: criador dono OU aluno matriculado. Bloqueia poster externo.
    const { lesson } = await requireLessonAccess(ctx, lessonId)

    // Se está respondendo, validar que o parent pertence à mesma aula e que o
    // parent não é já uma resposta (bloqueia threads de 2+ níveis).
    if (parentId) {
      const parent = await ctx.db.get(parentId)
      if (!parent || parent.lessonId !== lessonId) {
        throw new Error('Comentário pai inválido')
      }
      if (parent.parentId) {
        throw new Error('Respostas só podem ser em comentários raiz')
      }
    }

    const isCourseCreator = lesson.creatorId === identity.subject
    const authorRole: 'aluno' | 'criador' = isCourseCreator ? 'criador' : 'aluno'

    const commentId = await ctx.db.insert('lessonComments', {
      lessonId,
      courseId: lesson.courseId,
      authorId: identity.subject,
      authorName: user.name,
      authorAvatarUrl: user.avatarUrl,
      authorRole,
      text: safeText,
      parentId,
      // Respostas do criador do curso entram automaticamente como oficiais.
      isOfficial: isCourseCreator && parentId !== undefined ? true : undefined,
      createdAt: Date.now(),
    })

    const course = await ctx.db.get(lesson.courseId)
    const excerpt = safeText.length > 90 ? `${safeText.slice(0, 87)}...` : safeText

    // Se é uma resposta, notifica o autor do comentário pai (desde que não
    // esteja respondendo a si mesmo e que o pai não tenha sido removido).
    if (parentId) {
      const parent = await ctx.db.get(parentId)
      if (parent && !parent.deletedAt && parent.authorId !== identity.subject) {
        await ctx.runMutation(internal.notifications.pushInternal, {
          userId: parent.authorId,
          kind: 'comment_reply',
          title: isCourseCreator
            ? `${user.name} (professor) respondeu seu comentário`
            : `${user.name} respondeu seu comentário`,
          body: course ? `Em "${course.title}" · ${lesson.title}: ${excerpt}` : excerpt,
          link: `/dashboard/meus-cursos/${lesson.courseId}/aula/${lessonId}`,
        })
      }
    }

    // Se é um comentário raiz de aluno numa aula de outro professor, notifica
    // o professor dono do curso para que possa responder ou moderar.
    if (!parentId && !isCourseCreator) {
      await ctx.runMutation(internal.notifications.pushInternal, {
        userId: lesson.creatorId,
        kind: 'comment_new',
        title: `${user.name} comentou em sua aula`,
        body: course ? `Em "${course.title}" · ${lesson.title}: ${excerpt}` : excerpt,
        link: `/dashboard/meus-cursos/${lesson.courseId}/aula/${lessonId}`,
      })
    }

    return commentId
  },
})

export const edit = mutation({
  args: { id: v.id('lessonComments'), text: v.string() },
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

// Soft delete: preserva o registro mas a UI mostra placeholder "comentário
// removido". Necessário porque respostas podem apontar para este comentário.
export const softDelete = mutation({
  args: { id: v.id('lessonComments') },
  handler: async (ctx, { id }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(id)
    if (!comment) throw new Error('Não encontrado')

    // Autor pode deletar o próprio; criador do curso pode moderar qualquer
    // comentário da aula.
    const lesson = await ctx.db.get(comment.lessonId)
    const isAuthor = comment.authorId === identity.subject
    const isCourseCreator = lesson?.creatorId === identity.subject
    if (!isAuthor && !isCourseCreator) throw new Error('Não autorizado')

    await ctx.db.patch(id, { deletedAt: Date.now() })
  },
})

// Só o criador do curso pode marcar/desmarcar uma resposta como oficial.
export const setOfficial = mutation({
  args: { id: v.id('lessonComments'), isOfficial: v.boolean() },
  handler: async (ctx, { id, isOfficial }) => {
    const { identity } = await requireCurrentUser(ctx)
    const comment = await ctx.db.get(id)
    if (!comment) throw new Error('Não encontrado')

    const lesson = await ctx.db.get(comment.lessonId)
    if (!lesson || lesson.creatorId !== identity.subject) throw new Error('Não autorizado')
    if (!comment.parentId) throw new Error('Só respostas podem ser marcadas como oficiais')

    await ctx.db.patch(id, { isOfficial: isOfficial || undefined })
  },
})

// Retorna a thread da aula: lista de comentários-raiz em ordem cronológica
// (mais antigos primeiro) com suas respostas agrupadas. Frontend decide
// paginação/visual. Inclui comentários deletados para manter a estrutura
// (a UI substitui o texto por placeholder).
export const listByLesson = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    // Acesso: criador dono OU aluno matriculado. Evita leitura de threads por
    // terceiros que apenas estejam autenticados.
    const { role } = await requireLessonAccess(ctx, lessonId)
    const all = await ctx.db
      .query('lessonComments')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .collect()

    const roots = all
      .filter((c) => !c.parentId)
      .sort((a, b) => a.createdAt - b.createdAt)

    const repliesByParent = new Map<string, typeof all>()
    for (const c of all) {
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
