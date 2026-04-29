// IndexNow: notifica Bing, Yandex, Naver e Seznam sobre novas URLs ou
// atualizações sem depender de crawl passivo. Google ainda não participa.
//
// Como funciona: POST para api.indexnow.org com a chave validada via arquivo
// público em /<key>.txt. A chave reside em public/4786...611.txt e é o mesmo
// valor usado abaixo. Se o arquivo for removido ou a chave não bater, o
// IndexNow ignora a submissão silenciosamente.
//
// Pontos de gatilho (mutations chamam via ctx.scheduler.runAfter(0, ...)):
//   - posts.publish: nova URL de artigo
//   - lessons.update / runScheduledPublish: nova URL de aula
//   - courses.publishWithLessons: URLs do curso + aulas
//
// Cron mensal `indexnow-monthly-submitall` reenvia o sitemap inteiro como
// resgate, caso algum gatilho tenha falhado silenciosamente.

import { v } from 'convex/values'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'

const INDEXNOW_KEY = '4786bae4acc242c7496223a90bf3b31e9c65deab34ea53543e4d72055514b611'
const HOST = 'resenhadoteologo.com'
const SITE = `https://${HOST}`
const KEY_LOCATION = `${SITE}/${INDEXNOW_KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/IndexNow'

async function postToIndexNow(urls: string[]): Promise<{ ok: boolean; status: number; count: number }> {
  if (urls.length === 0) return { ok: true, status: 200, count: 0 }
  const dedup = Array.from(new Set(urls)).slice(0, 10000)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: dedup,
      }),
    })
    if (!res.ok) {
      console.warn('[indexnow] non-2xx response', res.status, await res.text().catch(() => ''))
    }
    return { ok: res.ok, status: res.status, count: dedup.length }
  } catch (err) {
    console.error('[indexnow] submit failed', err)
    return { ok: false, status: 0, count: dedup.length }
  }
}

export const submitUrls = internalAction({
  args: { urls: v.array(v.string()) },
  handler: async (_ctx, { urls }) => postToIndexNow(urls),
})

export const submitAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const [courses, lessons, posts, profiles, categories] = await Promise.all([
      ctx.runQuery(internal.indexnow._coursesForSubmit, {}),
      ctx.runQuery(internal.indexnow._lessonsForSubmit, {}),
      ctx.runQuery(internal.indexnow._postsForSubmit, {}),
      ctx.runQuery(internal.indexnow._profilesForSubmit, {}),
      ctx.runQuery(internal.indexnow._categoriesForSubmit, {}),
    ])

    const urls: string[] = [
      `${SITE}/`,
      `${SITE}/sobre`,
      `${SITE}/cursos`,
      `${SITE}/blog`,
      `${SITE}/biblia`,
      `${SITE}/apoie`,
    ]

    for (const c of courses) {
      if (c.slug) urls.push(`${SITE}/cursos/${c.slug}`)
    }
    for (const l of lessons) {
      urls.push(`${SITE}/cursos/${l.courseSlug}/${l.lessonSlug}`)
    }
    for (const p of posts) {
      urls.push(`${SITE}/blog/${p.handle}/${p.slug}`)
    }
    for (const u of profiles) {
      urls.push(`${SITE}/${u.handle}`)
    }
    for (const cat of categories) {
      urls.push(`${SITE}/blog/categoria/${cat.slug}`)
    }

    const chunks: string[][] = []
    for (let i = 0; i < urls.length; i += 9000) chunks.push(urls.slice(i, i + 9000))
    let total = 0
    for (const chunk of chunks) {
      const r = await postToIndexNow(chunk)
      if (r.ok) total += r.count
    }
    return { submitted: total, batches: chunks.length }
  },
})

import { internalQuery } from './_generated/server'

export const _coursesForSubmit = internalQuery({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect()
    return courses
      .filter((c) => c.visibility !== 'institution' && c.slug)
      .map((c) => ({ slug: c.slug as string }))
  },
})

export const _lessonsForSubmit = internalQuery({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect()
    const publicCourses = courses.filter((c) => c.visibility !== 'institution' && c.slug)
    const courseById = new Map(publicCourses.map((c) => [c._id, c]))
    const allLessons = await Promise.all(
      publicCourses.map((c) =>
        ctx.db.query('lessons').withIndex('by_courseId', (q) => q.eq('courseId', c._id)).collect(),
      ),
    )
    const out: Array<{ courseSlug: string; lessonSlug: string }> = []
    for (const lessons of allLessons) {
      for (const lesson of lessons) {
        if (!lesson.isPublished || !lesson.slug) continue
        const course = courseById.get(lesson.courseId)
        if (!course?.slug) continue
        out.push({ courseSlug: course.slug, lessonSlug: lesson.slug })
      }
    }
    return out
  },
})

export const _postsForSubmit = internalQuery({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(5000)
    const authorIds = Array.from(new Set(posts.map((p) => p.authorUserId)))
    const authors = await Promise.all(
      authorIds.map((id) =>
        ctx.db.query('users').withIndex('by_clerkId', (q) => q.eq('clerkId', id)).unique(),
      ),
    )
    const handleByClerkId = new Map<string, string>()
    authors.forEach((u, i) => {
      if (u?.handle) handleByClerkId.set(authorIds[i], u.handle)
    })
    const out: Array<{ handle: string; slug: string }> = []
    for (const p of posts) {
      const handle = handleByClerkId.get(p.authorUserId)
      if (!handle) continue
      out.push({ handle, slug: p.slug })
    }
    return out
  },
})

export const _profilesForSubmit = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').take(5000)
    const withHandle = users.filter((u) => !!u.handle)
    const checks = await Promise.all(
      withHandle.map(async (u) => {
        const [course, post] = await Promise.all([
          ctx.db.query('courses').withIndex('by_creatorId', (q) => q.eq('creatorId', u.clerkId)).first(),
          ctx.db.query('posts').withIndex('by_author', (q) => q.eq('authorUserId', u.clerkId)).first(),
        ])
        return {
          handle: u.handle!,
          hasContent: Boolean(course?.isPublished) || Boolean(post && post.status === 'published'),
        }
      }),
    )
    return checks.filter((c) => c.hasContent).map((c) => ({ handle: c.handle }))
  },
})

export const _categoriesForSubmit = internalQuery({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('postCategories').collect()
    return categories.map((c) => ({ slug: c.slug }))
  },
})
