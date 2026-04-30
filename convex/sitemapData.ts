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
    // Perfis públicos: usuários com handle e que publicaram cursos OU artigos.
    // Limita a 5000 para evitar inflação.
    const users = await ctx.db.query('users').take(5000)
    const withHandle = users.filter((u) => !!u.handle)

    // Quem tem ao menos um curso ou post publicado é o conjunto que deve ir
    // para o sitemap. Para isso, fazemos lookup paralelo.
    const checks = await Promise.all(
      withHandle.map(async (u) => {
        const [course, post] = await Promise.all([
          ctx.db
            .query('courses')
            .withIndex('by_creatorId', (q) => q.eq('creatorId', u.clerkId))
            .first(),
          ctx.db
            .query('posts')
            .withIndex('by_author', (q) => q.eq('authorUserId', u.clerkId))
            .first(),
        ])
        return {
          handle: u.handle!,
          updatedAt: u._creationTime,
          hasContent: Boolean(course?.isPublished) || Boolean(post && post.status === 'published'),
        }
      }),
    )

    return checks.filter((c) => c.hasContent).map((c) => ({ handle: c.handle, updatedAt: c.updatedAt }))
  },
})
