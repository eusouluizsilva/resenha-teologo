// Pollinations bloqueia IPs do Convex (HTTP 500), mas funciona do meu IP local.
// Este script roda localmente: baixa cada imagem via Pollinations, sobe pro
// Convex File Storage usando uploadUrl assinado, e patcha o registro.
//
// Rodar:
//   node scripts/generateCoversLocal.mjs
//
// Requer:
//   - COVER_GEN_SECRET no env (mesmo valor setado em `npx convex env set`)
//   - VITE_CONVEX_URL apontando pra prod (ou passar PROD_CONVEX_URL)

import { ConvexHttpClient } from 'convex/browser'
import { setTimeout as sleep } from 'node:timers/promises'

const PROD_URL =
  process.env.PROD_CONVEX_URL || 'https://blessed-platypus-993.convex.cloud'
const SECRET = process.env.COVER_GEN_SECRET
if (!SECRET) {
  console.error('Faltou COVER_GEN_SECRET no env')
  process.exit(1)
}

const client = new ConvexHttpClient(PROD_URL)

function buildPollinationsUrl(prompt, seed) {
  const params = new URLSearchParams({
    width: '1536',
    height: '1024',
    model: 'flux',
    nologo: 'true',
    seed: String(seed),
    enhance: 'true',
  })
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`
}

async function fetchImageBlob(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
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
        throw new Error(`imagem suspeita ${blob.size}b`)
      }
      return blob
    }
    if (attempt < 4 && res.status >= 500) {
      const wait = 5_000 * attempt
      console.log(`  retry em ${wait / 1000}s (HTTP ${res.status})`)
      await sleep(wait)
      continue
    }
    throw new Error(`Pollinations HTTP ${res.status}`)
  }
  throw new Error('unreachable')
}

async function uploadAndStore(blob) {
  const uploadUrl = await client.mutation('generateCovers:generateUploadUrlPublic', {
    secret: SECRET,
  })
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'image/jpeg' },
    body: blob,
  })
  if (!res.ok) {
    throw new Error(`upload HTTP ${res.status}: ${await res.text()}`)
  }
  const { storageId } = await res.json()
  return storageId
}

async function main() {
  const jobs = await client.query('generateCovers:listJobsPublic', {
    secret: SECRET,
  })
  console.log(`\nEncontrei ${jobs.length} jobs.\n`)

  let ok = 0
  let failed = 0
  let seed = 1000
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    seed += 1
    const tag = `[${i + 1}/${jobs.length}]`
    console.log(`${tag} ${job.kind} ${job.slug}`)
    try {
      const url = buildPollinationsUrl(job.prompt, seed)
      const blob = await fetchImageBlob(url)
      console.log(`  baixado ${(blob.size / 1024).toFixed(0)}KB`)
      const storageId = await uploadAndStore(blob)
      console.log(`  storage ${storageId}`)
      if (job.kind === 'post') {
        await client.mutation('generateCovers:patchPostCoverPublic', {
          secret: SECRET,
          postId: job.id,
          storageId,
        })
      } else {
        await client.mutation('generateCovers:patchCourseThumbnailPublic', {
          secret: SECRET,
          courseId: job.id,
          storageId,
        })
      }
      console.log(`  OK`)
      ok += 1
    } catch (err) {
      console.error(`  FAIL :: ${err.message}`)
      failed += 1
    }
    if (i < jobs.length - 1) await sleep(2_000)
  }

  console.log(`\nFim. ok=${ok} failed=${failed}\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
