import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireLessonAccess } from './lib/auth'
import { requireCurrentUser } from './lib/auth'

// Anotações de aula vinculadas a um timestamp do vídeo. Só o próprio aluno
// acessa suas anotações. Só matriculados (ou criador dono) podem criar.

const MAX_NOTE_LEN = 1000

export const create = mutation({
  args: {
    lessonId: v.id('lessons'),
    timestampSeconds: v.number(),
    note: v.string(),
  },
  handler: async (ctx, { lessonId, timestampSeconds, note }) => {
    const { identity, lesson } = await requireLessonAccess(ctx, lessonId)
    const trimmed = note.trim()
    if (!trimmed) throw new Error('Nota vazia')
    const safeSeconds = Math.max(0, Math.floor(timestampSeconds))

    return await ctx.db.insert('lessonTimestamps', {
      studentId: identity.subject,
      lessonId,
      courseId: lesson.courseId,
      timestampSeconds: safeSeconds,
      note: trimmed.slice(0, MAX_NOTE_LEN),
      createdAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: { id: v.id('lessonTimestamps'), note: v.string() },
  handler: async (ctx, { id, note }) => {
    const { identity } = await requireCurrentUser(ctx)
    const entry = await ctx.db.get(id)
    if (!entry || entry.studentId !== identity.subject) throw new Error('Não autorizado')
    const trimmed = note.trim()
    if (!trimmed) throw new Error('Nota vazia')
    await ctx.db.patch(id, { note: trimmed.slice(0, MAX_NOTE_LEN) })
  },
})

export const remove = mutation({
  args: { id: v.id('lessonTimestamps') },
  handler: async (ctx, { id }) => {
    const { identity } = await requireCurrentUser(ctx)
    const entry = await ctx.db.get(id)
    if (!entry || entry.studentId !== identity.subject) throw new Error('Não autorizado')
    await ctx.db.delete(id)
  },
})

export const listMyByLesson = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const entries = await ctx.db
      .query('lessonTimestamps')
      .withIndex('by_student_lesson', (q) =>
        q.eq('studentId', identity.subject).eq('lessonId', lessonId)
      )
      .collect()

    return entries.sort((a, b) => a.timestampSeconds - b.timestampSeconds)
  },
})
