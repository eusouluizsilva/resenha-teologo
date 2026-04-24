import { v } from 'convex/values'
import type { MutationCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireIdentity } from './lib/auth'

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
