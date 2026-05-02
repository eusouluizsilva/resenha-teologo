import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { planFromPriceId } from './stripe'

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

// Webhook do Stripe: processa eventos de subscription pra manter
// users.isPremium e a tabela subscriptions sincronizados.
//
// Configuração:
// 1. Stripe Dashboard → Webhooks → Add endpoint
//    URL: https://<convex-deployment>.convex.site/stripe
// 2. Eventos: checkout.session.completed, customer.subscription.created,
//    customer.subscription.updated, customer.subscription.deleted,
//    invoice.payment_failed
// 3. Copiar Signing Secret (whsec_...) para STRIPE_WEBHOOK_SECRET no Convex.
http.route({
  path: '/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET não configurado')
      return new Response('Webhook não configurado', { status: 500 })
    }

    const sigHeader = request.headers.get('stripe-signature')
    if (!sigHeader) return new Response('Stripe-Signature ausente', { status: 400 })

    const body = await request.text()

    const ok = await verifyStripeSignature(secret, sigHeader, body)
    if (!ok) return new Response('Assinatura inválida', { status: 401 })

    let event: { id: string; type: string; data: { object: Record<string, unknown> } }
    try {
      event = JSON.parse(body)
    } catch {
      return new Response('JSON inválido', { status: 400 })
    }

    if (!event.id) return new Response('event.id ausente', { status: 400 })

    // Dedup por event.id. Retries do Stripe não duplicam efeito.
    const dedup = await ctx.runMutation(internal.stripe.recordStripeEvent, {
      eventId: event.id,
      type: event.type,
    })
    if (!dedup.isNew) return new Response(null, { status: 204 })

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as {
            id: string
            mode?: string
            payment_status?: string
            payment_intent?: string | null
            metadata?: Record<string, string | undefined>
          }
          // Para subscription, o update real acontece nos customer.subscription.*.
          // Para certificate (one-time payment), processamos aqui: marca order
          // paid e dispara generatePaidPdf.
          if (session.metadata?.kind === 'certificate' && session.payment_status === 'paid') {
            const orderId = await ctx.runMutation(internal.certificates.markOrderPaidByWebhook, {
              stripeSessionId: session.id,
              stripePaymentIntentId:
                typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
              paidAt: Date.now(),
            })
            if (orderId) {
              await ctx.scheduler.runAfter(
                0,
                internal.certificatesPdf.generatePaidPdf,
                { orderId },
              )
            }
          }
          break
        }

        case 'checkout.session.expired': {
          const session = event.data.object as {
            id: string
            metadata?: Record<string, string | undefined>
          }
          if (session.metadata?.kind === 'certificate') {
            await ctx.runMutation(internal.certificates.markOrderExpiredByWebhook, {
              stripeSessionId: session.id,
              expiredAt: Date.now(),
            })
          }
          break
        }

        case 'charge.refunded': {
          const charge = event.data.object as {
            id: string
            payment_intent?: string | null
            metadata?: Record<string, string | undefined>
          }
          // Refund pode chegar tanto pra subscription quanto pra one-time.
          // O metadata.kind é setado pelo payment_intent_data.metadata na criação.
          if (charge.metadata?.kind === 'certificate' && typeof charge.payment_intent === 'string') {
            const n = await ctx.runMutation(internal.certificates.markOrderRefundedByWebhook, {
              stripePaymentIntentId: charge.payment_intent,
              refundedAt: Date.now(),
            })
            console.warn('[stripe-webhook] charge.refunded certificate', charge.payment_intent, 'orders=', n)
          }
          break
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const sub = event.data.object as {
            id: string
            customer: string
            status: string
            current_period_end?: number
            cancel_at_period_end?: boolean
            items: {
              data: Array<{
                price: { id: string }
                current_period_end?: number
              }>
            }
            metadata?: { clerkUserId?: string; plan?: string }
          }
          // Sanity-check rápido no payload pra evitar refetch caro em eventos
          // claramente inválidos. plan/periodEnd serão re-derivados do GET abaixo.
          const item = sub.items?.data?.[0]
          if (!item?.price?.id) {
            console.warn('[stripe-webhook] subscription sem priceId', sub.id)
            break
          }
          let clerkUserId = sub.metadata?.clerkUserId
          if (!clerkUserId) {
            // Fallback: olha a subscription já gravada pra recuperar o userId.
            clerkUserId = (await ctx.runQuery(internal.stripe.getUserIdBySubscriptionId, {
              stripeSubscriptionId: sub.id,
            })) ?? undefined
          }
          if (!clerkUserId) {
            console.warn('[stripe-webhook] subscription sem clerkUserId', sub.id)
            break
          }
          // Defense in depth: refetch a subscription direto da Stripe API antes
          // de gravar. Mesmo com signature válida, refazemos o GET pra eliminar
          // qualquer cenário de payload manipulado/replay (status/customer/price
          // batem com a verdade na Stripe). Em caso de falha do GET, ignora o
          // evento; o próximo retry da Stripe (até 3 dias) tenta de novo.
          const stripeSecret = process.env.STRIPE_SECRET_KEY
          if (!stripeSecret) {
            console.error('[stripe-webhook] STRIPE_SECRET_KEY ausente, abortando refetch')
            break
          }
          const refetch = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.id}`, {
            headers: { Authorization: `Bearer ${stripeSecret}` },
          })
          if (!refetch.ok) {
            // dedup já gravou o eventId, então retry não vai cair aqui.
            // Aceitamos: subscription evento subsequente vai re-sincronizar.
            console.error('[stripe-webhook] refetch falhou', refetch.status, sub.id)
            break
          }
          const verified = (await refetch.json()) as {
            id: string
            customer: string
            status: string
            current_period_end?: number
            cancel_at_period_end?: boolean
            items: { data: Array<{ price: { id: string }; current_period_end?: number }> }
          }
          const verifiedItem = verified.items?.data?.[0]
          const verifiedPriceId = verifiedItem?.price?.id
          const verifiedPeriodEnd = verifiedItem?.current_period_end ?? verified.current_period_end ?? 0
          if (!verifiedPriceId) {
            console.warn('[stripe-webhook] subscription verificada sem priceId', sub.id)
            break
          }
          const verifiedPlan = planFromPriceId(verifiedPriceId)
          if (!verifiedPlan) {
            console.warn('[stripe-webhook] price verificado desconhecido', verifiedPriceId)
            break
          }

          // Para deleted: marca o status como 'canceled' pra desligar isPremium.
          // Stripe pode retornar 'canceled' já no GET, mas garantimos via type.
          const finalStatus = event.type === 'customer.subscription.deleted' ? 'canceled' : verified.status
          await ctx.runMutation(internal.stripe.upsertFromWebhook, {
            clerkUserId,
            plan: verifiedPlan,
            stripeCustomerId: verified.customer,
            stripeSubscriptionId: verified.id,
            stripePriceId: verifiedPriceId,
            status: finalStatus,
            currentPeriodEnd: verifiedPeriodEnd * 1000,
            cancelAtPeriodEnd: verified.cancel_at_period_end,
          })
          break
        }

        case 'invoice.payment_failed': {
          // Apenas log; o evento customer.subscription.updated subsequente
          // refletirá o status 'past_due' e desligará isPremium quando for o caso.
          const inv = event.data.object as { subscription?: string; customer?: string }
          console.warn('[stripe-webhook] payment_failed', inv.subscription, inv.customer)
          break
        }

        default:
          break
      }
    } catch (err) {
      console.error('[stripe-webhook] erro processando evento', event.type, err)
      return new Response('Erro interno', { status: 500 })
    }

    return new Response(null, { status: 204 })
  }),
})

async function verifyStripeSignature(
  secret: string,
  sigHeader: string,
  body: string,
): Promise<boolean> {
  // Header format: "t=<unix_ts>,v1=<hex_sig>[,v1=<hex_sig>...]"
  const parts = sigHeader.split(',').map((p) => p.split('='))
  const ts = parts.find(([k]) => k === 't')?.[1]
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!ts || sigs.length === 0) return false

  // Replay guard: 5 min.
  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const payload = encoder.encode(`${ts}.${body}`)
  const signed = await crypto.subtle.sign('HMAC', key, payload)
  const expected = bytesToHex(new Uint8Array(signed))

  for (const sig of sigs) {
    if (timingSafeEqual(sig, expected)) return true
  }
  return false
}

function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0')
  }
  return out
}

export default http
