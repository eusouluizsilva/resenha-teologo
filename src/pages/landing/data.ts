// Constantes estáticas da landing. Mover daqui pro CMS seria caro e o conteúdo
// muda raramente, então fica em código com type-safety. Cada seção importa só
// o que precisa.

export const heroStats = [
  { value: '100%', label: 'gratuito para alunos' },
  { value: '70%', label: 'média mínima para certificar' },
  { value: 'PT', label: 'base pensada para o Brasil' },
  { value: 'Multi', label: 'perfis: aluno, professor e instituição' },
]

export const accessModel = [
  {
    eyebrow: 'Acesso livre',
    title: 'Todo conteúdo é gratuito para quem quer aprender.',
    description:
      'A plataforma remove a barreira da compra. O aluno entra, estuda e avança sem precisar pagar para começar.',
    dark: true,
    items: ['Sem venda de cursos', 'Certificação com média mínima', 'Experiência pensada para permanência'],
  },
  {
    eyebrow: 'Professores',
    title: 'Ensine com autoridade, sem transformar seu conteúdo em página de vendas.',
    description:
      'Professores publicam cursos em um ambiente sério, acompanham o progresso dos alunos e recebem apoio da comunidade sem depender de funis de venda.',
    dark: false,
    items: ['Dashboard de cursos e aulas', 'Doações e apoio da audiência', 'Espaço próprio dentro da plataforma'],
  },
  {
    eyebrow: 'Premium opcional',
    title: 'A receita não depende de bloquear o estudo.',
    description:
      'Os planos sem anúncios melhoram a experiência, mas o centro da proposta continua sendo acesso livre para estudar.',
    dark: false,
    items: ['Aluno sem anúncios', 'Professor sem anúncios no seu espaço', 'Camada premium sem travar o estudo'],
  },
]

export const learningFlow = [
  {
    step: '01',
    title: 'Assista com progresso real',
    description:
      'Vídeo, acompanhamento de tempo assistido e estrutura por módulos deixam o estudo mais sério e mais claro.',
  },
  {
    step: '02',
    title: 'Leia, anote e consulte',
    description:
      'Bíblia integrada, materiais de apoio e caderno digital ficam ao lado da aula, não escondidos em outra tela.',
  },
  {
    step: '03',
    title: 'Consolide o aprendizado',
    description:
      'Questionários por aula e média final transformam a aula em formação real, não só consumo de conteúdo.',
  },
]

export const studentFeatures = [
  {
    title: 'Bíblia e aula no mesmo ambiente',
    description:
      'Múltiplas traduções em um só lugar, com expansão prevista para grego, hebraico e interlinear, sem interromper o estudo.',
  },
  {
    title: 'Caderno digital vinculado ao estudo',
    description:
      'Notas por aula, por tema e por contexto. O estudo deixa de ser disperso e passa a morar dentro da plataforma.',
  },
  {
    title: 'Certificação baseada em aproveitamento',
    description:
      'O certificado é consequência da aprendizagem. A média mínima de 70% preserva sua credibilidade.',
  },
]

export const creatorFeatures = [
  'Criação de cursos, módulos e aulas em um fluxo simples',
  'Questionários por aula com estrutura já integrada ao produto',
  'Doações e apoio voluntário da audiência dentro da plataforma',
  'Visibilidade para quem ainda não tem audiência consolidada',
  'Estrutura preparada para crescer sem retrabalho técnico',
]

export const institutionFeatures = [
  {
    title: 'Matrícula em lote',
    description: 'Pastores, igrejas e instituições podem organizar o estudo coletivo com menos fricção operacional.',
  },
  {
    title: 'Acompanhamento centralizado',
    description: 'A visão institucional acompanha progresso, participação e evolução da comunidade em um só lugar.',
  },
  {
    title: 'Trilha própria de formação',
    description: 'A plataforma evolui com espaço para programas personalizados, identidade própria e governança mais madura.',
  },
]

export const comparisonRows = [
  { item: 'Todo conteúdo gratuito para alunos', platform: true, hotmart: false, youtube: true, generic: false },
  { item: 'Foco nativo em formação teológica', platform: true, hotmart: false, youtube: false, generic: false },
  { item: 'Avaliação com certificado por aproveitamento', platform: true, hotmart: true, youtube: false, generic: true },
  { item: 'Caderno digital vinculado à aula', platform: true, hotmart: false, youtube: false, generic: false },
  { item: 'Doações diretas para o criador', platform: true, hotmart: false, youtube: true, generic: false },
  { item: 'Sem venda obrigatória de cursos', platform: true, hotmart: false, youtube: true, generic: false },
]

export const libraryFeatures = [
  'Traduções em português, inglês e camadas futuras multilíngues',
  'Textos originais, interlinear e consulta durante a aula',
  'Materiais de apoio por curso, aula e trilha de estudo',
  'Ambiente mais próximo de biblioteca contemporânea do que de portal genérico',
]

export const plans = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: '',
    description: 'Acesso completo a todos os cursos, com anúncios.',
    features: ['Todos os cursos disponíveis', 'Quizzes e avaliações', 'Certificados de conclusão', 'Bíblia integrada'],
    cta: 'Criar conta grátis',
    href: '/cadastro?perfil=aluno',
    highlight: false,
  },
  {
    name: 'Premium',
    price: 'R$ 9,99',
    period: '/mês',
    description: 'A mesma formação, sem anúncios e com experiência mais limpa.',
    features: ['Tudo do plano Gratuito', 'Sem anúncios em toda a plataforma', 'Acesso prioritário a novidades', 'Suporte por email'],
    cta: 'Assinar Premium',
    href: '/dashboard/planos',
    highlight: true,
  },
  {
    name: 'Criador / Professor / Igreja / Instituição de Ensino',
    price: 'R$ 39,99',
    period: '/mês',
    description: 'Para criadores, professores, igrejas e instituições que querem publicar cursos e organizar a formação de muitos alunos, sem anúncios.',
    features: ['Publicação ilimitada de cursos e artigos', 'Matrícula e painel de progresso coletivo', 'Membros e alunos ilimitados', 'Sem anúncios para o seu público'],
    cta: 'Solicitar plano institucional',
    href: 'mailto:hello@resenhadoteologo.com',
    highlight: false,
  },
]
