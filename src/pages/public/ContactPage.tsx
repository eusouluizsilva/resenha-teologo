// Página /contato pública. Concentra os canais de contato (email + redes
// sociais) em uma URL dedicada. Útil para revisores do AdSense/AdSense for
// Sites, que verificam se o publisher tem forma clara de receber contato.

import { Link } from 'react-router-dom'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { useSeo } from '@/lib/seo'

const EMAIL = 'hello@resenhadoteologo.com'
const YOUTUBE_URL = 'https://www.youtube.com/@ResenhaDoTeólogo'
const INSTAGRAM_URL = 'https://www.instagram.com/eusouluizsilva/'
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61574237807743'

export function ContactPage() {
  useSeo({
    title: 'Contato | Resenha do Teólogo',
    description:
      'Fale com a equipe da Resenha do Teólogo. Suporte, parcerias, dúvidas pedagógicas e atendimento a anunciantes.',
    url: 'https://resenhadoteologo.com/contato',
    image: null,
    type: 'website',
  })

  return (
    <PublicPageShell>
      <div className="min-h-screen bg-[#0F141A] text-white">
        <main className="pt-28 pb-24">
          <div className="mx-auto max-w-3xl px-5 md:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
              Contato
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
              Fale com a Resenha do Teólogo.
            </h1>
            <p className="mt-5 text-base leading-7 text-white/64">
              Estamos disponíveis para suporte, parcerias institucionais, dúvidas pedagógicas
              e relacionamento com anunciantes. Respondemos em até 2 dias úteis.
            </p>

            <section className="mt-10 rounded-[1.6rem] border border-[#F37E20]/16 bg-[#F37E20]/8 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                Email principal
              </p>
              <p className="mt-3 text-sm leading-6 text-white/76">
                Para qualquer assunto, escreva para{' '}
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-semibold text-[#F2BD8A] underline-offset-4 hover:underline"
                >
                  {EMAIL}
                </a>
                .
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  href={`mailto:${EMAIL}?subject=Suporte%20pedag%C3%B3gico`}
                  className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-white/76 transition hover:border-[#F37E20]/30 hover:text-white"
                >
                  Suporte pedagógico (alunos e professores)
                </a>
                <a
                  href={`mailto:${EMAIL}?subject=Parcerias%20e%20institui%C3%A7%C3%B5es`}
                  className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-white/76 transition hover:border-[#F37E20]/30 hover:text-white"
                >
                  Parcerias e instituições
                </a>
                <a
                  href={`mailto:${EMAIL}?subject=Anunciantes%20e%20publicidade`}
                  className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-white/76 transition hover:border-[#F37E20]/30 hover:text-white"
                >
                  Anunciantes e publicidade
                </a>
                <a
                  href={`mailto:${EMAIL}?subject=Privacidade%20e%20LGPD`}
                  className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-sm text-white/76 transition hover:border-[#F37E20]/30 hover:text-white"
                >
                  Privacidade, LGPD e direitos do titular
                </a>
              </div>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5 transition hover:border-[#F37E20]/30"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                  YouTube
                </p>
                <p className="mt-2 text-sm font-semibold text-white">@ResenhaDoTeólogo</p>
                <p className="mt-1 text-xs text-white/54">
                  Aulas e estudos completos no canal oficial.
                </p>
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5 transition hover:border-[#F37E20]/30"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                  Instagram
                </p>
                <p className="mt-2 text-sm font-semibold text-white">@eusouluizsilva</p>
                <p className="mt-1 text-xs text-white/54">
                  Conteúdo curto, bastidores e respostas a perguntas.
                </p>
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5 transition hover:border-[#F37E20]/30"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                  Facebook
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Página oficial</p>
                <p className="mt-1 text-xs text-white/54">
                  Comunidade e atualizações do projeto.
                </p>
              </a>
            </section>

            <section className="mt-10 rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                Operação
              </p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                A Resenha do Teólogo é mantida por Luiz Carlos da Silva Junior, fundador do
                projeto. A plataforma oferece cursos, blog, leitor bíblico, caderno digital e
                ferramentas de estudo, todas gratuitas. A operação é sustentada por publicidade
                contextual e doações voluntárias.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/sobre"
                  className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-2 text-xs font-semibold text-white/72 transition hover:border-[#F37E20]/30 hover:text-white"
                >
                  Sobre o projeto
                </Link>
                <Link
                  to="/apoie"
                  className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-2 text-xs font-semibold text-white/72 transition hover:border-[#F37E20]/30 hover:text-white"
                >
                  Apoie a plataforma
                </Link>
                <Link
                  to="/privacidade"
                  className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-2 text-xs font-semibold text-white/72 transition hover:border-[#F37E20]/30 hover:text-white"
                >
                  Política de privacidade
                </Link>
                <Link
                  to="/termos"
                  className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-2 text-xs font-semibold text-white/72 transition hover:border-[#F37E20]/30 hover:text-white"
                >
                  Termos de uso
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </PublicPageShell>
  )
}
