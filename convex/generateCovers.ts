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

function asciiSlug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ç/g, 'c')
}

function findArticlePrompt(slug: string): string | undefined {
  return ARTICLE_PROMPTS[slug] ?? ARTICLE_PROMPTS[asciiSlug(slug)]
}

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
  'a-parabola-do-joio-por-que-deus-permite-o-mal-crescer':
    'cinematic painting of golden wheat field at golden hour with dark twisted weeds growing intermixed among mature wheat stalks, low warm sun casting long shadows across the field, distant farmhouse silhouette, oil painting chiaroscuro editorial book cover, navy sky and amber palette, no text no logo no people no faces',
  'o-maior-milagre-nao-e-o-que-voce-pensa':
    'cinematic painting of small mustard seed sprouting through cracked stone surface with single tender green leaf reaching toward beam of golden light from above, dramatic Caravaggio side lighting, dust particles suspended, oil painting editorial book cover, navy and amber palette, no text no logo no people no faces',
  'a-parabola-do-credor-incompassivo':
    'cinematic painting of antique ledger book open on dark wooden table with quill pen and brass scales of justice in shadow background, single golden coin catching candlelight, dust particles suspended, dutch still life oil painting style, navy and amber palette, no text no logo no readable writing no people',
  'o-evangelho-redefine-tudo':
    'cinematic painting of dark closed leather bound book on dark wooden table beginning to glow from within, golden light escaping from edges of pages, dust motes rising, dramatic chiaroscuro Rembrandt lighting, oil painting editorial book cover, deep navy and warm amber palette, no text no logo no readable writing no people',
  'o-reino-de-deus-presente-e-futuro':
    'cinematic painting of stone path beginning in shadowed foreground and rising into golden distant horizon where ancient city gates appear partially formed in mist, dual lighting cool blue near and warm amber far, oil painting editorial book cover, navy and amber palette, no text no logo no people no faces',
  'eternidade-salvacao-nao-e-o-fim':
    'cinematic painting of single star burning brightly in vast dark night sky above silhouetted mountain horizon at first light, soft amber glow on horizon edge, deep navy upper sky with scattered constellations, oil painting editorial book cover, no text no logo no people no faces',
  'sacerdocio-universal-voce-e-o-sacerdote':
    'cinematic painting of simple stone altar in dark ancient temple interior with single white linen cloth draped over it, three small lit oil lamps casting warm amber glow, tall stone columns receding into shadow, oil painting chiaroscuro editorial book cover, navy and amber palette, no text no logo no people no faces',
  'a-igreja-nao-e-onde-voce-vai-e-quem-voce-e':
    'cinematic painting of large empty cathedral interior with stone columns receding into golden light from tall windows, single small flame at center floor, soft mist drifting through the space, oil painting editorial book cover, deep navy and warm amber palette, no text no logo no people no faces',
  'frutos-e-dons-do-espirito-santo':
    'cinematic painting of mature grape vine heavy with ripe purple grapes alongside ripe wheat stalks resting on dark wooden table, soft golden side light, dutch still life oil painting style, deep navy background and amber palette, no text no logo no people no faces',
  'a-ressurreicao-muda-tudo':
    'cinematic painting of empty tomb interior with stone floor scattered with white linen burial cloths neatly folded, single shaft of bright golden morning light entering from open doorway, oil painting chiaroscuro editorial book cover, navy and amber palette, no text no logo no people no faces',
  'o-gadareno-encontro-com-jesus':
    'cinematic painting of broken iron chains lying scattered on rocky shore beside calm water at dawn, distant cliffside cave entrance in shadow, soft amber light spreading across water, oil painting editorial book cover, deep navy and warm amber palette, no text no logo no people no faces',
  'paciencia-macrotumia-marca-do-cristao':
    'cinematic painting of single tall white candle burning steadily on dark wooden table with very long pool of melted wax extending around the base, soft warm light, dutch still life oil painting style, deep navy background and amber palette, no text no logo no people no faces',
  'amor-nao-e-moeda-de-troca':
    'cinematic painting of two open empty hands cupped together facing upward illuminated by single warm light from above, dark blurred background, dramatic Caravaggio chiaroscuro, oil painting editorial book cover, navy and amber palette, no text no logo no faces no full bodies',
  'quem-vai-morar-na-cidade-de-deus':
    'cinematic painting of distant golden city with multiple tall gates seen across dark valley at twilight, single bright star above city, narrow stone path leading toward it from foreground, oil painting editorial book cover, deep navy and warm amber palette, no text no logo no people no faces',
  'estevao-uma-vida-que-marca':
    'cinematic painting of small smooth stones piled at base of dark stone altar with single shaft of bright golden light descending from above onto the pile, dramatic chiaroscuro lighting, oil painting editorial book cover, deep navy and amber palette, no text no logo no people no faces',
  'se-jesus-voltasse-hoje-voce-estaria-salvo':
    'cinematic painting of antique brass pendulum clock on dark mantelpiece with hands frozen near midnight, dust particles suspended in soft amber light from candle, dutch still life oil painting style, deep navy background, no text no logo no readable numbers no people',
  'o-espirito-do-anticristo':
    'cinematic painting of empty stone pedestal in dark ancient hall with subtle amber glow from below as if lit from beneath, tall shadowed columns receding, dramatic moody oil painting editorial book cover, deep navy and minimal amber palette, no text no logo no people no faces',
  'lancado-no-fogo-cinco-marcas-do-cristao':
    'cinematic painting of clay vessel held above forge fire with bright amber glowing embers below, sparks rising into dark air, blacksmith tongs in foreground silhouette, oil painting chiaroscuro editorial book cover, deep navy and intense amber palette, no text no logo no faces no full bodies',
  'adoracao-nao-e-onde-e-a-quem':
    'cinematic painting of open ancient stone temple ruins at dusk with single shaft of golden light descending vertically onto mossy floor, deep blue twilight sky above, oil painting editorial book cover, navy and amber palette, no text no logo no people no faces',
  'a-santa-ceia-muito-alem-de-comer-e-beber':
    'cinematic painting of broken loaf of rustic bread and pewter chalice of dark wine on simple dark wooden table, single shaft of warm golden light from window catching the bread, oil painting Rembrandt chiaroscuro, navy and amber palette, no text no logo no people no faces',
  'embaixadores-de-cristo':
    'cinematic painting of antique parchment scroll sealed with red wax bearing royal crest resting on dark wooden table beside quill and inkwell, single warm candle glow from side, dutch still life oil painting style, deep navy and amber palette, no text no logo no readable writing no people',
  'a-voz-de-deus-contra-as-outras-vozes':
    'cinematic painting of single warm beam of golden light cutting through thick dark fog from above, illuminating small clearing of stone ground in the center, oil painting moody editorial book cover, deep navy and amber palette, no text no logo no people no faces',
  'transicao-dos-filhos-de-deus':
    'cinematic painting of butterfly emerging from cocoon hanging on bare branch with first light of dawn breaking behind, soft amber sky transitioning to deep navy above, oil painting editorial book cover, no text no logo no people no faces',
  'multidao-ovelha-ou-discipulo':
    'cinematic painting of single white sheep standing apart on rocky path looking toward distant warm light, blurred crowd of sheep silhouettes in mist behind, oil painting chiaroscuro editorial book cover, deep navy and amber palette, no text no logo no people no faces',
  'o-bom-combate-de-paulo':
    'cinematic painting of weathered iron sword resting upright point down in rocky ground beside laurel crown of victory, golden light from setting sun illuminating both, oil painting chiaroscuro editorial book cover, deep navy sky and amber palette, no text no logo no people no faces',
  'voce-entendeu-o-amor-errado':
    'cinematic painting of antique mirror in ornate dark wooden frame on dark wall reflecting only soft warm amber glow without any image, dramatic side lighting, oil painting editorial book cover, deep navy and amber palette, no text no logo no people no faces',
  'acorda-pedrinho-o-evangelho-nao-e-o-que-voce-faz':
    'cinematic painting of antique alarm clock on dark wooden bedside table with hands at dawn time, soft golden light from window beginning to illuminate the room, dutch still life oil painting style, deep navy and amber palette, no text no logo no readable numbers no people',
  'termometro-ou-termostato':
    'cinematic painting of brass antique thermometer beside brass thermostat dial both displayed on dark wooden surface, soft warm light from candle, dutch still life oil painting style, deep navy and amber palette, no text no logo no readable numbers no people',
  'falsos-deuses-bezerro-de-ouro':
    'cinematic painting of small ornate golden idol fragment lying broken on dark stone ground with cracks running through it, soft amber light from above, oil painting chiaroscuro editorial book cover, deep navy and amber palette, no text no logo no people no faces',
  'o-repartir-do-pao-o-sentido-da-ceia':
    'cinematic painting of two halves of broken rustic bread on simple dark wooden table beside small earthenware bowl, soft warm side light from candle, dutch still life oil painting style, deep navy background and amber palette, no text no logo no people no faces',
  'cultura-da-honra':
    'cinematic painting of antique brass crown resting on dark velvet cushion atop dark wooden pedestal, soft warm light from above casting subtle highlights on the metal, dutch still life oil painting style, deep navy background and amber palette, no text no logo no people no faces',
  'seja-inteiro-so-reparte-quem-esta-completo':
    'cinematic painting of single perfectly ripe pomegranate fruit on dark wooden table cut open revealing rich red interior with seeds intact, soft amber side light, dutch still life oil painting style, deep navy background, no text no logo no people no faces',
  'escute-a-voz-de-deus-seja-quem-voce-nasceu':
    'cinematic painting of single seedling sprouting from dark soil within terracotta pot on dark wooden windowsill with first sunlight breaking through, soft amber morning glow, dutch still life oil painting style, deep navy palette, no text no logo no people no faces',
  'se-voce-e-deus-tres-atitudes-diante-da-cruz':
    'cinematic painting of three weathered iron nails arranged on dark stone surface beside crown of dried thorns, single shaft of warm light from above, oil painting chiaroscuro editorial book cover, deep navy and amber palette, no text no logo no people no faces',
  'o-lugar-do-homem-abencoado':
    'cinematic painting of mature green tree planted beside flowing stream at dawn with sun rising behind illuminating leaves in golden glow, deep navy sky transitioning to warm amber horizon, oil painting editorial book cover, no text no logo no people no faces',
  'o-que-e-o-reino-de-deus-e-sua-justica':
    'cinematic painting of brass scales of justice perfectly balanced on dark wooden table beside open ancient book, soft warm candle light from side, dutch still life oil painting style, deep navy background and amber palette, no text no logo no readable writing no people',
  'qual-e-o-preco-da-salvacao':
    'cinematic painting of single ancient bronze coin lying on dark wooden table beside antique scale weight, soft golden light from candle, dutch still life oil painting style, deep navy background and amber palette, no text no logo no readable inscription no people',
  'perigos-da-insatisfacao-e-ingratidao':
    'cinematic painting of full grain horn cornucopia spilling ripe wheat and dried fruits onto dark wooden table beside simple clay bowl, soft warm side light, dutch still life oil painting style, deep navy background and amber palette, no text no logo no people no faces',
  'o-reino-que-vale-tudo-e-separa-tudo':
    'cinematic painting of antique wooden treasure chest open on dark soil revealing golden coins inside, single luminous large pearl resting on the rim of the chest, weathered fishing net partially folded in foreground, dramatic shaft of warm golden light from above, dutch still life chiaroscuro oil painting, deep navy and amber palette, editorial book cover, no text no logo no people no faces',
  'o-livro-que-escrevi-para-voce-ler-a-biblia-sem-distorcer-o-texto':
    'cinematic painting of single hardcover book lying closed on dark wooden writing desk beside antique brass reading glasses and small lit oil lamp, soft warm amber light pooling onto the cover from the side, dust motes suspended in air, dutch still life Rembrandt chiaroscuro oil painting, deep navy and amber palette, editorial book cover, no text no logo no readable writing no people no faces',
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
      const prompt = findArticlePrompt(p.slug)
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
  args: { secret: v.string(), skipExisting: v.optional(v.boolean()) },
  handler: async (ctx, { secret, skipExisting }): Promise<Job[]> => {
    checkSecret(secret)
    const jobs: Job[] = []
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .collect()
    for (const p of posts) {
      if (skipExisting && p.coverImageStorageId) continue
      const prompt = findArticlePrompt(p.slug)
      if (!prompt) continue
      jobs.push({ kind: 'post', id: String(p._id), slug: p.slug, prompt })
    }
    const courses = await ctx.db.query('courses').collect()
    for (const c of courses) {
      if (!c.slug) continue
      if (skipExisting && c.thumbnail) continue
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

export const _findPostBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query('posts')
      .filter((q) => q.eq(q.field('slug'), slug))
      .first()
    if (!post) return null
    return { _id: post._id, slug: post.slug }
  },
})

export const runForSlug = internalAction({
  args: { slug: v.string(), seed: v.optional(v.number()) },
  handler: async (
    ctx,
    { slug, seed = 4242 },
  ): Promise<{ ok: boolean; slug: string; storageId?: string; error?: string }> => {
    const post = await ctx.runQuery(internal.generateCovers._findPostBySlug, { slug })
    if (!post) return { ok: false, slug, error: `Post not found: ${slug}` }
    const prompt = findArticlePrompt(slug)
    if (!prompt) return { ok: false, slug, error: `No prompt registered for ${slug}` }
    try {
      const url = buildUrl(prompt, seed)
      const blob = await fetchImageBlob(url)
      const storageId = await ctx.storage.store(blob)
      await ctx.runMutation(internal.generateCovers._patchPostCover, {
        postId: post._id as Id<'posts'>,
        storageId,
      })
      return { ok: true, slug, storageId: String(storageId) }
    } catch (err) {
      return { ok: false, slug, error: (err as Error).message }
    }
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
