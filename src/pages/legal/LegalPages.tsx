import { Link } from 'react-router-dom'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

type BodyItem =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

type Section = {
  title: string
  body: BodyItem[]
}

type LegalPageProps = {
  eyebrow: string
  title: string
  updatedAt: string
  description: string
  sections: Section[]
  footerNote?: string
}

function LegalPage({ eyebrow, title, updatedAt, description, sections, footerNote }: LegalPageProps) {
  return (
    <PublicPageShell>
    <div className="min-h-screen bg-[#0F141A] text-white">
      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.92)_0%,rgba(10,14,20,0.96)_100%)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.25)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F37E20]">{eyebrow}</p>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-3 text-xs text-white/36">Última atualização: {updatedAt}</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/56 sm:text-base">{description}</p>

            <div className="mt-8 space-y-4">
              {sections.map((section) => (
                <section key={section.title} className="rounded-[1.5rem] border border-white/7 bg-white/[0.025] p-6">
                  <h2 className="font-display text-lg font-bold text-white">{section.title}</h2>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-white/62">
                    {section.body.map((item, i) =>
                      item.type === 'paragraph' ? (
                        <p key={i}>{item.text}</p>
                      ) : (
                        <ul key={i} className="ml-1 space-y-1">
                          {item.items.map((li, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="mt-2.5 h-1 w-1 flex-shrink-0 rounded-full bg-white/28" />
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </div>
                </section>
              ))}
            </div>

            {footerNote && (
              <p className="mt-6 rounded-[1.2rem] border border-white/6 bg-white/[0.02] px-5 py-4 text-xs leading-6 text-white/40">
                {footerNote}
              </p>
            )}

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
                Voltar para a página inicial
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
    </PublicPageShell>
  )
}

function p(text: string): BodyItem {
  return { type: 'paragraph', text }
}

function list(items: string[]): BodyItem {
  return { type: 'list', items }
}

export function TermosPage() {
  return (
    <LegalPage
      eyebrow="Documentos legais"
      title="Termos Gerais da Plataforma"
      updatedAt="Abril de 2026"
      description="Ao acessar, criar conta, selecionar funções, publicar conteúdo, adquirir plano ou utilizar qualquer funcionalidade da plataforma Resenha do Teólogo, o usuário declara que leu, compreendeu e concorda com estes Termos Gerais, com a Política de Privacidade, com a Política de Cookies e com as demais políticas vinculadas."
      footerNote="Se o usuário não concordar com estes Termos, não deverá utilizar a plataforma."
      sections={[
        {
          title: '1. Aceitação dos Termos',
          body: [
            p('Ao acessar, navegar, criar conta, selecionar uma função, publicar conteúdo, adquirir plano, utilizar funcionalidades ou permanecer usando a plataforma Resenha do Teólogo, o usuário declara que leu, compreendeu e concorda com estes Termos Gerais, com a Política de Privacidade, com a Política de Cookies e com as demais políticas e documentos vinculados à plataforma.'),
            p('Se o usuário não concordar com estes Termos, não deverá utilizar a plataforma.'),
          ],
        },
        {
          title: '2. Sobre a Plataforma',
          body: [
            p('A Resenha do Teólogo é uma plataforma digital de ensino, estudo, organização de conteúdo, interação, acompanhamento de progresso, emissão de certificados internos, disponibilização de materiais complementares e gestão de ambientes educacionais e institucionais.'),
            p('A plataforma poderá ser utilizada por diferentes perfis, incluindo, entre outros:'),
            list(['Aluno', 'Professor', 'Instituição (igreja, escola, empresa ou ministério)', 'Colaborador', 'Administrador']),
            p('A plataforma atua como infraestrutura tecnológica para acesso, organização, exibição, indexação, incorporação, interação, gestão e disponibilização de conteúdos e serviços.'),
          ],
        },
        {
          title: '3. Natureza do Serviço',
          body: [
            p('A plataforma não é automaticamente autora, coautora, revisora prévia, certificadora oficial, patrocinadora, editora responsável, garantidora ou endossante de todo conteúdo publicado, incorporado, exibido, divulgado, vendido, referenciado ou utilizado por terceiros no ambiente da plataforma.'),
            p('O usuário reconhece que muitos conteúdos poderão ser produzidos, hospedados, controlados, mantidos ou disponibilizados por terceiros, inclusive professores, instituições, parceiros e plataformas externas.'),
            p('A plataforma não garante automaticamente:'),
            list([
              'Veracidade ou atualidade dos conteúdos',
              'Legalidade ou titularidade do material publicado por terceiros',
              'Originalidade ou ortodoxia teológica',
              'Adequação acadêmica externa ou adequação ministerial',
              'Disponibilidade contínua de conteúdos hospedados por terceiros',
              'Ausência de violação de direitos de terceiros',
            ]),
          ],
        },
        {
          title: '4. Cadastro, Conta e Responsabilidade de Acesso',
          body: [
            p('Para utilizar determinadas funcionalidades, o usuário deverá criar uma conta e fornecer informações verdadeiras, completas e atualizadas.'),
            p('O usuário é responsável por:'),
            list([
              'Manter a confidencialidade de suas credenciais de acesso',
              'Restringir o acesso não autorizado à sua conta',
              'Responder pelas atividades realizadas em seu login',
              'Atualizar seus dados sempre que houver alteração relevante',
            ]),
            p('A conta é pessoal e intransferível, salvo funcionalidade institucional expressamente prevista pela plataforma. O compartilhamento indevido de login, o empréstimo de conta ou o uso simultâneo incompatível com a natureza individual do acesso poderá resultar em limitação, suspensão ou encerramento da conta.'),
          ],
        },
        {
          title: '5. Funções do Usuário',
          body: [
            p('5.1 Regras comuns a todas as funções: todos os usuários se comprometem a utilizar a plataforma de forma lícita, ética, compatível com a finalidade do serviço e em conformidade com estes Termos e com as políticas aplicáveis.'),
            p('5.2 Função de aluno: o aluno utiliza a plataforma para acessar, acompanhar, estudar, organizar e interagir com conteúdos disponibilizados por terceiros. O aluno reconhece que os conteúdos acessados podem refletir opiniões, interpretações, abordagens doutrinárias, metodologias e estratégias pedagógicas de seus respectivos autores. O aluno se compromete a não copiar, redistribuir, gravar, disponibilizar publicamente, revender, sublicenciar ou explorar comercialmente conteúdos, materiais ou recursos da plataforma sem autorização expressa do titular e da plataforma, quando cabível.'),
            p('5.3 Função de professor: o professor é integralmente responsável por todo conteúdo, vídeo, arquivo, material, imagem, áudio, link, descrição, thumbnail, aula, quiz, apostila, PDF, eBook, produto, oferta, comentário, anúncio ou informação que publicar, incorporar, divulgar, vender, anexar ou utilizar na plataforma. Ao ativar a função de professor, o usuário declara que possui todos os direitos, licenças, permissões, cessões e autorizações necessárias para utilizar e disponibilizar esse conteúdo na plataforma.'),
            p('5.4 Função institucional: a instituição, incluindo igrejas, empresas, escolas, seminários, ministérios, organizações e entidades em geral, declara que possui autoridade válida para se cadastrar e operar o ambiente institucional. A instituição é responsável pelos usuários vinculados ao seu ambiente, pelos acessos concedidos, pelos conteúdos publicados, pelos dados inseridos, pelas permissões atribuídas e pelos atos praticados em seu espaço institucional.'),
          ],
        },
        {
          title: '6. Conteúdo do Usuário e Responsabilidade',
          body: [
            p('Todo usuário que publicar, incorporar, anexar, carregar, divulgar, vender ou referenciar conteúdo na plataforma declara que possui legitimidade para fazê-lo.'),
            p('O usuário é exclusivamente responsável por qualquer conteúdo que disponibilizar na plataforma, inclusive quanto a:'),
            list([
              'Direitos autorais e conexos',
              'Uso de imagem, voz e nome',
              'Marcas e sinais distintivos',
              'Privacidade e dados pessoais',
              'Exatidão de informações',
              'Promessas comerciais ou institucionais',
              'Adequação legal do material divulgado',
            ]),
            p('A plataforma poderá, mas não está obrigada a, revisar, moderar, sinalizar, restringir ou remover conteúdos.'),
          ],
        },
        {
          title: '7. Licença Operacional de Conteúdo',
          body: [
            p('Ao disponibilizar qualquer conteúdo na plataforma, o usuário concede à plataforma licença não exclusiva, mundial, limitada ao funcionamento do serviço, para:'),
            list([
              'Armazenar, organizar e indexar o conteúdo',
              'Exibir e reproduzir tecnicamente para usuários autorizados',
              'Converter formato e gerar pré-visualizações',
              'Manter cache, backup, logs e medidas técnicas de segurança',
              'Associar o conteúdo a cursos, módulos, trilhas, certificados, painéis, relatórios e funcionalidades correlatas',
            ]),
            p('Essa licença não transfere a titularidade do conteúdo à plataforma.'),
          ],
        },
        {
          title: '8. Vídeos Externos, Embeds e Serviços de Terceiros',
          body: [
            p('A plataforma poderá exibir ou incorporar vídeos, players, conteúdos, links, ferramentas e recursos hospedados ou operados por terceiros, inclusive plataformas externas de vídeo.'),
            p('O usuário reconhece que tais conteúdos e serviços permanecem sujeitos aos termos, políticas, regras técnicas, limitações, condições de monetização, restrições territoriais, configurações de privacidade e critérios operacionais do provedor de origem.'),
            p('O professor ou a instituição que vincular vídeo ou conteúdo externo declara que: possui legitimidade para utilizá-lo, respeita as regras da plataforma de origem, não está contornando restrições técnicas ou contratuais e responde integralmente por disputas, bloqueios, denúncias ou reivindicações decorrentes desse uso.'),
            p('A plataforma não garante que vídeos incorporados permanecerão disponíveis, reproduzíveis, livres de anúncios, monetizados, autorizados para incorporação ou acessíveis em todos os locais e momentos.'),
          ],
        },
        {
          title: '9. Regras Padrão de Plataforma EAD',
          body: [
            p('O usuário reconhece e aceita que, em razão da natureza educacional e tecnológica da plataforma:'),
            list([
              'Conteúdos, módulos, trilhas, aulas e materiais podem ser reorganizados, atualizados, substituídos, revisados ou removidos',
              'Páginas, layouts, recursos, integrações e funcionalidades podem ser alterados ao longo do tempo',
              'O progresso do aluno poderá depender de critérios internos da plataforma',
              'Certificados emitidos representam apenas o atendimento aos critérios internos definidos pela plataforma ou pelo curso correspondente',
              'Certificados da plataforma não constituem, por si só, diploma, reconhecimento estatal, credenciamento acadêmico formal ou habilitação profissional externa',
              'A plataforma poderá realizar manutenção, atualização, testes, ajustes ou interrupções temporárias',
              'Materiais complementares, aulas e recursos não podem ser redistribuídos sem autorização',
            ]),
          ],
        },
        {
          title: '10. Planos, Pagamentos, Comissão e Repasses',
          body: [
            p('A plataforma poderá disponibilizar planos, assinaturas, produtos, funcionalidades pagas, recursos premium, vendas de terceiros e mecanismos de repasse financeiro.'),
            p('Quando houver operações financeiras no ecossistema da plataforma, inclusive vendas realizadas por professores ou instituições, a plataforma reterá 15% sobre os valores elegíveis da operação, conforme a natureza do produto, serviço, assinatura, venda ou operação processada.'),
            p('Além da retenção da plataforma, poderão incidir taxas de terceiros, custos de processamento, tributos, estornos, chargebacks, tarifas bancárias, custos antifraude e demais encargos aplicáveis.'),
            p('O saldo disponível para repasse poderá considerar deduções relativas a: comissão da plataforma, taxas de terceiros, reembolsos, chargebacks, retenções cautelares, tributos e ajustes operacionais.'),
          ],
        },
        {
          title: '11. Publicidade no plano gratuito',
          body: [
            p('Todo o conteúdo educacional da plataforma, incluindo cursos, aulas, materiais complementares, eBooks, leitor bíblico, caderno digital e blog, é oferecido gratuitamente. Para sustentar essa operação, o plano gratuito exibe anúncios fornecidos pelo Google AdSense e por parceiros de publicidade, em espaços previamente definidos no rodapé de páginas públicas e ao final de artigos do blog.'),
            p('Usuários com assinatura premium ativa não recebem publicidade em nenhuma área da plataforma.'),
            p('Os anúncios podem ser personalizados com base em interesses inferidos pelo Google, conforme as preferências de cada usuário e as configurações do navegador. O usuário pode revogar o consentimento para publicidade personalizada a qualquer momento, ajustando a preferência no banner de cookies, optando pelo plano premium ou desativando a personalização diretamente em https://www.google.com/settings/ads.'),
            p('A plataforma não exibe anúncios em áreas restritas, incluindo o player de aulas, conteúdos institucionais privados, dashboards autenticados e páginas de pagamento. Anúncios também não são exibidos sobre material com restrição etária ou conteúdo sensível.'),
            p('Quando aplicável, parte da receita gerada pelos anúncios é repassada ao criador (professor ou instituição) responsável pelo conteúdo onde o anúncio foi exibido, conforme regras internas de revenue share publicadas no painel financeiro do criador.'),
          ],
        },
        {
          title: '12. Reembolsos, Estornos e Chargebacks',
          body: [
            p('A política de reembolso poderá variar conforme a natureza da operação, do produto, do serviço ou do plano contratado.'),
            p('Em caso de estorno, chargeback, disputa bancária ou contestação de pagamento, a plataforma poderá: debitar o valor correspondente do saldo do responsável, reter saldos futuros, suspender saques, congelar valores relacionados à disputa, exigir documentação adicional ou compensar o prejuízo em operações futuras.'),
            p('Professores e instituições respondem por estornos, disputas e chargebacks decorrentes de conteúdo irregular, oferta enganosa, não entrega, promessa descumprida, uso indevido de direitos ou qualquer fato a eles imputável.'),
          ],
        },
        {
          title: '13. Condutas Proibidas',
          body: [
            p('É proibido utilizar a plataforma para:'),
            list([
              'Violar direitos autorais, marcas, imagem, voz, honra, privacidade ou dados pessoais de terceiros',
              'Divulgar conteúdo ilícito, fraudulento, enganoso, abusivo, discriminatório, difamatório ou obsceno',
              'Praticar assédio, ameaça, perseguição ou abuso verbal',
              'Manipular progresso, certificados, repasses, métricas, avaliações, inscrições ou indicadores',
              'Burlar controles técnicos, controles de acesso ou mecanismos de segurança',
              'Inserir malware, scripts maliciosos, spam, phishing ou automações abusivas',
              'Criar perfis falsos ou alegações enganosas de autoridade institucional',
              'Usar bots ou processos automatizados sem autorização expressa',
              'Revender, sublicenciar ou redistribuir conteúdo sem autorização',
              'Usar a plataforma em desacordo com a legislação aplicável',
            ]),
          ],
        },
        {
          title: '14. Moderação, Remoção e Medidas da Plataforma',
          body: [
            p('A plataforma poderá, a qualquer tempo, adotar medidas como: moderação de comentários, fóruns e interações; remoção ou ocultação de conteúdos; limitação de funcionalidades; restrição de acesso; advertência; suspensão temporária; congelamento de valores; bloqueio de saques; encerramento de contas; preservação de registros e evidências.'),
            p('Essas medidas poderão ser tomadas em caso de denúncia plausível, disputa, risco jurídico, suspeita de fraude, violação de política, necessidade de proteção da operação, cumprimento de ordem judicial ou exigência legal.'),
          ],
        },
        {
          title: '15. Direitos Autorais e Denúncias',
          body: [
            p('A plataforma respeita direitos autorais, conexos, marcas, imagem, voz, privacidade, proteção de dados e demais direitos de terceiros.'),
            p('Qualquer pessoa que entenda que determinado conteúdo viola seus direitos poderá enviar denúncia contendo: identificação do denunciante, comprovação razoável de legitimidade, identificação clara do conteúdo denunciado, fundamento da alegação, link ou localização exata do conteúdo e dados para contato.'),
            p('Recebida a denúncia, a plataforma poderá solicitar informações adicionais, restringir o conteúdo, removê-lo, notificar o responsável, suspender funcionalidades ou preservar registros. Usuários reincidentes em infrações poderão ter conta, conteúdos, repasses e acessos suspensos ou encerrados definitivamente.'),
          ],
        },
        {
          title: '16. Privacidade e Proteção de Dados',
          body: [
            p('O tratamento de dados pessoais realizado pela plataforma observará a Política de Privacidade e a legislação aplicável, incluindo a Lei Geral de Proteção de Dados (Lei 13.709/2018).'),
            p('O usuário reconhece que a plataforma poderá tratar dados para fins de autenticação, segurança, suporte, operação do serviço, prevenção à fraude, cumprimento contratual, cumprimento de obrigação legal, exercício regular de direitos, emissão de certificados, cobrança, repasse e melhoria da experiência.'),
            p('Instituições que utilizarem o ambiente institucional declaram possuir base legal adequada para os dados que inserirem ou gerenciarem na plataforma, respondendo pelo uso que fizerem desses dados dentro de seu ambiente.'),
          ],
        },
        {
          title: '17. Comunicações da Plataforma',
          body: [
            p('O usuário autoriza o recebimento de comunicações operacionais, administrativas, contratuais, de segurança, cobrança, suporte, atualização de políticas e notificações relacionadas ao uso da plataforma.'),
            p('Comunicações promocionais, quando houver, seguirão as preferências e regras aplicáveis.'),
          ],
        },
        {
          title: '18. Propriedade Intelectual da Plataforma',
          body: [
            p('Todos os direitos sobre o software, código, interface, arquitetura, identidade visual, nome, marca, banco de dados próprio, design, documentação e demais elementos exclusivos da plataforma pertencem à Resenha do Teólogo ou aos seus licenciantes.'),
            p('É vedado copiar, modificar, reproduzir, distribuir, desmontar, explorar comercialmente ou usar indevidamente tais elementos sem autorização expressa.'),
          ],
        },
        {
          title: '19. Limitação de Responsabilidade',
          body: [
            p('Na máxima extensão permitida pela legislação aplicável, a plataforma não será responsável por:'),
            list([
              'Conteúdo publicado, incorporado, vendido ou divulgado por terceiros',
              'Indisponibilidade de vídeos externos ou serviços de terceiros',
              'Disputas autorais, contratuais ou comerciais entre usuários e terceiros',
              'Decisões teológicas, acadêmicas, ministeriais, institucionais ou comerciais tomadas por professores e instituições',
              'Falhas externas de rede, navegador, dispositivo, banco, gateway, provedor de vídeo ou integração',
              'Perdas indiretas, lucros cessantes, danos presumidos, perda de chance ou prejuízos decorrentes de fatos fora de seu controle razoável',
            ]),
            p('Nada nestes Termos afasta responsabilidades que não possam ser legalmente excluídas.'),
          ],
        },
        {
          title: '20. Indenização',
          body: [
            p('O usuário que causar prejuízo à plataforma ou a terceiros por violação destes Termos, de políticas aplicáveis, de direitos de terceiros ou da legislação responderá integralmente pelos danos, custos, despesas, notificações, condenações, acordos, estornos, chargebacks, honorários e prejuízos decorrentes de sua conduta.'),
            p('Professores e instituições, em especial, obrigam-se a defender, indenizar e manter a plataforma indene por reclamações ligadas a conteúdo, dados, ofertas, produtos, materiais, embeds, cursos, comunicações e atos praticados em seus respectivos ambientes.'),
          ],
        },
        {
          title: '21. Alterações da Plataforma e dos Termos',
          body: [
            p('A plataforma poderá alterar estes Termos, funcionalidades, políticas, integrações, fluxos, layout, critérios operacionais e recursos a qualquer tempo, mediante publicação de nova versão.'),
            p('Quando a alteração for relevante, a plataforma poderá solicitar novo aceite do usuário. A continuidade de uso após a publicação de nova versão implica concordância com os Termos atualizados.'),
          ],
        },
        {
          title: '22. Suspensão e Encerramento da Conta',
          body: [
            p('O usuário poderá encerrar sua conta conforme os meios disponibilizados pela plataforma, sujeito às obrigações pendentes e à preservação de registros necessários à operação, segurança, auditoria, prevenção à fraude e defesa de direitos.'),
            p('A plataforma poderá suspender ou encerrar contas nos casos previstos nestes Termos e nas políticas relacionadas.'),
          ],
        },
        {
          title: '23. Disposições Gerais',
          body: [
            p('A eventual tolerância da plataforma quanto ao descumprimento de qualquer disposição não constituirá renúncia de direito.'),
            p('Se qualquer cláusula destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão válidas.'),
          ],
        },
        {
          title: '24. Contato',
          body: [
            p('Para dúvidas, notificações, denúncias, solicitações jurídicas, questões de privacidade ou comunicações institucionais, o usuário deverá utilizar os canais oficiais da plataforma: hello@resenhadoteologo.com.'),
          ],
        },
        {
          title: '25. Lei Aplicável e Foro',
          body: [
            p('A lei aplicável, o idioma prevalente e o foro competente serão definidos na versão final validada juridicamente para a operação da plataforma, considerando o público atendido e os territórios de operação.'),
          ],
        },
      ]}
    />
  )
}

export function PrivacidadePage() {
  return (
    <LegalPage
      eyebrow="Documentos legais"
      title="Política de Privacidade"
      updatedAt="Abril de 2026"
      description="Esta Política de Privacidade descreve como a Resenha do Teólogo coleta, utiliza, armazena e protege os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018) e demais legislações aplicáveis."
      sections={[
        {
          title: '1. Quem somos',
          body: [
            p('A Resenha do Teólogo é uma plataforma digital de ensino teológico online, que oferece acesso a cursos, materiais de estudo, ferramentas de gestão institucional e recursos de formação para alunos, professores, igrejas e instituições.'),
            p('Contato do responsável pelo tratamento de dados: hello@resenhadoteologo.com'),
          ],
        },
        {
          title: '2. Dados coletados no cadastro',
          body: [
            p('Ao criar uma conta na plataforma, coletamos:'),
            list([
              'Nome e sobrenome',
              'Endereço de email',
              'Senha (armazenada de forma criptografada pelo serviço de autenticação Clerk)',
              'País de residência',
              'Telefone (opcional)',
              'Foto de perfil (opcional, caso fornecida ou importada de conta Google ou Facebook)',
            ]),
            p('Caso o usuário opte por cadastro via Google ou Facebook, recebemos os dados básicos de perfil autorizados pelo usuário nessas plataformas (nome, email e foto).'),
          ],
        },
        {
          title: '3. Dados coletados no uso da plataforma',
          body: [
            p('Ao utilizar a plataforma, poderemos tratar os seguintes dados:'),
            list([
              'Funções ativadas (aluno, professor, instituição) e data de ativação',
              'Registro de aceite dos Termos Gerais e termos por função, incluindo versão do documento e data',
              'Progresso em cursos: aulas assistidas, tempo de visualização, respostas em quizzes e notas obtidas',
              'Cursos em que o usuário está matriculado',
              'Certificados emitidos',
              'Dados de perfil complementares fornecidos voluntariamente: bio, endereço, redes sociais, dados de canal',
              'Dados de instituição: nome, tipo, CNPJ (se fornecido), email e telefone institucional',
              'Registros de acesso, logs de sessão e dados técnicos de navegador e dispositivo',
            ]),
          ],
        },
        {
          title: '4. Finalidade do tratamento',
          body: [
            p('Tratamos dados pessoais para as seguintes finalidades:'),
            list([
              'Autenticação e controle de acesso à conta',
              'Operação e personalização da experiência de uso',
              'Registro de progresso acadêmico e emissão de certificados',
              'Cumprimento de obrigações contratuais e legais',
              'Prevenção a fraudes, abusos e condutas vedadas',
              'Suporte técnico e atendimento ao usuário',
              'Comunicações operacionais e administrativas',
              'Gestão de repasses financeiros e processamento de pagamentos',
              'Exercício regular de direitos em processos judiciais, administrativos ou arbitrais',
            ]),
          ],
        },
        {
          title: '5. Bases legais (LGPD)',
          body: [
            p('O tratamento de dados realizado pela plataforma se apoia nas seguintes bases legais previstas na LGPD:'),
            list([
              'Execução de contrato: para operar a conta, fornecer acesso a cursos e emitir certificados',
              'Cumprimento de obrigação legal ou regulatória: quando exigido por lei ou autoridade competente',
              'Legítimo interesse: para segurança, prevenção a fraudes e melhoria do produto',
              'Consentimento: para comunicações promocionais e funcionalidades que dependem de autorização expressa',
            ]),
          ],
        },
        {
          title: '6. Dados de membros de instituições',
          body: [
            p('Quando uma instituição (igreja, escola ou empresa) adiciona membros à plataforma, os dados desses membros são tratados sob a responsabilidade compartilhada entre a plataforma e a instituição.'),
            p('A instituição declara, ao utilizar o módulo de membros, que possui base legal adequada para inserir e gerenciar os dados dos usuários vinculados ao seu ambiente, em conformidade com o art. 7 da LGPD.'),
            p('A plataforma não cria contas silenciosas para membros: toda vinculação exige que o membro possua conta própria ou aceite um convite formal com cadastro voluntário.'),
          ],
        },
        {
          title: '7. Compartilhamento de dados com terceiros',
          body: [
            p('Utilizamos os seguintes serviços de terceiros que podem tratar dados pessoais em nome da plataforma:'),
            list([
              'Clerk: autenticação, gerenciamento de sessão e dados de conta',
              'Convex: banco de dados em tempo real e armazenamento de dados da plataforma',
              'Vercel: hospedagem, entrega do aplicativo e métricas de performance (Vercel Analytics)',
              'Stripe: processamento de pagamentos (quando aplicável)',
              'Resend: envio de emails transacionais',
              'YouTube e outras plataformas de vídeo: incorporação de conteúdo externo',
              'Google Analytics 4: análise agregada de uso, sessões e origem de tráfego',
              'Google AdSense e parceiros: exibição de publicidade contextual e personalizada (apenas para usuários do plano gratuito), incluindo cookies próprios da Google e do DoubleClick (doubleclick.net) para limitar a frequência de anúncios, prevenir fraudes e medir desempenho de campanhas',
            ]),
            p('Esses serviços operam com seus próprios termos e políticas de privacidade. Não vendemos dados pessoais a terceiros.'),
            p('Para mais informações sobre como o Google trata dados em parceria com publishers, consulte a política do Google em https://policies.google.com/technologies/partner-sites. O usuário pode gerenciar a personalização de anúncios e desativar a publicidade comportamental do Google em https://www.google.com/settings/ads.'),
          ],
        },
        {
          title: '8. Cookies e rastreamento',
          body: [
            p('A plataforma utiliza cookies e tecnologias similares para:'),
            list([
              'Manter a sessão autenticada do usuário',
              'Armazenar preferências de uso',
              'Coletar dados de desempenho e uso para melhoria do produto (Vercel Analytics e Google Analytics 4)',
              'Exibir publicidade contextual e personalizada (apenas para usuários do plano gratuito), por meio do Google AdSense e parceiros',
            ]),
            p('Cookies de publicidade e analytics só são carregados após o usuário aceitar a categoria correspondente no banner de cookies. Quem optar por aceitar apenas os cookies essenciais não recebe scripts da Google AdSense, Google Analytics nem cookies do DoubleClick.'),
            p('O usuário pode gerenciar cookies nas configurações do navegador. A desativação de cookies essenciais pode impedir o funcionamento adequado da plataforma.'),
            p('Em conformidade com a LGPD (Brasil) e o GDPR (União Europeia), o usuário tem o direito de revogar a qualquer momento o consentimento para cookies de publicidade e analytics, ajustando a preferência no banner de cookies, no painel da conta ou desativando a personalização diretamente no Google em https://www.google.com/settings/ads.'),
          ],
        },
        {
          title: '9. Direitos do titular dos dados',
          body: [
            p('O usuário titular dos dados tem direito a:'),
            list([
              'Confirmar a existência de tratamento dos seus dados',
              'Acessar os dados que a plataforma possui sobre si',
              'Corrigir dados incompletos, inexatos ou desatualizados',
              'Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a LGPD',
              'Solicitar a portabilidade dos dados',
              'Revogar o consentimento, quando o tratamento se basear nessa base legal',
              'Solicitar o encerramento da conta e a exclusão dos dados, ressalvadas as hipóteses de retenção legalmente previstas',
            ]),
            p('Para exercer esses direitos, o usuário deverá entrar em contato pelo email: hello@resenhadoteologo.com.'),
          ],
        },
        {
          title: '10. Retenção e exclusão de dados',
          body: [
            p('Os dados são mantidos enquanto a conta estiver ativa ou pelo prazo necessário para cumprir as finalidades descritas nesta Política.'),
            p('Após o encerramento da conta, poderemos reter determinados dados pelo prazo necessário para: cumprimento de obrigações legais, resolução de disputas, prevenção a fraudes e exercício de direitos em processos judiciais ou administrativos.'),
            p('Registros de aceite de Termos e consentimentos são retidos por período mínimo de 5 anos para fins de auditoria e defesa jurídica.'),
          ],
        },
        {
          title: '11. Segurança dos dados',
          body: [
            p('Adotamos medidas técnicas e organizacionais para proteger os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição indevida, incluindo: autenticação segura, criptografia em trânsito (HTTPS), controle de acesso por função e monitoramento de segurança.'),
            p('Nenhum sistema é completamente invulnerável. Em caso de incidente de segurança que possa causar risco ou dano relevante aos titulares, notificaremos as partes afetadas e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD.'),
          ],
        },
        {
          title: '12. Alterações desta Política',
          body: [
            p('Esta Política de Privacidade poderá ser atualizada periodicamente para refletir mudanças nos serviços, na legislação ou nas práticas de tratamento de dados.'),
            p('Quando houver alterações relevantes, notificaremos os usuários por email ou por aviso dentro da plataforma. A continuidade de uso após a publicação de nova versão implica concordância com a Política atualizada.'),
          ],
        },
        {
          title: '13. Contato e encarregado de dados',
          body: [
            p('Para questões, solicitações ou reclamações relacionadas à privacidade e ao tratamento de dados pessoais, entre em contato pelo email: hello@resenhadoteologo.com.'),
            p('A plataforma designará formalmente um Encarregado de Proteção de Dados (DPO) conforme o crescimento da operação e as exigências regulatórias aplicáveis.'),
          ],
        },
      ]}
    />
  )
}
