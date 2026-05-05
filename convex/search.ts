import { v } from 'convex/values'
import { query } from './_generated/server'

// Busca global usada pelo command palette (Cmd+K). Procura cursos
// publicados, perfis de criadores, artigos publicados E (se autenticado)
// aulas das matrículas do usuário. Criadores: searchIndex (search_name +
// search_handle) substituiu o .collect() de toda tabela users. Cursos/posts:
// cap em 500 publicados (volume aceitável hoje; quando crescer, migrar para
// searchIndex próprio).
export const globalSearch = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const term = q.trim().replace(/^@/, '')
    if (term.length < 2) {
      return { courses: [], creators: [], posts: [], lessons: [] }
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

    // Aulas: só pra usuário autenticado e somente entre suas matrículas
    // (nunca expõe aulas privadas a quem não tem acesso). Cap defensivo
    // em 50 matrículas pra não escanear acervo enorme em alunos heavy.
    const identity = await ctx.auth.getUserIdentity()
    let lessons: Array<{
      courseRef: string
      lessonRef: string
      title: string
      courseTitle: string
    }> = []
    if (identity) {
      const enrollments = await ctx.db
        .query('enrollments')
        .withIndex('by_studentId', (qb) => qb.eq('studentId', identity.subject))
        .take(50)

      const courseById = new Map<string, { title: string; ref: string }>()
      for (const e of enrollments) {
        const course = await ctx.db.get(e.courseId)
        if (!course) continue
        courseById.set(String(e.courseId), {
          title: course.title,
          ref: course.slug ?? String(course._id),
        })
      }

      const lessonMatches: typeof lessons = []
      for (const [courseId, info] of courseById.entries()) {
        const courseLessons = await ctx.db
          .query('lessons')
          .withIndex('by_courseId', (qb) => qb.eq('courseId', courseId as never))
          .take(200)
        for (const l of courseLessons) {
          if (!l.isPublished) continue
          const title = (l.title ?? '').toLowerCase()
          if (!title.includes(lcTerm)) continue
          lessonMatches.push({
            courseRef: info.ref,
            lessonRef: l.slug ?? String(l._id),
            title: l.title,
            courseTitle: info.title,
          })
          if (lessonMatches.length >= 8) break
        }
        if (lessonMatches.length >= 8) break
      }
      lessons = lessonMatches
    }

    return {
      courses: courseMatches,
      creators: creatorMatches,
      posts,
      lessons,
    }
  },
})
