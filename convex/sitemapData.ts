import { query } from './_generated/server'

function extractYoutubeId(url: string | undefined | null): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i)
  return m ? m[1] : null
}

// Queries dedicadas à geração de sitemap. São queries públicas, mas retornam
// apenas campos mínimos (slug, lastmod, imagem pública), nunca dados privados.
// O script generate-sitemap.mjs roda no build com ConvexHttpClient e consome
// estes endpoints.

export const listCoursesForSitemap = query({
  args: {},
  handler: async (ctx) => {
    // Apenas cursos publicos (não institucionais), sem auth context.
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect()

    return courses
      .filter((c) => c.visibility !== 'institution')
      .map((c) => ({
        slug: c.slug ?? null,
        id: c._id,
        thumbnail: c.thumbnail ?? null,
        title: c.title,
        updatedAt: c._creationTime,
      }))
  },
})

export const listLessonsForSitemap = query({
  args: {},
  handler: async (ctx) => {
    // Cruza lessons publicadas com seus cursos. Retorna pares (courseSlug, lessonSlug)
    // para alimentar /cursos/:courseSlug/:lessonSlug.
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect()
    const publicCourses = courses.filter((c) => c.visibility !== 'institution' && c.slug)
    const courseById = new Map(publicCourses.map((c) => [c._id, c]))

    const allLessons = await Promise.all(
      publicCourses.map((c) =>
        ctx.db
          .query('lessons')
          .withIndex('by_courseId', (q) => q.eq('courseId', c._id))
          .collect(),
      ),
    )

    const out: Array<{
      courseSlug: string
      lessonSlug: string
      title: string
      youtubeVideoId: string | null
      thumbnail: string | null
      updatedAt: number
    }> = []
    for (const lessons of allLessons) {
      for (const lesson of lessons) {
        if (!lesson.isPublished) continue
        if (!lesson.slug) continue
        const course = courseById.get(lesson.courseId)
        if (!course?.slug) continue
        out.push({
          courseSlug: course.slug,
          lessonSlug: lesson.slug,
          title: lesson.title,
          youtubeVideoId: extractYoutubeId(lesson.youtubeUrl),
          thumbnail: course.thumbnail ?? null,
          updatedAt: lesson._creationTime,
        })
      }
    }
    return out
  },
})

export const listPostsForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(5000)

    const authorIds = Array.from(new Set(posts.map((p) => p.authorUserId)))
    const authors = await Promise.all(
      authorIds.map((id) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', id))
          .unique(),
      ),
    )
    const handleByClerkId = new Map<string, string>()
    authors.forEach((u, i) => {
      if (u?.handle) handleByClerkId.set(authorIds[i], u.handle)
    })

    const out: Array<{
      handle: string
      slug: string
      title: string
      coverUrl: string | null
      publishedAt: number
      updatedAt: number
    }> = []
    for (const p of posts) {
      const handle = handleByClerkId.get(p.authorUserId)
      if (!handle) continue
      const coverUrl = p.coverImageStorageId
        ? await ctx.storage.getUrl(p.coverImageStorageId)
        : null
      out.push({
        handle,
        slug: p.slug,
        title: p.title,
        coverUrl,
        publishedAt: p.publishedAt ?? p._creationTime,
        updatedAt: p.updatedAt ?? p._creationTime,
      })
    }
    return out
  },
})

export const listBlogCategoriesForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('postCategories').collect()
    return categories.map((c) => ({ slug: c.slug, name: c.name }))
  },
})

export const listProductsForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query('products')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .collect()
    return products.map((p) => ({
      slug: p.slug,
      title: p.title,
      coverUrl: p.coverUrl ?? null,
      updatedAt: p.updatedAt ?? p._creationTime,
    }))
  },
})

export const listProfilesForSitemap = query({
  args: {},
  handler: async (ctx) => {
    // Inverte a busca: em vez de varrer 5000 users e fazer 2 .first() por
    // usuario (10000 round-trips no pior caso), pegamos o conjunto de
    // creators/authors com conteudo publicado direto dos indices `by_published`
    // e `by_status_publishedAt`, deduplicamos clerkIds e so depois resolvemos
    // os handles via `by_clerkId`.
    const [publishedCourses, publishedPosts] = await Promise.all([
      ctx.db
        .query('courses')
        .withIndex('by_published', (q) => q.eq('isPublished', true))
        .take(2000),
      ctx.db
        .query('posts')
        .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
        .order('desc')
        .take(2000),
    ])

    const clerkIds = new Set<string>()
    for (const c of publishedCourses) clerkIds.add(c.creatorId)
    for (const p of publishedPosts) clerkIds.add(p.authorUserId)
    if (clerkIds.size === 0) return []

    const ids = Array.from(clerkIds)
    const users = await Promise.all(
      ids.map((cid) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', cid))
          .unique(),
      ),
    )

    return users
      .filter((u): u is NonNullable<typeof u> => !!u && !!u.handle)
      .map((u) => ({ handle: u.handle!, updatedAt: u._creationTime }))
  },
})
