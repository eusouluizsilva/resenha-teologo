import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import type { UserFunction } from '@/lib/functions'
import { DOCUMENT_VERSION } from '@/lib/functions'

const FUNCTIONS_CONFIG = [
  {
    id: 'aluno' as UserFunction,
    eyebrow: 'Para estudar',
    title: 'Aluno',
    description: 'Acesse cursos gratuitos, acompanhe seu progresso e receba certificados.',
    consent: 'Reconheço que os conteúdos disponibilizados podem ser produzidos por terceiros e que a plataforma não garante automaticamente sua veracidade, adequação acadêmica ou disponibilidade contínua.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'criador' as UserFunction,
    eyebrow: 'Para publicar',
    title: 'Criador de conteúdo',
    description: 'Crie e organize cursos, acompanhe alunos e monetize sua produção.',
    consent: 'Declaro que sou integralmente responsável por todo conteúdo, vídeo, arquivo, material, imagem, produto, dado ou informação que publicar na plataforma, incluindo direitos autorais, licenças, uso de imagem, privacidade e conformidade com regras de plataformas de terceiros.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    id: 'instituicao' as UserFunction,
    eyebrow: 'Para comunidades',
    title: 'Igreja ou instituição',
    description: 'Crie um ambiente institucional, gerencie membros e acompanhe formação coletiva.',
    consent: 'Declaro que possuo autoridade para representar a instituição que será cadastrada e assumo responsabilidade pelos dados, acessos, conteúdos, permissões e atos praticados no ambiente institucional.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
]

interface OnboardingModalProps {
  onComplete: () => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const enableFunction = useMutation(api.userFunctions.enable)
  const recordConsent = useMutation(api.consents.record)

  const [selected, setSelected] = useState<Set<UserFunction>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggle(fn: UserFunction) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(fn)) {
        next.delete(fn)
      } else {
        next.add(fn)
      }
      return next
    })
  }

  async function handleConfirm() {
    if (selected.size === 0) {
      setError('Selecione ao menos uma função para continuar.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userAgent =
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined

      for (const fn of selected) {
        await enableFunction({ function: fn })
        await recordConsent({
          type: fn,
          documentVersion: DOCUMENT_VERSION,
          userAgent,
        })
      }

      onComplete()
    } catch {
      setError('Erro ao salvar suas funções. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0E14]/90 px-4 backdrop-blur-md">
      <div className={cn('w-full max-w-xl', brandPanelClass)}>
        <div className="p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F2BD8A]">
            Bem-vindo
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">
            Como você vai usar a plataforma?
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/52">
            Escolha uma ou mais funções. Você pode alterar isso depois em "Minhas funções".
          </p>

          <div className="mt-6 space-y-3">
            {FUNCTIONS_CONFIG.map((fn) => {
              const active = selected.has(fn.id)
              return (
                <button
                  key={fn.id}
                  type="button"
                  onClick={() => toggle(fn.id)}
                  className={cn(
                    'w-full rounded-[1.3rem] border p-4 text-left transition-all duration-200',
                    active
                      ? 'border-[#F37E20]/28 bg-[#F37E20]/8'
                      : 'border-white/7 bg-white/[0.025] hover:border-white/14 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                      <div
                        className={cn(
                          'h-4 w-4 rounded border-2 transition-all duration-150',
                          active
                            ? 'border-[#F37E20] bg-[#F37E20]'
                            : 'border-white/30 bg-transparent'
                        )}
                      >
                        {active && (
                          <svg viewBox="0 0 12 12" className="h-full w-full text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border transition-all',
                          active
                            ? 'border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F2BD8A]'
                            : 'border-white/8 bg-white/[0.03] text-white/40'
                        )}>
                          {fn.icon}
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F2BD8A]/70">
                            {fn.eyebrow}
                          </p>
                          <p className="font-semibold text-white">{fn.title}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-white/48">{fn.description}</p>
                      {active && (
                        <div className="mt-3 rounded-xl border border-white/6 bg-black/10 px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/36 mb-1">
                            Termo de aceite
                          </p>
                          <p className="text-xs leading-5 text-white/46">{fn.consent}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || selected.size === 0}
              className={cn(brandPrimaryButtonClass, 'w-full py-3.5')}
            >
              {loading ? 'Salvando...' : `Confirmar ${selected.size > 0 ? `(${selected.size} ${selected.size === 1 ? 'função' : 'funções'})` : ''}`}
            </button>
            <button
              type="button"
              onClick={onComplete}
              className={cn(brandSecondaryButtonClass, 'w-full py-3 text-white/42 hover:text-white/60')}
            >
              Configurar depois
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
