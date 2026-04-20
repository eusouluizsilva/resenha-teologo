import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import { cn } from '@/lib/brand'
import { useCurrentAppUser } from '@/lib/currentUser'
import type { UserFunction } from '@/lib/functions'
import { DOCUMENT_VERSION } from '@/lib/functions'

const FUNCTIONS_CONFIG = [
  {
    id: 'aluno' as UserFunction,
    title: 'Aluno',
    description: 'Acesse cursos gratuitos, acompanhe seu progresso e receba certificados.',
    details: [
      'Acesso ao catálogo completo de cursos',
      'Player de aulas com acompanhamento de progresso',
      'Quizzes e avaliações por aula',
      'Emissão de certificados com nota mínima de 70%',
    ],
    consent: 'Reconheço que os conteúdos disponibilizados podem ser produzidos por terceiros e que a plataforma não garante automaticamente sua veracidade, adequação acadêmica ou disponibilidade contínua.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'criador' as UserFunction,
    title: 'Criador de conteúdo',
    description: 'Crie e organize cursos, acompanhe alunos e monetize sua produção.',
    details: [
      'Criação de cursos, módulos e aulas',
      'Adição de vídeos via URL (YouTube, Vimeo)',
      'Criação de quizzes por aula',
      'Painel financeiro com relatórios de repasse',
    ],
    consent: 'Declaro que sou integralmente responsável por todo conteúdo, vídeo, arquivo, material, imagem, produto, dado ou informação que publicar na plataforma, incluindo direitos autorais, licenças e conformidade com regras de plataformas de terceiros.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    id: 'instituicao' as UserFunction,
    title: 'Igreja ou instituição',
    description: 'Crie um ambiente institucional, gerencie membros e acompanhe formação coletiva.',
    details: [
      'Cadastro de entidade institucional separada',
      'Gestão de membros por convite',
      'Vinculação de cursos a membros',
      'Acompanhamento de progresso coletivo',
    ],
    consent: 'Declaro que possuo autoridade para representar a instituição que será cadastrada e assumo responsabilidade pelos dados, acessos, conteúdos, permissões e atos praticados no ambiente institucional.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
]

export function FuncoesPage() {
  const { hasFunction, isLoading } = useCurrentAppUser()
  const enableFunction = useMutation(api.userFunctions.enable)
  const disableFunction = useMutation(api.userFunctions.disable)
  const recordConsent = useMutation(api.consents.record)
  const [loadingFn, setLoadingFn] = useState<UserFunction | null>(null)
  const [expandedConsent, setExpandedConsent] = useState<UserFunction | null>(null)

  async function handleToggle(fn: UserFunction, currentlyActive: boolean) {
    if (currentlyActive) {
      setLoadingFn(fn)
      try {
        await disableFunction({ function: fn })
      } finally {
        setLoadingFn(null)
      }
    } else {
      setExpandedConsent(fn)
    }
  }

  async function handleEnable(fn: UserFunction) {
    setLoadingFn(fn)
    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      await enableFunction({ function: fn })
      await recordConsent({ type: fn, documentVersion: DOCUMENT_VERSION, userAgent })
      setExpandedConsent(null)
    } finally {
      setLoadingFn(null)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Conta"
      title="Minhas funções"
      description="Ative ou desative as funções da plataforma. Cada função desbloqueia áreas e recursos específicos."
      maxWidthClass="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {FUNCTIONS_CONFIG.map((config) => {
            const active = hasFunction(config.id)
            const loading = loadingFn === config.id
            const showConsent = expandedConsent === config.id

            return (
              <div
                key={config.id}
                className={cn(
                  'rounded-[1.5rem] border transition-all duration-200',
                  active
                    ? 'border-[#F37E20]/18 bg-[#F37E20]/6'
                    : 'border-white/7 bg-white/[0.02]'
                )}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border transition-all',
                        active
                          ? 'border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F2BD8A]'
                          : 'border-white/8 bg-white/[0.03] text-white/40'
                      )}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{config.title}</p>
                        {active ? (
                          <span className="flex-shrink-0 rounded-full border border-[#F37E20]/22 bg-[#F37E20]/10 px-3 py-0.5 text-xs font-semibold text-[#F2BD8A]">
                            Ativa
                          </span>
                        ) : (
                          <span className="flex-shrink-0 rounded-full border border-white/10 bg-white/4 px-3 py-0.5 text-xs font-medium text-white/36">
                            Inativa
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-white/52">{config.description}</p>
                      <ul className="mt-3 space-y-1">
                        {config.details.map((d) => (
                          <li key={d} className="flex items-center gap-2 text-xs text-white/38">
                            <span className="h-1 w-1 flex-shrink-0 rounded-full bg-white/24" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {!showConsent && (
                    <button
                      type="button"
                      onClick={() => handleToggle(config.id, active)}
                      disabled={loading}
                      className={cn(
                        'mt-4 w-full rounded-[1rem] border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                        active
                          ? 'border-white/10 bg-white/4 text-white/56 hover:border-red-500/20 hover:bg-red-500/8 hover:text-red-300'
                          : 'border-[#F37E20]/20 bg-[#F37E20]/8 text-[#F2BD8A] hover:bg-[#F37E20]/14'
                      )}
                    >
                      {loading
                        ? 'Aguarde...'
                        : active
                        ? 'Desativar função'
                        : 'Ativar função'}
                    </button>
                  )}
                </div>

                {showConsent && (
                  <div className="border-t border-white/6 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/36 mb-2">
                      Termo de aceite obrigatório
                    </p>
                    <p className="text-xs leading-5 text-white/52">{config.consent}</p>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleEnable(config.id)}
                        disabled={loading}
                        className="flex-1 rounded-[1rem] border border-[#F37E20]/22 bg-[#F37E20]/10 px-4 py-2.5 text-sm font-semibold text-[#F2BD8A] transition-all hover:bg-[#F37E20]/18 disabled:opacity-50"
                      >
                        {loading ? 'Ativando...' : 'Aceitar e ativar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedConsent(null)}
                        disabled={loading}
                        className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/46 transition-all hover:border-white/14 hover:text-white/62"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
