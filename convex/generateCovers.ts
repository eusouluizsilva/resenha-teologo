// Geracao automatica das capas dos 14 artigos publicados e do curso de
// Hermeneutica usando Pollinations AI (Flux). Sem chave de API, sem custo.
//
// Disparar manualmente uma vez:
//   npx convex run --prod generateCovers:runAll '{}'
//
// O que faz:
// 1. Lista todos os artigos publicados.
// 2. Para cada artigo cujo slug existe em ARTICLE_PROMPTS:
//    - chama Pollinations com prompt cinematografico custom
//    - baixa a imagem
//    - guarda em ctx.storage.store
//    - patcha posts.coverImageStorageId
// 3. Faz o mesmo para o curso de Hermeneutica em courses.thumbnail (URL string).
//
// Reexecucao: idempotente. Sempre regenera (porque o seed muda nada). Para
// preservar capas existentes, descomente o bloco "skip if has cover".

import { internal } from './_generated/api'
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

function checkSecret(secret: string) {
  const expected = process.env.COVER_GEN_SECRET
  if (!expected) throw new Error('COVER_GEN_SECRET not configured')
  if (secret !== expected) throw new Error('forbidden')
}

type Job = { kind: 'post' | 'course'; id: string; slug: string; prompt: string }

const ARTICLE_PROMPTS: Record<string, string> = {
  'a-ressurreicao-que-ninguem-te-contou':
    'cinematic painting of empty tomb at dawn, large stone rolled away revealing dark interior, single shaft of golden light entering from outside, folded white linen cloth on rocky floor, low mist on ground, deep navy and warm amber palette, oil painting chiaroscuro editorial book cover, no text no logo no people no faces',
  'o-deus-que-se-fez-homem':
    'cinematic painting of empty rough stone manger filled with hay inside dark stable, single golden ray of light cutting through stable opening, deep starry sky visible through doorway, oil painting chiaroscuro editorial style, navy and amber palette, no text no logo no people no plastic nativity',
  'por-que-existem-tantas-denominacoes':
    'cinematic painting of large ancient cathedral stained glass window divided into many distinct geometric panels held together by central lead structure, warm light passing through, navy and amber dominant palette, oil painting on stone wall, editorial book cover, no text no logo no people',
  'posso-perder-a-salvacao':
    'cinematic painting of strong masculine hand firmly gripping smaller hand at the wrist from above wrist to wrist, dramatic side lighting Rembrandt style, deep navy black background, dust particles suspended in golden light, oil painting, no text no logo no faces no full bodies',
  'o-que-acontece-com-quem-nunca-ouviu-o-evangelho':
    'cinematic painting of antique parchment world map laid on dark wooden desk, large continental regions in deep shadow, rare scattered points of golden light over them, bronze antique magnifying glass on a dark area, quill pen and inkwell beside, oil painting editorial book cover, no text no logo no readable letters',
  'o-inferno-existe-de-verdade':
    'cinematic painting of ancient heavy oak door slightly open at the end of long stone corridor, deep orange amber light spilling from the crack without revealing interior, fine ash particles suspended in air, dark dramatic oil painting, no text no logo no flames no people no faces',
  'existe-livre-arbitrio-na-biblia':
    'cinematic painting of stone path forking in two directions inside dark misty forest, both paths partially illuminated by distinct vertical golden rays from above, footprints visible in soft earth, oil painting, navy and amber palette, editorial book cover, no text no logo no people',
  'deus-escolhe-quem-vai-ser-salvo':
    'cinematic painting of antique parchment scroll open on dark wooden table sealed with single drop of golden wax bearing discreet ring imprint, soft candlelight from the side, quill pen, closed leather bound book in soft background, dutch still life style, oil painting, no text no logo no readable writing',
  'por-que-deus-permite-o-sofrimento':
    'cinematic painting of single drop of clear water falling onto dark wet stone surface, concentric ripples forming, cool pale light entering from tall narrow cathedral window, desaturated navy palette with minimal warm amber, silent solemn oil painting, no text no logo no people no tears',
  'o-que-jesus-esta-fazendo-agora-mesmo':
    'cinematic painting of empty stone throne elevated on rocky mountain summit illuminated by vertical golden beam descending from sky of dramatic moving clouds, soft light trail rising from foreground stone floor, oil painting editorial, navy and amber palette, no text no logo no people no figures',
  'advento-a-espera-que-transforma':
    'cinematic painting of single tall lit candle on dark wooden table, three unlit candles arranged around it in symbolic placement, leather bound closed book in background, slowly melting wax, dutch still life oil painting style, deep navy palette with single amber glow from candle, no text no logo',
  'pentecostes-o-dia-que-mudou-tudo-para-sempre':
    'cinematic painting of large ancient stone hall with tall narrow windows, light fabric curtains moving in visible wind, small individual flame embers floating suspended dancing in air, golden light flooding the interior, contemporary fresco style, oil painting, no text no logo no people',
  'reforma-os-5-principios-que-salvaram-o-evangelho':
    'cinematic painting of dark heavy wooden door studded with old iron nails, parchment paper still affixed to central nail, side lighting suggesting a hand just departed, five subtle golden light points distributed vertically across the door, oil painting historical book cover, no text no logo no faces no people',
  'a-cruz-que-voce-ainda-nao-entendeu':
    'cinematic painting of rough wooden cross rooted in rocky hill silhouetted against stormy sky that opens with single dramatic golden ray descending from above, veiled sun, oil painting, navy and deep violet palette with single warm amber cut of light, editorial book cover, no text no logo no people no blood',
}

const COURSE_PROMPTS: Record<string, string> = {
  'interpretacao-biblica-o-poder-do-contexto-imediato':
    'cinematic painting of large ancient open book centered on dark wooden study table, bronze antique magnifying glass over an illuminated paragraph, dramatic warm amber Caravaggio side lighting, dust motes softly floating, quill pen and inkwell beside, defocused beeswax candle in background, oil painting premium editorial book cover, deep navy palette with concentrated amber center, no text no logo no readable writing no people',
}

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt'

function buildUrl(prompt: string, seed: number): string {
  const params = new URLSearchParams({
    width: '1536',
    height: '1024',
    model: 'flux',
    nologo: 'true',
    seed: String(seed),
    enhance: 'true',
  })
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`
}

async function fetchImageBlob(url: string): Promise<Blob> {
  let lastStatus = 0
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'ResenhaDoTeologo/1.0 (+https://resenhadoteologo.com)',
        Accept: 'image/jpeg,image/png,image/*;q=0.9,*/*;q=0.5',
      },
    })
    if (res.ok) {
      const blob = await res.blob()
      if (blob.size < 5_000) {
        throw new Error(`Imagem suspeita, ${blob.size} bytes apenas`)
      }
      return blob
    }
    lastStatus = res.status
    if (attempt < 3 && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 10_000 * attempt))
      continue
    }
    break
  }
  throw new Error(`Pollinations HTTP ${lastStatus}`)
}

export const _listJobs = internalQuery({
  args: {},
  handler: async (ctx): Promise<Job[]> => {
    const jobs: Job[] = []
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .collect()
    for (const p of posts) {
      const prompt = ARTICLE_PROMPTS[p.slug]
      if (!prompt) continue
      jobs.push({ kind: 'post', id: String(p._id), slug: p.slug, prompt })
    }
    const courses = await ctx.db.query('courses').collect()
    for (const c of courses) {
      if (!c.slug) continue
      const prompt = COURSE_PROMPTS[c.slug]
      if (!prompt) continue
      jobs.push({ kind: 'course', id: String(c._id), slug: c.slug, prompt })
    }
    return jobs
  },
})

export const listJobsPublic = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }): Promise<Job[]> => {
    checkSecret(secret)
    const jobs: Job[] = []
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .collect()
    for (const p of posts) {
      const prompt = ARTICLE_PROMPTS[p.slug]
      if (!prompt) continue
      jobs.push({ kind: 'post', id: String(p._id), slug: p.slug, prompt })
    }
    const courses = await ctx.db.query('courses').collect()
    for (const c of courses) {
      if (!c.slug) continue
      const prompt = COURSE_PROMPTS[c.slug]
      if (!prompt) continue
      jobs.push({ kind: 'course', id: String(c._id), slug: c.slug, prompt })
    }
    return jobs
  },
})

export const generateUploadUrlPublic = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    checkSecret(secret)
    return await ctx.storage.generateUploadUrl()
  },
})

export const patchPostCoverPublic = mutation({
  args: {
    secret: v.string(),
    postId: v.id('posts'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { secret, postId, storageId }) => {
    checkSecret(secret)
    await ctx.db.patch(postId, { coverImageStorageId: storageId })
  },
})

export const patchCourseThumbnailPublic = mutation({
  args: {
    secret: v.string(),
    courseId: v.id('courses'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { secret, courseId, storageId }) => {
    checkSecret(secret)
    const url = await ctx.storage.getUrl(storageId)
    if (!url) throw new Error('storage.getUrl null')
    await ctx.db.patch(courseId, { thumbnail: url })
  },
})

export const _patchPostCover = internalMutation({
  args: { postId: v.id('posts'), storageId: v.id('_storage') },
  handler: async (ctx, { postId, storageId }) => {
    await ctx.db.patch(postId, { coverImageStorageId: storageId })
  },
})

export const _patchCourseThumbnail = internalMutation({
  args: { courseId: v.id('courses'), thumbnail: v.string() },
  handler: async (ctx, { courseId, thumbnail }) => {
    await ctx.db.patch(courseId, { thumbnail })
  },
})

export const runAll = internalAction({
  args: {
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { offset = 0, limit = 4 },
  ): Promise<{ ok: number; failed: number; total: number; processed: number; nextOffset: number; done: boolean; details: string[] }> => {
    const all = await ctx.runQuery(internal.generateCovers._listJobs, {})
    const slice = all.slice(offset, offset + limit)
    const details: string[] = []
    let ok = 0
    let failed = 0
    let seed = 1000 + offset
    for (let i = 0; i < slice.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 3_000))
      const job = slice[i]
      seed += 1
      const url = buildUrl(job.prompt, seed)
      try {
        const blob = await fetchImageBlob(url)
        const storageId = await ctx.storage.store(blob)
        if (job.kind === 'post') {
          await ctx.runMutation(internal.generateCovers._patchPostCover, {
            postId: job.id as Id<'posts'>,
            storageId,
          })
        } else {
          const publicUrl = await ctx.storage.getUrl(storageId)
          if (!publicUrl) throw new Error('storage.getUrl null')
          await ctx.runMutation(internal.generateCovers._patchCourseThumbnail, {
            courseId: job.id as Id<'courses'>,
            thumbnail: publicUrl,
          })
        }
        ok += 1
        details.push(`OK   ${job.kind} ${job.slug}`)
      } catch (err) {
        failed += 1
        details.push(`FAIL ${job.kind} ${job.slug} :: ${(err as Error).message}`)
      }
    }
    const nextOffset = offset + slice.length
    return {
      ok,
      failed,
      total: all.length,
      processed: slice.length,
      nextOffset,
      done: nextOffset >= all.length,
      details,
    }
  },
})
