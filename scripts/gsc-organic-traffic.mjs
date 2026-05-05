// Consulta Search Console (Search Analytics) usando o Service Account
// claude-automation@resenha-do-teologo.iam.gserviceaccount.com
//
// Requer que o email do SA esteja como Owner/Full em search.google.com/search-console
// para a propriedade sc-domain:resenhadoteologo.com (ou https://resenhadoteologo.com/).
//
// Uso: node scripts/gsc-organic-traffic.mjs

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const KEY_PATH = path.join(process.cwd(), 'credenciais', 'google-service-account.json')
const sa = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signingInput)
  const signature = signer.sign(sa.private_key).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwt = `${signingInput}.${signature}`

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const j = await r.json()
  if (!j.access_token) throw new Error(`token fail: ${JSON.stringify(j)}`)
  return j.access_token
}

async function listSites(token) {
  const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return r.json()
}

async function query(token, siteUrl, body) {
  const r = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return r.json()
}

function fmt(date) {
  return date.toISOString().slice(0, 10)
}

;(async () => {
  const token = await getAccessToken()
  const sites = await listSites(token)
  console.log('SITES VISIVEIS PRO SERVICE ACCOUNT:')
  console.log(JSON.stringify(sites, null, 2))

  const candidates = (sites.siteEntry || [])
    .map((s) => s.siteUrl)
    .filter((u) => /resenhadoteologo/.test(u))
  if (candidates.length === 0) {
    console.log('\nNENHUMA propriedade resenhadoteologo encontrada. Adicione o email')
    console.log('claude-automation@resenha-do-teologo.iam.gserviceaccount.com')
    console.log('como Owner em search.google.com/search-console e rode de novo.')
    return
  }

  const siteUrl = candidates[0]
  console.log(`\nUsando propriedade: ${siteUrl}\n`)

  const today = new Date()
  const end = fmt(new Date(today.getTime() - 2 * 86400000)) // GSC tem ~2d de delay
  const start = fmt(new Date(today.getTime() - 30 * 86400000))

  const totals = await query(token, siteUrl, {
    startDate: start,
    endDate: end,
    dimensions: [],
    type: 'web',
  })
  console.log(`TOTAIS ULTIMOS 28 DIAS (${start} -> ${end}):`)
  console.log(JSON.stringify(totals, null, 2))

  const byDate = await query(token, siteUrl, {
    startDate: start,
    endDate: end,
    dimensions: ['date'],
    rowLimit: 30,
  })
  console.log('\nPOR DIA:')
  ;(byDate.rows || []).forEach((r) =>
    console.log(`  ${r.keys[0]}  clicks=${r.clicks}  imp=${r.impressions}  ctr=${(r.ctr * 100).toFixed(2)}%  pos=${r.position.toFixed(1)}`),
  )

  const byQuery = await query(token, siteUrl, {
    startDate: start,
    endDate: end,
    dimensions: ['query'],
    rowLimit: 25,
  })
  console.log('\nTOP 25 QUERIES:')
  ;(byQuery.rows || []).forEach((r) =>
    console.log(`  "${r.keys[0]}"  clicks=${r.clicks}  imp=${r.impressions}  ctr=${(r.ctr * 100).toFixed(2)}%  pos=${r.position.toFixed(1)}`),
  )

  const byPage = await query(token, siteUrl, {
    startDate: start,
    endDate: end,
    dimensions: ['page'],
    rowLimit: 25,
  })
  console.log('\nTOP 25 PAGINAS:')
  ;(byPage.rows || []).forEach((r) =>
    console.log(`  ${r.keys[0]}  clicks=${r.clicks}  imp=${r.impressions}  ctr=${(r.ctr * 100).toFixed(2)}%  pos=${r.position.toFixed(1)}`),
  )

  const byCountry = await query(token, siteUrl, {
    startDate: start,
    endDate: end,
    dimensions: ['country'],
    rowLimit: 10,
  })
  console.log('\nTOP PAISES:')
  ;(byCountry.rows || []).forEach((r) =>
    console.log(`  ${r.keys[0]}  clicks=${r.clicks}  imp=${r.impressions}`),
  )

  const byDevice = await query(token, siteUrl, {
    startDate: start,
    endDate: end,
    dimensions: ['device'],
  })
  console.log('\nPOR DEVICE:')
  ;(byDevice.rows || []).forEach((r) =>
    console.log(`  ${r.keys[0]}  clicks=${r.clicks}  imp=${r.impressions}  ctr=${(r.ctr * 100).toFixed(2)}%`),
  )
})().catch((e) => {
  console.error('ERRO:', e)
  process.exit(1)
})
