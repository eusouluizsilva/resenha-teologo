import { useParams, Link, Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Navbar } from '@/components/layout/Navbar'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { useSeo } from '@/lib/seo'

export function BlogCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const categories = useQuery(api.postCategories.list, {})
  const articles = useQuery(
    api.posts.listByCategory,
    categorySlug ? { categorySlug, limit: 30 } : 'skip',
  )

  const category = categories?.find((c) => c.slug === categorySlug)
  const categoryName = category?.name ?? (categorySlug ?? '').replace(/-/g, ' ')

  useSeo({
    title: `${categoryName} | Blog | Resenha do Teólogo`,
    description: category?.description ?? `Artigos sobre ${categoryName}.`,
    url: `https://resenhadoteologo.com/blog/categoria/${categorySlug ?? ''}`,
    type: 'website',
  })

  if (!categorySlug) return <Navigate to="/blog" replace />

  const isLoading = articles === undefined
  const hasArticles = !!articles && articles.length > 0

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#111827]">
      <Navbar />

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
  )
}
