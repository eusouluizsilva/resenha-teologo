import { v } from 'convex/values'
import type { MutationCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireIdentity } from './lib/auth'
import { isValidCNPJ, isValidEmail } from './lib/validators'

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const memberships = await ctx.db
      .query('institutionMembers')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .filter((q) => q.neq(q.field('status'), 'removido'))
      .collect()

    // Busca a instituição de cada membership em paralelo e combina com o papel
    // antes de filtrar, para evitar desalinhamento de índices quando alguma
    // instituição retorna null (ex. deletada).
    const pairs = await Promise.all(
      memberships.map(async (m) => {
        const inst = await ctx.db.get(m.institutionId)
        if (!inst) return null
        return { ...inst, memberRole: m.role }
      })
    )

    return pairs.filter((p): p is NonNullable<typeof p> => p !== null)
  },
})

export const getById = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const membership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject)
      )
      .unique()

    if (!membership || membership.status === 'removido') return null

    return ctx.db.get(institutionId)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal('igreja'), v.literal('ensino'), v.literal('empresa')),
    email: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)

    if (args.cnpj && args.cnpj.trim() && !isValidCNPJ(args.cnpj)) {
      throw new Error('CNPJ inválido.')
    }
    if (args.email && args.email.trim() && !isValidEmail(args.email)) {
      throw new Error('Email inválido.')
    }

    const institutionId = await ctx.db.insert('institutions', {
      name: args.name,
      type: args.type,
      createdByUserId: identity.subject,
      email: args.email,
      cnpj: args.cnpj,
      phone: args.phone,
    })

    await ctx.db.insert('institutionMembers', {
      institutionId,
      userId: identity.subject,
      role: 'dono',
      addedAt: Date.now(),
      addedByUserId: identity.subject,
      status: 'ativo',
    })

    return institutionId
  },
})

export const update = mutation({
  args: {
    institutionId: v.id('institutions'),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    denomination: v.optional(v.string()),
    denominationName: v.optional(v.string()),
    responsibleRole: v.optional(v.string()),
    // Branding institucional. themeColor é o accent (#hex) que substitui
    // #F37E20 nas páginas internas da instituição. logoUrl aparece no topo
    // do painel. description é mostrada na futura página pública.
    themeColor: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { institutionId, ...fields }) => {
    const identity = await requireIdentity(ctx)

    const membership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject)
      )
      .unique()

    if (!membership || !['dono', 'admin'].includes(membership.role)) {
      throw new Error('Sem permissão para editar esta instituição')
    }

    if (fields.cnpj !== undefined && fields.cnpj.trim() && !isValidCNPJ(fields.cnpj)) {
      throw new Error('CNPJ inválido.')
    }
    if (fields.email !== undefined && fields.email.trim() && !isValidEmail(fields.email)) {
      throw new Error('Email inválido.')
    }

    if (fields.themeColor !== undefined) {
      const c = fields.themeColor.trim()
      if (c && !/^#[0-9a-fA-F]{6}$/.test(c)) {
        throw new Error('Cor inválida. Use formato hex #RRGGBB.')
      }
      fields.themeColor = c || undefined
    }
    if (fields.logoUrl !== undefined) {
      const u = fields.logoUrl.trim()
      if (u && !/^https?:\/\//i.test(u)) {
        throw new Error('URL de logo inválida. Use http(s)://')
      }
      fields.logoUrl = u || undefined
    }
    if (fields.description !== undefined) {
      const d = fields.description.trim()
      if (d.length > 1000) {
        throw new Error('Descrição muito longa (máximo 1000 caracteres).')
      }
      fields.description = d || undefined
    }

    await ctx.db.patch(institutionId, fields)
  },
})

export const listMembers = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const myMembership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject)
      )
      .unique()

    if (!myMembership || myMembership.status === 'removido') return []

    const members = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .filter((q) => q.neq(q.field('status'), 'removido'))
      .collect()

    const users = await Promise.all(
      members.map((m) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', m.userId))
          .unique()
      )
    )

    return members.map((m, i) => ({
      ...m,
      user: users[i],
    }))
  },
})

// Gera um token aleatório não sequencial para convites. Usar _id do Convex como
// token seria inseguro porque expõe a ordem de inserção. Usamos crypto quando
// disponível no runtime V8 do Convex, com fallback em Math.random.
function generateInviteToken(): string {
  const g = globalThis as { crypto?: { getRandomValues: (a: Uint8Array) => Uint8Array } }
  if (g.crypto?.getRandomValues) {
    const bytes = new Uint8Array(24)
    g.crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  let s = ''
  for (let i = 0; i < 48; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

async function requireAdmin(ctx: MutationCtx, institutionId: Id<'institutions'>, userId: string) {
  const membership = await ctx.db
    .query('institutionMembers')
    .withIndex('by_institution_user', (q) =>
      q.eq('institutionId', institutionId).eq('userId', userId)
    )
    .unique()
  if (!membership || !['dono', 'admin'].includes(membership.role) || membership.status === 'removido') {
    throw new Error('Sem permissão na instituição')
  }
  return membership
}

export const createInvite = mutation({
  args: {
    institutionId: v.id('institutions'),
    email: v.string(),
  },
  handler: async (ctx, { institutionId, email }) => {
    const identity = await requireIdentity(ctx)
    await requireAdmin(ctx, institutionId, identity.subject)

    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Email inválido.')
    }

    const now = Date.now()
    const inviteId = await ctx.db.insert('institutionInvites', {
      institutionId,
      email: normalizedEmail,
      token: generateInviteToken(),
      sentAt: now,
      expiresAt: now + INVITE_TTL_MS,
      status: 'pendente',
      sentByUserId: identity.subject,
    })

    return inviteId
  },
})

// Convite em massa: recebe lista de emails (até 200 por chamada), valida cada
// um e cria convites pendentes. Retorna agregado de criados, ignorados (já
// pendentes), inválidos e duplicados dentro do CSV. Pula emails que já têm
// convite pendente vivo OU já são membros ativos da instituição. Limite de
// 200 evita falhas de timeout: para listas maiores, o front quebra em
// blocos sequenciais.
export const createInvitesBulk = mutation({
  args: {
    institutionId: v.id('institutions'),
    emails: v.array(v.string()),
  },
  handler: async (ctx, { institutionId, emails }) => {
    const identity = await requireIdentity(ctx)
    await requireAdmin(ctx, institutionId, identity.subject)

    if (emails.length === 0) {
      return { created: 0, alreadyInvited: 0, alreadyMember: 0, invalid: 0, duplicates: 0 }
    }
    if (emails.length > 200) {
      throw new Error('Máximo de 200 emails por importação. Quebre o CSV em blocos.')
    }

    const now = Date.now()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const seen = new Set<string>()
    const valid: string[] = []
    let invalid = 0
    let duplicates = 0
    for (const raw of emails) {
      const normalized = raw.trim().toLowerCase()
      if (!normalized) continue
      if (!emailRegex.test(normalized)) {
        invalid++
        continue
      }
      if (seen.has(normalized)) {
        duplicates++
        continue
      }
      seen.add(normalized)
      valid.push(normalized)
    }

    const existingInvites = await ctx.db
      .query('institutionInvites')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .collect()
    const pendingEmails = new Set(
      existingInvites
        .filter((i) => i.status === 'pendente' && i.expiresAt > now)
        .map((i) => i.email),
    )

    const memberRows = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .filter((q) => q.eq(q.field('status'), 'ativo'))
      .collect()
    const memberClerkIds = new Set(memberRows.map((m) => m.userId))

    let created = 0
    let alreadyInvited = 0
    let alreadyMember = 0

    for (const email of valid) {
      if (pendingEmails.has(email)) {
        alreadyInvited++
        continue
      }
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', email))
        .unique()
      if (existingUser && memberClerkIds.has(existingUser.clerkId)) {
        alreadyMember++
        continue
      }
      await ctx.db.insert('institutionInvites', {
        institutionId,
        email,
        token: generateInviteToken(),
        sentAt: now,
        expiresAt: now + INVITE_TTL_MS,
        status: 'pendente',
        sentByUserId: identity.subject,
      })
      created++
    }

    return { created, alreadyInvited, alreadyMember, invalid, duplicates }
  },
})

export const listInvites = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const myMembership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject)
      )
      .unique()
    if (!myMembership || !['dono', 'admin'].includes(myMembership.role)) return []

    const invites = await ctx.db
      .query('institutionInvites')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .collect()

    // Expira automaticamente na leitura (lazy), sem precisar de cron.
    const now = Date.now()
    return invites.map((i) => ({
      ...i,
      status: i.status === 'pendente' && i.expiresAt < now ? ('expirado' as const) : i.status,
    }))
  },
})

export const revokeInvite = mutation({
  args: { inviteId: v.id('institutionInvites') },
  handler: async (ctx, { inviteId }) => {
    const identity = await requireIdentity(ctx)
    const invite = await ctx.db.get(inviteId)
    if (!invite) throw new Error('Convite não encontrado')
    await requireAdmin(ctx, invite.institutionId, identity.subject)
    await ctx.db.patch(inviteId, { status: 'expirado' })
  },
})

// Consulta pública por token: permite que o convidado veja a instituição antes
// de aceitar sem precisar estar autenticado. Retorna null se o convite não
// existir, estiver expirado ou já tiver sido aceito.
export const getInviteByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query('institutionInvites')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique()
    if (!invite) return null
    if (invite.status !== 'pendente' || invite.expiresAt < Date.now()) return null

    const institution = await ctx.db.get(invite.institutionId)
    if (!institution) return null
    return {
      invite: { email: invite.email, expiresAt: invite.expiresAt },
      institution: { _id: institution._id, name: institution.name, type: institution.type },
    }
  },
})

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await requireIdentity(ctx)

    const invite = await ctx.db
      .query('institutionInvites')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique()
    if (!invite) throw new Error('Convite inválido')
    if (invite.status !== 'pendente' || invite.expiresAt < Date.now()) {
      throw new Error('Convite expirado')
    }

    // Se já existe membership (ex. convidado reconvidado após remoção), reativa.
    const existing = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', invite.institutionId).eq('userId', identity.subject)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { status: 'ativo' })
    } else {
      await ctx.db.insert('institutionMembers', {
        institutionId: invite.institutionId,
        userId: identity.subject,
        role: 'membro',
        addedAt: Date.now(),
        addedByUserId: invite.sentByUserId,
        status: 'ativo',
      })
    }

    await ctx.db.patch(invite._id, { status: 'aceito' })
    return invite.institutionId
  },
})

export const removeMember = mutation({
  args: { memberId: v.id('institutionMembers') },
  handler: async (ctx, { memberId }) => {
    const identity = await requireIdentity(ctx)
    const member = await ctx.db.get(memberId)
    if (!member) throw new Error('Membro não encontrado')
    await requireAdmin(ctx, member.institutionId, identity.subject)
    // Dono não pode ser removido; só sair excluindo a instituição.
    if (member.role === 'dono') throw new Error('Não é possível remover o dono da instituição.')
    await ctx.db.patch(memberId, { status: 'removido' })
  },
})

// Promove ou rebaixa um membro entre 'admin' e 'membro'. Apenas o dono pode
// alterar papéis. Membros 'dono' não podem ter papel alterado.
export const setMemberRole = mutation({
  args: {
    memberId: v.id('institutionMembers'),
    role: v.union(v.literal('admin'), v.literal('membro')),
  },
  handler: async (ctx, { memberId, role }) => {
    const identity = await requireIdentity(ctx)
    const member = await ctx.db.get(memberId)
    if (!member) throw new Error('Membro não encontrado')

    const myMembership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', member.institutionId).eq('userId', identity.subject),
      )
      .unique()
    if (!myMembership || myMembership.role !== 'dono' || myMembership.status === 'removido') {
      throw new Error('Apenas o dono da instituição pode alterar papéis')
    }

    if (member.role === 'dono') throw new Error('Papel do dono não pode ser alterado')
    await ctx.db.patch(memberId, { role })
  },
})

// Lista cursos vinculados a esta instituição (visibility='institution' OU
// visibility='public' com institutionId apontando para esta instituição). Apenas
// membros ativos veem o resultado. Útil para a tela de "Cursos da instituição".
export const listCourses = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const membership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject),
      )
      .unique()
    if (!membership || membership.status === 'removido') return []

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .collect()

    const creators = await Promise.all(
      courses.map((c) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', c.creatorId))
          .unique(),
      ),
    )

    return courses.map((c, i) => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      thumbnail: c.thumbnail,
      category: c.category,
      level: c.level,
      isPublished: c.isPublished,
      visibility: c.visibility,
      totalLessons: c.totalLessons,
      totalStudents: c.totalStudents,
      releaseStatus: c.releaseStatus,
      creatorName: creators[i]?.name ?? 'Criador',
      creatorHandle: creators[i]?.handle,
    }))
  },
})

// Estatísticas agregadas para o dashboard institucional. Retorna contagens leves
// derivadas em runtime; com volumes pequenos (instituições reais com dezenas/
// centenas de membros) é aceitável. Se passar de milhares, denormalizar.
export const getStats = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const myMembership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject),
      )
      .unique()
    if (!myMembership || !['dono', 'admin'].includes(myMembership.role)) return null

    const members = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .filter((q) => q.eq(q.field('status'), 'ativo'))
      .collect()

    const invites = await ctx.db
      .query('institutionInvites')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .collect()
    const now = Date.now()
    const pendingInvites = invites.filter((i) => i.status === 'pendente' && i.expiresAt > now)

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .collect()
    const publishedCourses = courses.filter((c) => c.isPublished)
    const courseIdSet = new Set(courses.map((c) => c._id))

    // Enrollments e progresso dos membros nos cursos da instituição.
    const memberIds = members.map((m) => m.userId)
    let totalEnrollments = 0
    let totalCertificates = 0
    let totalLessonsCompleted = 0
    let lessonsCompletedLast30d = 0
    const cutoff = now - 30 * 24 * 60 * 60 * 1000

    const enrollmentsPerMember = await Promise.all(
      memberIds.map((uid) =>
        ctx.db
          .query('enrollments')
          .withIndex('by_studentId', (q) => q.eq('studentId', uid))
          .collect(),
      ),
    )
    for (const list of enrollmentsPerMember) {
      for (const e of list) {
        if (!courseIdSet.has(e.courseId)) continue
        totalEnrollments++
        if (e.certificateIssued) totalCertificates++
      }
    }

    const progressPerMember = await Promise.all(
      memberIds.map((uid) =>
        ctx.db
          .query('progress')
          .withIndex('by_studentId', (q) => q.eq('studentId', uid))
          .collect(),
      ),
    )
    for (const list of progressPerMember) {
      for (const p of list) {
        if (!courseIdSet.has(p.courseId)) continue
        if (!p.completed) continue
        totalLessonsCompleted++
        if (p.completedAt && p.completedAt >= cutoff) lessonsCompletedLast30d++
      }
    }

    return {
      members: members.length,
      pendingInvites: pendingInvites.length,
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      totalEnrollments,
      totalCertificates,
      totalLessonsCompleted,
      lessonsCompletedLast30d,
      completionRate:
        totalEnrollments > 0 ? Math.round((totalCertificates / totalEnrollments) * 100) : 0,
    }
  },
})

// Relatório por membro: para cada membro ativo, quantos cursos da instituição
// tem matriculado, quantos concluiu, total de aulas concluídas e última
// atividade. Apenas dono/admin podem ver. Limita lookups a uma instituição.
export const listMembersReport = query({
  args: { institutionId: v.id('institutions') },
  handler: async (ctx, { institutionId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const myMembership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', identity.subject),
      )
      .unique()
    if (!myMembership || !['dono', 'admin'].includes(myMembership.role)) return []

    const members = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .filter((q) => q.eq(q.field('status'), 'ativo'))
      .collect()

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_institutionId', (q) => q.eq('institutionId', institutionId))
      .collect()
    const courseIdSet = new Set(courses.map((c) => c._id))

    const userDocs = await Promise.all(
      members.map((m) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', m.userId))
          .unique(),
      ),
    )
    const enrollmentsList = await Promise.all(
      members.map((m) =>
        ctx.db
          .query('enrollments')
          .withIndex('by_studentId', (q) => q.eq('studentId', m.userId))
          .collect(),
      ),
    )
    const progressList = await Promise.all(
      members.map((m) =>
        ctx.db
          .query('progress')
          .withIndex('by_studentId', (q) => q.eq('studentId', m.userId))
          .collect(),
      ),
    )

    return members.map((m, i) => {
      const myEnrollments = (enrollmentsList[i] ?? []).filter((e) => courseIdSet.has(e.courseId))
      const myProgress = (progressList[i] ?? []).filter((p) => courseIdSet.has(p.courseId))
      const completedLessons = myProgress.filter((p) => p.completed)
      const lastCompletion = completedLessons.reduce(
        (acc, p) => Math.max(acc, p.completedAt ?? 0),
        0,
      )
      const certificates = myEnrollments.filter((e) => e.certificateIssued).length
      return {
        memberId: m._id,
        userId: m.userId,
        name: userDocs[i]?.name ?? userDocs[i]?.email ?? 'Membro',
        email: userDocs[i]?.email,
        avatarUrl: userDocs[i]?.avatarUrl,
        role: m.role,
        addedAt: m.addedAt,
        coursesEnrolled: myEnrollments.length,
        coursesCompleted: certificates,
        lessonsCompleted: completedLessons.length,
        lastActivity: lastCompletion > 0 ? lastCompletion : null,
      }
    })
  },
})
