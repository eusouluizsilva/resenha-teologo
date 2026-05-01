import { useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import { useCurrentAppUser } from '@/lib/currentUser'
import { cn } from '@/lib/brand'

type StripePlanKey = 'aluno_premium' | 'criador_sem_ads' | 'plano_igreja'

// Mapeamento dos planos da UI → planos no Stripe (definidos em convex/stripe.ts).
// Plano free tem null porque não passa por checkout.
const STRIPE_PLAN_BY_ID: Record<string, StripePlanKey | null> = {
  gratuito: null,
  premium: 'aluno_premium',
  'criador-free': null,
  'criador-sem-ads': 'criador_sem_ads',
  'igreja-sem-ads': 'plano_igreja',
  'instituicao-free': null,
  'plano-igreja': 'plano_igreja',
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-white/24" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

type PlanFeature = { label: string; included: boolean }

type Plan = {
  id: string
  name: string
  price: string
  period?: string
  description: string
  features: PlanFeature[]
  badge?: string
  highlight?: boolean
  ctaLabel: string
  available: boolean
}

const alunoPlans: Plan[] = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    price: 'R$ 0',
    description: 'Acesso completo a todos os cursos, com anúncios.',
    features: [
      { label: 'Todos os cursos disponíveis', included: true },
      { label: 'Certificados de conclusão', included: true },
      { label: 'Quizzes e avaliações', included: true },
      { label: 'Caderno digital', included: true },
      { label: 'Bíblia integrada (em breve)', included: true },
      { label: 'Exibição de anúncios', included: false },
    ],
    ctaLabel: 'Plano atual',
    available: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 9,99',
    period: '/mês',
    description: 'Experiência de estudo sem interrupções, sem nenhum anúncio.',
    features: [
      { label: 'Tudo do plano Gratuito', included: true },
      { label: 'Sem anúncios em toda a plataforma', included: true },
      { label: 'Acesso prioritário a novidades', included: true },
      { label: 'Suporte por email', included: true },
    ],
    highlight: true,
    ctaLabel: 'Assinar Premium',
    available: true,
  },
]

const criadorPlans: Plan[] = [
  {
    id: 'criador-free',
    name: 'Professor',
    price: 'R$ 0',
    description: 'Publique cursos gratuitamente. A plataforma exibe anúncios no seu espaço.',
    features: [
      { label: 'Cursos, módulos e aulas ilimitados', included: true },
      { label: 'Dashboard financeiro', included: true },
      { label: 'Relatório de alunos matriculados', included: true },
      { label: 'Certificados automáticos para alunos', included: true },
      { label: 'Repasse proporcional do AdSense', included: true },
      { label: 'Anúncios exibidos no seu espaço', included: false },
    ],
    ctaLabel: 'Plano atual',
    available: true,
  },
  {
    id: 'criador-sem-ads',
    name: 'Professor sem anúncios',
    price: 'R$ 39,99',
    period: '/mês',
    description: 'Seu espaço sem anúncios. Experiência limpa para os seus alunos.',
    features: [
      { label: 'Tudo do plano Professor', included: true },
      { label: 'Sem anúncios no seu espaço', included: true },
      { label: 'Marca pessoal mais forte', included: true },
      { label: 'Suporte prioritário', included: true },
    ],
    highlight: true,
    ctaLabel: 'Assinar',
    available: true,
  },
  {
    id: 'igreja-sem-ads',
    name: 'Igreja ou instituição',
    price: 'R$ 39,99',
    period: '/mês',
    description: 'Plano dedicado para igrejas e instituições. Espaço sem anúncios para todos os membros.',
    features: [
      { label: 'Tudo do plano Professor', included: true },
      { label: 'Sem anúncios para todos os membros', included: true },
      { label: 'Membros ilimitados', included: true },
      { label: 'Matrícula em lote', included: true },
      { label: 'Painel de progresso coletivo', included: true },
      { label: 'Suporte dedicado', included: true },
    ],
    highlight: true,
    ctaLabel: 'Assinar Plano Igreja',
    available: true,
  },
]

const instituicaoPlans: Plan[] = [
  {
    id: 'instituicao-free',
    name: 'Instituição',
    price: 'R$ 0',
    description: 'Publique cursos institucionais para membros e comunidade.',
    features: [
      { label: 'Cursos e aulas ilimitados', included: true },
      { label: 'Membros vinculados à instituição', included: true },
      { label: 'Relatórios de progresso', included: true },
      { label: 'Certificados automáticos', included: true },
      { label: 'Anúncios exibidos no espaço', included: false },
    ],
    ctaLabel: 'Plano atual',
    available: true,
  },
  {
    id: 'plano-igreja',
    name: 'Plano Igreja',
    price: 'R$ 39,99',
    period: '/mês',
    description: 'Membros ilimitados, matrícula em lote e painel pastoral de acompanhamento.',
    features: [
      { label: 'Tudo do plano Instituição', included: true },
      { label: 'Membros ilimitados', included: true },
      { label: 'Matricular membros em lote', included: true },
      { label: 'Painel de progresso coletivo', included: true },
      { label: 'Ferramentas de gestão pastoral', included: true },
      { label: 'Sem anúncios para membros', included: true },
      { label: 'Suporte dedicado', included: true },
    ],
    highlight: true,
    ctaLabel: 'Assinar Plano Igreja',
    available: true,
  },
]

function PlanCard({
  plan,
  current,
  onCheckout,
  loading,
}: {
  plan: Plan
  current: boolean
  onCheckout: (plan: Plan) => void
  loading: boolean
}) {
  const stripeKey = STRIPE_PLAN_BY_ID[plan.id]
  const canCheckout = !current && plan.available && !!stripeKey
  return (
    <div
      className={cn(
        'flex flex-col rounded-[1.6rem] border p-6 transition-all duration-200',
        plan.highlight
          ? 'border-[#F37E20]/20 bg-[#F37E20]/[0.04]'
          : 'border-white/8 bg-white/[0.02]',
        current && 'ring-1 ring-[#F37E20]/30',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">{plan.name}</p>
          <div className="mt-2 flex items-end gap-1">
            <span className="font-display text-3xl font-bold text-white">{plan.price}</span>
            {plan.period && <span className="mb-1 text-sm text-white/40">{plan.period}</span>}
          </div>
        </div>
        {plan.badge && (
          <span className="shrink-0 rounded-full border border-[#F37E20]/24 bg-[#F37E20]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F2BD8A]">
            {plan.badge}
          </span>
        )}
        {current && !plan.badge && (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Ativo
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-white/48">{plan.description}</p>

      <ul className="mt-6 space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-center gap-3">
            {f.included ? <CheckIcon /> : <LockIcon />}
            <span className={cn('text-sm', f.included ? 'text-white/72' : 'text-white/28 line-through')}>{f.label}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => canCheckout && onCheckout(plan)}
        disabled={!canCheckout || loading}
        className={cn(
          'mt-8 w-full rounded-[1.1rem] border px-5 py-3 text-sm font-semibold transition-all duration-200',
          current
            ? 'cursor-default border-white/8 bg-white/[0.03] text-white/30'
            : canCheckout
              ? 'border-[#F37E20]/24 bg-[#F37E20]/10 text-[#F2BD8A] hover:bg-[#F37E20]/20 disabled:opacity-50'
              : 'cursor-not-allowed border-white/8 bg-white/[0.03] text-white/28',
        )}
      >
        {current ? 'Plano atual' : loading ? 'Abrindo checkout...' : plan.ctaLabel}
      </button>
    </div>
  )
}

export function PlanosPage() {
  const { hasFunction } = useCurrentAppUser()
  const subscription = useQuery(api.subscriptions.mine, {})
  const createCheckout = useAction(api.stripe.createCheckoutSession)
  const createPortal = useAction(api.stripe.createPortalSession)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prioriza criador sobre instituição sobre aluno quando o usuário tem
  // múltiplas funções ativas (planos do criador são os mais completos).
  const primary: 'criador' | 'instituicao' | 'aluno' = hasFunction('criador')
    ? 'criador'
    : hasFunction('instituicao')
      ? 'instituicao'
      : 'aluno'

  const plans =
    primary === 'criador'
      ? criadorPlans
      : primary === 'instituicao'
        ? instituicaoPlans
        : alunoPlans

  // Determina o plano atual com prioridade pra subscription ativa do Stripe.
  // Quando subscription.status='active'/'trialing', o usuário está num plano pago.
  const isActive =
    subscription && (subscription.status === 'active' || subscription.status === 'trialing')

  const currentPlanId = (() => {
    if (isActive && subscription) {
      if (subscription.plan === 'aluno_premium') return 'premium'
      if (subscription.plan === 'criador_sem_ads') return 'criador-sem-ads'
      if (subscription.plan === 'plano_igreja') {
        return primary === 'criador' ? 'igreja-sem-ads' : 'plano-igreja'
      }
    }
    return primary === 'criador'
      ? 'criador-free'
      : primary === 'instituicao'
        ? 'instituicao-free'
        : 'gratuito'
  })()

  async function handleCheckout(plan: Plan) {
    const stripePlan = STRIPE_PLAN_BY_ID[plan.id]
    if (!stripePlan) return
    setError(null)
    setLoadingPlan(plan.id)
    try {
      const origin = window.location.origin
      const result = await createCheckout({
        plan: stripePlan,
        successUrl: `${origin}/dashboard/planos?status=success`,
        cancelUrl: `${origin}/dashboard/planos?status=canceled`,
      })
      if (result?.url) {
        window.location.href = result.url
      } else {
        throw new Error('Stripe não retornou URL de checkout')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao iniciar checkout'
      setError(msg)
      setLoadingPlan(null)
    }
  }

  async function handlePortal() {
    setError(null)
    setLoadingPortal(true)
    try {
      const result = await createPortal({
        returnUrl: `${window.location.origin}/dashboard/planos`,
      })
      if (result?.url) {
        window.location.href = result.url
      } else {
        throw new Error('Stripe não retornou URL do portal')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao abrir portal'
      setError(msg)
      setLoadingPortal(false)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Assinatura"
      title="Planos disponíveis"
      description="Seu plano atual e as opções de upgrade. Pagamento processado pelo Stripe."
      maxWidthClass="max-w-6xl"
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
          {error}
        </div>
      )}

      {isActive && subscription && (
        <div className="mb-6 rounded-2xl border border-[#F37E20]/24 bg-[#F37E20]/8 p-4 text-sm leading-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
                Assinatura ativa
              </p>
              <p className="mt-1 text-white/72">
                Próxima cobrança em{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}.
                {subscription.cancelAtPeriodEnd ? ' Cancelamento agendado para o fim do período.' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePortal}
              disabled={loadingPortal}
              className="shrink-0 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/72 transition-colors hover:border-white/24 hover:bg-white/[0.08] disabled:opacity-50"
            >
              {loadingPortal ? 'Abrindo...' : 'Gerenciar assinatura'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-2 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={plan.id === currentPlanId}
            onCheckout={handleCheckout}
            loading={loadingPlan === plan.id}
          />
        ))}
      </div>

      <div className="mt-8 rounded-[1.4rem] border border-white/6 bg-white/[0.02] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/28">Duvidas ou plano sob medida</p>
        <p className="mt-2 text-sm leading-6 text-white/48">
          Entre em contato pelo email{' '}
          <a href="mailto:hello@resenhadoteologo.com" className="text-[#F2BD8A] hover:underline">
            hello@resenhadoteologo.com
          </a>{' '}
          para conversarmos sobre planos institucionais customizados.
        </p>
      </div>
    </DashboardPageShell>
  )
}
