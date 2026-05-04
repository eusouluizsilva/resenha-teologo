// Inspeciona configs da instancia Clerk relevantes pra fluxo de login.
// Uso: CLERK_SECRET_KEY=sk_live_xxx node scripts/clerk-inspect-instance.mjs

const SECRET = process.env.CLERK_SECRET_KEY
if (!SECRET) { console.error('Falta CLERK_SECRET_KEY'); process.exit(1) }
const HEADERS = { Authorization: `Bearer ${SECRET}` }

async function api(path) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, { headers: HEADERS })
  const text = await res.text()
  let json
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  return { status: res.status, body: json }
}

const paths = [
  '/instance',
  '/instance/restrictions',
  '/instance/organization_settings',
  '/beta_features/url_based_session_syncing',
  '/sign_in_tokens',
  '/jwks',
]

for (const p of paths) {
  const r = await api(p)
  console.log(`\n=== GET ${p} -> ${r.status} ===`)
  console.log(JSON.stringify(r.body, null, 2))
}
