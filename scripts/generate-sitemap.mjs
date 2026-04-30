// Gera um sitemap-index.xml + sub-sitemaps em public/, no momento do build.
// Roda via npm script antes de `vite build`. Usa ConvexHttpClient com
// VITE_CONVEX_URL e queries internas dedicadas em convex/sitemapData.ts.
//
// Sub-sitemaps:
//   sitemap-static.xml          páginas institucionais
//   sitemap-courses.xml         /cursos/:slug
//   sitemap-lessons.xml         /cursos/:courseSlug/:lessonSlug
//   sitemap-blog.xml            /blog + /blog/:handle/:slug
//   sitemap-blog-categories.xml /blog/categoria/:slug
//   sitemap-profiles.xml        /:handle
//   sitemap-images.xml          extensão image:image (capas de artigos, thumbs)
//   sitemap-videos.xml          extensão video:video (aulas com YouTube)
//
// Google ignora <priority>/<changefreq> em 2026, mantemos só <loc> + <lastmod>
// (com extensões image/video onde aplicável).

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'
import { writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PUBLIC_DIR = join(__dirname, '..', 'public')
const SITE_URL = 'https://resenhadoteologo.com'

const STATIC_PATHS = [
  { path: '/', lastmod: today() },
  { path: '/sobre', lastmod: today() },
  { path: '/cursos', lastmod: today() },
  { path: '/biblia', lastmod: today() },
  { path: '/blog', lastmod: today() },
  { path: '/loja', lastmod: today() },
  { path: '/apoie', lastmod: today() },
  { path: '/contato', lastmod: today() },
  { path: '/termos', lastmod: today() },
  { path: '/privacidade', lastmod: today() },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function toIsoDate(ts) {
  if (!ts) return today()
  return new Date(ts).toISOString().slice(0, 10)
}

function escapeXml(text) {
  return String(text).replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;'
  )
}

function buildUrlset(entries, { withImage = false, withVideo = false } = {}) {
  const ns = ['xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"']
  if (withImage) ns.push('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
  if (withVideo) ns.push('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"')

  const lines = ['<?xml version="1.0" encoding="UTF-8"?>']
  lines.push(`<urlset ${ns.join(' ')}>`)
  for (const e of entries) {
    lines.push('  <url>')
    lines.push(`    <loc>${escapeXml(e.loc)}</loc>`)
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`)
    if (e.image) {
      lines.push('    <image:image>')
      lines.push(`      <image:loc>${escapeXml(e.image.loc)}</image:loc>`)
      if (e.image.title) lines.push(`      <image:title>${escapeXml(e.image.title)}</image:title>`)
      lines.push('    </image:image>')
    }
    if (e.video) {
      lines.push('    <video:video>')
      lines.push(`      <video:thumbnail_loc>${escapeXml(e.video.thumbnail)}</video:thumbnail_loc>`)
      lines.push(`      <video:title>${escapeXml(e.video.title)}</video:title>`)
      lines.push(`      <video:description>${escapeXml(e.video.description ?? e.video.title)}</video:description>`)
      if (e.video.contentLoc) lines.push(`      <video:content_loc>${escapeXml(e.video.contentLoc)}</video:content_loc>`)
      if (e.video.playerLoc) lines.push(`      <video:player_loc>${escapeXml(e.video.playerLoc)}</video:player_loc>`)
      lines.push('    </video:video>')
    }
    lines.push('  </url>')
  }
  lines.push('</urlset>')
  return lines.join('\n') + '\n'
}

function buildSitemapIndex(sitemaps) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>']
  lines.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  for (const s of sitemaps) {
    lines.push('  <sitemap>')
    lines.push(`    <loc>${escapeXml(s.loc)}</loc>`)
    if (s.lastmod) lines.push(`    <lastmod>${s.lastmod}</lastmod>`)
    lines.push('  </sitemap>')
  }
  lines.push('</sitemapindex>')
  return lines.join('\n') + '\n'
}

function writeXml(filename, content) {
  const out = join(PUBLIC_DIR, filename)
  writeFileSync(out, content)
  console.log(`[sitemap] ${filename} (${content.length} bytes)`)
}

async function main() {
  const convexUrl = process.env.VITE_CONVEX_URL
  const today_ = today()
  const generated = []

  // 1) sitemap-static.xml
  writeXml(
    'sitemap-static.xml',
    buildUrlset(STATIC_PATHS.map((s) => ({ loc: `${SITE_URL}${s.path}`, lastmod: s.lastmod }))),
  )
  generated.push({ loc: `${SITE_URL}/sitemap-static.xml`, lastmod: today_ })

  if (!convexUrl || convexUrl.includes('SEU_URL')) {
    console.warn('[sitemap] VITE_CONVEX_URL não definida; pulando sitemaps dinâmicos')
    writeXml('sitemap-index.xml', buildSitemapIndex(generated))
    // mantém sitemap.xml legado apontando para o índice (clients antigos)
    writeXml('sitemap.xml', buildSitemapIndex(generated))
    return
  }

  let courses = []
  let lessons = []
  let posts = []
  let categories = []
  let profiles = []
  let products = []

  try {
    const client = new ConvexHttpClient(convexUrl)
    ;[courses, lessons, posts, categories, profiles, products] = await Promise.all([
      client.query(api.sitemapData.listCoursesForSitemap, {}),
      client.query(api.sitemapData.listLessonsForSitemap, {}),
      client.query(api.sitemapData.listPostsForSitemap, {}),
      client.query(api.sitemapData.listBlogCategoriesForSitemap, {}),
      client.query(api.sitemapData.listProfilesForSitemap, {}),
      client.query(api.sitemapData.listProductsForSitemap, {}),
    ])
  } catch (err) {
    console.warn('[sitemap] falha ao consultar Convex:', err?.message ?? err)
  }

  // 2) sitemap-courses.xml
  if (Array.isArray(courses) && courses.length > 0) {
    const entries = courses
      .filter((c) => c.slug)
      .map((c) => ({
        loc: `${SITE_URL}/cursos/${c.slug}`,
        lastmod: toIsoDate(c.updatedAt),
      }))
    writeXml('sitemap-courses.xml', buildUrlset(entries))
    generated.push({ loc: `${SITE_URL}/sitemap-courses.xml`, lastmod: today_ })
  }

  // 3) sitemap-lessons.xml
  if (Array.isArray(lessons) && lessons.length > 0) {
    const entries = lessons.map((l) => ({
      loc: `${SITE_URL}/cursos/${l.courseSlug}/${l.lessonSlug}`,
      lastmod: toIsoDate(l.updatedAt),
    }))
    writeXml('sitemap-lessons.xml', buildUrlset(entries))
    generated.push({ loc: `${SITE_URL}/sitemap-lessons.xml`, lastmod: today_ })
  }

  // 4) sitemap-blog.xml
  if (Array.isArray(posts) && posts.length > 0) {
    const entries = posts.map((p) => ({
      loc: `${SITE_URL}/blog/${p.handle}/${p.slug}`,
      lastmod: toIsoDate(p.updatedAt),
    }))
    writeXml('sitemap-blog.xml', buildUrlset(entries))
    generated.push({ loc: `${SITE_URL}/sitemap-blog.xml`, lastmod: today_ })
  }

  // 5) sitemap-blog-categories.xml
  if (Array.isArray(categories) && categories.length > 0) {
    const entries = categories.map((c) => ({
      loc: `${SITE_URL}/blog/categoria/${c.slug}`,
      lastmod: today_,
    }))
    writeXml('sitemap-blog-categories.xml', buildUrlset(entries))
    generated.push({ loc: `${SITE_URL}/sitemap-blog-categories.xml`, lastmod: today_ })
  }

  // 6.1) sitemap-products.xml
  if (Array.isArray(products) && products.length > 0) {
    const entries = products.map((p) => ({
      loc: `${SITE_URL}/loja/${p.slug}`,
      lastmod: toIsoDate(p.updatedAt),
    }))
    writeXml('sitemap-products.xml', buildUrlset(entries))
    generated.push({ loc: `${SITE_URL}/sitemap-products.xml`, lastmod: today_ })
  }

  // 6) sitemap-profiles.xml
  if (Array.isArray(profiles) && profiles.length > 0) {
    const entries = profiles.map((p) => ({
      loc: `${SITE_URL}/${p.handle}`,
      lastmod: toIsoDate(p.updatedAt),
    }))
    writeXml('sitemap-profiles.xml', buildUrlset(entries))
    generated.push({ loc: `${SITE_URL}/sitemap-profiles.xml`, lastmod: today_ })
  }

  // 7) sitemap-images.xml — capas de artigos + thumbnails de cursos
  const imageEntries = []
  for (const p of posts ?? []) {
    if (!p.coverUrl) continue
    imageEntries.push({
      loc: `${SITE_URL}/blog/${p.handle}/${p.slug}`,
      lastmod: toIsoDate(p.updatedAt),
      image: { loc: p.coverUrl, title: p.title },
    })
  }
  for (const c of courses ?? []) {
    if (!c.thumbnail || !c.slug) continue
    imageEntries.push({
      loc: `${SITE_URL}/cursos/${c.slug}`,
      lastmod: toIsoDate(c.updatedAt),
      image: { loc: c.thumbnail, title: c.title },
    })
  }
  for (const p of products ?? []) {
    if (!p.coverUrl) continue
    imageEntries.push({
      loc: `${SITE_URL}/loja/${p.slug}`,
      lastmod: toIsoDate(p.updatedAt),
      image: { loc: p.coverUrl, title: p.title },
    })
  }
  if (imageEntries.length > 0) {
    writeXml('sitemap-images.xml', buildUrlset(imageEntries, { withImage: true }))
    generated.push({ loc: `${SITE_URL}/sitemap-images.xml`, lastmod: today_ })
  }

  // 8) sitemap-videos.xml — aulas com youtubeVideoId
  const videoEntries = []
  for (const l of lessons ?? []) {
    if (!l.youtubeVideoId) continue
    const thumb = `https://i.ytimg.com/vi/${l.youtubeVideoId}/hqdefault.jpg`
    videoEntries.push({
      loc: `${SITE_URL}/cursos/${l.courseSlug}/${l.lessonSlug}`,
      lastmod: toIsoDate(l.updatedAt),
      video: {
        thumbnail: thumb,
        title: l.title,
        description: l.title,
        playerLoc: `https://www.youtube.com/embed/${l.youtubeVideoId}`,
      },
    })
  }
  if (videoEntries.length > 0) {
    writeXml('sitemap-videos.xml', buildUrlset(videoEntries, { withVideo: true }))
    generated.push({ loc: `${SITE_URL}/sitemap-videos.xml`, lastmod: today_ })
  }

  // sitemap-index.xml + sitemap.xml legado
  const indexXml = buildSitemapIndex(generated)
  writeXml('sitemap-index.xml', indexXml)
  writeXml('sitemap.xml', indexXml)

  console.log(
    `[sitemap] gerado índice com ${generated.length} sub-sitemaps`,
    `(courses=${courses.length ?? 0}, lessons=${lessons.length ?? 0}, posts=${posts.length ?? 0},`,
    `categories=${categories.length ?? 0}, profiles=${profiles.length ?? 0}, products=${products.length ?? 0})`,
  )
}

main().catch((err) => {
  console.error('[sitemap] erro fatal:', err)
  // Fallback mínimo para não derrubar build.
  if (!existsSync(join(PUBLIC_DIR, 'sitemap-index.xml'))) {
    const fallback = buildUrlset(
      STATIC_PATHS.map((s) => ({ loc: `${SITE_URL}${s.path}`, lastmod: s.lastmod })),
    )
    writeXml('sitemap-static.xml', fallback)
    writeXml(
      'sitemap-index.xml',
      buildSitemapIndex([{ loc: `${SITE_URL}/sitemap-static.xml`, lastmod: today() }]),
    )
    writeXml('sitemap.xml', fallback)
  }
  process.exit(0)
})
