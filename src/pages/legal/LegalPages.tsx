import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'

type LegalPageProps = {
  eyebrow: string
  title: string
  description: string
  sections: Array<{ title: string; body: string[] }>
}

function LegalPage({ eyebrow, title, description, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#0F141A] text-white">
      <Navbar />

      <main className="px-6 pb-16 pt-32 md:pt-36">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.92)_0%,rgba(10,14,20,0.96)_100%)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.25)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F37E20]">{eyebrow}</p>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/56 sm:text-base">{description}</p>

            <div className="mt-8 space-y-6">
              {sections.map((section) => (
                <section key={section.title} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-6">
                  <h2 className="font-display text-2xl font-bold text-white">{section.title}</h2>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-white/60">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center rounded-2xl bg-[#F37E20] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#e06e10]"
              >
                Criar conta
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/8 px-5 py-3 text-sm font-semibold text-white/68 transition-colors duration-200 hover:text-white"
              >
                Voltar para a landing
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function TermosPage() {
  return (
    <LegalPage
      eyebrow="Informações legais"
      title="Termos de uso"
      description="Esta versão publica os princípios de uso da plataforma enquanto o documento jurídico definitivo é finalizado para as próximas fases de monetização e compliance."
      sections={[
        {
          title: 'Uso da plataforma',
          body: [
            'A Resenha do Teólogo oferece acesso gratuito a conteúdos de formação teológica, com áreas próprias para alunos, criadores e instituições.',
            'O uso da plataforma pressupõe conduta respeitosa, dados verdadeiros no cadastro e cumprimento das regras de convivência publicadas em cada ambiente comunitário.',
          ],
        },
        {
          title: 'Conteúdo e responsabilidade',
          body: [
            'Criadores são responsáveis pelo conteúdo que publicam, incluindo direitos de uso de vídeos, materiais complementares e textos relacionados aos cursos.',
            'A plataforma pode remover conteúdos, contas ou interações que violem leis, direitos de terceiros ou políticas internas de segurança e integridade.',
          ],
        },
        {
          title: 'Atualizações futuras',
          body: [
            'Este texto será expandido antes da liberação de pagamentos, loja, premium e recursos institucionais mais avançados.',
            'Ao continuar usando a plataforma, o usuário concorda com a evolução destes termos e com a publicação de versões mais completas conforme o produto amadurecer.',
          ],
        },
      ]}
    />
  )
}

export function PrivacidadePage() {
  return (
    <LegalPage
      eyebrow="Informações legais"
      title="Política de privacidade"
      description="A plataforma trata dados de acesso, perfil e progresso de aprendizagem para operar a experiência educacional com segurança, continuidade e personalização."
      sections={[
        {
          title: 'Dados coletados',
          body: [
            'Podemos tratar dados de cadastro, autenticação, perfil, progresso em cursos, interações dentro da plataforma e informações técnicas necessárias para segurança e funcionamento do serviço.',
            'Nas próximas fases, novas categorias de dados poderão ser tratadas para pagamentos, relatórios institucionais, suporte e recursos avançados de estudo.',
          ],
        },
        {
          title: 'Finalidade do tratamento',
          body: [
            'Os dados são utilizados para autenticar usuários, organizar acesso por perfil, registrar progresso acadêmico, emitir certificados e manter a integridade técnica da plataforma.',
            'Também podem ser usados para comunicação operacional, prevenção de abuso, melhoria do produto e análise agregada de uso.',
          ],
        },
        {
          title: 'Próximos passos de compliance',
          body: [
            'Antes das fases de monetização, white label e comunidade mais aberta, esta política será detalhada com bases legais, retenção, direitos do titular e fluxos completos de exclusão e suporte.',
            'Enquanto isso, a plataforma adota como princípio mínimo a coleta enxuta, o acesso restrito por perfil e o cuidado com segregação de dados entre criadores e instituições.',
          ],
        },
      ]}
    />
  )
}
