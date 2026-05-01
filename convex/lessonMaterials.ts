import { v } from 'convex/values'
import { action, internalQuery, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { ensureIdentityMatches, requireLessonAccess, requireUserFunction } from './lib/auth'
import { presignR2DownloadUrl } from './r2'

// Materiais aceitos: apenas PDF e TXT. Limite individual 10MB. Nomes de arquivo
// limitados a 140 caracteres para não quebrar layout de listagem no player.
//
// Storage: novos uploads vão pro Cloudflare R2 via `createFromR2` (cliente
// chama r2.generateUploadUrl + PUT, depois grava o registro aqui). Registros
// antigos continuam em Convex File Storage via `storageId`. listByLesson
// resolve URL preferindo R2 e caindo pra storage quando ausente.
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'text/plain'])
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_NAME_LEN = 140

// Mantido para retrocompatibilidade: telas antigas que ainda chamam
// generateUploadUrl + create (Convex storage). Novas telas devem usar R2.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserFunction(ctx, ['criador'])
    return await ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    lessonId: v.id('lessons'),
    creatorId: v.string(),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, args.creatorId)

    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson || lesson.creatorId !== identity.subject) throw new Error('Não autorizado')

    if (!ALLOWED_MIME_TYPES.has(args.mimeType)) {
      await ctx.storage.delete(args.storageId)
      throw new Error('Apenas arquivos PDF ou TXT são permitidos')
    }
    if (args.size > MAX_FILE_BYTES) {
      await ctx.storage.delete(args.storageId)
      throw new Error('Arquivo maior que o limite de 10MB')
    }
    const trimmedName = args.name.trim()
    if (!trimmedName) {
      await ctx.storage.delete(args.storageId)
      throw new Error('Nome de arquivo inválido')
    }
    const safeName = trimmedName.slice(0, MAX_NAME_LEN)

    const existing = await ctx.db
      .query('lessonMaterials')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', args.lessonId))
      .collect()
    const nextOrder = existing.length

    const id = await ctx.db.insert('lessonMaterials', {
      lessonId: args.lessonId,
      courseId: lesson.courseId,
      creatorId: identity.subject,
      name: safeName,
      size: args.size,
      mimeType: args.mimeType,
      storageId: args.storageId,
      order: nextOrder,
      createdAt: Date.now(),
    })
    return id
  },
})

// Novo caminho R2: cliente já fez upload via r2.generateUploadUrl e tem `key`.
// Aqui só validamos e gravamos o registro.
export const createFromR2 = mutation({
  args: {
    lessonId: v.id('lessons'),
    creatorId: v.string(),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    r2Key: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, args.creatorId)

    const lesson = await ctx.db.get(args.lessonId)
    if (!lesson || lesson.creatorId !== identity.subject) throw new Error('Não autorizado')

    if (!ALLOWED_MIME_TYPES.has(args.mimeType)) {
      throw new Error('Apenas arquivos PDF ou TXT são permitidos')
    }
    if (args.size > MAX_FILE_BYTES) {
      throw new Error('Arquivo maior que o limite de 10MB')
    }
    const trimmedName = args.name.trim()
    if (!trimmedName) throw new Error('Nome de arquivo inválido')
    const safeName = trimmedName.slice(0, MAX_NAME_LEN)
    if (!args.r2Key.trim()) throw new Error('Chave R2 ausente')

    const existing = await ctx.db
      .query('lessonMaterials')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', args.lessonId))
      .collect()
    const nextOrder = existing.length

    const id = await ctx.db.insert('lessonMaterials', {
      lessonId: args.lessonId,
      courseId: lesson.courseId,
      creatorId: identity.subject,
      name: safeName,
      size: args.size,
      mimeType: args.mimeType,
      r2Key: args.r2Key,
      order: nextOrder,
      createdAt: Date.now(),
    })
    return id
  },
})

export const remove = mutation({
  args: { id: v.id('lessonMaterials'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const material = await ctx.db.get(id)
    if (!material || material.creatorId !== identity.subject) throw new Error('Não autorizado')

    if (material.storageId) {
      await ctx.storage.delete(material.storageId)
    }
    // Materiais R2 ficam órfãos no bucket por enquanto. Se virar problema,
    // expor uma scheduled action que chama r2.deleteObject({key}). Custo é
    // baixo: R$ 0,015/GB/mês no plano Standard, primeiros 10GB grátis.
    await ctx.db.delete(id)
  },
})

// Listagem para o criador (dono da aula) ou aluno matriculado no curso. A
// verificação de acesso é feita via requireLessonAccess para evitar vazamento
// de materiais para qualquer usuário autenticado.
//
// Para materiais R2, retorna apenas r2Key (sem URL). O cliente chama
// `getDownloadUrl` action quando o usuário clica em "Abrir" para receber
// uma presigned GET válida por 1h. Isso evita renovar URLs no servidor a
// cada query e mantém o controle de tempo de vida da URL no momento do uso.
export const listByLesson = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    await requireLessonAccess(ctx, lessonId)
    const materials = await ctx.db
      .query('lessonMaterials')
      .withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId))
      .collect()
    materials.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)

    return await Promise.all(
      materials.map(async (m) => ({
        _id: m._id,
        lessonId: m.lessonId,
        name: m.name,
        size: m.size,
        mimeType: m.mimeType,
        order: m.order,
        createdAt: m.createdAt,
        // url só pra storage Convex (legado). R2 usa r2Key + action de download.
        url: m.storageId ? await ctx.storage.getUrl(m.storageId) : null,
        r2Key: m.r2Key ?? null,
      }))
    )
  },
})

// Internal query que valida acesso à aula e devolve a r2Key. Usada pela
// action getDownloadUrl, que não tem acesso direto a ctx.db.
export const getDownloadMeta = internalQuery({
  args: { materialId: v.id('lessonMaterials') },
  handler: async (ctx, { materialId }) => {
    const material = await ctx.db.get(materialId)
    if (!material) return null
    await requireLessonAccess(ctx, material.lessonId)
    return { r2Key: material.r2Key ?? null, lessonId: material.lessonId }
  },
})

// Action que gera presigned GET pro material R2. Cliente chama ao clicar em
// "Abrir". Valida acesso via internalQuery getDownloadMeta antes de assinar.
export const getDownloadUrl = action({
  args: { materialId: v.id('lessonMaterials') },
  handler: async (ctx, { materialId }): Promise<string> => {
    const meta = await ctx.runQuery(internal.lessonMaterials.getDownloadMeta, {
      materialId,
    })
    if (!meta) throw new Error('Material não encontrado')
    if (!meta.r2Key) throw new Error('Material legado sem chave R2')
    return await presignR2DownloadUrl(meta.r2Key, 60 * 60)
  },
})
