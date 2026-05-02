import { v } from 'convex/values'
import { query } from './_generated/server'

// Busca global usada pelo command palette (Cmd+K). Procura cursos
// publicados, perfis de criadores e artigos publicados a partir de um termo
// livre. Criadores: searchIndex (search_name + search_handle) substituiu o
// .collect() de toda tabela users. Cursos/posts: cap em 500 publicados
// (volume aceitável hoje; quando crescer, migrar para searchIndex próprio).
export const globalSearch = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const term = q.trim().replace(/^@/, '')
    if (term.length < 2) {
      return { courses: [], creators: [], posts: [] }
    }
    const lcTerm = term.toLowerCase()

    // Cursos publicados publicamente. Cap em 500 evita full-table indefinido.
    const allCourses = await ctx.db
      .query('courses')
      .withIndex('by_published', (qb) => qb.eq('isPublished', true))
      .take(500)

    const visibleCourses = allCourses.filter(
      (c) => c.visibility !== 'institution',
    )

    const courseMatches = visibleCourses
      .filter((c) => {
        const title = (c.title ?? '').toLowerCase()
        const desc = (c.description ?? '').toLowerCase()
        const cat = (c.category ?? '').toLowerCase()
        return title.includes(lcTerm) || desc.includes(lcTerm) || cat.includes(lcTerm)
      })
      .slice(0, 10)
      .map((c) => ({
        id: c._id,
        title: c.title,
        slug: c.slug ?? c._id,
        thumbnail: c.thumbnail ?? null,
        category: c.category ?? null,
      }))

    // Criadores: searchIndex Convex (search_name + search_handle). Pega 30 de
    // cada e dedupa por clerkId. Padrão consistente com users.searchPublic.
    const [byName, byHandle] = await Promise.all([
      ctx.db
        .query('users')
        .withSearchIndex('search_name', (s) => s.search('name', term))
        .take(30),
      ctx.db
        .query('users')
        .withSearchIndex('search_handle', (s) => s.search('handle', term))
        .take(30),
    ])
    const seenCreators = new Set<string>()
    const mergedCreators: typeof byName = []
    for (const u of [...byHandle, ...byName]) {
      if (seenCreators.has(u.clerkId)) continue
      seenCreators.add(u.clerkId)
      mergedCreators.push(u)
    }
    const creatorMatches = mergedCreators
      .filter((u) => !!u.handle)
      .filter((u) => u.profileVisibility !== 'unlisted')
      .slice(0, 6)
      .map((u) => ({
        handle: u.handle!,
        name: u.name,
        avatarUrl: u.avatarUrl ?? null,
      }))

    // Posts publicados. Cap em 500 mais recentes (já indexados em ordem).
    const allPosts = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (qb) => qb.eq('status', 'published'))
      .order('desc')
      .take(500)

    const postMatches = allPosts
      .filter((p) => {
        const title = (p.title ?? '').toLowerCase()
        const excerpt = (p.excerpt ?? '').toLowerCase()
        return title.includes(lcTerm) || excerpt.includes(lcTerm)
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
