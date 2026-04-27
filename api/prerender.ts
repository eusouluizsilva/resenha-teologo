// Serverless function para servir HTML pré-renderizado com meta tags reais
// para crawlers e previews de link (WhatsApp, Facebook, Twitter, LinkedIn,
// Slack, Bing, etc.). A SPA continua servindo usuários normais via rewrite
// catch-all em vercel.json. Crawlers caem aqui via rewrite condicional com
// `has` matching User-Agent.
//
// Caminhos suportados: /blog/<handle>/<slug>
//
// Por que: SPA pura demora dias pra ser indexada e compartilhamento de link
// nunca mostra OG correto (preview vê o og-default). Aqui injetamos title,
// description, og:image, JSON-LD Article + BreadcrumbList e o body em HTML
// pra Googlebot/Bingbot indexarem o texto direto.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import { marked } from 'marked'

const SITE_ORIGIN = 'https://resenhadoteologo.com'
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-default.jpg`
const CONVEX_URL =
  process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL ?? 'https://blessed-platypus-993.convex.cloud'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

type PostMeta = {
  title: string
  description: string
  url: string
  canonical: string
  image: string
  imageAlt: string
  authorName: string
  authorHandle: string | null
  publishedAt: number | null
  updatedAt: number | null
  categorySlug: string
  bodyHtml: string
}

function renderHtml(meta: PostMeta): string {
  const ogTags = [
    ['og:type', 'article'],
    ['og:title', meta.title],
    ['og:description', meta.description],
    ['og:url', meta.canonical],
    ['og:site_name', 'Resenha do Teólogo'],
    ['og:locale', 'pt_BR'],
    ['og:image', meta.image],
    ['og:image:alt', meta.imageAlt],
    ['og:image:width', '1200'],
    ['og:image:height', '630'],
  ]
  if (meta.publishedAt) {
    ogTags.push(['article:published_time', new Date(meta.publishedAt).toISOString()])
  }
  if (meta.updatedAt) {
    ogTags.push(['article:modified_time', new Date(meta.updatedAt).toISOString()])
  }
  if (meta.authorName) {
    ogTags.push(['article:author', meta.authorName])
  }
  ogTags.push(['article:section', meta.categorySlug])

  const twitter = [
    ['twitter:card', 'summary_large_image'],
    ['twitter:site', '@resenhadoteologo'],
    ['twitter:title', meta.title],
    ['twitter:description', meta.description],
    ['twitter:image', meta.image],
    ['twitter:image:alt', meta.imageAlt],
  ]

  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    url: meta.canonical,
    image: [meta.image],
    datePublished: meta.publishedAt ? new Date(meta.publishedAt).toISOString() : undefined,
    dateModified: meta.updatedAt ? new Date(meta.updatedAt).toISOString() : undefined,
    author: {
      '@type': 'Person',
      name: meta.authorName,
      url: meta.authorHandle ? `${SITE_ORIGIN}/${meta.authorHandle}` : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Resenha do Teólogo',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/logos/LOGO%20QUADRADA%20LETRA%20BRANCA.png`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': meta.canonical },
  }

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_ORIGIN}/blog` },
      ...(meta.authorHandle
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: meta.authorName,
              item: `${SITE_ORIGIN}/${meta.authorHandle}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: meta.authorHandle ? 4 : 3,
        name: meta.title,
        item: meta.canonical,
      },
    ],
  }

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeAttr(meta.description)}" />
<link rel="canonical" href="${escapeAttr(meta.canonical)}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
${ogTags.map(([k, v]) => `<meta property="${k}" content="${escapeAttr(v)}" />`).join('\n')}
${twitter.map(([k, v]) => `<meta name="${k}" content="${escapeAttr(v)}" />`).join('\n')}
<script type="application/ld+json">${JSON.stringify(jsonLdArticle)}</script>
<script type="application/ld+json">${JSON.stringify(jsonLdBreadcrumb)}</script>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #111827; line-height: 1.7; }
  h1 { font-size: 2rem; line-height: 1.2; margin-bottom: 0.5rem; }
  .excerpt { font-style: italic; color: #4B5563; margin-bottom: 2rem; }
  .meta { font-size: 0.85rem; color: #6B7280; margin-bottom: 2rem; }
  .cover { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 12px; margin-bottom: 2rem; }
  article img { max-width: 100%; height: auto; border-radius: 8px; }
  article a { color: #F37E20; }
  article h2 { font-size: 1.5rem; margin-top: 2rem; }
  article blockquote { border-left: 3px solid #F37E20; padding-left: 1rem; color: #4B5563; }
  .footer-cta { margin-top: 3rem; padding: 1.5rem; background: #F7F5F2; border-radius: 12px; text-align: center; }
  .footer-cta a { color: #F37E20; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<header>
  <a href="${SITE_ORIGIN}/" style="text-decoration:none;color:#111827;font-weight:600">Resenha do Teólogo</a>
  <nav style="margin-top:0.5rem"><a href="${SITE_ORIGIN}/blog" style="color:#6B7280;font-size:0.85rem">← Voltar ao blog</a></nav>
</header>
<article>
  <p style="text-transform:uppercase;letter-spacing:0.2em;color:#F37E20;font-size:0.75rem;font-weight:700;margin-top:1.5rem">${escapeHtml(meta.categorySlug.replace(/-/g, ' '))}</p>
  <h1>${escapeHtml(meta.title)}</h1>
  <p class="excerpt">${escapeHtml(meta.description)}</p>
  <p class="meta">Por <strong>${escapeHtml(meta.authorName)}</strong>${
    meta.publishedAt
      ? ` &middot; ${new Date(meta.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
      : ''
  }</p>
  ${meta.image && meta.image !== DEFAULT_OG_IMAGE ? `<img class="cover" src="${escapeAttr(meta.image)}" alt="${escapeAttr(meta.imageAlt)}" />` : ''}
  ${meta.bodyHtml}
</article>
<div class="footer-cta">
  <p>Leia este artigo com a experiência completa em</p>
  <a href="${escapeAttr(meta.canonical)}">${escapeAttr(meta.canonical)}</a>
</div>
</body>
</html>
`
}

function fallback(message: string, status = 404): { status: number; html: string } {
  return {
    status,
    html: `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Resenha do Teólogo</title><meta name="robots" content="noindex"/></head><body><h1>${escapeHtml(message)}</h1><p><a href="${SITE_ORIGIN}/blog">Voltar ao blog</a></p></body></html>`,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // path vem do rewrite. Aceita também ?path= direto pra teste manual.
  const rawPath = (req.query.path ?? req.url ?? '').toString()
  const path = rawPath.split('?')[0].split('#')[0]

  // Match /blog/<handle>/<slug>
  const blogMatch = path.match(/^\/blog\/([^/]+)\/([^/]+)\/?$/)
  if (!blogMatch) {
    const fb = fallback('Página não encontrada')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
    return res.status(fb.status).send(fb.html)
  }

  const [, handle, slug] = blogMatch

  try {
    const client = new ConvexHttpClient(CONVEX_URL)
    const post = await client.query(api.posts.getBySlugForReader, { handle, slug })

    if (!post) {
      const fb = fallback('Artigo não encontrado')
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
      return res.status(fb.status).send(fb.html)
    }

    const canonical = `${SITE_ORIGIN}/blog/${handle}/${slug}`
    const description = post.excerpt || post.title
    const image = post.coverImageUrl || DEFAULT_OG_IMAGE
    const bodyHtml = await marked.parse(post.bodyMarkdown || '', { async: true })

    const html = renderHtml({
      title: `${post.title}, ${post.author.name}, Resenha do Teólogo`,
      description,
      url: canonical,
      canonical,
      image,
      imageAlt: `Capa do artigo: ${post.title}`,
      authorName: post.author.name,
      authorHandle: post.author.handle,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      categorySlug: post.categorySlug,
      bodyHtml,
    })

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    // Edge cache 1h, revalidate 24h. Postos atualizados raramente; se mudar,
    // o updatedAt entra na chave do cache via rewrite (não, mas s-maxage curto resolve).
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).send(html)
  } catch (err) {
    console.error('[prerender] erro:', err)
    const fb = fallback('Erro ao carregar artigo', 500)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(fb.status).send(fb.html)
  }
}
