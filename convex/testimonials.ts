import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

export const submit = mutation({
  args: {
    profileHandle: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { profileHandle, text }) => {
    const identity = await requireIdentity(ctx)

    if (text.trim().length === 0) throw new Error('O depoimento não pode estar vazio.')
    if (text.length > 500) throw new Error('O depoimento não pode ter mais de 500 caracteres.')

    const profileUser = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', profileHandle))
      .unique()

    if (!profileUser) throw new Error('Perfil não encontrado.')
    if (profileUser.clerkId === identity.subject) throw new Error('Você não pode deixar um depoimento no seu próprio perfil.')

    const existing = await ctx.db
      .query('testimonials')
      .withIndex('by_author_profile', (q) =>
        q.eq('authorId', identity.subject).eq('profileUserId', profileUser.clerkId)
      )
      .unique()

    if (existing) throw new Error('Você já enviou um depoimento para este perfil.')

    await ctx.db.insert('testimonials', {
      authorId: identity.subject,
      profileUserId: profileUser.clerkId,
      text: text.trim(),
      status: 'pending',
      createdAt: Date.now(),
    })
  },
})

export const approve = mutation({
  args: { testimonialId: v.id('testimonials') },
  handler: async (ctx, { testimonialId }) => {
    const identity = await requireIdentity(ctx)

    const testimonial = await ctx.db.get(testimonialId)
    if (!testimonial) throw new Error('Depoimento não encontrado.')
    if (testimonial.profileUserId !== identity.subject) throw new Error('Não autorizado.')

    await ctx.db.patch(testimonialId, { status: 'approved', approvedAt: Date.now() })
  },
})

export const reject = mutation({
  args: { testimonialId: v.id('testimonials') },
  handler: async (ctx, { testimonialId }) => {
    const identity = await requireIdentity(ctx)

    const testimonial = await ctx.db.get(testimonialId)
    if (!testimonial) throw new Error('Depoimento não encontrado.')
    if (testimonial.profileUserId !== identity.subject) throw new Error('Não autorizado.')

    await ctx.db.patch(testimonialId, { status: 'rejected' })
  },
})

export const remove = mutation({
  args: { testimonialId: v.id('testimonials') },
  handler: async (ctx, { testimonialId }) => {
    const identity = await requireIdentity(ctx)

    const testimonial = await ctx.db.get(testimonialId)
    if (!testimonial) throw new Error('Depoimento não encontrado.')

    const isOwner = testimonial.profileUserId === identity.subject
    const isAuthorPending = testimonial.authorId === identity.subject && testimonial.status === 'pending'

    if (!isOwner && !isAuthorPending) throw new Error('Não autorizado.')

    await ctx.db.delete(testimonialId)
  },
})

export const listApproved = query({
  args: { profileUserId: v.string() },
  handler: async (ctx, { profileUserId }) => {
    const testimonials = await ctx.db
      .query('testimonials')
      .withIndex('by_profileUserId_status', (q) =>
        q.eq('profileUserId', profileUserId).eq('status', 'approved')
      )
      .order('desc')
      .collect()

    return await Promise.all(
      testimonials.map(async (t) => {
        const author = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', t.authorId))
          .unique()

        return {
          _id: t._id,
          text: t.text,
          createdAt: t.createdAt,
          approvedAt: t.approvedAt,
          authorName: author?.name ?? 'Usuário',
          authorAvatarUrl: author?.avatarUrl,
          authorHandle: author?.handle,
        }
      })
    )
  },
})

export const listPending = query({
  args: { profileUserId: v.string() },
  handler: async (ctx, { profileUserId }) => {
    const identity = await requireIdentity(ctx)
    if (identity.subject !== profileUserId) throw new Error('Não autorizado.')

    const testimonials = await ctx.db
      .query('testimonials')
      .withIndex('by_profileUserId_status', (q) =>
        q.eq('profileUserId', profileUserId).eq('status', 'pending')
      )
      .order('desc')
      .collect()

    return await Promise.all(
      testimonials.map(async (t) => {
        const author = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', t.authorId))
          .unique()

        return {
          _id: t._id,
          text: t.text,
          createdAt: t.createdAt,
          authorName: author?.name ?? 'Usuário',
          authorAvatarUrl: author?.avatarUrl,
          authorHandle: author?.handle,
        }
      })
    )
  },
})
