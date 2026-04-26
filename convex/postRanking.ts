// Ranking diário de artigos por categoria. O score combina engajamento com
// decaimento exponencial (half-life 14 dias) para favorecer conteúdo recente
// sem zerar artigos clássicos.
//
// Fórmula: score = (likes*1 + comments*2 + shares*3) * 2 ^ (-ageDays / 14)
//
// Snapshots ficam em postRankingSnapshots (categorySlug, generatedAt, topPostIds)
// e a home/blog index consomem em O(1) sem recomputar a cada page-load.

import { v } from 'convex/values'
import { internalMutation, query, type QueryCtx } from './_generated/server'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'

const HALF_LIFE_DAYS = 14
const TOP_N = 5
const MAX_AGE_DAYS = 365 // não considerar posts mais antigos que 1 ano

function engagementScore(post: Doc<'posts'>, now: number): number {
  const raw = post.likeCount * 1 + post.commentCount * 2 + post.shareCount * 3
  if (raw <= 0) return 0
  const publishedAt = post.publishedAt ?? post.updatedAt
  const ageDays = Math.max(0, (now - publishedAt) / (1000 * 60 * 60 * 24))
  if (ageDays > MAX_AGE_DAYS) return 0
  return raw * Math.pow(2, -ageDays / HALF_LIFE_DAYS)
}

// Recalcula os snapshots por categoria + global. Chamado pelo cron 1x/dia.
export const computeDailyRanking = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const allPublished = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(500)

    const scoredAll = allPublished
      .map((p) => ({ p, score: engagementScore(p, now) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N)
    await ctx.db.insert('postRankingSnapshots', {
      categorySlug: 'all',
      generatedAt: now,
      topPostIds: scoredAll.map((r) => r.p._id),
    })

    const cats = await ctx.db.query('postCategories').collect()
    for (const cat of cats) {
      const inCategory = allPublished.filter((p) => p.categorySlug === cat.slug)
      const scored = inCategory
        .map((p) => ({ p, score: engagementScore(p, now) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_N)
      await ctx.db.insert('postRankingSnapshots', {
        categorySlug: cat.slug,
        generatedAt: now,
        topPostIds: scored.map((r) => r.p._id),
      })
    }

    // Poda snapshots antigos (mantém os 7 mais recentes por categoria).
    const allCats = ['all', ...cats.map((c) => c.slug)]
    for (const slug of allCats) {
      const snaps = await ctx.db
        .query('postRankingSnapshots')
        .withIndex('by_category_at', (q) => q.eq('categorySlug', slug))
        .order('desc')
        .collect()
      const toDelete = snaps.slice(7)
      for (const s of toDelete) await ctx.db.delete(s._id)
    }
  },
})

type PublicAuthor = {
  handle: string | null
  name: string
  avatarUrl: string | null
  identity: 'aluno' | 'criador' | 'instituicao'
  institutionName: string | null
}

type RankedPost = {
  _id: Id<'posts'>
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string | null
  categorySlug: string
  publishedAt: number | null
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number
  authorUserId: string
  author: PublicAuthor
}

async function loadPublicAuthor(ctx: QueryCtx, post: Doc<'posts'>): Promise<PublicAuthor> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', post.authorUserId))
    .unique()
  let institutionName: string | null = null
  if (post.authorIdentity === 'instituicao' && post.authorInstitutionId) {
    const inst = await ctx.db.get(post.authorInstitutionId)
    institutionName = inst?.name ?? null
  }
  return {
    handle: user?.handle ?? null,
    name: user?.name ?? 'Autor',
    avatarUrl: user?.avatarUrl ?? null,
    identity: post.authorIdentity,
    institutionName,
  }
}

async function shapeRanked(ctx: QueryCtx, post: Doc<'posts'>): Promise<RankedPost> {
  const author = await loadPublicAuthor(ctx, post)
  const coverImageUrl = post.coverImageStorageId
    ? await ctx.storage.getUrl(post.coverImageStorageId)
    : null
  return {
    _id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImageUrl,
    categorySlug: post.categorySlug,
    publishedAt: post.publishedAt ?? null,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
    viewCount: post.viewCount,
    authorUserId: post.authorUserId,
    author,
  }
}

// Public: top por categoria. Lê o snapshot mais recente. Se nenhum existe
// (antes do primeiro cron rodar), faz fallback para os posts mais recentes
// para que a UI não fique vazia.
export const getTopByCategory = query({
  args: {
    categorySlug: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<RankedPost[]> => {
    const limit = Math.min(args.limit ?? TOP_N, 10)

    const snapshot = await ctx.db
      .query('postRankingSnapshots')
      .withIndex('by_category_at', (q) => q.eq('categorySlug', args.categorySlug))
      .order('desc')
      .first()

    let posts: Doc<'posts'>[] = []

    if (snapshot && snapshot.topPostIds.length > 0) {
      const fetched = await Promise.all(snapshot.topPostIds.map((id) => ctx.db.get(id)))
      posts = fetched.filter(
        (p): p is Doc<'posts'> => !!p && p.status === 'published',
      )
    }

    if (posts.length === 0) {
      if (args.categorySlug === 'all') {
        posts = await ctx.db
          .query('posts')
          .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
          .order('desc')
          .take(limit)
      } else {
        const rows = await ctx.db
          .query('posts')
          .withIndex('by_category_publishedAt', (q) =>
            q.eq('categorySlug', args.categorySlug),
          )
          .order('desc')
          .take(limit + 16)
        posts = rows.filter((p) => p.status === 'published').slice(0, limit)
      }
    }

    return await Promise.all(posts.slice(0, limit).map((p) => shapeRanked(ctx, p)))
  },
})

// Runner do scheduled-publish: a cada 5min, pega posts com status='scheduled'
// e publishAt <= now e flippa para 'published'. Notificações de seguidores são
// despachadas igual à publicação manual.
export const runScheduledPublish = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const due = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'scheduled'))
      .take(50)

    for (const post of due) {
      if (!post.publishAt || post.publishAt > now) continue
      const wasPublishedBefore = !!post.publishedAt
      await ctx.db.patch(post._id, {
        status: 'published',
        publishedAt: post.publishedAt ?? now,
        updatedAt: now,
      })
      if (wasPublishedBefore) continue

      const author = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', post.authorUserId))
        .unique()
      const handle = author?.handle ?? null
      const link = handle ? `/blog/${handle}/${post.slug}` : '/blog'
      const followers = await ctx.db
        .query('profileFollows')
        .withIndex('by_author', (q) => q.eq('authorUserId', post.authorUserId))
        .take(100)
      const authorName =
        post.authorIdentity === 'instituicao' && post.authorInstitutionId
          ? (await ctx.db.get(post.authorInstitutionId))?.name ?? author?.name ?? 'Autor'
          : author?.name ?? 'Autor'
      await Promise.all(
        followers
          .filter((f) => f.notifyArticles)
          .map((f) =>
            ctx.runMutation(internal.notifications.pushInternal, {
              userId: f.followerUserId,
              kind: 'post_published',
              title: `Novo artigo de ${authorName}`,
              body: post.title,
              link,
            }),
          ),
      )
    }
  },
})
