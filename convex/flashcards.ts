import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireCurrentUser } from './lib/auth'

// Flashcards com revisão espaçada simplificada (variação do SM-2).
// Cada card mantém easiness (1.3–2.8), intervalDays (próximo intervalo em dias),
// repetitions (acertos consecutivos) e dueAt (próxima data prevista).
// reviewCard recebe um grade 0-3 e recalcula os campos:
//   0 = errou     -> reseta repetitions, intervalo 1 dia, easiness -0.2
//   1 = difícil   -> repetitions+1, intervalo *1.2, easiness -0.15
//   2 = bom       -> repetitions+1, intervalo *easiness, easiness inalterado
//   3 = fácil     -> repetitions+1, intervalo *easiness*1.3, easiness +0.15
// easiness sempre clamped em [1.3, 2.8]; intervalDays mínimo 1.

const MS_PER_DAY = 86_400_000
const MIN_EASINESS = 1.3
const MAX_EASINESS = 2.8
const DEFAULT_EASINESS = 2.3

function clampEasiness(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_EASINESS
  return Math.min(MAX_EASINESS, Math.max(MIN_EASINESS, value))
}

export const createDeck = mutation({
  args: {
    title: v.string(),
    courseId: v.optional(v.id('courses')),
  },
  handler: async (ctx, { title, courseId }) => {
    const { identity } = await requireCurrentUser(ctx)
    const trimmed = title.trim()
    if (!trimmed) throw new Error('Título obrigatório')

    return await ctx.db.insert('flashcardDecks', {
      studentId: identity.subject,
      title: trimmed.slice(0, 120),
      courseId,
      createdAt: Date.now(),
    })
  },
})

export const renameDeck = mutation({
  args: { id: v.id('flashcardDecks'), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const { identity } = await requireCurrentUser(ctx)
    const deck = await ctx.db.get(id)
    if (!deck || deck.studentId !== identity.subject) throw new Error('Não autorizado')
    const trimmed = title.trim()
    if (!trimmed) throw new Error('Título obrigatório')
    await ctx.db.patch(id, { title: trimmed.slice(0, 120), updatedAt: Date.now() })
  },
})

export const deleteDeck = mutation({
  args: { id: v.id('flashcardDecks') },
  handler: async (ctx, { id }) => {
    const { identity } = await requireCurrentUser(ctx)
    const deck = await ctx.db.get(id)
    if (!deck || deck.studentId !== identity.subject) throw new Error('Não autorizado')

    const cards = await ctx.db
      .query('flashcards')
      .withIndex('by_deckId', (q) => q.eq('deckId', id))
      .collect()
    await Promise.all(cards.map((c) => ctx.db.delete(c._id)))
    await ctx.db.delete(id)
  },
})

export const createCard = mutation({
  args: {
    deckId: v.id('flashcardDecks'),
    front: v.string(),
    back: v.string(),
  },
  handler: async (ctx, { deckId, front, back }) => {
    const { identity } = await requireCurrentUser(ctx)
    const deck = await ctx.db.get(deckId)
    if (!deck || deck.studentId !== identity.subject) throw new Error('Não autorizado')

    const f = front.trim()
    const b = back.trim()
    if (!f || !b) throw new Error('Frente e verso obrigatórios')

    return await ctx.db.insert('flashcards', {
      deckId,
      studentId: identity.subject,
      front: f.slice(0, 500),
      back: b.slice(0, 2000),
      easiness: DEFAULT_EASINESS,
      intervalDays: 0,
      repetitions: 0,
      dueAt: Date.now(),
      createdAt: Date.now(),
    })
  },
})

export const updateCard = mutation({
  args: {
    id: v.id('flashcards'),
    front: v.string(),
    back: v.string(),
  },
  handler: async (ctx, { id, front, back }) => {
    const { identity } = await requireCurrentUser(ctx)
    const card = await ctx.db.get(id)
    if (!card || card.studentId !== identity.subject) throw new Error('Não autorizado')

    const f = front.trim()
    const b = back.trim()
    if (!f || !b) throw new Error('Frente e verso obrigatórios')

    await ctx.db.patch(id, {
      front: f.slice(0, 500),
      back: b.slice(0, 2000),
    })
  },
})

export const deleteCard = mutation({
  args: { id: v.id('flashcards') },
  handler: async (ctx, { id }) => {
    const { identity } = await requireCurrentUser(ctx)
    const card = await ctx.db.get(id)
    if (!card || card.studentId !== identity.subject) throw new Error('Não autorizado')
    await ctx.db.delete(id)
  },
})

export const reviewCard = mutation({
  args: {
    id: v.id('flashcards'),
    grade: v.union(
      v.literal(0),
      v.literal(1),
      v.literal(2),
      v.literal(3)
    ),
  },
  handler: async (ctx, { id, grade }) => {
    const { identity } = await requireCurrentUser(ctx)
    const card = await ctx.db.get(id)
    if (!card || card.studentId !== identity.subject) throw new Error('Não autorizado')

    const now = Date.now()
    let easiness = card.easiness
    let repetitions = card.repetitions
    let intervalDays = card.intervalDays

    if (grade === 0) {
      repetitions = 0
      intervalDays = 1
      easiness = clampEasiness(easiness - 0.2)
    } else {
      repetitions += 1
      if (grade === 1) {
        intervalDays = Math.max(1, (intervalDays || 1) * 1.2)
        easiness = clampEasiness(easiness - 0.15)
      } else if (grade === 2) {
        intervalDays = repetitions === 1 ? 1 : Math.max(1, (intervalDays || 1) * easiness)
      } else {
        intervalDays = repetitions === 1 ? 2 : Math.max(1, (intervalDays || 1) * easiness * 1.3)
        easiness = clampEasiness(easiness + 0.15)
      }
    }

    const cappedInterval = Math.min(intervalDays, 365)

    await ctx.db.patch(id, {
      easiness,
      intervalDays: cappedInterval,
      repetitions,
      dueAt: now + Math.round(cappedInterval * MS_PER_DAY),
      lastReviewedAt: now,
    })
  },
})

export const listMyDecks = query({
  args: {},
  handler: async (ctx) => {
    const { identity } = await requireCurrentUser(ctx)

    const decks = await ctx.db
      .query('flashcardDecks')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()

    const now = Date.now()
    const enriched = await Promise.all(
      decks.map(async (deck) => {
        const cards = await ctx.db
          .query('flashcards')
          .withIndex('by_deckId', (q) => q.eq('deckId', deck._id))
          .collect()
        const dueNow = cards.filter((c) => c.dueAt <= now).length
        const course = deck.courseId ? await ctx.db.get(deck.courseId) : null
        return {
          ...deck,
          totalCards: cards.length,
          dueNow,
          courseTitle: course?.title ?? null,
        }
      })
    )

    return enriched.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listCardsInDeck = query({
  args: { deckId: v.id('flashcardDecks') },
  handler: async (ctx, { deckId }) => {
    const { identity } = await requireCurrentUser(ctx)
    const deck = await ctx.db.get(deckId)
    if (!deck || deck.studentId !== identity.subject) throw new Error('Não autorizado')

    const cards = await ctx.db
      .query('flashcards')
      .withIndex('by_deckId', (q) => q.eq('deckId', deckId))
      .collect()

    return {
      deck,
      cards: cards.sort((a, b) => a.createdAt - b.createdAt),
    }
  },
})

export const listDueCards = query({
  args: { deckId: v.optional(v.id('flashcardDecks')) },
  handler: async (ctx, { deckId }) => {
    const { identity } = await requireCurrentUser(ctx)
    const now = Date.now()

    if (deckId) {
      const deck = await ctx.db.get(deckId)
      if (!deck || deck.studentId !== identity.subject) throw new Error('Não autorizado')
      const cards = await ctx.db
        .query('flashcards')
        .withIndex('by_deckId', (q) => q.eq('deckId', deckId))
        .collect()
      return cards
        .filter((c) => c.dueAt <= now)
        .sort((a, b) => a.dueAt - b.dueAt)
    }

    const cards = await ctx.db
      .query('flashcards')
      .withIndex('by_student_due', (q) => q.eq('studentId', identity.subject))
      .collect()
    return cards
      .filter((c) => c.dueAt <= now)
      .sort((a, b) => a.dueAt - b.dueAt)
  },
})
