import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { ensureIdentityMatches, requireIdentity, requirePerfil } from './lib/auth'

// Materiais aceitos: apenas PDF e TXT. Limite individual 10MB. Nomes de arquivo
// limitados a 140 caracteres para não quebrar layout de listagem no player.
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'text/plain'])
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_NAME_LEN = 140

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePerfil(ctx, ['criador'])
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
    const { identity } = await requirePerfil(ctx, ['criador'])
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

export const remove = mutation({
  args: { id: v.id('lessonMaterials'), creatorId: v.string() },
  handler: async (ctx, { id, creatorId }) => {
    const { identity } = await requirePerfil(ctx, ['criador'])
    ensureIdentityMatches(identity.subject, creatorId)

    const material = await ctx.db.get(id)
    if (!material || material.creatorId !== identity.subject) throw new Error('Não autorizado')

    await ctx.storage.delete(material.storageId)
    await ctx.db.delete(id)
  },
})

// Listagem para o criador (pode ver qualquer material dos seus cursos) e para
// o aluno (só aulas de cursos em que está matriculado, verificado via query
// do player — aqui só garantimos que é um usuário autenticado; o gating real
// fica no student.ts).
export const listByLesson = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, { lessonId }) => {
    await requireIdentity(ctx)
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
        url: await ctx.storage.getUrl(m.storageId),
      }))
    )
  },
})
