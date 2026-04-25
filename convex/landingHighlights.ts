// Destaques da landing publica: dois trios (artigos + cursos) com 3 slots cada.
// Slots: 'top' (mais engajado), 'recent' (mais recente) e 'resenha' (item do
// perfil oficial @resenhadoteologo, rotacionado por dia).
//
// A rotacao do slot 'resenha' usa o numero de dias desde a epoca como seed.
// Assim a escolha e deterministica por dia (todos os visitantes veem o mesmo
// item) e muda 1x a cada 24h sem cron.

import { query, type QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

const RESENHA_HANDLE = 'resenhadoteologo'
const DAY_MS = 24 * 60 * 60 * 1000

type ArticleSlot = 'top' | 'recent' | 'resenha'
type CourseSlot = 'top' | 'recent' | 'resenha'

type ArticleAuthor = {
  handle: string | null
  name: string
  avatarUrl: string | null
}

type ArticleCard = {
  slot: ArticleSlot
  _id: Id<'posts'>
  title: string
  slug: string
  excerpt: string
  categorySlug: string
  coverImageUrl: string | null
  publishedAt: number | null
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number
  authorUserId: string
  author: ArticleAuthor
}

type CourseCreator = {
  handle: string | null
  name: string
  avatarUrl: string | null
}

type CourseCard = {
  slot: CourseSlot
  _id: Id<'courses'>
  title: string
  slug: string | null
  shortDescription: string
  thumbnail: string | null
  level: 'iniciante' | 'intermediario' | 'avancado'
  category: string
  totalLessons: number
  totalStudents: number
  publishedAt: number
  creatorId: string
  creator: CourseCreator
}

function articleEngagement(p: Doc<'posts'>): number {
  return p.likeCount * 1 + p.commentCount * 2 + p.shareCount * 3 + p.viewCount * 0.1
}

async function loadArticleAuthor(
  ctx: QueryCtx,
  post: Doc<'posts'>,
): Promise<ArticleAuthor> {
  if (post.authorIdentity === 'instituicao' && post.authorInstitutionId) {
    const inst = await ctx.db.get(post.authorInstitutionId)
    return {
      handle: null,
      name: inst?.name ?? 'Instituição',
      avatarUrl: null,
    }
  }
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', post.authorUserId))
    .unique()
  return {
    handle: user?.handle ?? null,
    name: user?.name ?? 'Autor',
    avatarUrl: user?.avatarUrl ?? null,
  }
}

async function shapeArticle(
  ctx: QueryCtx,
  post: Doc<'posts'>,
  slot: ArticleSlot,
): Promise<ArticleCard> {
  const author = await loadArticleAuthor(ctx, post)
  const coverImageUrl = post.coverImageStorageId
    ? await ctx.storage.getUrl(post.coverImageStorageId)
    : null
  return {
    slot,
    _id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    categorySlug: post.categorySlug,
    coverImageUrl,
    publishedAt: post.publishedAt ?? null,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
    viewCount: post.viewCount,
    authorUserId: post.authorUserId,
    author,
  }
}

async function loadCourseCreator(
  ctx: QueryCtx,
  creatorId: string,
): Promise<CourseCreator> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', creatorId))
    .unique()
  return {
    handle: user?.handle ?? null,
    name: user?.name ?? 'Professor',
    avatarUrl: user?.avatarUrl ?? null,
  }
}

async function shapeCourse(
  ctx: QueryCtx,
  course: Doc<'courses'>,
  slot: CourseSlot,
): Promise<CourseCard> {
  const creator = await loadCourseCreator(ctx, course.creatorId)
  return {
    slot,
    _id: course._id,
    title: course.title,
    slug: course.slug ?? null,
    shortDescription: course.description.slice(0, 180),
    thumbnail: course.thumbnail ?? null,
    level: course.level,
    category: course.category,
    totalLessons: course.totalLessons ?? 0,
    totalStudents: course.totalStudents ?? 0,
    publishedAt: course._creationTime,
    creatorId: course.creatorId,
    creator,
  }
}

async function findResenhaUser(ctx: QueryCtx) {
  return await ctx.db
    .query('users')
    .withIndex('by_handle', (q) => q.eq('handle', RESENHA_HANDLE))
    .unique()
}

function dayIndex(): number {
  return Math.floor(Date.now() / DAY_MS)
}

export const getArticleTrio = query({
  args: {},
  handler: async (ctx): Promise<ArticleCard[]> => {
    const all = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(200)
    if (all.length === 0) return []

    const used = new Set<string>()
    const result: ArticleCard[] = []

    const byEngagement = [...all].sort(
      (a, b) => articleEngagement(b) - articleEngagement(a),
    )
    const top = byEngagement[0]
    if (top) {
      used.add(String(top._id))
      result.push(await shapeArticle(ctx, top, 'top'))
    }

    const recent = all.find((p) => !used.has(String(p._id)))
    if (recent) {
      used.add(String(recent._id))
      result.push(await shapeArticle(ctx, recent, 'recent'))
    }

    const resenhaUser = await findResenhaUser(ctx)
    if (resenhaUser) {
      const resenhaPosts = all.filter(
        (p) => p.authorUserId === resenhaUser.clerkId && !used.has(String(p._id)),
      )
      if (resenhaPosts.length > 0) {
        const idx = dayIndex() % resenhaPosts.length
        const pick = resenhaPosts[idx]
        used.add(String(pick._id))
        result.push(await shapeArticle(ctx, pick, 'resenha'))
      } else {
        const fallback = all.find((p) => !used.has(String(p._id)))
        if (fallback) {
          used.add(String(fallback._id))
          result.push(await shapeArticle(ctx, fallback, 'resenha'))
        }
      }
    } else {
      const fallback = all.find((p) => !used.has(String(p._id)))
      if (fallback) {
        used.add(String(fallback._id))
        result.push(await shapeArticle(ctx, fallback, 'resenha'))
      }
    }

    return result
  },
})

export const getCourseTrio = query({
  args: {},
  handler: async (ctx): Promise<CourseCard[]> => {
    const allPublished = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect()
    const visible = allPublished.filter((c) => c.visibility !== 'institution')
    if (visible.length === 0) return []

    const used = new Set<string>()
    const result: CourseCard[] = []

    const byEnroll = [...visible].sort(
      (a, b) => (b.totalStudents ?? 0) - (a.totalStudents ?? 0),
    )
    const top = byEnroll[0]
    if (top) {
      used.add(String(top._id))
      result.push(await shapeCourse(ctx, top, 'top'))
    }

    const byRecent = [...visible].sort((a, b) => b._creationTime - a._creationTime)
    const recent = byRecent.find((c) => !used.has(String(c._id)))
    if (recent) {
      used.add(String(recent._id))
      result.push(await shapeCourse(ctx, recent, 'recent'))
    }

    const resenhaUser = await findResenhaUser(ctx)
    if (resenhaUser) {
      const resenhaCourses = visible.filter(
        (c) => c.creatorId === resenhaUser.clerkId && !used.has(String(c._id)),
      )
      if (resenhaCourses.length > 0) {
        const idx = dayIndex() % resenhaCourses.length
        const pick = resenhaCourses[idx]
        used.add(String(pick._id))
        result.push(await shapeCourse(ctx, pick, 'resenha'))
      } else {
        const fallback = byRecent.find((c) => !used.has(String(c._id)))
        if (fallback) {
          used.add(String(fallback._id))
          result.push(await shapeCourse(ctx, fallback, 'resenha'))
        }
      }
    } else {
      const fallback = byRecent.find((c) => !used.has(String(c._id)))
      if (fallback) {
        used.add(String(fallback._id))
        result.push(await shapeCourse(ctx, fallback, 'resenha'))
      }
    }

    return result
  },
})
