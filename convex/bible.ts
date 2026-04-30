import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getOptionalIdentity, requireIdentity } from './lib/auth'

const ALLOWED_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'] as const
type AllowedColor = (typeof ALLOWED_COLORS)[number]

function isAllowedColor(c: string): c is AllowedColor {
  return (ALLOWED_COLORS as readonly string[]).includes(c)
}

// Lista highlights e notas do aluno autenticado para um capítulo. Retorna
// arrays vazios para usuários anônimos (a página da bíblia é pública).
export const listForChapter = query({
  args: {
    bookSlug: v.string(),
    chapter: v.number(),
  },
  handler: async (ctx, { bookSlug, chapter }) => {
    const identity = await getOptionalIdentity(ctx)
    if (!identity) {
      return { highlights: [], notes: [] }
    }
    const studentId = identity.subject

    const highlightRows = await ctx.db
      .query('bibleHighlights')
      .withIndex('by_student_chapter', (q) =>
        q.eq('studentId', studentId).eq('bookSlug', bookSlug).eq('chapter', chapter),
      )
      .collect()

    const noteRows = await ctx.db
      .query('bibleNotes')
      .withIndex('by_student_chapter', (q) =>
        q.eq('studentId', studentId).eq('bookSlug', bookSlug).eq('chapter', chapter),
      )
      .collect()

    return {
      highlights: highlightRows.map((h) => ({ verse: h.verse, color: h.color })),
      notes: noteRows
        .map((n) => ({
          _id: n._id,
          verse: n.verse,
          note: n.note,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        }))
        .sort((a, b) => a.verse - b.verse || a.createdAt - b.createdAt),
    }
  },
})

// Define ou remove o highlight de um versículo. color=null limpa.
export const setHighlight = mutation({
  args: {
    bookSlug: v.string(),
    chapter: v.number(),
    verse: v.number(),
    color: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { bookSlug, chapter, verse, color }) => {
    const identity = await requireIdentity(ctx)
    if (color !== null && !isAllowedColor(color)) {
      throw new Error('Cor inválida')
    }
    if (verse < 1 || chapter < 1) {
      throw new Error('Referência inválida')
    }

    const existing = await ctx.db
      .query('bibleHighlights')
      .withIndex('by_student_verse', (q) =>
        q
          .eq('studentId', identity.subject)
          .eq('bookSlug', bookSlug)
          .eq('chapter', chapter)
          .eq('verse', verse),
      )
      .unique()

    if (color === null) {
      if (existing) await ctx.db.delete(existing._id)
      return null
    }

    if (existing) {
      await ctx.db.patch(existing._id, { color })
      return existing._id
    }

    return await ctx.db.insert('bibleHighlights', {
      studentId: identity.subject,
      bookSlug,
      chapter,
      verse,
      color,
      createdAt: Date.now(),
    })
  },
})

export const addNote = mutation({
  args: {
    bookSlug: v.string(),
    chapter: v.number(),
    verse: v.number(),
    note: v.string(),
  },
  handler: async (ctx, { bookSlug, chapter, verse, note }) => {
    const identity = await requireIdentity(ctx)
    const trimmed = note.trim()
    if (trimmed.length === 0) throw new Error('Anotação vazia')
    if (trimmed.length > 2000) throw new Error('Anotação muito longa (máx. 2000)')
    if (verse < 1 || chapter < 1) throw new Error('Referência inválida')

    const now = Date.now()
    return await ctx.db.insert('bibleNotes', {
      studentId: identity.subject,
      bookSlug,
      chapter,
      verse,
      note: trimmed,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateNote = mutation({
  args: {
    id: v.id('bibleNotes'),
    note: v.string(),
  },
  handler: async (ctx, { id, note }) => {
    const identity = await requireIdentity(ctx)
    const row = await ctx.db.get(id)
    if (!row) throw new Error('Anotação não encontrada')
    if (row.studentId !== identity.subject) throw new Error('Não autorizado')
    const trimmed = note.trim()
    if (trimmed.length === 0) throw new Error('Anotação vazia')
    if (trimmed.length > 2000) throw new Error('Anotação muito longa (máx. 2000)')
    await ctx.db.patch(id, { note: trimmed, updatedAt: Date.now() })
    return id
  },
})

export const removeNote = mutation({
  args: { id: v.id('bibleNotes') },
  handler: async (ctx, { id }) => {
    const identity = await requireIdentity(ctx)
    const row = await ctx.db.get(id)
    if (!row) return null
    if (row.studentId !== identity.subject) throw new Error('Não autorizado')
    await ctx.db.delete(id)
    return null
  },
})
