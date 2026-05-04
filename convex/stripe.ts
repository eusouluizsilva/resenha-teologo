import { v } from 'convex/values'
import { action, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'

declare const process: { env: Record<string, string | undefined> }

// Mapa interno → Stripe Price ID. IDs atuais são Live mode da conta US
// (acct_1SBFQxBSCnH7XGvJ). Para criar novos preços, atualizar aqui e arquivar
// o anterior no dashboard. Aluno Premium R$ 9,99/mes; Criador sem ads e Plano
// Igreja R$ 39,99/mes.
const PRICE_IDS: Record<string, string> = {
  aluno_premium: 'price_1TRb8kBSCnH7XGvJGLfnik32',
  criador_sem_ads: 'price_1TS6fSBSCnH7XGvJ2N5mVuMz',
  plano_igreja: 'price_1TS6fSBSCnH7XGvJhDFEJNoH',
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
    // Loga corpo bruto da Stripe pro server-side e propaga só o status pro
    // client. O corpo pode conter PII e mensagens internas que não devem
    // vazar pro frontend.
    console.error('[stripe] erro upstream', resp.status, text)
    throw new Error(`Stripe API erro ${resp.status}`)
  }
  return (await resp.json()) as T
}

// Recupera um recurso da Stripe via GET. Retorna null em 404, throw em outros
// erros. Usado pra checar se um customer ainda existe antes de reaproveitar.
async function stripeGet<T>(path: string): Promise<T | null> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error('STRIPE_SECRET_KEY não configurado no Convex')
  const resp = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secret}` },
  })
  if (resp.status === 404) return null
  if (!resp.ok) {
    const text = await resp.text()
    console.error('[stripe] erro upstream GET', resp.status, text)
    throw new Error(`Stripe API erro ${resp.status}`)
  }
  return (await resp.json()) as T
}

// Devolve um stripeCustomerId válido pra conta atual. Se o cache (subscriptions
// ou certificateOrders antigos) trouxer um ID que não existe mais nessa conta
// (ex: criado em test mode, hoje rodando em live), cria um customer fresh em
// vez de quebrar o checkout. Sem o cache, sempre cria um novo.
async function ensureStripeCustomer(
  identity: { email?: string | null; name?: string | null; subject: string },
  cachedCustomerId: string | undefined,
): Promise<string> {
  if (cachedCustomerId) {
    const existing = await stripeGet<{ id: string; deleted?: boolean }>(
      `/customers/${cachedCustomerId}`,
    )
    if (existing && !existing.deleted) return existing.id
    console.warn(
      '[stripe.ensureStripeCustomer] cached customer ausente em current mode, criando novo',
      cachedCustomerId,
    )
  }
  const created = await stripeRequest<{ id: string }>('/customers', {
    email: identity.email ?? undefined,
    name: identity.name ?? undefined,
    'metadata[clerkUserId]': identity.subject,
  })
  return created.id
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

    const customerId = await ensureStripeCustomer(identity, existing?.stripeCustomerId)

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

// Action: cria uma sessão do Customer Portal pro usuário gerenciar assinatura
// (cancelar, atualizar cartão, ver invoices). Reusa o stripeCustomerId já
// gravado em subscriptions. Sem subscription => 404 lógico.
type PortalResult = { url: string }

export const createPortalSession = action({
  args: { returnUrl: v.string() },
  handler: async (ctx, { returnUrl }): Promise<PortalResult> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado')

    const existing: StoredSubscription = await ctx.runQuery(internal.stripe.getSubscriptionByUser, {
      userId: identity.subject,
    })
    if (!existing?.stripeCustomerId) {
      throw new Error('Nenhuma assinatura encontrada')
    }

    // Se a conta migrou de modo (test→live), o customer cacheado pode não
    // existir mais; sem ele, o portal não tem o que abrir.
    const verified = await stripeGet<{ id: string; deleted?: boolean }>(
      `/customers/${existing.stripeCustomerId}`,
    )
    if (!verified || verified.deleted) {
      throw new Error('Cliente Stripe não encontrado, contate o suporte')
    }

    const session = await stripeRequest<{ id: string; url: string }>('/billing_portal/sessions', {
      customer: verified.id,
      return_url: returnUrl,
    })
    return { url: session.url }
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

    // Hardening anti-bypass: se a subscription já existe gravada com outro
    // userId, rejeita a mudança. Cenário: atacante tenta reaproveitar um
    // stripeSubscriptionId que já pertence a outro user, ou metadata.clerkUserId
    // foi adulterada em algum ponto. O userId só pode mudar via fluxo de
    // transferência (que não temos), nunca via webhook.
    if (existing && existing.userId !== args.clerkUserId) {
      console.error(
        '[stripe.upsertFromWebhook] tentativa de cross-user para subscription',
        args.stripeSubscriptionId,
        'gravada=', existing.userId,
        'recebida=', args.clerkUserId,
      )
      return
    }

    // Hardening: clerkUserId precisa corresponder a um users existente. Se
    // chegar um webhook com clerkUserId fantasma, ignora em vez de criar
    // subscription órfã ou ativar premium em registro inexistente.
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkUserId))
      .unique()
    if (!user) {
      console.error(
        '[stripe.upsertFromWebhook] clerkUserId desconhecido',
        args.clerkUserId,
        'subscription=', args.stripeSubscriptionId,
      )
      return
    }

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

    const isActive = args.status === 'active' || args.status === 'trialing'
    await ctx.db.patch(user._id, { isPremium: isActive })
  },
})

// Idempotência: tenta gravar o eventId. Retorna true se for novo (processar),
// false se já existia (ignorar). Stripe retransmite eventos em caso de timeout
// e a chave única no eventId garante que o efeito seja aplicado uma vez só.
export const recordStripeEvent = internalMutation({
  args: { eventId: v.string(), type: v.string() },
  handler: async (ctx, { eventId, type }) => {
    const existing = await ctx.db
      .query('stripeWebhookEvents')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique()
    if (existing) return { isNew: false }
    await ctx.db.insert('stripeWebhookEvents', {
      eventId,
      type,
      receivedAt: Date.now(),
    })
    return { isNew: true }
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

// === Certificado pago R$ 29,90 (one-time payment) =========================

type CertificateCheckoutResult = { sessionId: string; url: string }

// Action: cria Stripe Checkout Session one-time pra emissão de certificado.
// Pré-requisito: aluno concluiu o curso (enrollment.certificateIssued=true).
// Idempotência: se já existir order paid pra (userId, courseId), retorna erro
// pra forçar o frontend a baixar em vez de pagar de novo. Reaproveita
// stripeCustomerId quando o aluno já tem assinatura.
export const createCertificateCheckout = action({
  args: {
    courseId: v.id('courses'),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (
    ctx,
    { courseId, successUrl, cancelUrl },
  ): Promise<CertificateCheckoutResult> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Não autenticado')

    const priceId = process.env.STRIPE_CERTIFICATE_PRICE_ID
    if (!priceId) throw new Error('STRIPE_CERTIFICATE_PRICE_ID não configurado')

    const ctxData = await ctx.runQuery(internal.stripe.getCertificateCheckoutContext, {
      userId: identity.subject,
      courseId,
    })
    if (!ctxData) {
      throw new Error('Contexto do certificado indisponível')
    }
    if (!ctxData.eligible) {
      throw new Error('Conclua o curso com média mínima de 70% antes de emitir o certificado')
    }
    if (ctxData.alreadyPaid) {
      throw new Error('Você já adquiriu este certificado. Acesse a página de certificados para baixar.')
    }

    const customerId = await ensureStripeCustomer(identity, ctxData.stripeCustomerId)

    const session = await stripeRequest<{ id: string; url: string }>(
      '/checkout/sessions',
      {
        mode: 'payment',
        customer: customerId,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': 1,
        success_url: successUrl,
        cancel_url: cancelUrl,
        'metadata[kind]': 'certificate',
        'metadata[clerkUserId]': identity.subject,
        'metadata[courseId]': courseId,
        'metadata[enrollmentId]': ctxData.enrollmentId,
        'payment_intent_data[metadata][kind]': 'certificate',
        'payment_intent_data[metadata][clerkUserId]': identity.subject,
        'payment_intent_data[metadata][courseId]': courseId,
        'payment_intent_data[metadata][enrollmentId]': ctxData.enrollmentId,
        'payment_intent_data[statement_descriptor_suffix]': 'CERT',
        allow_promotion_codes: true,
      },
    )

    await ctx.runMutation(internal.stripe.recordCertificateOrderPending, {
      userId: identity.subject,
      courseId,
      enrollmentId: ctxData.enrollmentId,
      stripeSessionId: session.id,
      stripeCustomerId: customerId,
      amount: 2990,
      currency: 'brl',
    })

    return { sessionId: session.id, url: session.url }
  },
})

// Helper interno: traz o que a action precisa pra montar o checkout sem fazer
// múltiplos round-trips. Não expõe PII além do que a própria sessão já tem.
export const getCertificateCheckoutContext = internalQuery({
  args: { userId: v.string(), courseId: v.id('courses') },
  handler: async (ctx, { userId, courseId }) => {
    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_student_course', (q) =>
        q.eq('studentId', userId).eq('courseId', courseId),
      )
      .unique()
    if (!enrollment) return null

    const eligible = enrollment.certificateIssued === true

    const existingPaid = await ctx.db
      .query('certificateOrders')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', userId).eq('courseId', courseId),
      )
      .filter((q) => q.eq(q.field('status'), 'paid'))
      .first()

    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()

    return {
      enrollmentId: enrollment._id,
      eligible,
      alreadyPaid: !!existingPaid,
      stripeCustomerId: sub?.stripeCustomerId,
    }
  },
})

// Mutation interna: cria a linha pending. Idempotente por stripeSessionId.
export const recordCertificateOrderPending = internalMutation({
  args: {
    userId: v.string(),
    courseId: v.id('courses'),
    enrollmentId: v.id('enrollments'),
    stripeSessionId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('certificateOrders')
      .withIndex('by_session_id', (q) => q.eq('stripeSessionId', args.stripeSessionId))
      .unique()
    if (existing) return existing._id

    const now = Date.now()
    return await ctx.db.insert('certificateOrders', {
      userId: args.userId,
      courseId: args.courseId,
      enrollmentId: args.enrollmentId,
      status: 'pending',
      stripeSessionId: args.stripeSessionId,
      stripeCustomerId: args.stripeCustomerId,
      amount: args.amount,
      currency: args.currency,
      createdAt: now,
      updatedAt: now,
    })
  },
})
