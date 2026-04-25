// Blog: queries públicas (anon-safe) e mutation de view counter. Wave 16
// fornece apenas leitura. Wave 17 adiciona create/edit/publish.
//
// IMPORTANTE: nenhum retorno público pode conter email, clerkId, phone ou
// qualquer PII. O author shape exposto é estritamente { handle, name,
// avatarUrl, bio?, institutionName? }.

import { v } from 'convex/values'
import { query, mutation, type QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { requireIdentity, requireCurrentUser } from './lib/auth'
import { toSlug } from './lib/slug'
import { internal } from './_generated/api'

const MAX_TITLE = 120
const MAX_EXCERPT = 220
const MAX_BODY = 60000
const MAX_TAGS = 5

type PublicAuthor = {
  handle: string | null
  name: string
  avatarUrl: string | null
  bio: string | null
  identity: 'aluno' | 'criador' | 'instituicao'
  institutionName: string | null
}

type PublicPostListItem = {
  _id: Id<'posts'>
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string | null
  categorySlug: string
  tagSlugs: string[]
  publishedAt: number | null
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number
  // authorUserId exposto para atribuição de AdSense (revenue share por
  // criador). Mesmo padrão do courses.creatorId em CatalogPage.
  authorUserId: string
  author: PublicAuthor
}

type PublicPostFull = PublicPostListItem & {
  bodyMarkdown: string
  updatedAt: number
}

async function loadAuthor(
  ctx: QueryCtx,
  post: Doc<'posts'>,
): Promise<PublicAuthor> {
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
    bio: user?.bio ?? null,
    identity: post.authorIdentity,
    institutionName,
  }
}

async function shapeListItem(
  ctx: QueryCtx,
  post: Doc<'posts'>,
): Promise<PublicPostListItem> {
  const author = await loadAuthor(ctx, post)
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
    tagSlugs: post.tagSlugs,
    publishedAt: post.publishedAt ?? null,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
    viewCount: post.viewCount,
    authorUserId: post.authorUserId,
    author,
  }
}

// Lista pública de artigos publicados, mais recentes primeiro. Suporta cursor
// simples: caller passa o publishedAt do último item recebido para próxima
// página.
export const listPublic = query({
  args: {
    limit: v.optional(v.number()),
    beforePublishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<PublicPostListItem[]> => {
    const limit = Math.min(args.limit ?? 20, 50)
    const rows = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(limit + 32) // pega um buffer para filtrar com beforePublishedAt
    const filtered = args.beforePublishedAt
      ? rows.filter((p) => (p.publishedAt ?? 0) < args.beforePublishedAt!)
      : rows
    const sliced = filtered.slice(0, limit)
    return await Promise.all(sliced.map((p) => shapeListItem(ctx, p)))
  },
})

// Lista pública de artigos publicados de um autor. Usado no perfil público
// para alimentar a aba "Artigos". Anon-safe.
export const listByAuthor = query({
  args: {
    authorUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<PublicPostListItem[]> => {
    const limit = Math.min(args.limit ?? 12, 50)
    const rows = await ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorUserId', args.authorUserId))
      .order('desc')
      .collect()
    const published = rows
      .filter((p) => p.status === 'published')
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
      .slice(0, limit)
    return await Promise.all(published.map((p) => shapeListItem(ctx, p)))
  },
})

export const listByCategory = query({
  args: {
    categorySlug: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<PublicPostListItem[]> => {
    const limit = Math.min(args.limit ?? 20, 50)
    const rows = await ctx.db
      .query('posts')
      .withIndex('by_category_publishedAt', (q) => q.eq('categorySlug', args.categorySlug))
      .order('desc')
      .take(limit + 32)
    const published = rows.filter((p) => p.status === 'published')
    return await Promise.all(published.slice(0, limit).map((p) => shapeListItem(ctx, p)))
  },
})

// Busca por (handle do autor, slug do post). Esta é a página de leitura. Se o
// post estiver em status diferente de 'published'/'unlisted', retorna null
// para anônimos. O autor pode ler o próprio post em qualquer status (visualizar
// rascunho).
export const getBySlugForReader = query({
  args: {
    handle: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args): Promise<PublicPostFull | null> => {
    const author = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', args.handle))
      .unique()
    if (!author) return null

    const post = await ctx.db
      .query('posts')
      .withIndex('by_author_slug', (q) =>
        q.eq('authorUserId', author.clerkId).eq('slug', args.slug),
      )
      .unique()
    if (!post) return null

    const identity = await ctx.auth.getUserIdentity()
    const isOwner = identity?.subject === post.authorUserId

    if (!isOwner && post.status !== 'published' && post.status !== 'unlisted') {
      return null
    }

    const item = await shapeListItem(ctx, post)
    return {
      ...item,
      bodyMarkdown: post.bodyMarkdown,
      updatedAt: post.updatedAt,
    }
  },
})

// Bump no contador de views. Idempotência fica do lado do client (sessionStorage).
// Mantemos a mutation simples e sem auth para permitir contagem de leitores anônimos.
export const incrementView = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId)
    if (!post) return
    if (post.status !== 'published' && post.status !== 'unlisted') return
    await ctx.db.patch(postId, { viewCount: post.viewCount + 1 })
  },
})

// =============================================================
// Editor (Wave 17): create/update drafts, publish, unpublish, delete
// =============================================================

const identityValidator = v.union(
  v.literal('aluno'),
  v.literal('criador'),
  v.literal('instituicao'),
)

async function ensureUniqueSlugForAuthor(
  ctx: QueryCtx,
  authorUserId: string,
  desiredSlug: string,
  ignorePostId?: Id<'posts'>,
): Promise<string> {
  const base = desiredSlug || 'artigo'
  let candidate = base
  let suffix = 2
  for (;;) {
    const existing = await ctx.db
      .query('posts')
      .withIndex('by_author_slug', (q) => q.eq('authorUserId', authorUserId).eq('slug', candidate))
      .unique()
    if (!existing || (ignorePostId && existing._id === ignorePostId)) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
    if (suffix > 200) return `${base}-${Date.now()}`
  }
}

function sanitizeTags(input: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input) {
    const slug = toSlug(raw)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
    if (out.length >= MAX_TAGS) break
  }
  return out
}

async function ensureCanPublishAs(
  ctx: QueryCtx,
  authorUserId: string,
  identity: 'aluno' | 'criador' | 'instituicao',
  institutionId: Id<'institutions'> | undefined,
): Promise<void> {
  if (identity === 'instituicao') {
    if (!institutionId) throw new Error('Selecione a instituição.')
    const inst = await ctx.db.get(institutionId)
    if (!inst) throw new Error('Instituição não encontrada.')
    const membership = await ctx.db
      .query('institutionMembers')
      .withIndex('by_institution_user', (q) =>
        q.eq('institutionId', institutionId).eq('userId', authorUserId),
      )
      .unique()
    if (!membership || membership.status !== 'ativo') {
      throw new Error('Você não pertence a esta instituição.')
    }
    if (membership.role !== 'dono' && membership.role !== 'admin') {
      throw new Error('Apenas donos e administradores podem publicar pela instituição.')
    }
    return
  }

  // aluno/criador: a função precisa estar ativa
  const fns = await ctx.db
    .query('userFunctions')
    .withIndex('by_userId_function', (q) => q.eq('userId', authorUserId).eq('function', identity))
    .unique()
  if (!fns) throw new Error('Função não ativa. Ative em Configurações.')
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const createDraft = mutation({
  args: {
    title: v.string(),
    excerpt: v.string(),
    bodyMarkdown: v.string(),
    categorySlug: v.string(),
    tags: v.array(v.string()),
    authorIdentity: identityValidator,
    authorInstitutionId: v.optional(v.id('institutions')),
    coverImageStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)

    const title = args.title.trim().slice(0, MAX_TITLE)
    if (!title) throw new Error('Título obrigatório.')
    const excerpt = args.excerpt.trim().slice(0, MAX_EXCERPT)
    if (!excerpt) throw new Error('Resumo obrigatório.')
    const body = args.bodyMarkdown.slice(0, MAX_BODY)
    if (!body.trim()) throw new Error('Conteúdo obrigatório.')

    const cat = await ctx.db
      .query('postCategories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .unique()
    if (!cat) throw new Error('Categoria inválida.')

    await ensureCanPublishAs(ctx, identity.subject, args.authorIdentity, args.authorInstitutionId)

    const baseSlug = toSlug(title)
    const slug = await ensureUniqueSlugForAuthor(ctx, identity.subject, baseSlug)
    const tagSlugs = sanitizeTags(args.tags)

    const now = Date.now()
    const id = await ctx.db.insert('posts', {
      authorUserId: identity.subject,
      authorIdentity: args.authorIdentity,
      authorInstitutionId: args.authorIdentity === 'instituicao' ? args.authorInstitutionId : undefined,
      title,
      slug,
      excerpt,
      bodyMarkdown: body,
      coverImageStorageId: args.coverImageStorageId,
      categorySlug: args.categorySlug,
      tagSlugs,
      status: 'draft',
      updatedAt: now,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
    })
    return id
  },
})

export const updateDraft = mutation({
  args: {
    postId: v.id('posts'),
    title: v.string(),
    excerpt: v.string(),
    bodyMarkdown: v.string(),
    categorySlug: v.string(),
    tags: v.array(v.string()),
    authorIdentity: identityValidator,
    authorInstitutionId: v.optional(v.id('institutions')),
    coverImageStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    const post = await ctx.db.get(args.postId)
    if (!post) throw new Error('Artigo não encontrado.')
    if (post.authorUserId !== identity.subject) throw new Error('Não autorizado.')

    const title = args.title.trim().slice(0, MAX_TITLE)
    if (!title) throw new Error('Título obrigatório.')
    const excerpt = args.excerpt.trim().slice(0, MAX_EXCERPT)
    if (!excerpt) throw new Error('Resumo obrigatório.')
    const body = args.bodyMarkdown.slice(0, MAX_BODY)
    if (!body.trim()) throw new Error('Conteúdo obrigatório.')

    const cat = await ctx.db
      .query('postCategories')
      .withIndex('by_slug', (q) => q.eq('slug', args.categorySlug))
      .unique()
    if (!cat) throw new Error('Categoria inválida.')

    await ensureCanPublishAs(ctx, identity.subject, args.authorIdentity, args.authorInstitutionId)

    let slug = post.slug
    if (post.title !== title) {
      const baseSlug = toSlug(title)
      slug = await ensureUniqueSlugForAuthor(ctx, identity.subject, baseSlug, post._id)
    }
    const tagSlugs = sanitizeTags(args.tags)

    await ctx.db.patch(post._id, {
      title,
      slug,
      excerpt,
      bodyMarkdown: body,
      coverImageStorageId: args.coverImageStorageId,
      categorySlug: args.categorySlug,
      tagSlugs,
      authorIdentity: args.authorIdentity,
      authorInstitutionId: args.authorIdentity === 'instituicao' ? args.authorInstitutionId : undefined,
      updatedAt: Date.now(),
    })
  },
})

export const publish = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const identity = await requireIdentity(ctx)
    const post = await ctx.db.get(postId)
    if (!post) throw new Error('Artigo não encontrado.')
    if (post.authorUserId !== identity.subject) throw new Error('Não autorizado.')

    await ensureCanPublishAs(ctx, identity.subject, post.authorIdentity, post.authorInstitutionId)

    const now = Date.now()
    const wasPublishedBefore = !!post.publishedAt
    await ctx.db.patch(postId, {
      status: 'published',
      publishedAt: post.publishedAt ?? now,
      updatedAt: now,
    })

    // Notifica seguidores apenas na primeira publicação. Edições posteriores
    // não geram nova notificação (evita spam ao salvar/republicar).
    if (!wasPublishedBefore) {
      const author = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', post.authorUserId))
        .unique()
      const handle = author?.handle ?? null
      const link = handle ? `/blog/${handle}/${post.slug}` : `/blog`
      const followers = await ctx.db
        .query('profileFollows')
        .withIndex('by_author', (q) => q.eq('authorUserId', post.authorUserId))
        .take(100)
      const authorName =
        post.authorIdentity === 'instituicao' && post.authorInstitutionId
          ? (await ctx.db.get(post.authorInstitutionId))?.name ?? author?.name ?? 'Autor'
          : author?.name ?? 'Autor'

      for (const f of followers) {
        if (!f.notifyArticles) continue
        await ctx.runMutation(internal.notifications.pushInternal, {
          userId: f.followerUserId,
          kind: 'post_published',
          title: `Novo artigo de ${authorName}`,
          body: post.title,
          link,
        })
      }
    }
  },
})

export const unpublish = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const identity = await requireIdentity(ctx)
    const post = await ctx.db.get(postId)
    if (!post) throw new Error('Artigo não encontrado.')
    if (post.authorUserId !== identity.subject) throw new Error('Não autorizado.')
    await ctx.db.patch(postId, { status: 'draft', updatedAt: Date.now() })
  },
})

export const softDeleteMine = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const identity = await requireIdentity(ctx)
    const post = await ctx.db.get(postId)
    if (!post) return
    if (post.authorUserId !== identity.subject) throw new Error('Não autorizado.')
    await ctx.db.patch(postId, { status: 'removed', updatedAt: Date.now() })
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const rows = await ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorUserId', identity.subject))
      .order('desc')
      .collect()
    return rows
      .filter((p) => p.status !== 'removed')
      .map((p) => ({
        _id: p._id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        status: p.status,
        categorySlug: p.categorySlug,
        publishedAt: p.publishedAt ?? null,
        updatedAt: p.updatedAt,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        viewCount: p.viewCount,
        authorIdentity: p.authorIdentity,
        authorInstitutionId: p.authorInstitutionId ?? null,
      }))
  },
})

export const getMineForEditor = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const { identity } = await requireCurrentUser(ctx)
    const post = await ctx.db.get(postId)
    if (!post) return null
    if (post.authorUserId !== identity.subject) return null
    let coverImageUrl: string | null = null
    if (post.coverImageStorageId) {
      coverImageUrl = await ctx.storage.getUrl(post.coverImageStorageId)
    }
    return {
      _id: post._id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      bodyMarkdown: post.bodyMarkdown,
      categorySlug: post.categorySlug,
      tagSlugs: post.tagSlugs,
      status: post.status,
      authorIdentity: post.authorIdentity,
      authorInstitutionId: post.authorInstitutionId ?? null,
      coverImageStorageId: post.coverImageStorageId ?? null,
      coverImageUrl,
      publishedAt: post.publishedAt ?? null,
      updatedAt: post.updatedAt,
    }
  },
})
