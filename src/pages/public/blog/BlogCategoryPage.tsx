import { useParams, Link, Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { useBreadcrumbJsonLd, useJsonLd, useSeo } from '@/lib/seo'

const CATEGORY_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'

export function BlogCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const categories = useQuery(api.postCategories.list, {})
  const articles = useQuery(
    api.posts.listByCategory,
    categorySlug ? { categorySlug, limit: 30 } : 'skip',
  )

  const category = categories?.find((c) => c.slug === categorySlug)
  const categoryName = category?.name ?? (categorySlug ?? '').replace(/-/g, ' ')
  const categoryUrl = `${CATEGORY_ORIGIN}/blog/categoria/${categorySlug ?? ''}`

  useSeo({
    title: `${categoryName}, artigos de teologia, Resenha do Teólogo`,
    description:
      category?.description ??
      `Artigos editoriais sobre ${categoryName} no blog gratuito da Resenha do Teólogo.`,
    url: categoryUrl,
    type: 'website',
  })

  useBreadcrumbJsonLd(
    categorySlug
      ? [
          { name: 'Início', url: `${CATEGORY_ORIGIN}/` },
          { name: 'Blog', url: `${CATEGORY_ORIGIN}/blog` },
          { name: categoryName, url: categoryUrl },
        ]
      : null,
  )

  useJsonLd(
    articles && articles.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${categoryName}, artigos de teologia`,
          url: categoryUrl,
          inLanguage: 'pt-BR',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: articles.slice(0, 30).map((a, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${CATEGORY_ORIGIN}/blog/${a.author.handle ?? ''}/${a.slug}`,
              name: a.title,
            })),
          },
        }
      : null,
  )

  if (!categorySlug) return <Navigate to="/blog" replace />

  const isLoading = articles === undefined
  const hasArticles = !!articles && articles.length > 0

  return (
    <PublicPageShell>
    <div className="min-h-screen bg-[#F7F5F2] text-[#111827]">
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <header className="mb-10">
            <Link to="/blog" className="text-sm text-[#F37E20] hover:underline">
              Voltar ao blog
            </Link>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl capitalize">
              {categoryName}
            </h1>
            {category?.description && (
              <p className="mt-4 max-w-2xl font-serif text-lg leading-7 text-[#4B5563]">
                {category.description}
              </p>
            )}
          </header>

          {isLoading && (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
            </div>
          )}

          {!isLoading && !hasArticles && (
            <div className="rounded-[1.6rem] border border-dashed border-[#E6DBCF] bg-white p-10 text-center">
              <p className="font-display text-xl font-semibold text-[#111827]">Sem artigos nesta categoria ainda</p>
              <p className="mt-2 font-serif text-[#6B7280]">Em breve, novas leituras estarão aqui.</p>
            </div>
          )}

          {hasArticles && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles!.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
    </PublicPageShell>
  )
}
