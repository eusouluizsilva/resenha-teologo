import { v } from 'convex/values'
import { action, internalAction, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { isAdminEmail } from './lib/auth'

declare const process: { env: Record<string, string | undefined> }

// ──────────────────────────────────────────────────────────────────────────
// Cloudflare R2 — assinatura S3v4 manual (sem SDK pra rodar em Convex)
//
// Env vars esperadas no Convex prod (Settings → Environment Variables):
//   R2_ACCOUNT_ID         675e4e9276b5f9bae24216781404dba9 (mesma conta do ziulhub)
//   R2_BUCKET             resenha-do-teologo
//   R2_ENDPOINT           https://<account>.r2.cloudflarestorage.com
//   R2_ACCESS_KEY_ID      Token de Object R/W escopado pro bucket
//   R2_SECRET_ACCESS_KEY  Idem
//   R2_PUBLIC_BASE_URL    (opcional) URL base do public bucket — ex: https://cdn.resenhadoteologo.com
//                         Se ausente, getPublicUrl monta presigned GET.
//
// Estrutura de keys recomendada:
//   covers/<courseId>/<filename>
//   lessons/<lessonId>/materials/<filename>
//   avatars/<userId>/<filename>
//   ebooks/<ebookId>/<filename>
// ──────────────────────────────────────────────────────────────────────────

type R2Env = {
  accountId: string
  bucket: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  publicBaseUrl: string | null
}

function getR2Env(): R2Env {
  const e = process.env
  const required = ['R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
  for (const key of required) {
    if (!e[key]) throw new Error(`R2: env ${key} ausente`)
  }
  return {
    accountId: e.R2_ACCOUNT_ID!,
    bucket: e.R2_BUCKET!,
    endpoint: e.R2_ENDPOINT!.replace(/\/+$/, ''),
    accessKeyId: e.R2_ACCESS_KEY_ID!,
    secretAccessKey: e.R2_SECRET_ACCESS_KEY!,
    publicBaseUrl: e.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '') ?? null,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Util: hex/hash/HMAC. R2 usa region "auto" e service "s3".
// ──────────────────────────────────────────────────────────────────────────
const REGION = 'auto'
const SERVICE = 's3'

function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

// Converte Uint8Array → ArrayBuffer "limpo" pra satisfazer BufferSource das
// APIs de WebCrypto (TS 5.7+ não aceita ArrayBufferLike via SharedArrayBuffer).
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buf).set(bytes)
  return buf
}

async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const hash = await crypto.subtle.digest('SHA-256', toArrayBuffer(bytes))
  return bytesToHex(new Uint8Array(hash))
}

async function hmac(key: ArrayBuffer, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return await crypto.subtle.sign('HMAC', k, toArrayBuffer(new TextEncoder().encode(msg)))
}

async function signingKey(secret: string, dateStamp: string): Promise<ArrayBuffer> {
  const kDate = await hmac(toArrayBuffer(new TextEncoder().encode(`AWS4${secret}`)), dateStamp)
  const kRegion = await hmac(kDate, REGION)
  const kService = await hmac(kRegion, SERVICE)
  return await hmac(kService, 'aws4_request')
}

// RFC 3986 unreserved encoding (S3 canonical query string)
function rfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Presigned URL (GET ou PUT) usando query-string auth (SigV4 presigned).
// Retorna URL absoluta com X-Amz-* params.
// ──────────────────────────────────────────────────────────────────────────
async function presignS3Url(opts: {
  env: R2Env
  method: 'GET' | 'PUT' | 'DELETE'
  key: string
  expiresInSec: number
  contentType?: string
}): Promise<string> {
  const { env, method, key, expiresInSec, contentType } = opts
  const url = new URL(`${env.endpoint}/${env.bucket}/${key.split('/').map(rfc3986).join('/')}`)
  const host = url.host

  const now = new Date()
  const amzDate =
    now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const credential = `${env.accessKeyId}/${credentialScope}`

  // Headers assinados: só Host (presigned). Se contentType vier, R2 valida
  // que o PUT envie esse header — então também precisa entrar nos signed.
  const signedHeaders = contentType ? 'content-type;host' : 'host'

  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSec),
    'X-Amz-SignedHeaders': signedHeaders,
  }

  const sortedKeys = Object.keys(queryParams).sort()
  const canonicalQuery = sortedKeys.map((k) => `${rfc3986(k)}=${rfc3986(queryParams[k])}`).join('&')

  const canonicalHeaders = contentType
    ? `content-type:${contentType}\nhost:${host}\n`
    : `host:${host}\n`

  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n')

  const key_ = await signingKey(env.secretAccessKey, dateStamp)
  const signature = bytesToHex(new Uint8Array(await hmac(key_, stringToSign)))

  return `${url.origin}${url.pathname}?${canonicalQuery}&X-Amz-Signature=${signature}`
}

// ──────────────────────────────────────────────────────────────────────────
// SigV4 com header (não query) — usado pra DELETE/HEAD direto do servidor.
// ──────────────────────────────────────────────────────────────────────────
async function signedFetch(opts: {
  env: R2Env
  method: 'DELETE' | 'HEAD' | 'GET'
  key: string
}): Promise<Response> {
  const { env, method, key } = opts
  const url = new URL(`${env.endpoint}/${env.bucket}/${key.split('/').map(rfc3986).join('/')}`)
  const host = url.host

  const now = new Date()
  const amzDate =
    now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)
  const payloadHash = await sha256Hex('')

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`

  const canonicalRequest = [
    method,
    url.pathname,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n')

  const key_ = await signingKey(env.secretAccessKey, dateStamp)
  const signature = bytesToHex(new Uint8Array(await hmac(key_, stringToSign)))
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${env.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  return await fetch(url.toString(), {
    method,
    headers: {
      Authorization: authorization,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// PURPOSE → restrições. Define onde cada perfil pode subir e tipos aceitos.
// ──────────────────────────────────────────────────────────────────────────
const PURPOSE = v.union(
  v.literal('cover'),       // capa de curso (criador/admin)
  v.literal('material'),    // PDF/anexo de aula (criador/admin)
  v.literal('avatar'),      // foto de perfil (qualquer usuário autenticado)
  v.literal('ebook'),       // PDF de eBook (admin only)
  v.literal('post-image'),  // imagem de post do blog (admin/criador)
)

type Purpose = 'cover' | 'material' | 'avatar' | 'ebook' | 'post-image'

const MAX_SIZE_BYTES: Record<Purpose, number> = {
  cover: 5 * 1024 * 1024,         // 5 MB
  material: 50 * 1024 * 1024,     // 50 MB
  avatar: 2 * 1024 * 1024,        // 2 MB
  ebook: 100 * 1024 * 1024,       // 100 MB
  'post-image': 5 * 1024 * 1024,  // 5 MB
}

const ALLOWED_MIME: Record<Purpose, string[]> = {
  cover: ['image/jpeg', 'image/png', 'image/webp'],
  material: ['application/pdf', 'image/jpeg', 'image/png'],
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  ebook: ['application/pdf', 'application/epub+zip'],
  'post-image': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}

function sanitizeFilename(name: string): string {
  // Remove path traversal, normaliza separadores, mantém ext. Trunca em 80 chars.
  const base = name.replace(/[\\/]/g, '_').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80)
  return base || 'file'
}

function buildKey(purpose: Purpose, ownerId: string, filename: string): string {
  const ts = Date.now().toString(36)
  const safe = sanitizeFilename(filename)
  // Prefixo por propósito + owner + timestamp pra evitar colisão
  const folder = {
    cover: 'covers',
    material: 'materials',
    avatar: 'avatars',
    ebook: 'ebooks',
    'post-image': 'posts',
  }[purpose]
  return `${folder}/${ownerId}/${ts}-${safe}`
}

// Internal query usada pelas actions pra checar perfil/admin sem expor PII.
// Actions não têm db direto, então delegam pra esta query.
export const getAuthMeta = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
    if (!user) return null
    return { email: user.email, perfil: user.perfil }
  },
})

type AuthMeta = { email: string; perfil?: string } | null

// ──────────────────────────────────────────────────────────────────────────
// ACTION: gera URL pré-assinada de UPLOAD. Cliente faz PUT direto no R2.
// Retorna também a chave + URL pública pra salvar no banco depois.
// ──────────────────────────────────────────────────────────────────────────
export const generateUploadUrl = action({
  args: {
    purpose: PURPOSE,
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { purpose, filename, contentType, size }) => {
    const purposeKey = purpose as Purpose

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado')

    const meta: AuthMeta = await ctx.runQuery(internal.r2.getAuthMeta, {
      clerkId: identity.subject,
    })
    if (!meta) throw new Error('Usuário não encontrado')

    // Avatar: qualquer user autenticado. ebook: admin only. Demais: autenticado.
    if (purposeKey === 'ebook' && !isAdminEmail(meta.email)) {
      throw new Error('Não autorizado')
    }

    if (size > MAX_SIZE_BYTES[purposeKey]) {
      throw new Error(`Arquivo excede ${MAX_SIZE_BYTES[purposeKey] / 1024 / 1024}MB`)
    }
    if (!ALLOWED_MIME[purposeKey].includes(contentType)) {
      throw new Error(`Tipo ${contentType} não permitido para ${purpose}`)
    }

    const env = getR2Env()
    const key = buildKey(purposeKey, identity.subject, filename)

    const uploadUrl = await presignS3Url({
      env,
      method: 'PUT',
      key,
      expiresInSec: 60 * 5, // 5 min
      contentType,
    })

    const publicUrl = env.publicBaseUrl
      ? `${env.publicBaseUrl}/${key}`
      : await presignS3Url({ env, method: 'GET', key, expiresInSec: 60 * 60 * 24 * 7 })

    return { uploadUrl, key, publicUrl, expiresIn: 300 }
  },
})

// ──────────────────────────────────────────────────────────────────────────
// ACTION: gera URL pré-assinada de leitura (GET) — útil quando o bucket é
// privado e o cliente precisa baixar (ex: PDF de aula com matrícula ativa).
// Caller deve já ter validado autorização antes de chamar.
// ──────────────────────────────────────────────────────────────────────────
export const generateDownloadUrl = action({
  args: { key: v.string(), expiresInSec: v.optional(v.number()) },
  handler: async (ctx, { key, expiresInSec }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado')
    const env = getR2Env()
    return await presignS3Url({
      env,
      method: 'GET',
      key,
      expiresInSec: expiresInSec ?? 60 * 60, // 1h default
    })
  },
})

// Helper exportado para outros módulos (lessonMaterials.getDownloadUrl, etc).
// Caller deve garantir que chamou a partir de uma action que já validou
// autorização ao recurso. Não fazer chamadas diretas do cliente.
export async function presignR2DownloadUrl(
  key: string,
  expiresInSec: number,
): Promise<string> {
  return await presignS3Url({
    env: getR2Env(),
    method: 'GET',
    key,
    expiresInSec,
  })
}

// Resolve URL pública a partir de uma key. Se R2_PUBLIC_BASE_URL estiver
// setado (custom domain), retorna URL estável. Senão, presigned GET de 7 dias.
// Usado em queries que devolvem coverImageUrl resolvida (blog posts, etc).
export async function resolveR2PublicUrl(key: string): Promise<string> {
  const env = getR2Env()
  if (env.publicBaseUrl) return `${env.publicBaseUrl}/${key}`
  return await presignS3Url({
    env,
    method: 'GET',
    key,
    expiresInSec: 60 * 60 * 24 * 7,
  })
}

// ──────────────────────────────────────────────────────────────────────────
// ACTION: deleta objeto do R2. Usar com cuidado, não desfaz. Restrito a admin.
// ──────────────────────────────────────────────────────────────────────────
export const deleteObject = action({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado')
    const meta: AuthMeta = await ctx.runQuery(internal.r2.getAuthMeta, {
      clerkId: identity.subject,
    })
    if (!meta || !isAdminEmail(meta.email)) throw new Error('Não autorizado')

    const env = getR2Env()
    const resp = await signedFetch({ env, method: 'DELETE', key })
    if (!resp.ok && resp.status !== 404) {
      const text = await resp.text()
      throw new Error(`R2 delete falhou ${resp.status}: ${text}`)
    }
    return { ok: true }
  },
})

// Internal action chamada via ctx.scheduler quando o backend precisa apagar
// um objeto em cascata (curso/aula/materiais excluídos). Sem checagem de admin
// porque é disparada por mutations já autorizadas. Falhas são silenciadas para
// não bloquear o cascade se o objeto não existir mais.
export const internalDeleteObject = internalAction({
  args: { key: v.string() },
  handler: async (_ctx, { key }) => {
    try {
      const env = getR2Env()
      const resp = await signedFetch({ env, method: 'DELETE', key })
      if (!resp.ok && resp.status !== 404) {
        console.warn(`R2 cascade delete falhou ${resp.status} para chave ${key.slice(0, 40)}...`)
      }
    } catch (err) {
      console.warn('R2 cascade delete erro:', err instanceof Error ? err.message : 'unknown')
    }
  },
})
