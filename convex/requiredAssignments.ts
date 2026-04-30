import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireIdentity } from './lib/auth'

type Ctx = QueryCtx | MutationCtx

// Garante que o caller é dono ou admin da instituição. Throw em caso contrário.
async function ensureInstitutionAdmin(
  ctx: Ctx,
  institutionId: Id<'institutions'>,
  userId: string,
) {
  const member = await ctx.db
    .query('institutionMembers')
    .withIndex('by_institution_user', (q) =>
      q.eq('institutionId', institutionId).eq('userId', userId),
    )
    .unique()
  if (!member || member.status !== 'ativo' || member.role === 'membro') {
    throw new Error('Apenas dono ou admin da instituição pode gerenciar cursos obrigatórios.')
  }
  return member
}

// Lista cursos obrigatórios para uma instituição (visão admin).
export const listForInstitution = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const member = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject),
      )
      .unique()
    if (!member || member.status !== 'ativo') return []

    const rows = await ctx.db
      .query('requiredAssignments')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .collect()

    const enriched = await Promise.all(
      rows.map(async (r) => {
        const course = await ctx.db.get(r.courseId)
        return {
          _id: r._id,
          courseId: r.courseId,
          memberRole: r.memberRole,
          addedAt: r.addedAt,
          courseTitle: course?.title ?? 'Curso removido',
          courseSlug: course?.slug,
          coursePublished: course?.isPublished ?? false,
        }
      }),
    )

    enriched.sort((a, b) => b.addedAt - a.addedAt)
    return enriched
  },
})

// Lista cursos obrigatórios visíveis ao aluno autenticado, com base nas
// instituições onde ele é membro ativo. Retorna por curso o(s) institutionId(s)
// e nome(s) que tornam o curso obrigatório, e se o aluno já tem matrícula.
export const listForStudent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const memberships = await ctx.db
      .query('institutionMembers')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .filter((q) => q.eq(q.field('status'), 'ativo'))
      .collect()

    if (memberships.length === 0) return []

    const grouped = new Map<
      string,
      {
        courseId: string
        institutions: { institutionId: string; institutionName: string }[]
      }
    >()

    for (const m of memberships) {
      const institution = await ctx.db.get(m.institutionId)
      if (!institution) continue

      const rows = await ctx.db
        .query('requiredAssignments')
        .withIndex('by_institutionId', (q) =>
          q.eq('institutionId', m.institutionId),
        )
        .collect()

      for (const r of rows) {
        if (r.memberRole && r.memberRole !== m.role) continue
        const key = r.courseId as unknown as string
        if (!grouped.has(key)) {
          grouped.set(key, { courseId: key, institutions: [] })
        }
        grouped.get(key)!.institutions.push({
          institutionId: m.institutionId as unknown as string,
          institutionName: institution.name,
        })
      }
    }

    const enriched = await Promise.all(
      Array.from(grouped.values()).map(async (g) => {
        const course = await ctx.db.get(g.courseId as never)
        if (!course) return null
        const enrollment = await ctx.db
          .query('enrollments')
          .withIndex('by_student_course', (q) =>
            q
              .eq('studentId', identity.subject)
              .eq('courseId', g.courseId as never),
          )
          .unique()
        return {
          courseId: g.courseId,
          courseTitle: (course as { title: string }).title,
          courseSlug: (course as { slug?: string }).slug,
          isPublished: (course as { isPublished: boolean }).isPublished,
          institutions: g.institutions,
          enrolled: !!enrollment,
          completed: enrollment?.completedAt !== undefined,
        }
      }),
    )

    return enriched.filter((x): x is NonNullable<typeof x> => x !== null)
  },
})

// Verifica se um curso específico é obrigatório para o aluno (em ao menos uma
// instituição onde ele é membro ativo). Retorna a lista de instituições que o
// tornam obrigatório (vazia quando não é).
export const isCourseRequired = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { required: false as const, institutions: [] }

    const memberships = await ctx.db
      .query('institutionMembers')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .filter((q) => q.eq(q.field('status'), 'ativo'))
      .collect()

    const result: { institutionId: string; institutionName: string }[] = []
    for (const m of memberships) {
      const row = await ctx.db
        .query('requiredAssignments')
        .withIndex('by_institution_course', (q) =>
          q.eq('institutionId', m.institutionId).eq('courseId', courseId),
        )
        .unique()
      if (!row) continue
      if (row.memberRole && row.memberRole !== m.role) continue
      const inst = await ctx.db.get(m.institutionId)
      if (!inst) continue
      result.push({
        institutionId: m.institutionId as unknown as string,
        institutionName: inst.name,
      })
    }

    return { required: result.length > 0, institutions: result }
  },
})

export const add = mutation({
  args: {
    institutionId: v.id('institutions'),
    courseId: v.id('courses'),
    memberRole: v.optional(
      v.union(v.literal('dono'), v.literal('admin'), v.literal('membro')),
    ),
  },
  handler: async (ctx, { institutionId, courseId, memberRole }) => {
    const identity = await requireIdentity(ctx)
    await ensureInstitutionAdmin(ctx, institutionId, identity.subject)

    const course = await ctx.db.get(courseId)
    if (!course) throw new Error('Curso não encontrado.')

    const existing = await ctx.db
      .query('requiredAssignments')
      .withIndex('by_institution_course', (q) =>
        q.eq('institutionId', institutionId).eq('courseId', courseId),
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { memberRole })
      return existing._id
    }

    return await ctx.db.insert('requiredAssignments', {
      institutionId,
      courseId,
      memberRole,
      addedAt: Date.now(),
      addedByUserId: identity.subject,
    })
  },
})

export const remove = mutation({
  args: { assignmentId: v.id('requiredAssignments') },
  handler: async (ctx, { assignmentId }) => {
    const identity = await requireIdentity(ctx)
    const row = await ctx.db.get(assignmentId)
    if (!row) return
    await ensureInstitutionAdmin(ctx, row.institutionId, identity.subject)
    await ctx.db.delete(assignmentId)
  },
})
