import { DashboardPageShell } from '@/components/dashboard/PageShell'
import { useCurrentAppUser } from '@/lib/currentUser'
import { cn } from '@/lib/brand'

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
    badge: 'Em breve',
    highlight: true,
    ctaLabel: 'Assinar Premium',
    available: false,
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
    price: 'R$ 99,90',
    period: '/mês',
    description: 'Seu espaço sem anúncios. Experiência limpa para os seus alunos.',
    features: [
      { label: 'Tudo do plano Professor', included: true },
      { label: 'Sem anúncios no seu espaço', included: true },
      { label: 'Marca pessoal mais forte', included: true },
      { label: 'Suporte prioritário', included: true },
    ],
    badge: 'Em breve',
    highlight: true,
    ctaLabel: 'Assinar',
    available: false,
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
    price: 'R$ 99,90',
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
    badge: 'Em breve',
    highlight: true,
    ctaLabel: 'Entrar em contato',
    available: false,
  },
]

function PlanCard({ plan, current }: { plan: Plan; current: boolean }) {
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
        disabled={current || !plan.available}
        className={cn(
          'mt-8 w-full rounded-[1.1rem] border px-5 py-3 text-sm font-semibold transition-all duration-200',
          current
            ? 'cursor-default border-white/8 bg-white/[0.03] text-white/30'
            : plan.available
              ? 'border-[#F37E20]/24 bg-[#F37E20]/10 text-[#F2BD8A] hover:bg-[#F37E20]/20'
              : 'cursor-not-allowed border-white/8 bg-white/[0.03] text-white/28',
        )}
      >
        {current ? 'Plano atual' : plan.ctaLabel}
      </button>
    </div>
  )
}

export function PlanosPage() {
  const { hasFunction } = useCurrentAppUser()

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

  const currentPlanId =
    primary === 'criador'
      ? 'criador-free'
      : primary === 'instituicao'
        ? 'instituicao-free'
        : 'gratuito'

  return (
    <DashboardPageShell
      eyebrow="Assinatura"
      title="Planos disponíveis"
      description="Seu plano atual e as opções de upgrade. O pagamento online estará disponível em breve."
      maxWidthClass="max-w-4xl"
    >
      <div className="mb-6 rounded-2xl border border-[#F37E20]/24 bg-[#F37E20]/8 p-4 text-sm leading-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
          Em breve
        </p>
        <p className="mt-1 text-white/72">
          A plataforma é gratuita por enquanto. O fluxo de assinatura paga (Stripe) será liberado nas próximas fases. Use o email abaixo se quiser garantir acesso antecipado.
        </p>
      </div>

      <div className="mt-2 grid gap-5 sm:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} current={plan.id === currentPlanId} />
        ))}
      </div>

      <div className="mt-8 rounded-[1.4rem] border border-white/6 bg-white/[0.02] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/28">Duvidas ou upgrade antecipado</p>
        <p className="mt-2 text-sm leading-6 text-white/48">
          Entre em contato pelo email{' '}
          <a href="mailto:hello@resenhadoteologo.com" className="text-[#F2BD8A] hover:underline">
            hello@resenhadoteologo.com
          </a>{' '}
          para conversarmos sobre planos institucionais ou acesso antecipado ao Premium.
        </p>
      </div>
    </DashboardPageShell>
  )
}
