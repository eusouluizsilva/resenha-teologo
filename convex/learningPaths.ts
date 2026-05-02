import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireIdentity } from './lib/auth'

type Ctx = QueryCtx | MutationCtx

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80)
}

async function ensureUniqueSlug(ctx: Ctx, base: string): Promise<string> {
  let candidate = base.length > 0 ? base : 'trilha'
  let n = 0
  while (true) {
    const slug = n === 0 ? candidate : `${candidate}-${n}`
    const existing = await ctx.db
      .query('learningPaths')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!existing) return slug
    n += 1
    if (n > 200) {
      candidate = `${base}-${Date.now().toString(36)}`
      n = 0
    }
  }
}

async function ensurePathOwnership(
  ctx: Ctx,
  pathId: Id<'learningPaths'>,
  userId: string,
) {
  const path = await ctx.db.get(pathId)
  if (!path) throw new Error('Trilha não encontrada.')
  if (path.creatorId === userId) return path
  // Permite donos/admins da instituição vinculada também editarem.
  if (path.institutionId) {
    const member = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', path.institutionId!).eq('userId', userId),
      )
      .unique()
    if (member && member.status === 'ativo' && member.role !== 'membro') {
      return path
    }
  }
  throw new Error('Não autorizado.')
}

// Lista trilhas que o usuário pode editar: criadas por ele ou de instituições
// onde ele é dono/admin.
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const own = await ctx.db
      .query('learningPaths')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
      .collect()

    const memberships = await ctx.db
      .query('institutionMembers')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .filter((q) => q.eq(q.field('status'), 'ativo'))
      .collect()

    const adminInstIds = memberships
      .filter((m) => m.role !== 'membro')
      .map((m) => m.institutionId)

    const fromInst: typeof own = []
    for (const id of adminInstIds) {
      const rows = await ctx.db
        .query('learningPaths')
        .withIndex('by_institutionId', (q) => q.eq('institutionId', id))
        .collect()
      for (const r of rows) {
        if (!own.find((o) => o._id === r._id)) fromInst.push(r)
      }
    }

    const all = [...own, ...fromInst]
    all.sort((a, b) => b._creationTime - a._creationTime)

    return Promise.all(
      all.map(async (p) => {
        const items = await ctx.db
          .query('pathItems')
          .withIndex('by_pathId', (q) => q.eq('pathId', p._id))
          .collect()
        return {
          _id: p._id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          coverUrl: p.coverUrl,
          isPublished: p.isPublished,
          institutionId: p.institutionId,
          itemsCount: items.length,
        }
      }),
    )
  },
})

// Lista trilhas publicadas de uma instituição (visão pública para o aluno).
export const listForInstitution = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const rows = await ctx.db
      .query('learningPaths')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .filter((q) => q.eq(q.field('isPublished'), true))
      .collect()

    return Promise.all(
      rows.map(async (p) => {
        const items = await ctx.db
          .query('pathItems')
          .withIndex('by_pathId', (q) => q.eq('pathId', p._id))
          .collect()
        return {
          _id: p._id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          coverUrl: p.coverUrl,
          itemsCount: items.length,
        }
      }),
    )
  },
})

// Detalhe completo de uma trilha (com items + cursos resolvidos). Edição
// restrita ao dono/admin; leitura pública quando publicada.
export const getById = query({
  args: { pathId: v.id('learningPaths') },
  handler: async (ctx, { pathId }) => {
    const path = await ctx.db.get(pathId)
    if (!path) return null

    const identity = await ctx.auth.getUserIdentity()
    const isOwner = identity && path.creatorId === identity.subject
    let isInstAdmin = false
    if (identity && path.institutionId) {
      const m = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q
            .eq('institutionId', path.institutionId!)
            .eq('userId', identity.subject),
        )
        .unique()
      if (m && m.status === 'ativo' && m.role !== 'membro') isInstAdmin = true
    }
    if (!path.isPublished && !isOwner && !isInstAdmin) return null

    const items = await ctx.db
      .query('pathItems')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()
    items.sort((a, b) => a.order - b.order)

    const courses = await Promise.all(
      items.map(async (it) => {
        const c = await ctx.db.get(it.courseId)
        return {
          itemId: it._id,
          courseId: it.courseId,
          order: it.order,
          title: c?.title ?? 'Curso removido',
          slug: c?.slug,
          thumbnail: c?.thumbnail,
          isPublished: c?.isPublished ?? false,
          totalLessons: c?.totalLessons ?? 0,
        }
      }),
    )

    return {
      _id: path._id,
      title: path.title,
      slug: path.slug,
      description: path.description,
      coverUrl: path.coverUrl,
      isPublished: path.isPublished,
      institutionId: path.institutionId,
      creatorId: path.creatorId,
      items: courses,
      canEdit: !!(isOwner || isInstAdmin),
    }
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const path = await ctx.db
      .query('learningPaths')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!path || !path.isPublished) return null

    const items = await ctx.db
      .query('pathItems')
      .withIndex('by_pathId', (q) => q.eq('pathId', path._id))
      .collect()
    items.sort((a, b) => a.order - b.order)

    const courses = await Promise.all(
      items.map(async (it) => {
        const c = await ctx.db.get(it.courseId)
        return {
          courseId: it.courseId,
          order: it.order,
          title: c?.title ?? 'Curso removido',
          slug: c?.slug,
          thumbnail: c?.thumbnail,
          totalLessons: c?.totalLessons ?? 0,
        }
      }),
    )

    let institutionName: string | undefined
    if (path.institutionId) {
      const inst = await ctx.db.get(path.institutionId)
      institutionName = inst?.name
    }

    return {
      _id: path._id,
      title: path.title,
      slug: path.slug,
      description: path.description,
      coverUrl: path.coverUrl,
      institutionName,
      items: courses,
    }
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    institutionId: v.optional(v.id('institutions')),
    coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, { title, description, institutionId, coverUrl }) => {
    const identity = await requireIdentity(ctx)

    if (institutionId) {
      const member = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', institutionId).eq('userId', identity.subject),
        )
        .unique()
      if (!member || member.status !== 'ativo' || member.role === 'membro') {
        throw new Error('Apenas dono ou admin da instituição pode criar trilha.')
      }
    }

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 3) {
      throw new Error('Título precisa de ao menos 3 caracteres.')
    }
    const slug = await ensureUniqueSlug(ctx, slugify(trimmedTitle))

    const now = Date.now()
    return await ctx.db.insert('learningPaths', {
      title: trimmedTitle,
      slug,
      description: description.trim().slice(0, 2000),
      coverUrl: coverUrl?.trim() || undefined,
      institutionId,
      creatorId: identity.subject,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    pathId: v.id('learningPaths'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, { pathId, title, description, coverUrl, isPublished }) => {
    const identity = await requireIdentity(ctx)
    await ensurePathOwnership(ctx, pathId, identity.subject)

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (title !== undefined) {
      const t = title.trim()
      if (t.length < 3) throw new Error('Título precisa de ao menos 3 caracteres.')
      patch.title = t
    }
    if (description !== undefined) patch.description = description.trim().slice(0, 2000)
    if (coverUrl !== undefined) {
      const url = coverUrl.trim()
      if (url.length > 0 && !/^https?:\/\//i.test(url)) {
        throw new Error('URL da capa precisa começar com http(s)://')
      }
      patch.coverUrl = url.length > 0 ? url : undefined
    }
    if (isPublished !== undefined) {
      if (isPublished) {
        const items = await ctx.db
          .query('pathItems')
          .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
          .collect()
        if (items.length === 0) {
          throw new Error('Adicione ao menos um curso antes de publicar a trilha.')
        }
      }
      patch.isPublished = isPublished
    }

    await ctx.db.patch(pathId, patch)
  },
})

export const remove = mutation({
  args: { pathId: v.id('learningPaths') },
  handler: async (ctx, { pathId }) => {
    const identity = await requireIdentity(ctx)
    await ensurePathOwnership(ctx, pathId, identity.subject)

    const items = await ctx.db
      .query('pathItems')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()
    for (const it of items) await ctx.db.delete(it._id)

    const enrollments = await ctx.db
      .query('pathEnrollments')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()
    for (const e of enrollments) await ctx.db.delete(e._id)

    await ctx.db.delete(pathId)
  },
})

export const addItem = mutation({
  args: {
    pathId: v.id('learningPaths'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, { pathId, courseId }) => {
    const identity = await requireIdentity(ctx)
    await ensurePathOwnership(ctx, pathId, identity.subject)

    const existing = await ctx.db
      .query('pathItems')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()
    if (existing.find((it) => it.courseId === courseId)) {
      throw new Error('Esse curso já está na trilha.')
    }
    const order = existing.length

    await ctx.db.insert('pathItems', {
      pathId,
      courseId,
      order,
    })
    await ctx.db.patch(pathId, { updatedAt: Date.now() })
  },
})

export const removeItem = mutation({
  args: { itemId: v.id('pathItems') },
  handler: async (ctx, { itemId }) => {
    const identity = await requireIdentity(ctx)
    const item = await ctx.db.get(itemId)
    if (!item) return
    await ensurePathOwnership(ctx, item.pathId, identity.subject)

    await ctx.db.delete(itemId)

    const remaining = await ctx.db
      .query('pathItems')
      .withIndex('by_pathId', (q) => q.eq('pathId', item.pathId))
      .collect()
    remaining.sort((a, b) => a.order - b.order)
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i) {
        await ctx.db.patch(remaining[i]._id, { order: i })
      }
    }
    await ctx.db.patch(item.pathId, { updatedAt: Date.now() })
  },
})

export const moveItem = mutation({
  args: {
    itemId: v.id('pathItems'),
    direction: v.union(v.literal('up'), v.literal('down')),
  },
  handler: async (ctx, { itemId, direction }) => {
    const identity = await requireIdentity(ctx)
    const item = await ctx.db.get(itemId)
    if (!item) return
    await ensurePathOwnership(ctx, item.pathId, identity.subject)

    const items = await ctx.db
      .query('pathItems')
      .withIndex('by_pathId', (q) => q.eq('pathId', item.pathId))
      .collect()
    items.sort((a, b) => a.order - b.order)
    const idx = items.findIndex((x) => x._id === itemId)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= items.length) return

    const a = items[idx]
    const b = items[targetIdx]
    await ctx.db.patch(a._id, { order: b.order })
    await ctx.db.patch(b._id, { order: a.order })
    await ctx.db.patch(item.pathId, { updatedAt: Date.now() })
  },
})

export const enroll = mutation({
  args: { pathId: v.id('learningPaths') },
  handler: async (ctx, { pathId }) => {
    const identity = await requireIdentity(ctx)
    const path = await ctx.db.get(pathId)
    if (!path || !path.isPublished) throw new Error('Trilha indisponível.')

    const existing = await ctx.db
      .query('pathEnrollments')
      .withIndex('by_student_path', (q) =>
        q.eq('studentId', identity.subject).eq('pathId', pathId),
      )
      .unique()
    if (existing) return existing._id

    return await ctx.db.insert('pathEnrollments', {
      pathId,
      studentId: identity.subject,
      status: 'active',
      startedAt: Date.now(),
    })
  },
})

// Admin/dono da instituição matricula um membro específico no plano de estudo.
// Valida que: (1) o caller é admin/dono da instituição da trilha; (2) o
// memberUserId é membro ativo da mesma instituição. Idempotente: se já
// matriculado, retorna o id existente.
export const enrollMember = mutation({
  args: {
    pathId: v.id('learningPaths'),
    memberUserId: v.string(),
  },
  handler: async (ctx, { pathId, memberUserId }) => {
    const identity = await requireIdentity(ctx)
    const path = await ctx.db.get(pathId)
    if (!path) throw new Error('Trilha não encontrada.')
    if (!path.institutionId) {
      throw new Error('Apenas trilhas institucionais aceitam matrícula manual de alunos.')
    }
    await ensurePathOwnership(ctx, pathId, identity.subject)

    const targetMember = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', path.institutionId!).eq('userId', memberUserId),
      )
      .unique()
    if (!targetMember || targetMember.status !== 'ativo') {
      throw new Error('Usuário não é membro ativo desta instituição.')
    }

    const existing = await ctx.db
      .query('pathEnrollments')
      .withIndex('by_student_path', (q) =>
        q.eq('studentId', memberUserId).eq('pathId', pathId),
      )
      .unique()
    if (existing) return existing._id

    return await ctx.db.insert('pathEnrollments', {
      pathId,
      studentId: memberUserId,
      status: 'active',
      startedAt: Date.now(),
    })
  },
})

// Versão em lote: matricula vários membros de uma vez. Retorna agregado de
// adicionados e ignorados (já matriculados ou inválidos). Limite 100 por
// chamada para evitar timeout em instituições grandes.
export const enrollMembersBulk = mutation({
  args: {
    pathId: v.id('learningPaths'),
    memberUserIds: v.array(v.string()),
  },
  handler: async (ctx, { pathId, memberUserIds }) => {
    const identity = await requireIdentity(ctx)
    const path = await ctx.db.get(pathId)
    if (!path) throw new Error('Trilha não encontrada.')
    if (!path.institutionId) {
      throw new Error('Apenas trilhas institucionais aceitam matrícula manual de alunos.')
    }
    await ensurePathOwnership(ctx, pathId, identity.subject)

    if (memberUserIds.length === 0) return { added: 0, skipped: 0 }
    if (memberUserIds.length > 100) {
      throw new Error('Máximo de 100 alunos por chamada.')
    }

    const activeMembers = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', path.institutionId!))
      .filter((q) => q.eq(q.field('status'), 'ativo'))
      .collect()
    const activeMemberIds = new Set(activeMembers.map((m) => m.userId))

    const existingEnrollments = await ctx.db
      .query('pathEnrollments')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()
    const enrolledIds = new Set(existingEnrollments.map((e) => e.studentId))

    let added = 0
    let skipped = 0
    const now = Date.now()
    for (const memberUserId of memberUserIds) {
      if (!activeMemberIds.has(memberUserId)) {
        skipped++
        continue
      }
      if (enrolledIds.has(memberUserId)) {
        skipped++
        continue
      }
      await ctx.db.insert('pathEnrollments', {
        pathId,
        studentId: memberUserId,
        status: 'active',
        startedAt: now,
      })
      enrolledIds.add(memberUserId)
      added++
    }
    return { added, skipped }
  },
})

// Admin/dono remove a matrícula de um aluno na trilha. Não apaga o progresso
// dos cursos individuais; apenas remove o vínculo da trilha.
export const removeMemberFromPath = mutation({
  args: {
    pathId: v.id('learningPaths'),
    studentId: v.string(),
  },
  handler: async (ctx, { pathId, studentId }) => {
    const identity = await requireIdentity(ctx)
    await ensurePathOwnership(ctx, pathId, identity.subject)

    const existing = await ctx.db
      .query('pathEnrollments')
      .withIndex('by_student_path', (q) =>
        q.eq('studentId', studentId).eq('pathId', pathId),
      )
      .unique()
    if (existing) await ctx.db.delete(existing._id)
  },
})

// Lista alunos matriculados na trilha com progresso agregado (cursos
// concluídos vs total). Acesso restrito a dono/admin da instituição.
export const listPathStudents = query({
  args: { pathId: v.id('learningPaths') },
  handler: async (ctx, { pathId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const path = await ctx.db.get(pathId)
    if (!path) return []

    // Permissão: dono do criador ou admin/dono da instituição.
    const isOwner = path.creatorId === identity.subject
    let isInstAdmin = false
    if (path.institutionId) {
      const m = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', path.institutionId!).eq('userId', identity.subject),
        )
        .unique()
      if (m && m.status === 'ativo' && m.role !== 'membro') isInstAdmin = true
    }
    if (!isOwner && !isInstAdmin) return []

    const enrollments = await ctx.db
      .query('pathEnrollments')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()

    const items = await ctx.db
      .query('pathItems')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()
    const courseIds = items.map((it) => it.courseId)

    const rows = await Promise.all(
      enrollments.map(async (e) => {
        const userDoc = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', e.studentId))
          .unique()
        let completedCount = 0
        for (const cid of courseIds) {
          const en = await ctx.db
            .query('enrollments')
            .withIndex('by_student_course', (q) =>
              q.eq('studentId', e.studentId).eq('courseId', cid),
            )
            .unique()
          if (en?.completedAt) completedCount++
        }
        return {
          enrollmentId: e._id,
          studentId: e.studentId,
          status: e.status,
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          name: userDoc?.name ?? userDoc?.email ?? 'Aluno',
          email: userDoc?.email,
          avatarUrl: userDoc?.avatarUrl,
          completedCourses: completedCount,
          totalCourses: courseIds.length,
        }
      }),
    )

    rows.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
    return rows
  },
})

// Lista membros ativos da instituição que ainda NÃO estão matriculados nesta
// trilha. Usado pelo modal "Adicionar alunos". Restrito a dono/admin.
export const listAvailableMembers = query({
  args: { pathId: v.id('learningPaths') },
  handler: async (ctx, { pathId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const path = await ctx.db.get(pathId)
    if (!path || !path.institutionId) return []

    const isOwner = path.creatorId === identity.subject
    const myMembership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', path.institutionId!).eq('userId', identity.subject),
      )
      .unique()
    const isInstAdmin =
      !!myMembership && myMembership.status === 'ativo' && myMembership.role !== 'membro'
    if (!isOwner && !isInstAdmin) return []

    const members = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', path.institutionId!))
      .filter((q) => q.eq(q.field('status'), 'ativo'))
      .collect()

    const enrollments = await ctx.db
      .query('pathEnrollments')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()
    const enrolledIds = new Set(enrollments.map((e) => e.studentId))

    const candidates = members.filter((m) => !enrolledIds.has(m.userId))

    const userDocs = await Promise.all(
      candidates.map((m) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', m.userId))
          .unique(),
      ),
    )

    return candidates.map((m, i) => ({
      memberId: m._id,
      userId: m.userId,
      role: m.role,
      name: userDocs[i]?.name ?? userDocs[i]?.email ?? 'Membro',
      email: userDocs[i]?.email,
      avatarUrl: userDocs[i]?.avatarUrl,
    }))
  },
})

// Lista cursos disponíveis para adicionar a uma trilha. Para trilhas
// institucionais, retorna o catálogo público completo (qualquer curso
// publicado pode ser usado em planos de estudo de igreja). Para trilhas
// pessoais, mantém a regra antiga (apenas cursos próprios). Em ambos os
// casos, exclui cursos já adicionados à trilha.
export const listCoursesForPath = query({
  args: { pathId: v.id('learningPaths') },
  handler: async (ctx, { pathId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const path = await ctx.db.get(pathId)
    if (!path) return []

    const isOwner = path.creatorId === identity.subject
    let isInstAdmin = false
    if (path.institutionId) {
      const m = await ctx.db
        .query('institutionMembers')
        .withIndex('by_institution_user', (q) =>
          q.eq('institutionId', path.institutionId!).eq('userId', identity.subject),
        )
        .unique()
      if (m && m.status === 'ativo' && m.role !== 'membro') isInstAdmin = true
    }
    if (!isOwner && !isInstAdmin) return []

    const items = await ctx.db
      .query('pathItems')
      .withIndex('by_pathId', (q) => q.eq('pathId', pathId))
      .collect()
    const taken = new Set(items.map((it) => it.courseId as unknown as string))

    let candidates
    if (path.institutionId) {
      // Trilha institucional: catálogo público + cursos próprios da instituição
      // (ainda em rascunho ou com visibility='institution').
      const published = await ctx.db
        .query('courses')
        .withIndex('by_published', (q) => q.eq('isPublished', true))
        .collect()
      const instCourses = await ctx.db
        .query('courses')
        .withIndex('by_institutionId', (q) => q.eq('institutionId', path.institutionId!))
        .collect()
      const seen = new Set<string>()
      candidates = [...published, ...instCourses].filter((c) => {
        const k = c._id as unknown as string
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
    } else {
      candidates = await ctx.db
        .query('courses')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
        .collect()
    }

    const filtered = candidates.filter(
      (c) => !taken.has(c._id as unknown as string),
    )

    const uniqueCreators = Array.from(new Set(filtered.map((c) => c.creatorId)))
    const creators = await Promise.all(
      uniqueCreators.map((cid) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', cid))
          .unique(),
      ),
    )
    const creatorName = new Map<string, string>()
    creators.forEach((u, i) => {
      if (u) creatorName.set(uniqueCreators[i], u.name ?? u.email ?? 'Professor')
    })

    return filtered
      .map((c) => ({
        _id: c._id,
        title: c.title,
        slug: c.slug,
        thumbnail: c.thumbnail,
        category: c.category,
        level: c.level,
        isPublished: c.isPublished,
        totalLessons: c.totalLessons,
        creatorName: creatorName.get(c.creatorId) ?? 'Professor',
        isOwn: c.creatorId === identity.subject,
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  },
})

export const listMyEnrollments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const rows = await ctx.db
      .query('pathEnrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .collect()

    return Promise.all(
      rows.map(async (e) => {
        // Path + items em paralelo.
        const [path, items] = await Promise.all([
          ctx.db.get(e.pathId),
          ctx.db
            .query('pathItems')
            .withIndex('by_pathId', (q) => q.eq('pathId', e.pathId))
            .collect(),
        ])
        if (!path) return null

        // Cada matricula de curso da trilha em paralelo (substitui loop sequencial).
        const enrollments = await Promise.all(
          items.map((it) =>
            ctx.db
              .query('enrollments')
              .withIndex('by_student_course', (q) =>
                q.eq('studentId', identity.subject).eq('courseId', it.courseId),
              )
              .unique(),
          ),
        )
        const completedCount = enrollments.filter((en) => en?.completedAt).length

        return {
          enrollmentId: e._id,
          pathId: e.pathId,
          status: e.status,
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          title: path.title,
          slug: path.slug,
          coverUrl: path.coverUrl,
          totalCourses: items.length,
          completedCount,
        }
      }),
    ).then((arr) => arr.filter((x): x is NonNullable<typeof x> => x !== null))
  },
})
