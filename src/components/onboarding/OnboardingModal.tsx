// Tour de boas-vindas em 3 telas, exibido uma única vez por usuário ao entrar
// no dashboard. Conteúdo varia por perfil (aluno, criador, instituição).
// Persiste conclusão em users.onboardingCompletedAt — segunda visita não dispara.
// Respeita prefers-reduced-motion: anima discreto se motion ok, instantâneo se não.

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  brandGhostButtonClass,
  brandPrimaryButtonClass,
  cn,
} from '@/lib/brand'
import type { Perfil } from '@/lib/perfil'

type Step = {
  iconPath: string
  eyebrow: string
  title: string
  body: string
}

const STEPS_BY_PERFIL: Record<Perfil, Step[]> = {
  aluno: [
    {
      iconPath:
        'M3.75 3.75v3.75h16.5V3.75H3.75zm0 7.5v9h16.5v-9H3.75zm3 3.75h10.5',
      eyebrow: 'Passo 1',
      title: 'Catálogo gratuito de cursos',
      body: 'Todos os cursos da plataforma são gratuitos. Comece pela página Cursos e matricule-se nos que mais combinam com seu momento de fé.',
    },
    {
      iconPath:
        'M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 14.25v-9zM10 8l5 3.5L10 15V8z',
      eyebrow: 'Passo 2',
      title: 'Aulas com proteção anti pulo',
      body: 'O player garante que você assista de verdade. Ao terminar, faz quiz e libera a próxima aula. Foco no que importa: aprender.',
    },
    {
      iconPath:
        'M9 12l2.25 2.25L15 10.5m6 1.5a9 9 0 11-18 0 9 9 0 0118 0z',
      eyebrow: 'Passo 3',
      title: 'Conquiste seu certificado',
      body: 'Concluiu o curso com média mínima de 70%? Você pode emitir um certificado digital com QR Code de verificação pública.',
    },
  ],
  criador: [
    {
      iconPath:
        'M12 4.5v15m7.5-7.5h-15',
      eyebrow: 'Passo 1',
      title: 'Crie seu primeiro curso',
      body: 'No painel Cursos, monte trilhas com aulas em vídeo do YouTube ou Vimeo. Adicione quiz, materiais e organize em módulos.',
    },
    {
      iconPath:
        'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0',
      eyebrow: 'Passo 2',
      title: 'Acompanhe seus alunos',
      body: 'Veja em tempo real quem assiste, quem terminou e quem está parado. Envie mensagens diretas para reengajar.',
    },
    {
      iconPath:
        'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m4.5 12.75l-3-3m0 0l-3 3m3-3v6',
      eyebrow: 'Passo 3',
      title: 'Publique no blog',
      body: 'Compartilhe artigos teológicos e fortaleça sua autoridade. Seus seguidores recebem notificação automática a cada publicação.',
    },
  ],
  instituicao: [
    {
      iconPath:
        'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z',
      eyebrow: 'Passo 1',
      title: 'Adicione seus membros',
      body: 'Convide alunos da sua igreja ou instituição. Cada membro fica vinculado e você acompanha o progresso de todos em um lugar.',
    },
    {
      iconPath:
        'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
      eyebrow: 'Passo 2',
      title: 'Monte planos de estudo',
      body: 'Defina trilhas obrigatórias para cada grupo. A formação teológica fica organizada e padronizada para todos os membros.',
    },
    {
      iconPath:
        'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
      eyebrow: 'Passo 3',
      title: 'Veja relatórios de engajamento',
      body: 'Visão consolidada de horas estudadas, certificados emitidos e quem precisa de atenção. Exporte para reuniões de liderança.',
    },
  ],
}

export function OnboardingModal({
  open,
  perfil,
  onClose,
}: {
  open: boolean
  perfil: Perfil
  onClose: () => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [closing, setClosing] = useState(false)
  const reduceMotion = useReducedMotion()
  const markCompleted = useMutation(api.users.markOnboardingCompleted)

  const steps = STEPS_BY_PERFIL[perfil]
  const total = steps.length
  const isLast = stepIndex === total - 1

  // Reseta o passo ao reabrir o modal: garante que o tour sempre comece no
  // passo 1 (caso o componente seja remontado por mudança de perfil).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setStepIndex(0)
  }, [open])

  // Bloqueia ESC fechando sem marcar como completo: o tour deve ser
  // explicitamente concluído ou pulado para ser persistido. Trava scroll.
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') void finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function finish() {
    if (closing) return
    setClosing(true)
    try {
      await markCompleted({})
    } catch {
      // Se a mutation falhar (rede), fecha mesmo assim: não vamos travar o
      // usuário no modal. Tour reabrirá no próximo login se realmente falhou.
    }
    onClose()
    setClosing(false)
  }

  function next() {
    if (isLast) {
      void finish()
      return
    }
    setStepIndex((i) => Math.min(i + 1, total - 1))
  }

  function back() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const step = steps[stepIndex]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
        >
          <div className="absolute inset-0 bg-[rgba(8,12,18,0.78)] backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(27,36,48,0.98)_0%,rgba(18,24,33,0.98)_100%)] shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(243,126,32,0.22)_0%,rgba(243,126,32,0)_70%)]" />

            <div className="relative px-7 pt-8 pb-6 sm:px-9 sm:pt-10">
              <div className="flex items-center gap-2">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-all duration-300',
                      i <= stepIndex ? 'bg-[#F37E20]' : 'bg-white/10',
                    )}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-7"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F37E20]/22 bg-[#F37E20]/12 text-[#F37E20]">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={step.iconPath} />
                    </svg>
                  </div>

                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                    {step.eyebrow} de {total}
                  </p>
                  <h2
                    id="onboarding-title"
                    className="mt-2 font-display text-2xl font-bold text-white sm:text-[26px]"
                  >
                    {step.title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-7 text-white/70">{step.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/6 bg-black/16 px-7 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-9">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void finish()}
                  disabled={closing}
                  className="text-sm font-medium text-white/52 transition-colors hover:text-white/80 disabled:opacity-50"
                >
                  Pular tour
                </button>
              </div>
              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    disabled={closing}
                    className={brandGhostButtonClass}
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  disabled={closing}
                  className={brandPrimaryButtonClass}
                >
                  {isLast ? 'Começar agora' : 'Avançar'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
