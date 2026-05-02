import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { ensureIdentityMatches, requireIdentity } from './lib/auth'
import { checkRateLimit } from './lib/rateLimit'
import {
  OFFICIAL_HANDLE,
  autoEnrollUserInOfficialCourses,
  autoFollowOfficial,
  getOfficialUser,
} from './lib/autoEnroll'

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const identity = await requireIdentity(ctx)
    ensureIdentityMatches(identity.subject, clerkId)

    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
  },
})

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
  },
})

export const upsert = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    ensureIdentityMatches(identity.subject, args.clerkId)

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        // Sync from Clerk metadata only if profile field is still empty
        ...(args.phone && !existing.phone ? { phone: args.phone } : {}),
        ...(args.phoneCountry && !existing.phoneCountry ? { phoneCountry: args.phoneCountry } : {}),
        ...(args.country && !existing.country ? { country: args.country } : {}),
      })
      return existing._id
    }

    const newId = await ctx.db.insert('users', {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      country: args.country,
      phone: args.phone,
      phoneCountry: args.phoneCountry,
      totalDonationsReceived: 0,
      // Perfil publico por padrao. Pode ser alterado pelo proprio usuario na
      // pagina de perfil (toggle "Publico/Privado") ou pelo admin.
      profileVisibility: 'public',
      showProgressPublicly: true,
    })
    await autoFollowOfficial(ctx, args.clerkId)
    await autoEnrollUserInOfficialCourses(ctx, args.clerkId)
    return newId
  },
})

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    country: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneCountry: v.optional(v.string()),
    instagram: v.optional(v.string()),
    facebook: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    address: v.optional(v.string()),
    addressNumber: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    cep: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    institution: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    denomination: v.optional(v.string()),
    churchRole: v.optional(v.string()),
    churchName: v.optional(v.string()),
    churchInstagram: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, ...fields }) => {
    const identity = await requireIdentity(ctx)
    ensureIdentityMatches(identity.subject, clerkId)

    // Max 30 atualizacoes de perfil por minuto: bloqueia bot que tenta inflar
    // viewCount/searchIndex flippando bio em loop.
    await checkRateLimit(ctx, identity.subject, 'user.updateProfile', {
      max: 30,
      windowMs: 60_000,
    })

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
    if (!user) throw new Error('Usuário não encontrado')

    // Sanitização: campos que viram href em <a> precisam recusar
    // javascript:/data:/vbscript:. Sem isso, autor de perfil podia gravar
    // `javascript:alert(1)` e o link no perfil público disparava XSS.
    // Aceita só http(s):// ou caminho relativo iniciando em /.
    const sanitizeUrl = (raw: string | undefined): string | undefined => {
      if (raw === undefined) return undefined
      const trimmed = raw.trim()
      if (trimmed === '') return ''
      const lower = trimmed.toLowerCase()
      if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) return ''
      // Permite https?:// ou caminho relativo. Sem esquema, prefixa https://.
      if (/^https?:\/\//i.test(trimmed)) return trimmed
      if (trimmed.startsWith('/')) return trimmed
      return `https://${trimmed}`
    }
    const sanitizeHandle = (raw: string | undefined): string | undefined => {
      if (raw === undefined) return undefined
      // Para handles de redes sociais (instagram/facebook/etc), aceita só
      // caracteres alfanuméricos, ponto, sublinhado e hífen. Recusa qualquer
      // coisa com ":" ou "<", evitando ataques quando concatenados em href.
      return raw.trim().replace(/[^a-zA-Z0-9._\-@]/g, '')
    }
    const safe = {
      ...fields,
      website: sanitizeUrl(fields.website),
      youtubeChannel: sanitizeUrl(fields.youtubeChannel),
      instagram: sanitizeHandle(fields.instagram),
      facebook: sanitizeHandle(fields.facebook),
      linkedin: sanitizeHandle(fields.linkedin),
      twitter: sanitizeHandle(fields.twitter),
      churchInstagram: sanitizeHandle(fields.churchInstagram),
    }
    await ctx.db.patch(user._id, safe)
  },
})

// Chamado pelo webhook do Clerk quando o perfil é atualizado fora do frontend
// (ex.: admin muda email no dashboard do Clerk). Mantém name/email/avatar em dia.
export const syncFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique()
    if (!existing) {
      // Usuário ainda não existe no Convex: cria para manter consistência.
      await ctx.db.insert('users', {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        totalDonationsReceived: 0,
        profileVisibility: 'public',
        showProgressPublicly: true,
      })
      await autoFollowOfficial(ctx, args.clerkId)
      await autoEnrollUserInOfficialCourses(ctx, args.clerkId)
      return
    }
    await ctx.db.patch(existing._id, {
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
    })
  },
})

// Backfill: faz todos os usuarios existentes seguirem o @resenhadoteologo.
// Idempotente. Disparar manualmente via:
//   npx convex run --prod users:backfillResenhaFollows '{}'
export const backfillResenhaFollows = internalMutation({
  args: {},
  handler: async (ctx) => {
    const target = await getOfficialUser(ctx)
    if (!target) throw new Error(`Perfil @${OFFICIAL_HANDLE} nao encontrado`)

    const allUsers = await ctx.db.query('users').collect()
    const now = Date.now()
    let added = 0

    for (const u of allUsers) {
      if (u.clerkId === target.clerkId) continue
      const exists = await ctx.db
        .query('profileFollows')
        .withIndex('by_pair', (q) =>
          q.eq('followerUserId', u.clerkId).eq('authorUserId', target.clerkId),
        )
        .unique()
      if (exists) continue
      await ctx.db.insert('profileFollows', {
        followerUserId: u.clerkId,
        authorUserId: target.clerkId,
        notifyArticles: true,
        notifyCourses: true,
        notifyLessons: false,
        emailDigest: false,
        createdAt: now,
      })
      added += 1
    }

    if (added > 0) {
      const fresh = await ctx.db.get(target._id)
      if (fresh) {
        await ctx.db.patch(target._id, {
          followerCount: (fresh.followerCount ?? 0) + added,
        })
      }
    }
    return { added, totalUsers: allUsers.length }
  },
})

// Busca de perfis públicos (lupa do dashboard). Usa searchIndex full-text do
// Convex em name e handle separadamente; consolida por clerkId. Substituiu o
// .collect() em toda a tabela users que escalava em O(N) por busca.
// Esconde perfis sem handle (sem URL pública), perfis 'unlisted' e o próprio
// usuário dos resultados.
export const searchPublic = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const term = q.trim().replace(/^@/, '')
    if (term.length < 2) return []

    const identity = await ctx.auth.getUserIdentity()
    const myClerkId = identity?.subject ?? null

    // Convex searchIndex ranqueia por relevância textual e retorna até ~256
    // resultados. Pegamos 50 de cada índice — suficiente para alimentar o
    // top-10 final mesmo após dedupe e filtros.
    const [byName, byHandle] = await Promise.all([
      ctx.db
        .query('users')
        .withSearchIndex('search_name', (s) => s.search('name', term))
        .take(50),
      ctx.db
        .query('users')
        .withSearchIndex('search_handle', (s) => s.search('handle', term))
        .take(50),
    ])

    // Dedupe por clerkId. Coloca byHandle primeiro porque match em handle
    // tende a ser mais relevante que match em nome para a lupa @username.
    const seen = new Set<string>()
    const merged: typeof byName = []
    for (const u of [...byHandle, ...byName]) {
      if (seen.has(u.clerkId)) continue
      seen.add(u.clerkId)
      merged.push(u)
    }

    const lcTerm = term.toLowerCase()
    const filtered = merged
      .filter((u) => !!u.handle)
      .filter((u) => u.profileVisibility !== 'unlisted')
      .filter((u) => u.clerkId !== myClerkId)

    filtered.sort((a, b) => {
      const aHandle = (a.handle ?? '').toLowerCase()
      const bHandle = (b.handle ?? '').toLowerCase()
      const aHandleStarts = aHandle.startsWith(lcTerm) ? 0 : 1
      const bHandleStarts = bHandle.startsWith(lcTerm) ? 0 : 1
      if (aHandleStarts !== bHandleStarts) return aHandleStarts - bHandleStarts
      return (b.followerCount ?? 0) - (a.followerCount ?? 0)
    })

    return filtered.slice(0, 10).map((u) => ({
      handle: u.handle!,
      name: u.name,
      avatarUrl: u.avatarUrl ?? null,
      bio: u.bio ?? null,
      followerCount: u.followerCount ?? 0,
    }))
  },
})

// Chamado pelo webhook do Clerk quando a conta é deletada fora do app.
// Remove apenas o registro do usuário; dados vinculados (cursos, doações, etc.)
// ficam órfãos mas preservados — a deleção LGPD completa deve ser feita via
// account.deleteAccount (pelo próprio usuário no app).
export const deleteFromWebhook = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
    if (existing) await ctx.db.delete(existing._id)
  },
})
