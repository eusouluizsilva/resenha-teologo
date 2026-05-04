// Inspeciona uma conta no Clerk pelo email.
// Uso: CLERK_SECRET_KEY=sk_live_xxx node scripts/clerk-inspect-user.mjs hello@resenhadoteologo.com

const SECRET = process.env.CLERK_SECRET_KEY
const EMAIL = process.argv[2]
if (!SECRET || !EMAIL) {
  console.error('Uso: CLERK_SECRET_KEY=... node scripts/clerk-inspect-user.mjs <email>')
  process.exit(1)
}

const HEADERS = { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }

async function api(path) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, { headers: HEADERS })
  const text = await res.text()
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

const list = await api(`/users?email_address=${encodeURIComponent(EMAIL)}&limit=10`)
if (!list?.length) {
  console.log('Nenhum usuario encontrado para', EMAIL)
  process.exit(0)
}

for (const u of list) {
  console.log('---')
  console.log('id:', u.id)
  console.log('emails:', u.email_addresses?.map((e) => ({
    email: e.email_address,
    verified: e.verification?.status,
    strategy: e.verification?.strategy,
    reserved_for_2fa: e.reserved_for_second_factor,
  })))
  console.log('totp_enabled:', u.totp_enabled)
  console.log('backup_code_enabled:', u.backup_code_enabled)
  console.log('two_factor_enabled:', u.two_factor_enabled)
  console.log('mfa_enabled_at:', u.mfa_enabled_at)
  console.log('password_enabled:', u.password_enabled)
  console.log('external_accounts:', u.external_accounts?.map((a) => a.provider))
  console.log('last_sign_in_at:', u.last_sign_in_at)
  console.log('created_at:', u.created_at)
  console.log('locked:', u.locked, ' banned:', u.banned)
  console.log('verification_attempts_remaining:', u.verification_attempts_remaining)
}
