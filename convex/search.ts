import { v } from 'convex/values'
import { query } from './_generated/server'

// Busca global usada pelo command palette (Cmd+K). Procura cursos
// publicados, perfis de criadores e artigos publicados a partir de um
// termo livre. Filtra in-memory porque o volume atual e pequeno; quando
// passar de poucos milhares de itens, migrar para searchIndex no Convex.
export const globalSearch = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const term = q.trim().toLowerCase().replace(/^@/, '')
    if (term.length < 2) {
      return { courses: [], creators: [], posts: [] }
    }

    // Cursos publicados publicamente. Esconde institucionais para anonimo.
    const allCourses = await ctx.db
      .query('courses')
      .withIndex('by_published', (qb) => qb.eq('isPublished', true))
      .collect()

    const visibleCourses = allCourses.filter(
      (c) => c.visibility !== 'institution',
    )

    const courseMatches = visibleCourses
      .filter((c) => {
        const title = (c.title ?? '').toLowerCase()
        const desc = (c.description ?? '').toLowerCase()
        const cat = (c.category ?? '').toLowerCase()
        return title.includes(term) || desc.includes(term) || cat.includes(term)
      })
      .slice(0, 10)
      .map((c) => ({
        id: c._id,
        title: c.title,
        slug: c.slug ?? c._id,
        thumbnail: c.thumbnail ?? null,
        category: c.category ?? null,
      }))

    // Criadores com handle publico.
    const allUsers = await ctx.db.query('users').collect()
    const creatorMatches = allUsers
      .filter((u) => !!u.handle)
      .filter((u) => u.profileVisibility !== 'unlisted')
      .filter((u) => {
        const handle = (u.handle ?? '').toLowerCase()
        const name = (u.name ?? '').toLowerCase()
        return handle.includes(term) || name.includes(term)
      })
      .slice(0, 6)
      .map((u) => ({
        handle: u.handle!,
        name: u.name,
        avatarUrl: u.avatarUrl ?? null,
      }))

    // Posts publicados.
    const allPosts = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (qb) => qb.eq('status', 'published'))
      .collect()

    const postMatches = allPosts
      .filter((p) => {
        const title = (p.title ?? '').toLowerCase()
        const excerpt = (p.excerpt ?? '').toLowerCase()
        return title.includes(term) || excerpt.includes(term)
      })
      .slice(0, 6)

    // Lookup de autores para posts (handle e nome).
    const authorIds = Array.from(new Set(postMatches.map((p) => p.authorUserId)))
    const authors = await Promise.all(
      authorIds.map((aid) =>
        ctx.db
          .query('users')
          .withIndex('by_clerkId', (qb) => qb.eq('clerkId', aid))
          .unique(),
      ),
    )
    const authorByClerkId = new Map<string, { handle: string | null; name: string | null }>()
    authors.forEach((a, i) => {
      if (a) authorByClerkId.set(authorIds[i], { handle: a.handle ?? null, name: a.name ?? null })
    })

    const posts = postMatches
      .map((p) => {
        const a = authorByClerkId.get(p.authorUserId)
        if (!a?.handle) return null
        return {
          slug: p.slug,
          title: p.title,
          handle: a.handle,
          authorName: a.name ?? 'Autor',
        }
      })
      .filter((p): p is { slug: string; title: string; handle: string; authorName: string } => p !== null)

    return {
      courses: courseMatches,
      creators: creatorMatches,
      posts,
    }
  },
})
