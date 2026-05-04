// Lista usuarios do Clerk com MFA habilitado e (opcionalmente) desabilita.
// Uso:
//   CLERK_SECRET_KEY=sk_live_xxx node scripts/clerk-disable-mfa.mjs            # dry-run
//   CLERK_SECRET_KEY=sk_live_xxx node scripts/clerk-disable-mfa.mjs --apply    # aplica
//
// Endpoints:
//   GET    /v1/users?limit=500&offset=N
//   DELETE /v1/users/{id}/mfa            -> desabilita todos os fatores MFA do user
//   PATCH  /v1/email_addresses/{id}      -> { reserved_for_second_factor: false }

const SECRET = process.env.CLERK_SECRET_KEY
if (!SECRET) {
  console.error('Falta CLERK_SECRET_KEY no ambiente.')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')
const BASE = 'https://api.clerk.com/v1'
const HEADERS = {
  Authorization: `Bearer ${SECRET}`,
  'Content-Type': 'application/json',
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`)
  }
  return json
}

async function listAllUsers() {
  const all = []
  const limit = 500
  let offset = 0
  while (true) {
    const batch = await api('GET', `/users?limit=${limit}&offset=${offset}`)
    if (!Array.isArray(batch) || batch.length === 0) break
    all.push(...batch)
    if (batch.length < limit) break
    offset += limit
  }
  return all
}

function userMfaState(u) {
  const totp = !!u.totp_enabled
  const backup = !!u.backup_code_enabled
  const reservedEmails = (u.email_addresses ?? []).filter((e) => e.reserved_for_second_factor)
  const hasMfa = totp || backup || reservedEmails.length > 0
  return { totp, backup, reservedEmails, hasMfa }
}

function userLabel(u) {
  const primary = u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
  const email = primary?.email_address ?? u.email_addresses?.[0]?.email_address ?? '(sem email)'
  return `${u.id}  ${email}`
}

async function main() {
  console.log(`[clerk-disable-mfa] modo: ${APPLY ? 'APPLY (vai gravar)' : 'DRY-RUN'}`)
  const users = await listAllUsers()
  console.log(`[clerk-disable-mfa] total de usuarios: ${users.length}`)

  const affected = users
    .map((u) => ({ user: u, state: userMfaState(u) }))
    .filter((x) => x.state.hasMfa)

  console.log(`[clerk-disable-mfa] usuarios com MFA: ${affected.length}`)
  for (const { user, state } of affected) {
    const flags = [
      state.totp && 'totp',
      state.backup && 'backup',
      state.reservedEmails.length && `email_2fa(${state.reservedEmails.length})`,
    ]
      .filter(Boolean)
      .join(' + ')
    console.log(`  - ${userLabel(user)}  [${flags}]`)
  }

  if (!APPLY) {
    console.log('\n[dry-run] nada foi modificado. Rode com --apply para aplicar.')
    return
  }

  let okMfa = 0
  let okEmail = 0
  let fail = 0
  for (const { user, state } of affected) {
    try {
      if (state.totp || state.backup) {
        await api('DELETE', `/users/${user.id}/mfa`)
        okMfa++
      }
      for (const email of state.reservedEmails) {
        await api('PATCH', `/email_addresses/${email.id}`, {
          reserved_for_second_factor: false,
        })
        okEmail++
      }
      console.log(`  ok  ${userLabel(user)}`)
    } catch (err) {
      fail++
      console.error(`  err ${userLabel(user)} -> ${err.message}`)
    }
  }

  console.log(
    `\n[clerk-disable-mfa] concluido. mfa removido: ${okMfa}, emails 2fa desmarcados: ${okEmail}, falhas: ${fail}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
