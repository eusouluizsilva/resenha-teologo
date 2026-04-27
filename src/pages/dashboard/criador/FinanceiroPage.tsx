import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandPanelClass, brandPanelSoftClass, cn } from '@/lib/brand'
import {
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardPageShell,
  DashboardSectionLabel,
} from '@/components/dashboard/PageShell'

type Tab = 'adsense' | 'doacoes'

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('p-5', brandPanelSoftClass)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
        <div className="text-sm leading-7 text-white/56">{children}</div>
      </div>
    </div>
  )
}

export function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>('adsense')

  const totalGeral = 'R$ 0,00'
  const totalMes = 'R$ 0,00'

  return (
    <DashboardPageShell
      eyebrow="Receita e repasses"
      title="Financeiro"
      description="Uma leitura financeira mais sóbria e institucional, com menos repetição visual e mais hierarquia entre resumo, origem da receita e explicação do modelo."
      maxWidthClass="max-w-5xl"
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-[#F37E20]/24 bg-[#F37E20]/8 p-4 text-sm leading-6 text-[#F2BD8A]"
        >
          <p className="font-semibold uppercase tracking-[0.18em] text-[10px] text-[#F37E20]">
            Pré-visualização
          </p>
          <p className="mt-1 text-white/72">
            O painel financeiro ainda está em construção. Os números abaixo são exemplos para ilustrar a estrutura. Repasse de AdSense, doações e relatórios reais entram nas próximas fases.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            {
              label: 'Total acumulado',
              value: totalGeral,
              sub: 'AdSense + doações',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: 'Este mês',
              value: totalMes,
              sub: 'abril 2026',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              ),
            },
            {
              label: 'Repasse AdSense',
              value: 'R$ 0,00',
              sub: 'proporcional às views',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              ),
            },
            {
              label: 'Doações recebidas',
              value: 'R$ 0,00',
              sub: '0 transações',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              ),
            },
          ].map((item, index) => (
            <DashboardMetricCard key={item.label} icon={item.icon} label={item.label} value={item.value} sub={item.sub} accent={index === 0} />
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className={cn('p-2', brandPanelClass)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              { key: 'adsense', label: 'Repasse AdSense' },
              { key: 'doacoes', label: 'Doações voluntárias' },
            ] as { key: Tab; label: string }[]).map((item) => {
              const active = tab === item.key

              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    'rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition-all duration-200',
                    active
                      ? 'bg-[#F37E20] text-white shadow-[0_16px_30px_rgba(243,126,32,0.18)]'
                      : 'text-white/52 hover:bg-white/[0.04] hover:text-white',
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {tab === 'adsense' && (
          <motion.div variants={fadeUp} className="space-y-4">
            <div className={cn('p-6', brandPanelClass)}>
              <DashboardSectionLabel>Métricas do AdSense</DashboardSectionLabel>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Visualizações de página', value: '0', sub: 'este mês' },
                  { label: 'RPM estimado', value: 'R$ 0,00', sub: 'por mil visualizações' },
                  { label: 'Sua participação', value: '70%', sub: 'da receita gerada' },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5">
                    <p className="font-display text-2xl font-bold text-white">{metric.value}</p>
                    <p className="mt-2 text-sm font-medium text-white/68">{metric.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/28">{metric.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <DashboardEmptyState
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
              }
              title="Nenhum repasse registrado ainda"
              description="Os repasses do AdSense aparecerão aqui conforme a plataforma acumular visualizações e consolidar pagamentos mensais."
            />

            <InfoBox>
              <p className="font-medium text-white/74">Como funciona o repasse do AdSense</p>
              <p className="mt-2">
                O AdSense é exibido apenas para alunos sem assinatura premium. A plataforma distribui 70% da receita gerada pelos anúncios proporcionalmente às visualizações de cada criador. O pagamento é realizado no dia 15 do mês seguinte, desde que o saldo acumulado seja superior a R$ 50,00.
              </p>
            </InfoBox>
          </motion.div>
        )}

        {tab === 'doacoes' && (
          <motion.div variants={fadeUp} className="space-y-4">
            <DashboardEmptyState
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              }
              title="Nenhuma doação registrada ainda"
              description="Quando os alunos apoiarem o seu conteúdo com doações voluntárias, o histórico aparecerá aqui com uma leitura mais clara e institucional."
            />

            <InfoBox>
              <p className="font-medium text-white/74">Como funcionam as doações</p>
              <p className="mt-2">
                Todo o conteúdo permanece gratuito para os alunos. As doações são voluntárias, processadas via Stripe e repassadas ao criador após a retenção da taxa operacional da plataforma.
              </p>
            </InfoBox>
          </motion.div>
        )}
      </motion.div>
    </DashboardPageShell>
  )
}
