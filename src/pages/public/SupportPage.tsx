// Pagina /apoie com instrucoes de doacao. Por enquanto so o admin enxerga
// o botao que linka para ca; a rota fica publica para que o link possa ser
// compartilhado depois sem precisar de login. Quando Stripe/Pix estiverem
// integrados, esta pagina recebe o widget de pagamento.

import { Navbar } from '@/components/layout/Navbar'
import { useSeo } from '@/lib/seo'

export function SupportPage() {
  useSeo({
    title: 'Apoiar | Resenha do Teólogo',
    description:
      'Apoie o Resenha do Teólogo para mantermos cursos, blog e ferramentas de estudo bíblico gratuitas para todos.',
    url: 'https://resenhadoteologo.com/apoie',
    image: null,
    type: 'website',
  })

  return (
    <div className="min-h-screen bg-[#0F141A] text-white">
      <Navbar />

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
              <p className="mt-3 text-sm leading-6 text-white/72">
                Em breve disponibilizaremos chave Pix dedicada para doações. Enquanto isso,
                escreva para o email abaixo que enviamos os dados.
              </p>
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
  )
}
