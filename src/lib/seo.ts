// Helpers de SEO para páginas SPA. Sem dependência externa: injeta via DOM.
// Em SSR/prerender futuro, substituir por react-helmet-async.

import { useEffect } from 'react'

const SITE_ORIGIN = 'https://resenhadoteologo.com'
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-default.jpg`
const DEFAULT_OG_ALT = 'Resenha do Teólogo, plataforma gratuita de ensino teológico'

type ArticleSeoMeta = {
  title: string
  description: string
  url: string
  image?: string | null
  imageAlt?: string | null
  publishedAt?: number | null
  updatedAt?: number | null
  authorName?: string | null
  type?: 'website' | 'article'
}

export function useSeo(meta: ArticleSeoMeta) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = meta.title

    const finalImage = meta.image ?? DEFAULT_OG_IMAGE
    const finalImageAlt = meta.imageAlt ?? meta.title ?? DEFAULT_OG_ALT

    const ogTags: Array<{ property?: string; name?: string; content: string }> = [
      { property: 'og:type', content: meta.type ?? 'article' },
      { property: 'og:title', content: meta.title },
      { property: 'og:description', content: meta.description },
      { property: 'og:url', content: meta.url },
      { property: 'og:image', content: finalImage },
      { property: 'og:image:alt', content: finalImageAlt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: meta.title },
      { name: 'twitter:description', content: meta.description },
      { name: 'twitter:image', content: finalImage },
      { name: 'twitter:image:alt', content: finalImageAlt },
      { name: 'description', content: meta.description },
    ]
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

    // canonical: remove TODOS os canonicals existentes (incluindo estaticos
    // herdados do index.html) antes de injetar o dinamico, para evitar duas
    // tags canonical no DOM que confundem o Google Search Console.
    const previousCanonicals = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'),
    )
    const stashedCanonicals = previousCanonicals.map((el) => ({ el, href: el.href }))
    for (const { el } of stashedCanonicals) el.remove()

    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.dataset.dynamicSeo = '1'
    canonical.href = meta.url
    document.head.appendChild(canonical)

    return () => {
      document.title = previousTitle
      for (const el of created) el.remove()
      canonical.remove()
      // restaura canonicals que existiam antes (caso voltemos a uma rota sem useSeo)
      for (const { el, href } of stashedCanonicals) {
        el.href = href
        document.head.appendChild(el)
      }
    }
  }, [
    meta.title,
    meta.description,
    meta.url,
    meta.image,
    meta.imageAlt,
    meta.publishedAt,
    meta.updatedAt,
    meta.authorName,
    meta.type,
  ])
}

// Genérico: injeta qualquer objeto como <script type="application/ld+json">.
// Use para Course, ItemList, Organization, BreadcrumbList, etc. JSON é
// estabilizado via JSON.stringify para que a key do useEffect só dispare
// quando o conteúdo realmente muda.
export function useJsonLd(data: Record<string, unknown> | null | undefined) {
  const serialized = data ? JSON.stringify(data) : null
  useEffect(() => {
    if (!serialized) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.dynamicSeo = '1'
    script.text = serialized
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [serialized])
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
      '@type': 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': meta.url },
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
        logo: {
          '@type': 'ImageObject',
          url: 'https://resenhadoteologo.com/logos/LOGO%20QUADRADA%20LETRA%20BRANCA.png',
        },
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

export type BreadcrumbItem = { name: string; url: string }

export function useBreadcrumbJsonLd(items: BreadcrumbItem[] | null | undefined) {
  const valid = items && items.length > 0 ? items : null
  const serialized = valid
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: valid.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      })
    : null

  useEffect(() => {
    if (!serialized) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.dynamicSeo = '1'
    script.text = serialized
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [serialized])
}

export type FaqItem = { question: string; answer: string }

export function useFaqJsonLd(items: FaqItem[] | null | undefined) {
  const valid = items && items.length > 0 ? items : null
  const serialized = valid
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: valid.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      })
    : null

  useEffect(() => {
    if (!serialized) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.dynamicSeo = '1'
    script.text = serialized
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [serialized])
}
