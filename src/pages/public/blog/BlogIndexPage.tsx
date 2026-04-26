import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../../convex/_generated/api'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { useBreadcrumbJsonLd, useJsonLd, useSeo } from '@/lib/seo'

const BLOG_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'

export function BlogIndexPage() {
  const articles = useQuery(api.posts.listPublic, { limit: 24 })
  const categories = useQuery(api.postCategories.list, {})
  const featured = useQuery(api.postRanking.getTopByCategory, {
    categorySlug: 'all',
    limit: 5,
  })

  useSeo({
    title: 'Blog de teologia, artigos gratuitos, Resenha do Teólogo',
    description:
      'Artigos editoriais de teologia, Bíblia, história da igreja e vida cristã. Conteúdo gratuito, plural e em português.',
    url: `${BLOG_ORIGIN}/blog`,
    type: 'website',
  })

  useBreadcrumbJsonLd([
    { name: 'Início', url: `${BLOG_ORIGIN}/` },
    { name: 'Blog', url: `${BLOG_ORIGIN}/blog` },
  ])

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog da Resenha do Teólogo',
    url: `${BLOG_ORIGIN}/blog`,
    inLanguage: 'pt-BR',
    publisher: {
      '@type': 'Organization',
      name: 'Resenha do Teólogo',
      url: `${BLOG_ORIGIN}/`,
    },
  })

  const isLoading = articles === undefined
  const hasArticles = !!articles && articles.length > 0
  const hasFeatured = !!featured && featured.length > 0
  const featuredIds = new Set(hasFeatured ? featured.map((f) => String(f._id)) : [])
  const rest = hasArticles ? articles.filter((a) => !featuredIds.has(String(a._id))) : []

  return (
    <PublicPageShell>
    <div className="min-h-screen bg-[#F7F5F2] text-[#111827]">
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <header className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F37E20]">Blog</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Leituras para quem estuda teologia.
            </h1>
            <p className="mt-4 max-w-2xl font-serif text-lg leading-7 text-[#4B5563]">
              Artigos publicados por professores, alunos e instituições da plataforma. Sem paywall, sem venda, sem ruído.
            </p>
          </header>

          {categories && categories.length > 0 && (
            <nav className="mb-10 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/blog/categoria/${cat.slug}`}
                  className="rounded-full border border-[#E6DBCF] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:border-[#F37E20]/40 hover:text-[#7A4A14]"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          )}

          {isLoading && (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
            </div>
          )}

          {!isLoading && !hasArticles && (
            <div className="rounded-[1.6rem] border border-dashed border-[#E6DBCF] bg-white p-10 text-center">
              <p className="font-display text-xl font-semibold text-[#111827]">Em breve</p>
              <p className="mt-2 font-serif text-[#6B7280]">
                Estamos preparando os primeiros artigos. Volte em alguns dias.
              </p>
            </div>
          )}

          {hasFeatured && (
            <section className="mb-12">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F37E20]">
                Em destaque
              </p>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <ArticleCard article={featured[0]} variant="feature" />
                </div>
                <div className="space-y-4">
                  {featured.slice(1, 4).map((article) => (
                    <ArticleCard key={String(article._id)} article={article} variant="compact" />
                  ))}
                </div>
              </div>
            </section>
          )}

          {hasArticles && rest.length > 0 && (
            <section>
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F37E20]">
                Mais recentes
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((article) => (
                  <ArticleCard key={String(article._id)} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
    </PublicPageShell>
  )
}
