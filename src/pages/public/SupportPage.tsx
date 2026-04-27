// Pagina /apoie com instrucoes de doacao. Por enquanto so o admin enxerga
// o botao que linka para ca; a rota fica publica para que o link possa ser
// compartilhado depois sem precisar de login. Quando Stripe/Pix estiverem
// integrados, esta pagina recebe o widget de pagamento.

import { useState } from 'react'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { useSeo } from '@/lib/seo'

const PIX_KEY_RAW = '10532024745'
const PIX_KEY_DISPLAY = '105.320.247-45'
const PIX_RECIPIENT = 'Luiz Carlos da Silva Junior'

export function SupportPage() {
  const [copied, setCopied] = useState(false)

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(PIX_KEY_RAW)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  useSeo({
    title: 'Apoiar | Resenha do Teólogo',
    description:
      'Apoie o Resenha do Teólogo para mantermos cursos, blog e ferramentas de estudo bíblico gratuitas para todos.',
    url: 'https://resenhadoteologo.com/apoie',
    image: null,
    type: 'website',
  })

  return (
    <PublicPageShell>
    <div className="min-h-screen bg-[#0F141A] text-white">
      <main className="pt-28 pb-24">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
            Apoie o projeto
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
            Conteúdo gratuito sustentado por quem acredita.
          </h1>
          <p className="mt-5 text-base leading-7 text-white/64">
            Cursos, ferramentas de estudo e o blog teológico permanecem livres para todos. A
            plataforma se mantém em pé com o apoio de leitores e alunos que escolhem contribuir
            com qualquer valor.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                Pix
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                    Tipo de chave
                  </p>
                  <p className="mt-1 text-sm text-white/82">CPF</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                    Chave
                  </p>
                  <p className="mt-1 font-display text-lg font-bold tracking-wide text-white">
                    {PIX_KEY_DISPLAY}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                    Favorecido
                  </p>
                  <p className="mt-1 text-sm text-white/82">{PIX_RECIPIENT}</p>
                </div>
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F37E20]/30 bg-[#F37E20]/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#F2BD8A] transition hover:border-[#F37E20]/50 hover:bg-[#F37E20]/16 hover:text-white"
                >
                  {copied ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Chave copiada
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h6a2 2 0 002-2M8 5a2 2 0 012-2h6a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
                      </svg>
                      Copiar chave
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                Cartão e assinatura
              </p>
              <p className="mt-3 text-sm leading-6 text-white/72">
                Em breve. Estamos finalizando a integração com Stripe para apoios mensais e
                recorrentes.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[1.6rem] border border-[#F37E20]/16 bg-[#F37E20]/8 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
              Fale com a gente
            </p>
            <p className="mt-3 text-sm leading-6 text-white/76">
              Para apoiar agora ou tirar dúvidas, escreva para
              {' '}
              <a
                href="mailto:hello@resenhadoteologo.com?subject=Quero%20apoiar%20o%20Resenha%20do%20Te%C3%B3logo"
                className="font-semibold text-[#F2BD8A] underline-offset-4 hover:underline"
              >
                hello@resenhadoteologo.com
              </a>
              . Respondemos com instruções diretas.
            </p>
          </div>
        </div>
      </main>
    </div>
    </PublicPageShell>
  )
}
