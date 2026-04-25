// Helpers de SEO para páginas SPA. Sem dependência externa: injeta via DOM.
// Em SSR/prerender futuro, substituir por react-helmet-async.

import { useEffect } from 'react'

type ArticleSeoMeta = {
  title: string
  description: string
  url: string
  image?: string | null
  publishedAt?: number | null
  updatedAt?: number | null
  authorName?: string | null
  type?: 'website' | 'article'
}

export function useSeo(meta: ArticleSeoMeta) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = meta.title

    const ogTags: Array<{ property?: string; name?: string; content: string }> = [
      { property: 'og:type', content: meta.type ?? 'article' },
      { property: 'og:title', content: meta.title },
      { property: 'og:description', content: meta.description },
      { property: 'og:url', content: meta.url },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: meta.title },
      { name: 'twitter:description', content: meta.description },
      { name: 'description', content: meta.description },
    ]
    if (meta.image) {
      ogTags.push({ property: 'og:image', content: meta.image })
      ogTags.push({ name: 'twitter:image', content: meta.image })
    }
    if (meta.publishedAt) {
      ogTags.push({ property: 'article:published_time', content: new Date(meta.publishedAt).toISOString() })
    }
    if (meta.updatedAt) {
      ogTags.push({ property: 'article:modified_time', content: new Date(meta.updatedAt).toISOString() })
    }
    if (meta.authorName) {
      ogTags.push({ property: 'article:author', content: meta.authorName })
    }

    const created: HTMLMetaElement[] = []
    for (const tag of ogTags) {
      const el = document.createElement('meta')
      if (tag.property) el.setAttribute('property', tag.property)
      if (tag.name) el.setAttribute('name', tag.name)
      el.content = tag.content
      el.dataset.dynamicSeo = '1'
      document.head.appendChild(el)
      created.push(el)
    }

    // canonical
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"][data-dynamic-seo="1"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      canonical.dataset.dynamicSeo = '1'
      document.head.appendChild(canonical)
    }
    canonical.href = meta.url

    return () => {
      document.title = previousTitle
      for (const el of created) el.remove()
      canonical?.remove()
    }
  }, [
    meta.title,
    meta.description,
    meta.url,
    meta.image,
    meta.publishedAt,
    meta.updatedAt,
    meta.authorName,
    meta.type,
  ])
}

export function useArticleJsonLd(meta: {
  title: string
  description: string
  url: string
  image?: string | null
  publishedAt?: number | null
  updatedAt?: number | null
  authorName?: string | null
  authorUrl?: string | null
}) {
  useEffect(() => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: meta.title,
      description: meta.description,
      url: meta.url,
      image: meta.image ? [meta.image] : undefined,
      datePublished: meta.publishedAt ? new Date(meta.publishedAt).toISOString() : undefined,
      dateModified: meta.updatedAt ? new Date(meta.updatedAt).toISOString() : undefined,
      author: meta.authorName
        ? {
            '@type': 'Person',
            name: meta.authorName,
            url: meta.authorUrl ?? undefined,
          }
        : undefined,
      publisher: {
        '@type': 'Organization',
        name: 'Resenha do Teólogo',
      },
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.dynamicSeo = '1'
    script.text = JSON.stringify(data)
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [
    meta.title,
    meta.description,
    meta.url,
    meta.image,
    meta.publishedAt,
    meta.updatedAt,
    meta.authorName,
    meta.authorUrl,
  ])
}
