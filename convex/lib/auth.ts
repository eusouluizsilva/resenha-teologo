import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type Ctx = QueryCtx | MutationCtx
type Perfil = Doc<'users'>['perfil']

export async function requireIdentity(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Não autenticado')
  }
  return identity
}

export async function getCurrentUserRecord(ctx: Ctx) {
  const identity = await requireIdentity(ctx)
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique()

  return { identity, user }
}

export async function requireCurrentUser(ctx: Ctx) {
  const { identity, user } = await getCurrentUserRecord(ctx)
  if (!user) {
    throw new Error('Usuário não encontrado')
  }
  return { identity, user }
}

export async function requirePerfil(ctx: Ctx, perfis: Perfil[]) {
  const result = await requireCurrentUser(ctx)
  if (!perfis.includes(result.user.perfil)) {
    throw new Error('Não autorizado')
  }
  return result
}

export function ensureIdentityMatches(identitySubject: string, expectedSubject: string) {
  if (identitySubject !== expectedSubject) {
    throw new Error('Não autorizado')
  }
}
