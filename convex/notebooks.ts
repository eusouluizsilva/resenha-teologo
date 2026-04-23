import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity, requirePerfil } from './lib/auth'

// Cadernos do aluno. Cada aluno pode manter múltiplos cadernos para organizar
// estudos por assunto/curso. Entradas (notebookEntries) são vinculadas a uma
// aula específica dentro de um caderno escolhido pelo aluno.

const MAX_TITLE_LEN = 80
const MAX_CONTENT_LEN = 20000

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)
    const notebooks = await ctx.db
      .query('notebooks')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()
    notebooks.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
    return notebooks
  },
})

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const { identity } = await requirePerfil(ctx, ['aluno'])
    const trimmed = title.trim()
    if (!trimmed) throw new Error('Título obrigatório')
    const safeTitle = trimmed.slice(0, MAX_TITLE_LEN)

    return await ctx.db.insert('notebooks', {
      studentId: identity.subject,
      title: safeTitle,
      createdAt: Date.now(),
    })
  },
})

export const rename = mutation({
  args: { id: v.id('notebooks'), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const { identity } = await requirePerfil(ctx, ['aluno'])
    const notebook = await ctx.db.get(id)
    if (!notebook || notebook.studentId !== identity.subject) throw new Error('Não autorizado')
    const trimmed = title.trim()
    if (!trimmed) throw new Error('Título obrigatório')
    await ctx.db.patch(id, { title: trimmed.slice(0, MAX_TITLE_LEN), updatedAt: Date.now() })
  },
})

export const remove = mutation({
  args: { id: v.id('notebooks') },
  handler: async (ctx, { id }) => {
    const { identity } = await requirePerfil(ctx, ['aluno'])
    const notebook = await ctx.db.get(id)
    if (!notebook || notebook.studentId !== identity.subject) throw new Error('Não autorizado')

    const entries = await ctx.db
      .query('notebookEntries')
      .withIndex('by_notebook', (q) => q.eq('notebookId', id))
      .collect()
    for (const entry of entries) {
      await ctx.db.delete(entry._id)
    }
    await ctx.db.delete(id)
  },
})

// Busca a entrada do aluno para uma aula específica dentro de um caderno.
// Se o aluno ainda não escreveu nada neste caderno para esta aula, retorna null.
export const getEntry = query({
  args: { notebookId: v.id('notebooks'), lessonId: v.id('lessons') },
  handler: async (ctx, { notebookId, lessonId }) => {
    const identity = await requireIdentity(ctx)
    const entry = await ctx.db
      .query('notebookEntries')
      .withIndex('by_student_notebook_lesson', (q) =>
        q.eq('studentId', identity.subject).eq('notebookId', notebookId).eq('lessonId', lessonId)
      )
      .first()
    if (!entry) return null
    return entry
  },
})

// Busca todas as entradas do aluno relacionadas a uma aula (em qualquer caderno).
// Usado para mostrar na UI da aula quais cadernos já têm anotações desta aula.
export const listEntriesForLesson = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    const identity = await requireIdentity(ctx)
    return await ctx.db
      .query('notebookEntries')
      .withIndex('by_student_lesson', (q) =>
        q.eq('studentId', identity.subject).eq('lessonId', lessonId)
      )
      .collect()
  },
})

export const upsertEntry = mutation({
  args: {
    notebookId: v.id('notebooks'),
    lessonId: v.id('lessons'),
    content: v.string(),
  },
  handler: async (ctx, { notebookId, lessonId, content }) => {
    const { identity } = await requirePerfil(ctx, ['aluno'])

    const notebook = await ctx.db.get(notebookId)
    if (!notebook || notebook.studentId !== identity.subject) throw new Error('Caderno inválido')

    const lesson = await ctx.db.get(lessonId)
    if (!lesson) throw new Error('Aula não encontrada')

    const safeContent = content.slice(0, MAX_CONTENT_LEN)
    const now = Date.now()

    const existing = await ctx.db
      .query('notebookEntries')
      .withIndex('by_student_notebook_lesson', (q) =>
        q.eq('studentId', identity.subject).eq('notebookId', notebookId).eq('lessonId', lessonId)
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { content: safeContent, updatedAt: now })
      await ctx.db.patch(notebookId, { updatedAt: now })
      return existing._id
    }

    const id = await ctx.db.insert('notebookEntries', {
      studentId: identity.subject,
      notebookId,
      lessonId,
      courseId: lesson.courseId,
      content: safeContent,
      updatedAt: now,
    })
    await ctx.db.patch(notebookId, { updatedAt: now })
    return id
  },
})
