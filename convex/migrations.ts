// Migrações one-shot. Cada uma é internalAction idempotente: pode rodar de novo
// sem efeito colateral porque a query lista só os ainda-não-migrados.
//
// Como rodar (prod):
//   CONVEX_DEPLOYMENT=prod:blessed-platypus-993 \
//     npx convex run --prod migrations:migratePostCoversToR2
//
// Item 28 da auditoria 2026-05-04: Convex Free está perto do limite de storage,
// move capas de blog post pro R2 público pra liberar espaço.

import { v } from 'convex/values'
import { internalAction, internalMutation, internalQuery } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import { uploadBytesToR2 } from './r2'

// Lista posts com capa em Convex storage e ainda sem R2 key.
export const _listLegacyCoverPosts = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const posts = await ctx.db.query('posts').collect()
    return posts
      .filter((p) => p.coverImageStorageId && !p.coverImageR2Key)
      .slice(0, limit)
      .map((p) => ({
        _id: p._id,
        coverImageStorageId: p.coverImageStorageId!,
        authorUserId: p.authorUserId,
        slug: p.slug,
      }))
  },
})

export const _setPostR2Cover = internalMutation({
  args: { postId: v.id('posts'), r2Key: v.string() },
  handler: async (ctx, { postId, r2Key }) => {
    await ctx.db.patch(postId, {
      coverImageR2Key: r2Key,
      coverImageStorageId: undefined,
    })
  },
})

function extOf(contentType: string): string {
  if (contentType.includes('jpeg')) return 'jpg'
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  return 'bin'
}

type MigrationResult = {
  processed: number
  migrated: number
  failed: number
  remaining: string
  errors: { postId: Id<'posts'>; reason: string }[]
}

export const migratePostCoversToR2 = internalAction({
  args: { batch: v.optional(v.number()) },
  handler: async (ctx, { batch }): Promise<MigrationResult> => {
    const limit = batch ?? 25
    const posts = await ctx.runQuery(internal.migrations._listLegacyCoverPosts, {
      limit,
    })
    let migrated = 0
    let failed = 0
    const errors: { postId: Id<'posts'>; reason: string }[] = []

    for (const post of posts) {
      try {
        const url = await ctx.storage.getUrl(post.coverImageStorageId)
        if (!url) {
          failed++
          errors.push({ postId: post._id, reason: 'storage.getUrl null' })
          continue
        }
        const resp = await fetch(url)
        if (!resp.ok) {
          failed++
          errors.push({ postId: post._id, reason: `download ${resp.status}` })
          continue
        }
        const contentType = resp.headers.get('content-type') ?? 'image/jpeg'
        const buf = new Uint8Array(await resp.arrayBuffer())
        const key = `posts/${post.authorUserId}/${post._id}-${Date.now().toString(36)}.${extOf(contentType)}`

        await uploadBytesToR2({ key, bytes: buf, contentType })
        await ctx.runMutation(internal.migrations._setPostR2Cover, {
          postId: post._id,
          r2Key: key,
        })
        migrated++
      } catch (err) {
        failed++
        errors.push({
          postId: post._id,
          reason: err instanceof Error ? err.message : 'unknown',
        })
      }
    }

    return {
      processed: posts.length,
      migrated,
      failed,
      remaining: posts.length === limit ? 'tem mais, rode de novo' : 'fim',
      errors: errors.slice(0, 10),
    }
  },
})

// Conta quantos posts ainda têm capa em Convex storage. Útil pra verificar
// progresso da migração sem listar todos.
export const _countLegacyCovers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query('posts').collect()
    const legacy = posts.filter((p) => p.coverImageStorageId && !p.coverImageR2Key).length
    const r2 = posts.filter((p) => p.coverImageR2Key).length
    return { legacy, r2, total: posts.length }
  },
})

export const countLegacyCovers = internalAction({
  args: {},
  handler: async (ctx): Promise<{ legacy: number; r2: number; total: number }> => {
    return await ctx.runQuery(internal.migrations._countLegacyCovers, {})
  },
})

// Conta materiais de aula ainda em Convex storage (sem r2Key). Para confirmar
// se vale rodar uma migração equivalente à de capas. Avatares são geridos
// pelo Clerk (não toca em Convex storage). Ebooks usam string URL (R2 ou
// externo), nunca Convex storage.
export const _countLegacyMaterials = internalQuery({
  args: {},
  handler: async (ctx) => {
    const materials = await ctx.db.query('lessonMaterials').collect()
    const legacy = materials.filter((m) => m.storageId && !m.r2Key).length
    const r2 = materials.filter((m) => m.r2Key).length
    return { legacy, r2, total: materials.length }
  },
})

export const countLegacyMaterials = internalAction({
  args: {},
  handler: async (ctx): Promise<{ legacy: number; r2: number; total: number }> => {
    return await ctx.runQuery(internal.migrations._countLegacyMaterials, {})
  },
})

export const _listLegacyMaterials = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const materials = await ctx.db.query('lessonMaterials').collect()
    return materials
      .filter((m) => m.storageId && !m.r2Key)
      .slice(0, limit)
      .map((m) => ({
        _id: m._id,
        storageId: m.storageId!,
        creatorId: m.creatorId,
        name: m.name,
        mimeType: m.mimeType,
      }))
  },
})

export const _setMaterialR2Key = internalMutation({
  args: { id: v.id('lessonMaterials'), r2Key: v.string() },
  handler: async (ctx, { id, r2Key }) => {
    await ctx.db.patch(id, { r2Key, storageId: undefined })
  },
})

function safeFilename(s: string): string {
  return s.replace(/[\\/]/g, '_').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80)
}

export const migrateMaterialsToR2 = internalAction({
  args: { batch: v.optional(v.number()) },
  handler: async (ctx, { batch }): Promise<MigrationResult> => {
    const limit = batch ?? 10
    const materials = await ctx.runQuery(internal.migrations._listLegacyMaterials, {
      limit,
    })
    let migrated = 0
    let failed = 0
    const errors: { postId: Id<'posts'>; reason: string }[] = []

    for (const m of materials) {
      try {
        const url = await ctx.storage.getUrl(m.storageId)
        if (!url) {
          failed++
          continue
        }
        const resp = await fetch(url)
        if (!resp.ok) {
          failed++
          continue
        }
        const buf = new Uint8Array(await resp.arrayBuffer())
        const key = `materials/${m.creatorId}/${m._id}-${safeFilename(m.name)}`
        await uploadBytesToR2({ key, bytes: buf, contentType: m.mimeType })
        await ctx.runMutation(internal.migrations._setMaterialR2Key, {
          id: m._id,
          r2Key: key,
        })
        migrated++
      } catch (err) {
        failed++
        errors.push({
          postId: m._id as unknown as Id<'posts'>,
          reason: err instanceof Error ? err.message : 'unknown',
        })
      }
    }

    return {
      processed: materials.length,
      migrated,
      failed,
      remaining: materials.length === limit ? 'tem mais, rode de novo' : 'fim',
      errors: errors.slice(0, 10),
    }
  },
})
