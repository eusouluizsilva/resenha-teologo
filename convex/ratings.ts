import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

export const submit = mutation({
  args: {
    profileHandle: v.string(),
    stars: v.number(),
  },
  handler: async (ctx, { profileHandle, stars }) => {
    const identity = await requireIdentity(ctx)

    if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
      throw new Error('A nota deve ser um número inteiro entre 1 e 5.')
    }

    const profileUser = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', profileHandle))
      .unique()

    if (!profileUser) throw new Error('Perfil não encontrado.')
    if (profileUser.clerkId === identity.subject) throw new Error('Você não pode avaliar o seu próprio perfil.')

    const profileFunctions = await ctx.db
      .query('userFunctions')
      .withIndex('by_userId', (q) => q.eq('userId', profileUser.clerkId))
      .collect()

    const isCreator = profileFunctions.some((f) => f.function === 'criador')
    const isInstitution = profileFunctions.some((f) => f.function === 'instituicao')

    if (!isCreator && !isInstitution) {
      throw new Error('Avaliações por estrelas são permitidas apenas para criadores de conteúdo e instituições.')
    }

    // Validate minimum interaction: completed at least 1 lesson from this creator, or is a member
    let hasInteraction = false

    if (isCreator) {
      const creatorLessons = await ctx.db
        .query('lessons')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', profileUser.clerkId))
        .collect()

      const lessonIds = new Set(creatorLessons.map((l) => l._id))

      const progressItems = await ctx.db
        .query('progress')
        .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
        .collect()

      hasInteraction = progressItems.some((p) => p.completed && lessonIds.has(p.lessonId))
    }

    if (!hasInteraction && isInstitution) {
      const institutions = await ctx.db
        .query('institutions')
        .withIndex('by_createdByUserId', (q) => q.eq('createdByUserId', profileUser.clerkId))
        .collect()

      for (const inst of institutions) {
        const membership = await ctx.db
          .query('institutionMembers')
          .withIndex('by_institution_user', (q) =>
            q.eq('institutionId', inst._id).eq('userId', identity.subject)
          )
          .unique()

        if (membership && membership.status === 'ativo') {
          hasInteraction = true
          break
        }
      }
    }

    if (!hasInteraction) {
      throw new Error('Você precisa ter assistido ao menos uma aula deste criador, ou ser membro desta instituição, para deixar uma avaliação.')
    }

    const existing = await ctx.db
      .query('ratings')
      .withIndex('by_author_profile', (q) =>
        q.eq('authorId', identity.subject).eq('profileUserId', profileUser.clerkId)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { stars, updatedAt: Date.now() })
    } else {
      await ctx.db.insert('ratings', {
        authorId: identity.subject,
        profileUserId: profileUser.clerkId,
        stars,
        createdAt: Date.now(),
      })
    }
  },
})

export const getAverage = query({
  args: { profileUserId: v.string() },
  handler: async (ctx, { profileUserId }) => {
    const ratings = await ctx.db
      .query('ratings')
      .withIndex('by_profileUserId', (q) => q.eq('profileUserId', profileUserId))
      .collect()

    if (ratings.length === 0) return { average: 0, count: 0 }

    const sum = ratings.reduce((acc, r) => acc + r.stars, 0)
    return {
      average: Math.round((sum / ratings.length) * 10) / 10,
      count: ratings.length,
    }
  },
})

export const getMyRating = query({
  args: { profileUserId: v.string() },
  handler: async (ctx, { profileUserId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const rating = await ctx.db
      .query('ratings')
      .withIndex('by_author_profile', (q) =>
        q.eq('authorId', identity.subject).eq('profileUserId', profileUserId)
      )
      .unique()

    return rating?.stars ?? null
  },
})
