import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { canEditCourse, requireUserFunction } from './lib/auth'

export const getByLesson = query({
  args: { lessonId: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { lessonId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const lesson = await ctx.db.get(lessonId)
    if (!lesson) return null
    if (!(await canEditCourse(ctx, lesson.courseId, identity.subject))) return null

    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .first()
    return quiz
  },
})

export const upsert = mutation({
  args: {
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    creatorId: v.string(),
    questions: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        options: v.array(v.object({ id: v.string(), text: v.string() })),
        correctOptionId: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson) throw new Error('Não autorizado')
    if (!(await canEditCourse(ctx, lesson.courseId, identity.subject))) {
      throw new Error('Não autorizado')
    }
    if (lesson.courseId !== args.courseId) throw new Error('Curso inválido')

    // Regra do produto: quizzes regulares devem ter pelo menos 5 perguntas.
    // O quiz da última aula costuma ser mais denso (10 ou 20), mas aceitamos
    // qualquer valor dentro da faixa 5–20. Cada pergunta precisa ter ao menos
    // duas alternativas com texto para não ser puramente decorativa.
    if (args.questions.length < 5) {
      throw new Error('O quiz precisa ter ao menos 5 perguntas.')
    }
    if (args.questions.length > 20) {
      throw new Error('O quiz pode ter no máximo 20 perguntas.')
    }
    for (const q of args.questions) {
      if (!q.text.trim()) throw new Error('Todas as perguntas precisam de enunciado.')
      const validOptions = q.options.filter((o) => o.text.trim())
      if (validOptions.length < 2) {
        throw new Error('Cada pergunta precisa de pelo menos 2 alternativas.')
      }
      if (!q.options.some((o) => o.id === q.correctOptionId)) {
        throw new Error('Cada pergunta precisa ter uma alternativa correta marcada.')
      }
    }

    const existing = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', args.lessonId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { questions: args.questions })
      return existing._id
    }
    const { creatorId: _ownerHint, ...rest } = args
    void _ownerHint
    return await ctx.db.insert('quizzes', {
      ...rest,
      creatorId: lesson.creatorId,
    })
  },
})

export const remove = mutation({
  args: { lessonId: v.id('lessons'), creatorId: v.string() },
  handler: async (ctx, { lessonId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])

    const lesson = await ctx.db.get(lessonId)
    if (!lesson) return
    if (!(await canEditCourse(ctx, lesson.courseId, identity.subject))) return

    const quiz = await ctx.db
      .query('quizzes')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .first()
    if (!quiz) return
    await ctx.db.delete(quiz._id)
  },
})
