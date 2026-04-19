import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'

type Tab = 'adsense' | 'doacoes'

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-[#F37E20]/5 border border-[#F37E20]/15 rounded-xl p-4">
      <div className="p-1.5 rounded-lg bg-[#F37E20]/10 text-[#F37E20] flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </div>
      <div className="text-sm text-white/50 leading-relaxed">{children}</div>
    </div>
  )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#F37E20]/10 flex items-center justify-center mx-auto mb-4 text-[#F37E20]">
        {icon}
      </div>
      <p className="text-white/70 font-medium mb-1">{title}</p>
      <p className="text-white/30 text-sm max-w-xs mx-auto">{description}</p>
    </div>
  )
}

export function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>('adsense')

  const totalGeral = 'R$ 0,00'
  const totalMes = 'R$ 0,00'

  return (
    <div className="p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-2xl font-bold text-white font-display">Financeiro</h1>
          <p className="text-white/50 mt-1 text-sm">Receitas de AdSense e doações voluntárias dos alunos</p>
        </motion.div>

        {/* Cards de resumo geral */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total acumulado',
              value: totalGeral,
              sub: 'AdSense + doações',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: 'Este mês',
              value: totalMes,
              sub: 'abril 2026',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              ),
            },
            {
              label: 'Repasse AdSense',
              value: 'R$ 0,00',
              sub: 'proporcional às views',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              ),
            },
            {
              label: 'Doações recebidas',
              value: 'R$ 0,00',
              sub: '0 transações',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              ),
            },
          ].map((s) => (
            <div key={s.label} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-5">
              <div className="p-2 rounded-lg bg-[#F37E20]/10 text-[#F37E20] w-fit mb-3">{s.icon}</div>
              <p className="text-xl font-bold text-white font-display">{s.value}</p>
              <p className="text-sm font-medium text-white/60 mt-0.5">{s.label}</p>
              <p className="text-xs text-white/25 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeUp} className="flex gap-1 p-1 bg-[#151B23] border border-[#2A313B] rounded-xl mb-5 w-fit">
          {([
            { key: 'adsense', label: 'Repasse AdSense' },
            { key: 'doacoes', label: 'Doações voluntárias' },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t.key
                  ? 'bg-[#F37E20] text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Conteúdo da tab AdSense */}
        {tab === 'adsense' && (
          <motion.div variants={fadeUp} key="adsense" className="space-y-4">
            {/* Métricas AdSense */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Visualizações de página', value: '0', sub: 'este mês' },
                { label: 'RPM estimado', value: 'R$ 0,00', sub: 'por mil visualizações' },
                { label: 'Sua participação', value: '70%', sub: 'da receita gerada' },
              ].map((m) => (
                <div key={m.label} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-4">
                  <p className="text-lg font-bold text-white font-display">{m.value}</p>
                  <p className="text-xs font-medium text-white/60 mt-0.5">{m.label}</p>
                  <p className="text-xs text-white/25">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Histórico AdSense */}
            <div className="bg-[#151B23] border border-[#2A313B] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2A313B] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Histórico de repasses</h2>
                <span className="text-xs text-white/30">Pagamentos mensais via Pix</span>
              </div>
              <EmptyState
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                }
                title="Nenhum repasse ainda"
                description="Os repasses do AdSense são processados mensalmente conforme as visualizações dos seus cursos."
              />
            </div>

            <InfoBox>
              <p className="font-medium text-white/70 mb-1">Como funciona o repasse do AdSense</p>
              O AdSense é exibido apenas para alunos sem assinatura premium. A plataforma distribui
              <strong className="text-white/70"> 70% da receita gerada</strong> pelos anúncios proporcionalmente
              às visualizações de cada criador. O pagamento é realizado todo dia 15 do mês seguinte via Pix,
              desde que o saldo acumulado seja superior a R$ 50,00.
            </InfoBox>
          </motion.div>
        )}

        {/* Conteúdo da tab Doações */}
        {tab === 'doacoes' && (
          <motion.div variants={fadeUp} key="doacoes" className="space-y-4">
            <div className="bg-[#151B23] border border-[#2A313B] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2A313B]">
                <h2 className="text-sm font-semibold text-white">Histórico de doações</h2>
              </div>
              <EmptyState
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Nenhuma doação ainda"
                description="Quando alunos enviarem doações voluntárias, elas aparecerão aqui."
              />
            </div>

            <InfoBox>
              <p className="font-medium text-white/70 mb-1">Como funcionam as doações</p>
              Todo o conteúdo é gratuito para os alunos. Doações são voluntárias e processadas via Stripe.
              A plataforma retém uma pequena taxa operacional e o restante é repassado integralmente
              ao criador via Pix ou transferência bancária em até 5 dias úteis.
            </InfoBox>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
