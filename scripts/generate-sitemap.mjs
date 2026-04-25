// Gera public/sitemap.xml no momento do build, incluindo a lista de cursos
// publicados. Roda antes do `vite build` via npm script. Usa ConvexHttpClient
// com VITE_CONVEX_URL (mesma var que o frontend) e a query pública
// `catalog.listPublished` (já filtra visibility='institution'). Se a env não
// estiver definida ou a chamada falhar, mantém o sitemap estático anterior
// para não quebrar o deploy.

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const outPath = join(__dirname, '..', 'public', 'sitemap.xml')

const SITE_URL = 'https://resenhadoteologo.com'

const STATIC_URLS = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/sobre', changefreq: 'monthly', priority: '0.8' },
  { loc: '/cursos', changefreq: 'daily', priority: '0.9' },
  { loc: '/termos', changefreq: 'monthly', priority: '0.3' },
  { loc: '/privacidade', changefreq: 'monthly', priority: '0.3' },
  { loc: '/entrar', changefreq: 'yearly', priority: '0.4' },
  { loc: '/cadastro', changefreq: 'yearly', priority: '0.5' },
]

function escapeXml(text) {
  return String(text).replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;'
  )
}

function buildSitemap(entries) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>']
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  for (const e of entries) {
    lines.push('  <url>')
    lines.push(`    <loc>${escapeXml(e.loc)}</loc>`)
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`)
    if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`)
    if (e.priority) lines.push(`    <priority>${e.priority}</priority>`)
    lines.push('  </url>')
  }
  lines.push('</urlset>')
  return lines.join('\n') + '\n'
}

async function main() {
  const convexUrl = process.env.VITE_CONVEX_URL
  const entries = STATIC_URLS.map((u) => ({ ...u, loc: `${SITE_URL}${u.loc}` }))

  if (!convexUrl || convexUrl.includes('SEU_URL')) {
    console.warn('[sitemap] VITE_CONVEX_URL não definida, mantendo sitemap sem cursos')
    if (!existsSync(outPath)) {
      writeFileSync(outPath, buildSitemap(entries))
    }
    return
  }

  try {
    const client = new ConvexHttpClient(convexUrl)
    const courses = await client.query(api.catalog.listPublished, {})
    for (const c of courses ?? []) {
      if (!c.slug) continue
      entries.push({
        loc: `${SITE_URL}/cursos/${c.slug}`,
        lastmod: new Date(c._creationTime).toISOString().slice(0, 10),
        changefreq: 'weekly',
        priority: '0.7',
      })
    }
    console.log(`[sitemap] ${courses?.length ?? 0} cursos publicados incluídos`)
  } catch (err) {
    console.warn('[sitemap] falha ao consultar Convex, gerando apenas URLs estáticas:', err?.message ?? err)
  }

  writeFileSync(outPath, buildSitemap(entries))
  console.log(`[sitemap] escrito em ${outPath} (${entries.length} URLs)`)
}

main().catch((err) => {
  console.error('[sitemap] erro fatal:', err)
  // Não derruba o build: se der problema, mantém o sitemap anterior (se existir).
  if (!existsSync(outPath)) {
    writeFileSync(outPath, buildSitemap(STATIC_URLS.map((u) => ({ ...u, loc: `${SITE_URL}${u.loc}` }))))
  }
  process.exit(0)
})
