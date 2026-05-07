import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { useInView } from './useInView'

export function FeaturedArticlesSection() {
  const inView = useInView()
  const featuredArticles = useQuery(api.landingHighlights.getArticleTrio, {})

  if (!featuredArticles || featuredArticles.length === 0) return null

  return (
    <section className="bg-[#F7F5F2] px-6 py-24 text-[#111827]">
      <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
        <m.div variants={fadeUp} className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F37E20]">
              Em destaque no blog
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
              Três leituras escolhidas para hoje.
            </h2>
            <p className="mt-3 max-w-xl font-serif text-base leading-7 text-[#4B5563]">
              O artigo com mais interações, o mais recente publicado e um destaque do perfil oficial @resenhadoteologo, atualizado todos os dias.
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#111827]/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:border-[#F37E20]/40 hover:text-[#7A4A14]"
          >
            Ver todos os artigos
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l7.5 7.5-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </m.div>

        <m.div variants={staggerContainer} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredArticles.map((article) => {
            const slotLabel =
              article.slot === 'top'
                ? 'Mais lido'
                : article.slot === 'recent'
                  ? 'Mais recente'
                  : 'Do @resenhadoteologo'
            return (
              <m.div key={String(article._id)} variants={fadeUp}>
                <Link
                  to={
                    article.author.handle
                      ? `/blog/${article.author.handle}/${article.slug}`
                      : '/blog'
                  }
                  className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[#E6DBCF] bg-white transition-all hover:border-[#F37E20]/40 hover:shadow-[0_24px_60px_rgba(17,24,39,0.08)]"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#F2EAE1]">
                    {article.coverImageUrl ? (
                      <img
                        src={article.coverImageUrl}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#F37E20]/8 text-[#F37E20]">
                        <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-[#111827]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                      {slotLabel}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
                      {article.categorySlug.replace(/-/g, ' ')}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#111827] group-hover:text-[#7A4A14]">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[#4B5563]">
                      {article.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-[#6B7280]">
                      {article.author.avatarUrl ? (
                        <img
                          src={article.author.avatarUrl}
                          alt={article.author.name}
                          loading="lazy"
                          decoding="async"
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F37E20]/10 text-[10px] font-semibold text-[#F37E20]">
                          {article.author.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{article.author.name}</span>
                    </div>
                  </div>
                </Link>
              </m.div>
            )
          })}
        </m.div>
      </m.div>
    </section>
  )
}
