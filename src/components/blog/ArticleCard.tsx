import { Link } from 'react-router-dom'
import { cn } from '@/lib/brand'
import { VerifiedBadge } from '@/components/VerifiedBadge'

export type ArticleCardData = {
  _id: string
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string | null
  categorySlug: string
  publishedAt: number | null
  likeCount: number
  commentCount: number
  author: {
    handle: string | null
    name: string
    avatarUrl: string | null
    identity: 'aluno' | 'criador' | 'instituicao'
    institutionName: string | null
  }
}

function formatDate(ts: number | null) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ArticleCard({
  article,
  variant = 'default',
}: {
  article: ArticleCardData
  variant?: 'default' | 'feature' | 'compact'
}) {
  const isFeature = variant === 'feature'
  const isCompact = variant === 'compact'
  const href =
    article.author.handle && article.slug ? `/blog/${article.author.handle}/${article.slug}` : '#'
  const authorLabel =
    article.author.identity === 'instituicao' && article.author.institutionName
      ? article.author.institutionName
      : article.author.name

  if (isCompact) {
    return (
      <Link
        to={href}
        className="group flex gap-4 overflow-hidden rounded-2xl border border-[#E6DBCF] bg-white p-3 transition-all duration-200 hover:border-[#F37E20]/40 hover:shadow-[0_10px_30px_rgba(17,24,39,0.06)]"
      >
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-[#F0EBE2]">
          {article.coverImageUrl ? (
            <img
              src={article.coverImageUrl}
              alt={article.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#D9CDB9]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
            {article.categorySlug.replace(/-/g, ' ')}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold leading-snug text-[#111827] group-hover:text-[#7A4A14]">
            {article.title}
          </h3>
          <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-[#6B7280]">
            <span className="truncate">{authorLabel}</span>
            <VerifiedBadge handle={article.author.handle} size="xs" />
            <span className="flex-shrink-0">· {formatDate(article.publishedAt)}</span>
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={href}
      className={cn(
        'group flex flex-col overflow-hidden rounded-[1.6rem] border border-[#E6DBCF] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(17,24,39,0.10)]',
        isFeature && 'lg:flex-row',
      )}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden bg-[#F0EBE2]',
          isFeature ? 'aspect-[16/9] lg:aspect-auto lg:w-[55%]' : 'aspect-[16/9]',
        )}
      >
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-[#D9CDB9]" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className="rounded-full border border-white/40 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A4A14] backdrop-blur-sm">
            {article.categorySlug.replace(/-/g, ' ')}
          </span>
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col p-6', isFeature && 'lg:p-8')}>
        <h3
          className={cn(
            'font-display font-bold leading-tight text-[#111827]',
            isFeature ? 'text-2xl lg:text-3xl' : 'text-xl',
          )}
        >
          {article.title}
        </h3>
        <p className={cn('mt-3 font-serif text-[#374151] line-clamp-3', isFeature ? 'text-base' : 'text-sm')}>
          {article.excerpt}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {article.author.avatarUrl ? (
              <img src={article.author.avatarUrl} alt={authorLabel} className="h-8 w-8 flex-shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#F37E20]/10 text-xs font-semibold text-[#F37E20]">
                {authorLabel.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#111827]">
                <span className="truncate">{authorLabel}</span>
                <VerifiedBadge handle={article.author.handle} size="sm" />
              </p>
              <p className="text-xs text-[#6B7280]">{formatDate(article.publishedAt)}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3 text-xs text-[#6B7280]">
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              {article.likeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
              {article.commentCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
