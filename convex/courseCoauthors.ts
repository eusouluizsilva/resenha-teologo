import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

// Lista co-autores ativos de um curso. Apenas o dono pode ver. Retorna nome,
// email e avatarUrl do coautor para exibição.
export const list = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const course = await ctx.db.get(courseId)
    if (!course || course.creatorId !== identity.subject) return []

    const rows = await ctx.db
      .query('courseCoauthors')
      .withIndex('by_courseId', (q) => q.eq('courseId', courseId))
      .collect()

    const users = await Promise.all(
      rows.map((r) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', r.userId))
          .unique(),
      ),
    )

    return rows.map((r, i) => ({
      _id: r._id,
      userId: r.userId,
      role: r.role,
      addedAt: r.addedAt,
      name: users[i]?.name ?? users[i]?.email ?? 'Co-autor',
      email: users[i]?.email,
      avatarUrl: users[i]?.avatarUrl,
      handle: users[i]?.handle,
    }))
  },
})

// Lista cursos onde o usuário atual é co-autor. Mostra a função (editor/
// reviewer), nome do curso e dono. Útil para a futura aba "Compartilhados
// comigo" do criador.
export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const rows = await ctx.db
      .query('courseCoauthors')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()

    const courses = await Promise.all(rows.map((r) => ctx.db.get(r.courseId)))
    const owners = await Promise.all(
      courses.map((c) =>
        c
          ? ctx.db
              .query('users')
              .withIndex('by_clerkId', (q) => q.eq('clerkId', c.creatorId))
              .unique()
          : null,
      ),
    )

    return rows
      .map((r, i) => {
        const course = courses[i]
        if (!course) return null
        return {
          _id: r._id,
          courseId: r.courseId,
          title: course.title,
          slug: course.slug,
          isPublished: course.isPublished,
          role: r.role,
          ownerName: owners[i]?.name ?? owners[i]?.email ?? 'Criador',
          ownerHandle: owners[i]?.handle,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  },
})

// Adiciona co-autor por email. Apenas o dono do curso pode adicionar. O
// convidado precisa já ter conta na plataforma com função 'criador' para
// editar; reviewer não exige função criador (só lê). Não há convite por
// email pendente — adição é instantânea, e o coautor passa a ver o curso na
// aba "Compartilhados comigo" automaticamente.
export const addByEmail = mutation({
  args: {
    courseId: v.id('courses'),
    email: v.string(),
    role: v.union(v.literal('editor'), v.literal('reviewer')),
  },
  handler: async (ctx, { courseId, email, role }) => {
    const identity = await requireIdentity(ctx)

    const course = await ctx.db.get(courseId)
    if (!course || course.creatorId !== identity.subject) {
      throw new Error('Apenas o dono do curso pode adicionar co-autores.')
    }

    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Email inválido.')
    }

    const target = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', normalized))
      .unique()
    if (!target) {
      throw new Error('Não encontramos um usuário com este email. Peça para a pessoa criar conta primeiro.')
    }
    if (target.clerkId === identity.subject) {
      throw new Error('Você já é o dono deste curso.')
    }

    const existing = await ctx.db
      .query('courseCoauthors')
      .withIndex('by_course_user', (q) =>
        q.eq('courseId', courseId).eq('userId', target.clerkId),
      )
      .unique()
    if (existing) {
      if (existing.role !== role) {
        await ctx.db.patch(existing._id, { role })
      }
      return existing._id
    }

    return await ctx.db.insert('courseCoauthors', {
      courseId,
      userId: target.clerkId,
      role,
      addedAt: Date.now(),
      addedByUserId: identity.subject,
    })
  },
})

export const setRole = mutation({
  args: {
    coauthorId: v.id('courseCoauthors'),
    role: v.union(v.literal('editor'), v.literal('reviewer')),
  },
  handler: async (ctx, { coauthorId, role }) => {
    const identity = await requireIdentity(ctx)
    const row = await ctx.db.get(coauthorId)
    if (!row) throw new Error('Co-autor não encontrado.')
    const course = await ctx.db.get(row.courseId)
    if (!course || course.creatorId !== identity.subject) {
      throw new Error('Apenas o dono do curso pode alterar o papel.')
    }
    await ctx.db.patch(coauthorId, { role })
  },
})

export const remove = mutation({
  args: { coauthorId: v.id('courseCoauthors') },
  handler: async (ctx, { coauthorId }) => {
    const identity = await requireIdentity(ctx)
    const row = await ctx.db.get(coauthorId)
    if (!row) return
    const course = await ctx.db.get(row.courseId)
    if (!course || course.creatorId !== identity.subject) {
      throw new Error('Apenas o dono do curso pode remover co-autores.')
    }
    await ctx.db.delete(coauthorId)
  },
})
