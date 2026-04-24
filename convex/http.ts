import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'

// Convex runtime expõe `process.env` mas o tsconfig de functions às vezes
// não carrega `@types/node`. Declaração local mínima resolve sem afetar build.
declare const process: { env: Record<string, string | undefined> }

const http = httpRouter()

// Webhook do Clerk: processa user.updated e user.deleted para manter o banco
// Convex em sincronia quando mudanças ocorrem fora do fluxo de sync do frontend.
//
// Configuração necessária no dashboard do Clerk:
// 1. Webhooks → Add Endpoint → URL: https://<seu-deployment>.convex.site/clerk
// 2. Eventos: user.updated, user.deleted
// 3. Copiar o Signing Secret (whsec_...) para a env var CLERK_WEBHOOK_SECRET
//    no Convex dashboard (Settings → Environment Variables)
http.route({
  path: '/clerk',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) {
      console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET não configurado')
      return new Response('Webhook não configurado', { status: 500 })
    }

    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Headers svix ausentes', { status: 400 })
    }

    const body = await request.text()

    // Verificação de assinatura svix: HMAC-SHA256 sobre `id.timestamp.body`,
    // comparado ao header svix-signature (formato "v1,<base64>,v1,<base64>...").
    const ok = await verifySvixSignature(secret, svixId, svixTimestamp, body, svixSignature)
    if (!ok) {
      return new Response('Assinatura inválida', { status: 401 })
    }

    // Proteção contra replay: timestamp não pode ter mais de 5 minutos.
    const ts = Number(svixTimestamp)
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      return new Response('Timestamp fora da janela', { status: 400 })
    }

    let event: { type: string; data: Record<string, unknown> }
    try {
      event = JSON.parse(body)
    } catch {
      return new Response('JSON inválido', { status: 400 })
    }

    try {
      switch (event.type) {
        case 'user.updated': {
          const data = event.data as {
            id: string
            first_name?: string | null
            last_name?: string | null
            email_addresses?: Array<{ email_address: string; id: string }>
            primary_email_address_id?: string | null
            image_url?: string | null
          }
          const primary = data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
          const email = primary?.email_address ?? data.email_addresses?.[0]?.email_address ?? ''
          const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
          await ctx.runMutation(internal.users.syncFromWebhook, {
            clerkId: data.id,
            name: fullName || email || 'Usuário',
            email,
            avatarUrl: data.image_url ?? undefined,
          })
          break
        }

        case 'user.deleted': {
          const data = event.data as { id: string; deleted?: boolean }
          if (data.deleted && data.id) {
            await ctx.runMutation(internal.users.deleteFromWebhook, { clerkId: data.id })
          }
          break
        }

        default:
          // Ignorado de forma silenciosa para não quebrar replay de outros eventos.
          break
      }
    } catch (err) {
      console.error('[clerk-webhook] erro processando evento', event.type, err)
      return new Response('Erro interno', { status: 500 })
    }

    return new Response(null, { status: 204 })
  }),
})

async function verifySvixSignature(
  secret: string,
  id: string,
  timestamp: string,
  body: string,
  signatureHeader: string
): Promise<boolean> {
  // svix secret format: "whsec_<base64>". Remove o prefixo.
  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret

  // Base64 → bytes (ArrayBuffer "limpo" para evitar incompatibilidade de tipos)
  const keyBytes = base64ToBuffer(rawSecret)
  if (!keyBytes) return false

  const encoder = new TextEncoder()
  const payloadBytes = encoder.encode(`${id}.${timestamp}.${body}`)
  const payloadBuf = toArrayBuffer(payloadBytes)

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuf = await crypto.subtle.sign('HMAC', key, payloadBuf)
  const expected = bytesToBase64(new Uint8Array(signatureBuf))

  // svix-signature pode vir com várias versões separadas por espaço:
  // "v1,<base64> v1,<base64>". Validamos se alguma bate.
  const parts = signatureHeader.split(' ')
  for (const part of parts) {
    const [version, sig] = part.split(',')
    if (version === 'v1' && timingSafeEqual(sig, expected)) {
      return true
    }
  }
  return false
}

function base64ToBuffer(b64: string): ArrayBuffer | null {
  try {
    const bin = atob(b64)
    const buf = new ArrayBuffer(bin.length)
    const view = new Uint8Array(buf)
    for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
    return buf
  } catch {
    return null
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buf).set(bytes)
  return buf
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

export default http
