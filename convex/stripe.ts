import { v } from 'convex/values'
import { action, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'

declare const process: { env: Record<string, string | undefined> }

// Mapa interno → Stripe Price ID. Atualizar aqui quando criar novos produtos
// no Stripe (test ou live mode). IDs atuais são test mode (acct_1SBFR3BZ3mrrG6uS).
// Quando virar live: trocar por price_live_... e setar STRIPE_SECRET_KEY com sk_live_.
const PRICE_IDS: Record<string, string> = {
  aluno_premium: 'price_1TQyTyBZ3mrrG6uSW8WhyEH9',
  criador_sem_ads: 'price_1TQyU2BZ3mrrG6uS0W7guQzZ',
  plano_igreja: 'price_1TQyU6BZ3mrrG6uSlv1ca0yS',
}

const PLAN_KIND = v.union(
  v.literal('aluno_premium'),
  v.literal('criador_sem_ads'),
  v.literal('plano_igreja'),
)

type PlanKind = 'aluno_premium' | 'criador_sem_ads' | 'plano_igreja'

// Helper: form-encode um objeto plano para a Stripe REST API. A API só aceita
// application/x-www-form-urlencoded; objetos com chaves aninhadas viram
// "metadata[plan]=..." etc.
function formEncode(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, val] of Object.entries(params)) {
    if (val === undefined) continue
    sp.append(k, String(val))
  }
  return sp.toString()
}

async function stripeRequest<T>(
  path: string,
  body: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error('STRIPE_SECRET_KEY não configurado no Convex')
  const resp = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formEncode(body),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Stripe API ${resp.status}: ${text}`)
  }
  return (await resp.json()) as T
}

// Action: cria uma sessão de Stripe Checkout pro usuário atual e retorna a
// URL pra redirecionar. Reaproveita stripeCustomerId quando já existe linha
// em subscriptions (evita duplicar Customer no Stripe).
//
// Anotação de tipo explícita no handler porque a função usa internal.stripe.*
// (recursão), o que faz o TS perder a inferência se deixarmos implícito.
type CheckoutResult = { sessionId: string; url: string }
type StoredSubscription = {
  stripeCustomerId: string
} | null

export const createCheckoutSession = action({
  args: {
    plan: PLAN_KIND,
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, { plan, successUrl, cancelUrl }): Promise<CheckoutResult> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado')

    const priceId = PRICE_IDS[plan]
    if (!priceId) throw new Error(`Plano desconhecido: ${plan}`)

    const existing: StoredSubscription = await ctx.runQuery(internal.stripe.getSubscriptionByUser, {
      userId: identity.subject,
    })

    let customerId: string | undefined = existing?.stripeCustomerId
    if (!customerId) {
      const customer = await stripeRequest<{ id: string }>('/customers', {
        email: identity.email ?? undefined,
        name: identity.name ?? undefined,
        'metadata[clerkUserId]': identity.subject,
      })
      customerId = customer.id
    }

    const session = await stripeRequest<{ id: string; url: string }>('/checkout/sessions', {
      mode: 'subscription',
      customer: customerId,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': 1,
      success_url: successUrl,
      cancel_url: cancelUrl,
      'metadata[clerkUserId]': identity.subject,
      'metadata[plan]': plan,
      'subscription_data[metadata][clerkUserId]': identity.subject,
      'subscription_data[metadata][plan]': plan,
      allow_promotion_codes: true,
    })

    return { sessionId: session.id, url: session.url }
  },
})

// Query interna usada pela action acima pra buscar a subscription do usuário
// sem expor PII. Retorna apenas os campos necessários.
export const getSubscriptionByUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()
  },
})

// Chamado pelo webhook (/stripe em http.ts) quando customer.subscription.*
// dispara. Faz upsert na tabela subscriptions e patcheia users.isPremium
// conforme o status. Nunca confiar no campo do payload sem cross-check
// (no futuro, refazer fetch /subscriptions/:id antes de gravar para evitar replay).
export const upsertFromWebhook = internalMutation({
  args: {
    clerkUserId: v.string(),
    plan: PLAN_KIND,
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeSubscriptionId', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId),
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        stripeCustomerId: args.stripeCustomerId,
        stripePriceId: args.stripePriceId,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('subscriptions', {
        userId: args.clerkUserId,
        plan: args.plan,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Sincroniza users.isPremium com base no status. 'active' e 'trialing' contam
    // como premium; qualquer outro status (canceled, past_due, unpaid) desliga.
    const isActive = args.status === 'active' || args.status === 'trialing'
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkUserId))
      .unique()
    if (user) {
      await ctx.db.patch(user._id, { isPremium: isActive })
    }
  },
})

// Lookup reverso: dado um stripeSubscriptionId, retorna o clerkUserId. Usado
// pelo webhook quando o evento é customer.subscription.deleted e o payload não
// traz metadata.clerkUserId (alguns eventos são truncados).
export const getUserIdBySubscriptionId = internalQuery({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, { stripeSubscriptionId }) => {
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeSubscriptionId', (q) =>
        q.eq('stripeSubscriptionId', stripeSubscriptionId),
      )
      .unique()
    return sub?.userId ?? null
  },
})

// Plano associado a um price_id. Útil para webhooks que só trazem priceId.
export function planFromPriceId(priceId: string): PlanKind | null {
  for (const [plan, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return plan as PlanKind
  }
  return null
}
