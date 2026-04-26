import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { ArticleBody } from '@/components/blog/ArticleBody'
import { ArticleReactions } from '@/components/blog/ArticleReactions'
import { ArticleComments } from '@/components/blog/ArticleComments'
import { FollowButton } from '@/components/blog/FollowButton'
import { AdSlot } from '@/components/AdSlot'
import { useArticleJsonLd, useBreadcrumbJsonLd, useSeo } from '@/lib/seo'

const VIEW_DEDUP_KEY_PREFIX = 'rdt_post_view_'
const POST_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'

function formatDate(ts: number | null) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function BlogPostPage() {
  const { handle, postSlug } = useParams<{ handle: string; postSlug: string }>()
  const post = useQuery(
    api.posts.getBySlugForReader,
    handle && postSlug ? { handle, slug: postSlug } : 'skip',
  )
  const incrementView = useMutation(api.posts.incrementView)

  const url = `${POST_ORIGIN}/blog/${handle}/${postSlug}`

  useSeo({
    title: post
      ? `${post.title}, ${post.author.name}, Resenha do Teólogo`
      : 'Artigo, Resenha do Teólogo',
    description: post?.excerpt ?? 'Artigo no blog gratuito da Resenha do Teólogo.',
    url,
    image: post?.coverImageUrl ?? null,
    imageAlt: post ? `Capa do artigo: ${post.title}` : null,
    publishedAt: post?.publishedAt ?? null,
    updatedAt: post?.updatedAt ?? null,
    authorName: post?.author.name ?? null,
    type: 'article',
  })

  useArticleJsonLd({
    title: post?.title ?? '',
    description: post?.excerpt ?? '',
    url,
    image: post?.coverImageUrl ?? null,
    publishedAt: post?.publishedAt ?? null,
    updatedAt: post?.updatedAt ?? null,
    authorName: post?.author.name ?? null,
    authorUrl: post?.author.handle ? `${POST_ORIGIN}/${post.author.handle}` : null,
  })

  useBreadcrumbJsonLd(
    post
      ? [
          { name: 'Início', url: `${POST_ORIGIN}/` },
          { name: 'Blog', url: `${POST_ORIGIN}/blog` },
          { name: post.author.name, url: `${POST_ORIGIN}/${post.author.handle ?? handle}` },
          { name: post.title, url },
        ]
      : null,
  )

  useEffect(() => {
    if (!post) return
    const key = VIEW_DEDUP_KEY_PREFIX + post._id
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    incrementView({ postId: post._id }).catch(() => {})
  }, [post, incrementView])

  if (!handle || !postSlug) return <Navigate to="/blog" replace />

  if (post === undefined) {
    return (
      <PublicPageShell>
        <div className="min-h-screen bg-[#F7F5F2]">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
          </div>
        </div>
      </PublicPageShell>
    )
  }

  if (post === null) {
    return (
      <PublicPageShell>
      <div className="min-h-screen bg-[#F7F5F2] text-[#111827]">
        <main className="pt-32 pb-24">
          <div className="mx-auto max-w-2xl px-5 text-center">
            <h1 className="font-display text-3xl font-bold">Artigo não encontrado</h1>
            <p className="mt-3 font-serif text-[#4B5563]">
              Este endereço não existe ou o artigo foi removido.
            </p>
            <Link to="/blog" className="mt-6 inline-flex rounded-2xl bg-[#F37E20] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e06e10]">
              Voltar ao blog
            </Link>
          </div>
        </main>
      </div>
      </PublicPageShell>
    )
  }

  const authorLabel =
    post.author.identity === 'instituicao' && post.author.institutionName
      ? post.author.institutionName
      : post.author.name

  return (
    <PublicPageShell>
    <div className="min-h-screen bg-[#F7F5F2] text-[#111827]">
      <main className="pt-28 pb-24">
        <article className="mx-auto max-w-3xl px-5 md:px-8">
          <div className="mb-8">
            <Link to={`/blog/categoria/${post.categorySlug}`} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F37E20] hover:underline">
              {post.categorySlug.replace(/-/g, ' ')}
            </Link>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 font-serif text-lg leading-8 text-[#4B5563]">{post.excerpt}</p>
          </div>

          <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-[#E6DBCF] py-5">
            {post.author.handle ? (
              <Link to={`/${post.author.handle}`} className="flex items-center gap-3">
                {post.author.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt={authorLabel} className="h-11 w-11 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F37E20]/10 text-sm font-semibold text-[#F37E20]">
                    {authorLabel.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-[#111827]">{authorLabel}</p>
                  <p className="text-xs text-[#6B7280]">
                    {formatDate(post.publishedAt)} • {post.viewCount.toLocaleString('pt-BR')} leituras
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F37E20]/10 text-sm font-semibold text-[#F37E20]">
                  {authorLabel.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[#111827]">{authorLabel}</p>
                  <p className="text-xs text-[#6B7280]">{formatDate(post.publishedAt)}</p>
                </div>
              </div>
            )}
            <FollowButton authorUserId={post.authorUserId} authorName={authorLabel} />
          </header>

          {post.coverImageUrl && (
            <figure className="mb-10 -mx-5 md:mx-0">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full rounded-none object-cover md:rounded-2xl"
                style={{ aspectRatio: '16 / 9' }}
              />
            </figure>
          )}

          <ArticleBody markdown={post.bodyMarkdown} />

          <footer className="mt-16 space-y-8 border-t border-[#E6DBCF] pt-8">
            <ArticleReactions
              postId={post._id}
              url={url}
              title={post.title}
              initialLikeCount={post.likeCount}
              initialShareCount={post.shareCount}
            />

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E6DBCF] bg-white p-5">
              <div className="flex items-center gap-3">
                {post.author.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt={authorLabel} className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F37E20]/10 text-sm font-semibold text-[#F37E20]">
                    {authorLabel.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#111827]">{authorLabel}</p>
                  {post.author.bio && (
                    <p className="text-sm text-[#6B7280] line-clamp-2 max-w-md">{post.author.bio}</p>
                  )}
                </div>
              </div>
              <FollowButton authorUserId={post.authorUserId} authorName={authorLabel} />
            </div>
          </footer>

          <div className="mt-12">
            <AdSlot
              slotId="blog-post-footer"
              creatorId={post.authorUserId}
              className="rounded-2xl border border-[#E6DBCF] bg-white p-6"
            />
          </div>

          <div className="mt-16">
            <ArticleComments postId={post._id} postAuthorUserId={post.authorUserId} />
          </div>
        </article>
      </main>
    </div>
    </PublicPageShell>
  )
}
