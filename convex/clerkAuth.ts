// Login alternativo via Clerk Backend API que bypassa o "new device verification"
// (que dispara needs_second_factor mesmo com MFA desligado). Fluxo:
//   1. Frontend manda email+senha
//   2. Action verifica senha via Backend API
//   3. Action gera sign_in_token e retorna o ticket
//   4. Frontend usa signIn.create({ strategy: 'ticket', ticket }) que completa direto

import { v } from 'convex/values'
import { action } from './_generated/server'

declare const process: { env: Record<string, string | undefined> }

const CLERK_API = 'https://api.clerk.com/v1'

type LoginResult =
  | { ok: true; ticket: string }
  | { ok: false; code: 'invalid_credentials' | 'unverified_email' | 'account_locked' | 'config_missing' | 'unknown_error' }

async function clerkApi<T = unknown>(
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<{ status: number; data: T | null; raw: string }> {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) throw new Error('CLERK_SECRET_KEY ausente no env do Convex')

  const res = await fetch(`${CLERK_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const raw = await res.text()
  let data: T | null = null
  try {
    if (raw) data = JSON.parse(raw) as T
  } catch {
    // resposta sem JSON valido, mantem data como null
  }
  return { status: res.status, data, raw }
}

type ClerkUser = {
  id: string
  banned?: boolean
  locked?: boolean
  password_enabled?: boolean
  email_addresses?: Array<{
    id: string
    email_address: string
    verification?: { status?: string } | null
  }>
  primary_email_address_id?: string | null
}

export const loginWithPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (_ctx, args): Promise<LoginResult> => {
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('[clerkAuth] CLERK_SECRET_KEY ausente')
      return { ok: false, code: 'config_missing' }
    }

    const email = args.email.trim().toLowerCase()
    if (!email || !args.password) {
      return { ok: false, code: 'invalid_credentials' }
    }

    const lookup = await clerkApi<ClerkUser[]>(
      'GET',
      `/users?email_address=${encodeURIComponent(email)}&limit=2`,
    )
    if (lookup.status !== 200 || !Array.isArray(lookup.data) || lookup.data.length === 0) {
      return { ok: false, code: 'invalid_credentials' }
    }

    const user = lookup.data[0]

    if (user.banned || user.locked) {
      return { ok: false, code: 'account_locked' }
    }

    if (!user.password_enabled) {
      return { ok: false, code: 'invalid_credentials' }
    }

    const primaryEmail =
      user.email_addresses?.find((e) => e.id === user.primary_email_address_id) ??
      user.email_addresses?.find((e) => e.email_address.toLowerCase() === email) ??
      user.email_addresses?.[0]
    if (!primaryEmail || primaryEmail.verification?.status !== 'verified') {
      return { ok: false, code: 'unverified_email' }
    }

    const verify = await clerkApi<{ verified: boolean }>(
      'POST',
      `/users/${user.id}/verify_password`,
      { password: args.password },
    )
    if (verify.status !== 200 || !verify.data?.verified) {
      return { ok: false, code: 'invalid_credentials' }
    }

    const token = await clerkApi<{ token: string }>('POST', `/sign_in_tokens`, {
      user_id: user.id,
      expires_in_seconds: 300,
    })
    if (token.status !== 200 || !token.data?.token) {
      console.error('[clerkAuth] sign_in_tokens falhou:', token.status, token.raw.slice(0, 200))
      return { ok: false, code: 'unknown_error' }
    }

    return { ok: true, ticket: token.data.token }
  },
})
