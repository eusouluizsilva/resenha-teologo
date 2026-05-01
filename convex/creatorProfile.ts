import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity, requireUserFunction } from './lib/auth'
import { isValidCPF, isValidCNPJ } from './lib/validators'
import { checkRateLimit } from './lib/rateLimit'

// Validação de chave PIX. PIX no Brasil aceita 5 formatos:
// CPF (11 dígitos), CNPJ (14), email, telefone (+55...) e chave aleatória
// (UUID 32 hex). Retorna a chave normalizada (sem máscara) ou lança erro.
function validatePixKey(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error('Chave PIX vazia.')

  const digitsOnly = trimmed.replace(/\D/g, '')
  if (digitsOnly.length === 11 && /^\d+$/.test(digitsOnly)) {
    if (!isValidCPF(digitsOnly)) throw new Error('CPF inválido.')
    return digitsOnly
  }
  if (digitsOnly.length === 14 && /^\d+$/.test(digitsOnly)) {
    if (!isValidCNPJ(digitsOnly)) throw new Error('CNPJ inválido.')
    return digitsOnly
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed.toLowerCase()

  if (/^\+?\d{10,15}$/.test(digitsOnly)) {
    return digitsOnly.startsWith('55') ? `+${digitsOnly}` : `+55${digitsOnly}`
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  if (/^[0-9a-f]{32}$/i.test(trimmed.replace(/-/g, ''))) {
    return trimmed.toLowerCase()
  }

  throw new Error('Formato inválido. Use CPF, CNPJ, email, celular ou chave aleatória.')
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)
    const profile = await ctx.db
      .query('creatorProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .unique()
    if (!profile) {
      return {
        pixKey: null,
        channelName: null,
        bioProfessional: null,
      }
    }
    return {
      pixKey: profile.pixKey ?? null,
      channelName: profile.channelName ?? null,
      bioProfessional: profile.bioProfessional ?? null,
    }
  },
})

export const setPixKey = mutation({
  args: {
    pixKey: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { pixKey }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    await checkRateLimit(ctx, identity.subject, 'pix.set', { max: 5, windowMs: 60_000 })

    const normalized = pixKey === null || pixKey.trim() === '' ? null : validatePixKey(pixKey)

    const existing = await ctx.db
      .query('creatorProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .unique()

    if (existing) {
      if (normalized === null) {
        const { _id, _creationTime, pixKey: _pix, ...rest } = existing
        await ctx.db.replace(_id, rest)
      } else {
        await ctx.db.patch(existing._id, { pixKey: normalized })
      }
    } else if (normalized !== null) {
      await ctx.db.insert('creatorProfiles', {
        userId: identity.subject,
        pixKey: normalized,
      })
    }

    return { pixKey: normalized }
  },
})
