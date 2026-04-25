import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'

const RESERVED = new Set([
  'cursos', 'entrar', 'cadastro', 'dashboard', 'termos', 'privacidade',
  'admin', 'api', 'sobre', 'ajuda', 'suporte', 'contato', 'perfil', 'login',
  'verificar', 'sso-callback', 'webhook', 'blog', 'app', 'planos', 'funcoes',
  'convite', 'convites', 'instituicao', 'membros', 'apoie', 'apoiar', 'doacao', 'doar',
])

const HANDLE_REGEX = /^[a-z0-9_]{3,30}$/

function validateHandle(handle: string): string | null {
  if (!HANDLE_REGEX.test(handle)) return 'O handle deve ter entre 3 e 30 caracteres, usando apenas letras minúsculas, números e underscore.'
  if (RESERVED.has(handle)) return 'Este handle é reservado pelo sistema. Escolha outro.'
  return null
}

export const isAvailable = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const error = validateHandle(handle)
    if (error) return false

    const existing = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', handle))
      .unique()

    return existing === null
  },
})

export const claim = mutation({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const identity = await requireIdentity(ctx)

    const error = validateHandle(handle)
    if (error) throw new Error(error)

    const existing = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', handle))
      .unique()

    if (existing && existing.clerkId !== identity.subject) {
      throw new Error('Este handle já está em uso. Escolha outro.')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) throw new Error('Usuário não encontrado')

    await ctx.db.patch(user._id, { handle })
  },
})

export const updateVisibility = mutation({
  args: {
    visibility: v.union(v.literal('public'), v.literal('unlisted')),
    showProgressPublicly: v.boolean(),
  },
  handler: async (ctx, { visibility, showProgressPublicly }) => {
    const identity = await requireIdentity(ctx)

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) throw new Error('Usuário não encontrado')

    await ctx.db.patch(user._id, {
      profileVisibility: visibility,
      showProgressPublicly,
    })
  },
})
