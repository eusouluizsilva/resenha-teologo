import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { toSlug } from './lib/slug'

// ---------------------------------------------------------------------------
// SEED — Curso "Interpretação Bíblica: o poder do contexto imediato"
// Disparado uma única vez via `npx convex run --prod seedCourses:seedInterpretacaoBiblica`.
// Idempotente: detecta um curso anterior com o mesmo slug e aborta para nao
// duplicar. Para reseed, apague antes via admin:deleteCourseCascade ou pelo
// painel.
// ---------------------------------------------------------------------------

type Verse = {
  bookSlug: string
  chapter: number
  verseStart: number
  verseEnd: number
  testament: 'old' | 'new'
}

type Question = {
  text: string
  options: string[]
  correctIndex: number
  explanation: string
}

type LessonSeed = {
  number: number
  title: string
  description: string
  youtubeId: string
  durationSeconds: number
  versesRefs: Verse[]
  questions: Question[]
}

const COURSE_SLUG = 'interpretacao-biblica-o-poder-do-contexto-imediato'
const COURSE_TITLE = 'Interpretação Bíblica: o poder do contexto imediato'
const COURSE_THUMB = 'https://i.ytimg.com/vi/fHYJKDLNuq8/maxresdefault.jpg'

const COURSE_DESCRIPTION = `Curso gratuito e completo sobre como interpretar a Bíblia usando o contexto imediato como ferramenta principal. Você vai aprender por que ler o versículo isolado é o erro mais comum entre cristãos e como uma única mudança simples, ler o parágrafo inteiro, transforma a sua leitura para sempre.

São 12 aulas em três módulos. No primeiro módulo você entende o que é contexto imediato, identifica os 5 erros que destroem a leitura bíblica e aprende um método prático de 4 passos. No segundo módulo aplicamos o método nos versículos mais famosos e mais distorcidos da igreja brasileira, como Jeremias 29:11, Filipenses 4:13, Mateus 18:20, Mateus 7:1, 1 Coríntios 10:13 e Romanos 8:28. No terceiro módulo você aprende como o contexto funciona em cada gênero literário da Bíblia, narrativas, cartas, salmos, provérbios e profecia.

O curso é 100% gratuito. Inclui eBook completo em PDF anexo a todas as aulas, quizzes obrigatórios para fixação de cada conteúdo e certificado de conclusão para quem alcançar 70% de aproveitamento.

Para quem prefere o formato Kindle, a versão digital também está disponível na Amazon (apenas EUA por enquanto): https://www.amazon.com/dp/B0GXBHDWWZ`

const TAGS = ['hermenêutica', 'bíblia', 'interpretação', 'contexto', 'exegese']

const MODULES: { title: string; lessonNumbers: number[] }[] = [
  { title: 'Módulo 1, Fundamentos', lessonNumbers: [1, 2, 3] },
  { title: 'Módulo 2, Versículos famosos fora de contexto', lessonNumbers: [4, 5, 6, 7, 8, 9] },
  { title: 'Módulo 3, Gêneros literários', lessonNumbers: [10, 11, 12] },
]

const LESSONS: LessonSeed[] = [
  {
    number: 1,
    title: 'Aula 01, O que é contexto imediato e por que ele muda tudo',
    description:
      'O que é contexto imediato e por que ele é o primeiro passo para interpretar a Bíblia corretamente. Você aprende como o contexto imediato se diferencia do contexto histórico, cultural e canônico, por que ler o versículo isolado é o erro mais comum entre cristãos e como Filipenses 4:13 muda completamente de sentido quando você lê o parágrafo. Estudamos também o que 2 Timóteo 2:15 e 2 Pedro 3:16 ensinam sobre manejar a Palavra com responsabilidade.',
    youtubeId: 'fHYJKDLNuq8',
    durationSeconds: 402,
    versesRefs: [
      { bookSlug: 'filipenses', chapter: 4, verseStart: 11, verseEnd: 13, testament: 'new' },
      { bookSlug: '2-timoteo', chapter: 2, verseStart: 15, verseEnd: 15, testament: 'new' },
      { bookSlug: '2-pedro', chapter: 3, verseStart: 16, verseEnd: 16, testament: 'new' },
    ],
    questions: [
      {
        text: 'Segundo a aula, o que é contexto imediato?',
        options: [
          'A época em que o texto foi escrito',
          'Os versículos que vêm antes e depois, o parágrafo onde o versículo está inserido',
          'A tradução em que você está lendo o texto',
          'A interpretação que o pastor da sua igreja dá ao texto',
        ],
        correctIndex: 1,
        explanation:
          'Contexto imediato é o que está ao redor do versículo, os versículos antes, os versículos depois, o parágrafo e o argumento que o autor está desenvolvendo.',
      },
      {
        text: 'Qual é a real ideia central de Filipenses 4:13 quando lido com os versículos 11 e 12?',
        options: [
          'Capacidade ilimitada de conquistar qualquer objetivo',
          'Promessa de prosperidade financeira para o cristão',
          'Contentamento e suficiência em Cristo em qualquer circunstância',
          'Garantia de cura física para todos os crentes',
        ],
        correctIndex: 2,
        explanation:
          'Paulo está falando de contentamento. Ele aprendeu a viver com pouco e com muito. O versículo 13 declara suficiência em Cristo, não vitória sobre tudo.',
      },
      {
        text: 'Quais quatro tipos de contexto a aula apresenta?',
        options: [
          'Pessoal, emocional, espiritual e doutrinário',
          'Histórico, cultural, canônico e imediato',
          'Antigo, novo, judaico e gentílico',
          'Literal, alegórico, místico e prático',
        ],
        correctIndex: 1,
        explanation:
          'Os quatro contextos apresentados são histórico, cultural, canônico e imediato. O imediato é o ponto de partida.',
      },
      {
        text: 'O que 2 Timóteo 2:15 ensina sobre como devemos tratar a Palavra?',
        options: [
          'Que devemos memorizar todos os versículos',
          'Que devemos manejá-la corretamente, com precisão, sem distorcer',
          'Que devemos pregá-la em todos os lugares',
          'Que devemos lê-la em grego e hebraico',
        ],
        correctIndex: 1,
        explanation:
          'Paulo manda manejar corretamente a palavra da verdade, ou seja, tratar o texto com precisão, sem torcer e sem arrancá-lo do lugar.',
      },
      {
        text: 'Segundo 2 Pedro 3:16, qual é a consequência de torcer as Escrituras?',
        options: [
          'Vergonha pública',
          'Repreensão da liderança',
          'Destruição',
          'Ignorância prolongada',
        ],
        correctIndex: 2,
        explanation:
          'Pedro afirma que os ignorantes e instáveis torcem as Escrituras para a própria destruição.',
      },
      {
        text: 'Por que o contexto imediato é apresentado como o primeiro passo?',
        options: [
          'Porque é a barreira mais simples e acessível contra o erro de interpretação',
          'Porque substitui a necessidade de qualquer estudo posterior',
          'Porque é o único contexto que importa',
          'Porque é o mais difícil de ser ignorado',
        ],
        correctIndex: 0,
        explanation:
          'O contexto imediato é simples, está ao alcance imediato de qualquer leitor e resolve a maioria dos problemas de interpretação antes de exigir estudos avançados.',
      },
      {
        text: 'O que a aula afirma sobre a maioria dos versículos usados fora de contexto?',
        options: [
          'Precisam de comentários teológicos avançados para serem corrigidos',
          'Exigem domínio do grego e do hebraico',
          'Bastaria que alguém lesse o que está antes e o que está depois',
          'Devem ser evitados pela igreja',
        ],
        correctIndex: 2,
        explanation:
          'A aula é direta: a maioria dos erros se corrigiria apenas com a leitura do parágrafo, sem necessidade de estudos avançados.',
      },
      {
        text: 'Quem é o autor da Carta de Filipenses citada no exemplo?',
        options: ['Pedro', 'João', 'Tiago', 'Paulo'],
        correctIndex: 3,
        explanation: 'A carta de Filipenses, da qual vem o famoso 4:13, foi escrita pelo apóstolo Paulo.',
      },
      {
        text: 'Segundo a aula, qual a diferença entre acertar e errar na interpretação?',
        options: [
          'É questão de fé',
          'É questão de denominação',
          'É questão de leitura',
          'É questão de inspiração',
        ],
        correctIndex: 2,
        explanation:
          'A aula afirma textualmente: a diferença entre acertar e errar não é questão de fé, é questão de leitura.',
      },
      {
        text: 'Qual ferramenta a aula define como a mais simples e poderosa para ler a Bíblia corretamente?',
        options: [
          'Concordância bíblica',
          'Comentário expositivo',
          'Contexto imediato',
          'Léxico grego e hebraico',
        ],
        correctIndex: 2,
        explanation:
          'A aula apresenta o contexto imediato como a ferramenta mais simples e mais poderosa para uma leitura responsável da Bíblia.',
      },
    ],
  },
  {
    number: 2,
    title: 'Aula 02, Os 5 erros que destroem sua leitura bíblica',
    description:
      'Cinco hábitos comuns que fazem o cristão interpretar mal a Bíblia toda semana. Você vai entender por que ler o versículo como promessa universal, pular para a aplicação sem ler o parágrafo, usar o texto para confirmar o que já acredita (eisegese), ignorar o gênero literário e espiritualizar textos com sentido literal claro são erros que sempre nascem da mesma raiz: ignorar o contexto imediato.',
    youtubeId: 'lslixRoEUxM',
    durationSeconds: 423,
    versesRefs: [
      { bookSlug: 'jeremias', chapter: 29, verseStart: 10, verseEnd: 11, testament: 'old' },
      { bookSlug: 'proverbios', chapter: 22, verseStart: 6, verseEnd: 6, testament: 'old' },
      { bookSlug: 'joao', chapter: 11, verseStart: 25, verseEnd: 25, testament: 'new' },
    ],
    questions: [
      {
        text: 'Qual erro número um a aula identifica?',
        options: [
          'Ler o versículo isolado como se fosse uma promessa universal',
          'Ler em traduções diferentes',
          'Ler somente o Antigo Testamento',
          'Ler em voz alta na igreja',
        ],
        correctIndex: 0,
        explanation:
          'O primeiro erro é ler o versículo isolado e transformá-lo em promessa universal, como acontece com Jeremias 29:11.',
      },
      {
        text: 'O que significa eisegese, citada como o terceiro erro?',
        options: [
          'Extrair do texto o pensamento do autor',
          'Levar para dentro do texto a opinião do leitor',
          'Comparar o texto com outros textos',
          'Ler o texto em sua língua original',
        ],
        correctIndex: 1,
        explanation:
          'Eisegese é o oposto de exegese. É projetar dentro do texto o pensamento do leitor em vez de extrair o pensamento do autor.',
      },
      {
        text: 'A aula compara eisegese e exegese como, respectivamente:',
        options: [
          'Ler como espelho e ler como janela',
          'Ler em voz alta e ler em silêncio',
          'Ler rápido e ler devagar',
          'Ler sozinho e ler em grupo',
        ],
        correctIndex: 0,
        explanation:
          'Eisegese é ler o texto como espelho, vendo só a si mesmo. Exegese é ler como janela, vendo o que o autor de fato disse.',
      },
      {
        text: 'Como a aula descreve a Bíblia em relação aos gêneros literários?',
        options: [
          'Um livro único de poesia',
          'Uma biblioteca com diferentes tipos de texto',
          'Um manual de doutrinas sistemáticas',
          'Um diário pessoal de cada autor',
        ],
        correctIndex: 1,
        explanation:
          'A Bíblia não é um livro só, é uma biblioteca com narrativas, poesia, lei, cartas, profecias, sabedoria e apocalipse.',
      },
      {
        text: 'Qual a diferença entre descrever e prescrever, citada na aula?',
        options: [
          'Descrever é narrar o que aconteceu, prescrever é ordenar como agir',
          'Descrever é falar de pessoas, prescrever é falar de Deus',
          'Descrever vale para o Antigo Testamento, prescrever para o Novo',
          'Descrever é literal, prescrever é simbólico',
        ],
        correctIndex: 0,
        explanation:
          'A Bíblia descreve o que aconteceu (narrativa) sem necessariamente prescrever, ou seja, sem mandar repetir.',
      },
      {
        text: 'Qual o erro número cinco apresentado na aula?',
        options: [
          'Ler poesia como prosa',
          'Espiritualizar textos que têm sentido literal claro',
          'Memorizar versículos sem entender',
          'Ouvir mais sermão do que ler a Bíblia',
        ],
        correctIndex: 1,
        explanation:
          'O quinto erro é espiritualizar textos que têm sentido literal claro, como acontece quando se transformam falas literais em alegoria.',
      },
      {
        text: 'A regra final do erro número cinco é:',
        options: [
          'Quando o sentido literal faz sentido, não busque outro sentido',
          'Sempre prefira o sentido alegórico',
          'Sempre use o sentido moral antes do literal',
          'Sempre confie na inspiração emocional',
        ],
        correctIndex: 0,
        explanation:
          'A regra é: quando o sentido literal faz sentido, não busque outro. Senão, todo sentido vira sem sentido.',
      },
      {
        text: 'Por que o devocional não pode ser apenas sentimento?',
        options: [
          'Porque sentimento é pecaminoso',
          'Porque precisa de compreensão, e compreensão exige ler o parágrafo',
          'Porque deve sempre durar uma hora',
          'Porque exige o uso obrigatório do hebraico',
        ],
        correctIndex: 1,
        explanation:
          'A aula afirma que o devocional precisa de compreensão, e compreensão exige ler o parágrafo, não só o versículo.',
      },
      {
        text: 'Qual é a função original dos versículos numerados na Bíblia?',
        options: [
          'Indicar mudanças de inspiração',
          'Marcar pausas litúrgicas',
          'Ferramenta de referência inserida séculos depois',
          'Separar promessas de mandamentos',
        ],
        correctIndex: 2,
        explanation:
          'Versículos foram inseridos séculos depois como ferramenta de referência. O texto original é um fluxo contínuo.',
      },
      {
        text: 'Qual elemento comum a aula identifica nos cinco erros apresentados?',
        options: [
          'Excesso de leitura',
          'Excesso de doutrina',
          'Ignorar o contexto imediato',
          'Falta de oração',
        ],
        correctIndex: 2,
        explanation:
          'A aula conclui que os cinco erros têm uma raiz comum: todos ignoram o contexto imediato.',
      },
    ],
  },
  {
    number: 3,
    title: 'Aula 03, Método prático: como ler o contexto em 4 passos',
    description:
      'Um método prático e replicável para nunca mais ler um versículo fora de contexto. Quatro passos simples que qualquer pessoa pode aplicar no devocional, na leitura diária ou na preparação de uma aula: ler o parágrafo inteiro, identificar o assunto principal, perguntar para quem foi escrito e por quê, e só então aplicar. Aplicado ao vivo em Romanos 8:28.',
    youtubeId: 'TRTFm49aHMw',
    durationSeconds: 415,
    versesRefs: [
      { bookSlug: 'romanos', chapter: 8, verseStart: 18, verseEnd: 30, testament: 'new' },
      { bookSlug: 'jeremias', chapter: 29, verseStart: 11, verseEnd: 11, testament: 'old' },
      { bookSlug: 'mateus', chapter: 7, verseStart: 1, verseEnd: 1, testament: 'new' },
    ],
    questions: [
      {
        text: 'Qual é o passo número um do método apresentado?',
        options: [
          'Ler o parágrafo inteiro, não o versículo',
          'Ler em duas traduções',
          'Buscar comentários antes de ler',
          'Memorizar antes de interpretar',
        ],
        correctIndex: 0,
        explanation:
          'O primeiro passo é ler o parágrafo inteiro, e de preferência o capítulo, para captar o pensamento contínuo do autor.',
      },
      {
        text: 'Qual é o passo número dois?',
        options: [
          'Comparar com outras religiões',
          'Identificar o assunto principal do trecho',
          'Sublinhar o versículo favorito',
          'Memorizar o versículo de cor',
        ],
        correctIndex: 1,
        explanation:
          'O passo dois é identificar o assunto principal do trecho, ou seja, o tema central que o autor está tratando.',
      },
      {
        text: 'Segundo a aula, qual é o real assunto de Romanos 8:28 quando lemos o contexto?',
        options: [
          'Prosperidade financeira',
          'Cura física',
          'Sofrimento e conformidade com Cristo',
          'Vida pré-existente',
        ],
        correctIndex: 2,
        explanation:
          'Romanos 8:28 está dentro de um trecho que fala de sofrimento, gemido da criação e fraqueza humana. O bem é conformidade com Cristo (v.29).',
      },
      {
        text: 'Qual é o passo número três do método?',
        options: [
          'Perguntar para quem foi escrito e por quê',
          'Marcar o texto com canetas coloridas',
          'Pesquisar no Google antes de ler',
          'Decorar o capítulo',
        ],
        correctIndex: 0,
        explanation:
          'O passo três é perguntar quem é o destinatário e qual é a situação tratada, antes de aplicar.',
      },
      {
        text: 'Qual é a regra de ouro citada sobre o sentido do texto?',
        options: [
          'O texto pode significar qualquer coisa que faça bem ao leitor',
          'O texto não pode significar pra nós algo que nunca significou para os leitores originais',
          'O texto significa o que o pastor diz que significa',
          'O texto significa o que sentirmos no momento',
        ],
        correctIndex: 1,
        explanation:
          'A regra de ouro é: o texto não pode significar para nós algo que nunca significou para os leitores originais.',
      },
      {
        text: 'Em que ordem a aplicação deve aparecer no método?',
        options: ['Primeiro', 'Segundo', 'Terceiro', 'Quarto, último'],
        correctIndex: 3,
        explanation:
          'A aplicação é o último passo, não o primeiro. Vem depois de ler o parágrafo, identificar o assunto e entender o destinatário.',
      },
      {
        text: 'Para Jeremias 29:11, qual era o destinatário original?',
        options: [
          'Os apóstolos',
          'O povo de Judá no exílio em Babilônia',
          'Os fariseus',
          'A igreja primitiva',
        ],
        correctIndex: 1,
        explanation:
          'Jeremias estava falando ao povo de Judá deportado para a Babilônia, num cenário de exílio.',
      },
      {
        text: 'O método dispensa o uso de grego e hebraico?',
        options: [
          'Não, exige domínio das línguas originais',
          'Sim, qualquer pessoa pode aplicá-lo sem essas línguas',
          'Apenas para o Novo Testamento',
          'Apenas se a tradução for KJV',
        ],
        correctIndex: 1,
        explanation:
          'A aula deixa claro que o método é acessível, não exige grego, hebraico, comentários ou seminário.',
      },
      {
        text: 'Quando Jesus disse não julgueis, em que contexto Ele estava?',
        options: [
          'Última Ceia',
          'Sermão do Monte',
          'Discurso do Cenáculo',
          'Diante de Pilatos',
        ],
        correctIndex: 1,
        explanation:
          'A frase está no Sermão do Monte (Mateus 7), tratando do perigo da hipocrisia religiosa.',
      },
      {
        text: 'Por que a aplicação fica mais rica quando vem depois dos outros passos?',
        options: [
          'Porque o leitor já se cansou e aceita qualquer coisa',
          'Porque deixa de ser projeção dos desejos do leitor e passa a ser o texto falando com autoridade',
          'Porque o pastor já validou o sentido',
          'Porque a aplicação só vale após oração de uma hora',
        ],
        correctIndex: 1,
        explanation:
          'A aplicação correta vem por último porque deixa de ser projeção dos desejos do leitor e se torna o texto falando com autoridade sobre a vida real.',
      },
    ],
  },
  {
    number: 4,
    title: 'Aula 04, Jeremias 29:11 não é sobre você',
    description:
      'O versículo mais tatuado e mais usado fora de contexto no Brasil. Você vai descobrir que Jeremias 29:11 foi escrito a um povo em exílio na Babilônia, com prazo de 70 anos de espera, e que entender esse contexto não diminui o texto, ao contrário, revela um consolo muito mais profundo: a fidelidade de Deus mesmo no juízo.',
    youtubeId: 'yF6P4JOEH8c',
    durationSeconds: 362,
    versesRefs: [
      { bookSlug: 'jeremias', chapter: 29, verseStart: 1, verseEnd: 14, testament: 'old' },
    ],
    questions: [
      {
        text: 'A quem Jeremias 29:11 foi originalmente endereçada?',
        options: [
          'Aos cristãos modernos',
          'Aos exilados de Judá em Babilônia',
          'Aos discípulos de Jesus',
          'Ao rei Davi',
        ],
        correctIndex: 1,
        explanation:
          'A carta foi escrita por Jeremias aos líderes, sacerdotes, profetas e ao povo deportado por Nabucodonosor à Babilônia.',
      },
      {
        text: 'Que tempo de espera Deus anuncia antes de cumprir a promessa de restauração?',
        options: ['Sete anos', 'Quarenta anos', 'Setenta anos', 'Cem anos'],
        correctIndex: 2,
        explanation:
          'Jeremias 29:10 diz que após se completarem setenta anos em Babilônia, Deus traria o povo de volta.',
      },
      {
        text: 'O que Deus, por meio de Jeremias, manda o povo fazer durante o exílio (vv.4-7)?',
        options: [
          'Conspirar contra os babilônios',
          'Voltar imediatamente para Jerusalém',
          'Construir casas, plantar, casar os filhos e orar pela cidade',
          'Permanecer em jejum até o livramento',
        ],
        correctIndex: 2,
        explanation:
          'Deus manda se estabelecerem, construírem casas, plantarem, casarem os filhos e orarem pela prosperidade da cidade.',
      },
      {
        text: 'O contexto histórico do texto é:',
        options: [
          'A entrada na Terra Prometida',
          'A reforma de Esdras',
          'O exílio babilônico após a destruição de Jerusalém',
          'O reinado de Salomão',
        ],
        correctIndex: 2,
        explanation:
          'O cenário é o exílio babilônico, após a derrota de Judá e a destruição de Jerusalém e do templo.',
      },
      {
        text: 'O versículo NÃO ensina que Deus:',
        options: [
          'É fiel mesmo quando o povo falha',
          'Tem propósitos no meio do juízo',
          'Vai realizar todos os planos pessoais de carreira do leitor',
          'Não abandona quem é dele',
        ],
        correctIndex: 2,
        explanation:
          'O texto não promete realização de planos pessoais de carreira. Essa é uma leitura individualista importada.',
      },
      {
        text: 'Qual a aplicação legítima de Jeremias 29:11 para o cristão hoje?',
        options: [
          'Garantia de prosperidade material',
          'Confiança no caráter fiel de Deus em meio ao sofrimento',
          'Promessa de cura imediata',
          'Garantia de viagem missionária',
        ],
        correctIndex: 1,
        explanation:
          'A aplicação legítima é confiar no caráter fiel de Deus, que não abandona o seu povo mesmo no juízo, não usar o versículo como mantra pessoal.',
      },
      {
        text: 'Quem trouxe o povo de Judá ao exílio?',
        options: [
          'Os assírios sob Senaqueribe',
          'Os egípcios sob Faraó Neco',
          'Os babilônios sob Nabucodonosor',
          'Os persas sob Ciro',
        ],
        correctIndex: 2,
        explanation:
          'O texto cita expressamente que Nabucodonosor havia deportado o povo de Jerusalém para a Babilônia.',
      },
      {
        text: 'A aula afirma que entender o contexto faz o texto:',
        options: ['Ficar menor', 'Perder valor devocional', 'Ficar maior, mais profundo', 'Virar lenda'],
        correctIndex: 2,
        explanation:
          'A aula é categórica: o texto não fica menor com o contexto, ele fica maior, mais profundo e mais consolador.',
      },
      {
        text: 'O que está sendo prometido em Jeremias 29:11 é primariamente:',
        options: [
          'Sucesso individual imediato',
          'Restauração coletiva do povo de Deus após 70 anos',
          'Multiplicação financeira',
          'Cura física',
        ],
        correctIndex: 1,
        explanation:
          'A promessa é coletiva, ao povo, e diz respeito à restauração após o exílio de 70 anos.',
      },
      {
        text: 'Qual a esperança verdadeira que o texto aponta?',
        options: [
          'Ausência de dificuldade',
          'A presença de Deus na dificuldade',
          'Eliminação imediata dos inimigos',
          'Renovação do reino davídico no exílio',
        ],
        correctIndex: 1,
        explanation:
          'A esperança não está na ausência de dificuldade, mas na presença fiel de Deus dentro da dificuldade.',
      },
    ],
  },
  {
    number: 5,
    title: 'Aula 05, Filipenses 4:13 não é autoajuda',
    description:
      'O famoso "tudo posso naquele que me fortalece" lido dentro do parágrafo. Você vai entender que Paulo escreveu essa frase preso, ao agradecer a oferta da igreja de Filipos, depois de declarar que aprendeu o segredo do contentamento em qualquer circunstância. O versículo não é um grito de conquista. É uma declaração de suficiência em Cristo.',
    youtubeId: 'hd5-wgPP83E',
    durationSeconds: 276,
    versesRefs: [
      { bookSlug: 'filipenses', chapter: 4, verseStart: 10, verseEnd: 13, testament: 'new' },
    ],
    questions: [
      {
        text: 'Em que situação Paulo escreveu Filipenses?',
        options: [
          'Em uma viagem missionária pacífica',
          'Em uma conferência em Jerusalém',
          'Preso em uma prisão romana',
          'Em casa, durante um período sabático',
        ],
        correctIndex: 2,
        explanation: 'Paulo escreveu Filipenses enquanto estava preso em uma prisão romana.',
      },
      {
        text: 'O motivo direto do trecho de Filipenses 4:10-13 é:',
        options: [
          'Uma repreensão à igreja',
          'Um agradecimento por uma oferta enviada pela igreja de Filipos',
          'Um sermão sobre o céu',
          'Uma defesa pessoal contra acusações',
        ],
        correctIndex: 1,
        explanation:
          'Paulo está agradecendo a oferta enviada pela igreja de Filipos. É nesse contexto que ele fala de contentamento.',
      },
      {
        text: 'Que palavra-chave Paulo usa para descrever o que aprendeu nos versos 11 e 12?',
        options: ['Vitória', 'Contentamento', 'Conquista', 'Influência'],
        correctIndex: 1,
        explanation:
          'Paulo aprendeu o "segredo" de viver contente em qualquer situação, com pouco ou com muito.',
      },
      {
        text: 'Quando Paulo diz "tudo posso", a que "tudo" ele se refere segundo o contexto?',
        options: [
          'Conquistar tudo o que quiser',
          'Vencer qualquer competição',
          'Enfrentar qualquer circunstância, boa ou ruim, com a força de Cristo',
          'Fazer milagres a qualquer momento',
        ],
        correctIndex: 2,
        explanation:
          'O "tudo" é enfrentar qualquer circunstância, fome ou fartura, sustentado por Cristo, não conquista ilimitada.',
      },
      {
        text: 'Qual é a diferença entre autoajuda e o ensino de Paulo?',
        options: [
          'Autoajuda depende da força do indivíduo, Paulo depende da força de Cristo',
          'Autoajuda é cristã, Paulo é estoico',
          'Autoajuda fala de Deus, Paulo fala do homem',
          'Não há diferença',
        ],
        correctIndex: 0,
        explanation:
          'Autoajuda diz: você pode tudo se acreditar em si. Paulo diz: posso tudo porque Cristo me fortalece. A fonte é diferente.',
      },
      {
        text: 'O que Paulo havia aprendido a viver?',
        options: [
          'Apenas a fartura',
          'Apenas a necessidade',
          'Tanto a necessidade quanto a fartura, com contentamento',
          'Apenas a vida monástica',
        ],
        correctIndex: 2,
        explanation:
          'Paulo afirma ter aprendido a viver com pouco e com muito, em fartura ou em fome, sempre contente.',
      },
      {
        text: 'Quantos versículos antes do v.13 são suficientes para mudar a interpretação?',
        options: ['Nenhum', 'Apenas o capítulo 1', 'Os três versículos imediatamente anteriores', 'Toda a carta'],
        correctIndex: 2,
        explanation:
          'A aula mostra que ler apenas três versículos antes (v.10-12) muda completamente o sentido do v.13.',
      },
      {
        text: 'O que a teologia da prosperidade fez com Filipenses 4:13?',
        options: [
          'Pregou-o em seu sentido original',
          'Transformou-o em declaração de sucesso financeiro e profissional',
          'Excluiu-o do cânon protestante',
          'Tornou-o opcional',
        ],
        correctIndex: 1,
        explanation:
          'A teologia da prosperidade transformou o versículo em declaração de sucesso material, contrariando o contexto de contentamento.',
      },
      {
        text: 'O versículo, em seu contexto, mostra que a fonte da satisfação cristã é:',
        options: ['As circunstâncias', 'Cristo', 'O esforço pessoal', 'A comunidade'],
        correctIndex: 1,
        explanation:
          'A fonte da satisfação não está nas circunstâncias, mas em Cristo. Por isso Paulo está contente preso.',
      },
      {
        text: 'Segundo a aula, o sentido correto do versículo torna o texto:',
        options: ['Mais fraco', 'Menor', 'Gigante, mais poderoso que a versão de autoajuda', 'Irrelevante'],
        correctIndex: 2,
        explanation:
          'A aula afirma que o versículo não fica menor com o contexto, fica gigante, porque promete sustento de Cristo em qualquer situação.',
      },
    ],
  },
  {
    number: 6,
    title: 'Aula 06, Mateus 18:20 não é sobre culto',
    description:
      'Onde dois ou três estiverem reunidos em Meu nome, ali estou no meio deles. Você vai descobrir que esse versículo está dentro de um ensino sobre disciplina eclesiástica, não sobre presença em culto, e que entender isso não diminui a frase, ao contrário, revela uma promessa poderosa sobre a autoridade de Cristo na comunidade que trata o pecado com seriedade.',
    youtubeId: '9Y0WaD-qISw',
    durationSeconds: 267,
    versesRefs: [
      { bookSlug: 'mateus', chapter: 18, verseStart: 15, verseEnd: 20, testament: 'new' },
    ],
    questions: [
      {
        text: 'Qual é o tema central de Mateus 18:15-20?',
        options: [
          'Casamento cristão',
          'Disciplina eclesiástica e correção do pecado entre irmãos',
          'Modelo de culto público',
          'Batismo de crianças',
        ],
        correctIndex: 1,
        explanation:
          'Jesus está ensinando sobre disciplina eclesiástica, o que fazer quando um irmão peca contra você.',
      },
      {
        text: 'Qual é a primeira etapa do processo descrito por Jesus?',
        options: [
          'Anunciar o erro publicamente',
          'Falar com o irmão a sós',
          'Levar o caso direto à igreja',
          'Ignorar o problema',
        ],
        correctIndex: 1,
        explanation:
          'A primeira etapa é falar a sós com o irmão e mostrar o erro, conforme v.15.',
      },
      {
        text: 'Se o irmão não ouvir a primeira tentativa, o que se faz?',
        options: [
          'Levar uma ou duas testemunhas',
          'Excluí-lo imediatamente',
          'Esquecer o assunto',
          'Postar nas redes sociais',
        ],
        correctIndex: 0,
        explanation:
          'No v.16, Jesus orienta levar uma ou duas testemunhas para confirmar o caso.',
      },
      {
        text: 'O que significa "ligar e desligar" no v.18?',
        options: [
          'Decretar bênçãos e maldições',
          'Operar curas e libertações',
          'Exercer autoridade da comunidade cristã para tratar o pecado, com respaldo celestial',
          'Reservar lugares no céu',
        ],
        correctIndex: 2,
        explanation:
          'Ligar e desligar diz respeito à autoridade da comunidade para tratar o pecado, com chancela do céu.',
      },
      {
        text: 'Quando o v.19 fala de dois concordando em qualquer assunto, isso se aplica:',
        options: [
          'A qualquer pedido genérico',
          'A pedidos sobre saúde e finanças',
          'No contexto da disciplina e autoridade que Jesus está descrevendo',
          'Somente em datas litúrgicas',
        ],
        correctIndex: 2,
        explanation:
          'O acordo do v.19 está dentro do contexto da disciplina, não é um cheque em branco para qualquer pedido.',
      },
      {
        text: 'A presença prometida no v.20 é em qual contexto?',
        options: [
          'Apenas em cultos com poucos presentes',
          'Quando a comunidade se reúne para exercer disciplina em nome de Cristo',
          'Apenas em conferências',
          'Apenas em domingos',
        ],
        correctIndex: 1,
        explanation:
          'A presença prometida é no contexto da disciplina eclesiástica em nome de Cristo, não em culto pequeno qualquer.',
      },
      {
        text: 'O que o texto NÃO ensina?',
        options: [
          'Que Deus está presente em qualquer reunião com mais de duas pessoas',
          'Que a disciplina é uma prática autorizada por Cristo',
          'Que tratar o pecado do irmão é obediência a Cristo',
          'Que a comunidade cristã age com respaldo celestial',
        ],
        correctIndex: 0,
        explanation:
          'O texto não está dizendo que Deus só aparece em reunião pequena. Ele é onipresente. O foco é a disciplina.',
      },
      {
        text: 'Como tratar o irmão que se recusa a ouvir até a igreja, segundo v.17?',
        options: [
          'Como família',
          'Como pagão ou publicano',
          'Como visitante',
          'Como discípulo em formação',
        ],
        correctIndex: 1,
        explanation:
          'No v.17 Jesus orienta tratá-lo como pagão ou publicano se ele se recusar a ouvir até a igreja.',
      },
      {
        text: 'A confrontação entre irmãos, segundo a aula, NÃO é:',
        options: [
          'Obediência a Cristo',
          'Fofoca ou julgamento hipócrita',
          'Responsabilidade da comunidade',
          'Autorizada pelo Senhor',
        ],
        correctIndex: 1,
        explanation:
          'A aula é clara: tratar o pecado do irmão como Jesus ensinou não é fofoca nem julgamento hipócrita.',
      },
      {
        text: 'A leitura correta do v.20 eleva ou diminui o peso do texto?',
        options: ['Diminui', 'Eleva, mostrando a autoridade da igreja na disciplina', 'Não muda', 'Anula'],
        correctIndex: 1,
        explanation:
          'A leitura correta eleva o peso do texto, mostrando a autoridade da igreja com a presença ativa de Cristo.',
      },
    ],
  },
  {
    number: 7,
    title: 'Aula 07, Não julgueis: o versículo mais mal usado',
    description:
      'Mateus 7:1 lido dentro do Sermão do Monte. Você vai entender que Jesus não proibiu todo julgamento, Ele proibiu o julgamento hipócrita. O texto que muita gente usa como escudo para evitar correção é, na verdade, um chamado urgente à autoexame antes de ajudar o próximo, e o próprio Jesus, três versos depois, manda exercer discernimento.',
    youtubeId: 'gUW3a6KpCG8',
    durationSeconds: 290,
    versesRefs: [
      { bookSlug: 'mateus', chapter: 7, verseStart: 1, verseEnd: 6, testament: 'new' },
      { bookSlug: 'joao', chapter: 7, verseStart: 24, verseEnd: 24, testament: 'new' },
      { bookSlug: '1-corintios', chapter: 5, verseStart: 12, verseEnd: 13, testament: 'new' },
      { bookSlug: 'galatas', chapter: 6, verseStart: 1, verseEnd: 1, testament: 'new' },
    ],
    questions: [
      {
        text: 'O que Jesus realmente proíbe em Mateus 7:1?',
        options: [
          'Qualquer forma de julgamento moral',
          'O julgamento hipócrita',
          'A leitura da lei',
          'A confrontação respeitosa',
        ],
        correctIndex: 1,
        explanation:
          'Jesus não proíbe todo julgamento, Ele proíbe julgar com hipocrisia, sem antes examinar a si mesmo.',
      },
      {
        text: 'Qual é a imagem usada por Jesus para mostrar o problema do julgamento sem autoexame?',
        options: [
          'Espinho e flor',
          'Cisco e viga',
          'Lobo e ovelha',
          'Trigo e joio',
        ],
        correctIndex: 1,
        explanation:
          'A imagem é do cisco no olho do irmão e da viga no próprio olho de quem julga.',
      },
      {
        text: 'O que se deve fazer primeiro segundo o v.5?',
        options: [
          'Ignorar o cisco',
          'Tirar a viga do próprio olho',
          'Levar o caso à igreja',
          'Chamar o pastor',
        ],
        correctIndex: 1,
        explanation:
          'O v.5 manda tirar primeiro a viga do próprio olho. Só então se enxerga claramente para tirar o cisco do irmão.',
      },
      {
        text: 'O que Jesus manda no v.6, logo depois?',
        options: [
          'Não dar o que é santo aos cães nem pérolas aos porcos',
          'Não levantar a voz na sinagoga',
          'Não responder os fariseus',
          'Não cobrar impostos',
        ],
        correctIndex: 0,
        explanation:
          'No v.6 Jesus manda discernir, não dar o santo aos cães nem pérolas aos porcos, o que pressupõe avaliar caráter.',
      },
      {
        text: 'João 7:24, citado na aula, manda fazer:',
        options: [
          'Julgamento por aparência',
          'Julgamento justo, com discernimento',
          'Silêncio absoluto',
          'Apenas perguntas',
        ],
        correctIndex: 1,
        explanation:
          'Jesus manda parar de julgar pela aparência e fazer um julgamento justo (Jo 7:24).',
      },
      {
        text: 'Em 1 Coríntios 5, Paulo afirma que a igreja deve julgar:',
        options: [
          'Os que estão de fora',
          'Os que estão dentro',
          'Apenas os pastores',
          'Apenas em assembleias',
        ],
        correctIndex: 1,
        explanation:
          'Paulo questiona retoricamente: não devem vocês julgar os que estão dentro? A igreja exerce julgamento interno.',
      },
      {
        text: 'Em Gálatas 6:1, como deve ser feita a restauração do irmão em pecado?',
        options: [
          'Com mansidão, pelos espirituais',
          'Com dureza',
          'Apenas por escrito',
          'Apenas pelos apóstolos',
        ],
        correctIndex: 0,
        explanation:
          'Gálatas 6:1 fala em restaurar com mansidão, ato realizado por aqueles que são espirituais.',
      },
      {
        text: 'O que Mateus 7:1 NÃO ensina?',
        options: [
          'Que o julgamento começa por si mesmo',
          'Que a hipocrisia invalida a correção',
          'Que é errado apontar pecado',
          'Que o cristão deve se examinar antes de corrigir',
        ],
        correctIndex: 2,
        explanation:
          'O versículo não diz que é errado apontar pecado. Diz que é errado apontar com hipocrisia.',
      },
      {
        text: 'Restaurar o irmão pressupõe:',
        options: [
          'Ignorar o pecado',
          'Identificar o pecado',
          'Postar nas redes',
          'Excomungar imediatamente',
        ],
        correctIndex: 1,
        explanation:
          'Para restaurar é preciso primeiro identificar o pecado, o que é uma forma de julgamento bíblico legítimo.',
      },
      {
        text: 'A aula apresenta a relação entre julgar com hipocrisia e exercer discernimento como:',
        options: [
          'Contradição',
          'Equilíbrio bíblico',
          'Tensão impossível',
          'Sinônimos',
        ],
        correctIndex: 1,
        explanation:
          'Jesus proibiu o julgamento hipócrita (v.1) e mandou exercer discernimento (v.6). Não é contradição, é equilíbrio.',
      },
    ],
  },
  {
    number: 8,
    title: 'Aula 08, Deus não dá fardo maior? Esse versículo nem existe',
    description:
      'A frase "Deus não dá fardo maior do que a gente pode carregar" é uma das mais repetidas nas igrejas brasileiras, e não existe na Bíblia da forma como é citada. Você vai entender que 1 Coríntios 10:13 fala de tentação ao pecado, não de sofrimento, e que reler o texto no contexto da advertência de Paulo aos coríntios traz um consolo bem mais honesto e bem mais sólido.',
    youtubeId: 'mnUPkvtffns',
    durationSeconds: 318,
    versesRefs: [
      { bookSlug: '1-corintios', chapter: 10, verseStart: 1, verseEnd: 13, testament: 'new' },
      { bookSlug: '2-corintios', chapter: 1, verseStart: 8, verseEnd: 9, testament: 'new' },
      { bookSlug: '2-corintios', chapter: 12, verseStart: 9, verseEnd: 9, testament: 'new' },
    ],
    questions: [
      {
        text: 'A frase popular "Deus não dá fardo maior" tem origem em qual versículo?',
        options: [
          'João 14:1',
          '1 Coríntios 10:13',
          'Salmo 23:1',
          'Romanos 8:28',
        ],
        correctIndex: 1,
        explanation:
          'A frase é uma adaptação distorcida de 1 Coríntios 10:13, que originalmente trata de tentação, não de sofrimento.',
      },
      {
        text: 'Qual é o tema real de 1 Coríntios 10:13?',
        options: [
          'Sofrimento físico',
          'Tentação ao pecado',
          'Liderança eclesiástica',
          'Casamento',
        ],
        correctIndex: 1,
        explanation:
          'O texto diz que Deus não permitirá que sejam tentados além do que podem suportar, falando de tentação ao pecado.',
      },
      {
        text: 'Qual história Paulo recapitula nos vv.1-5 antes do v.13?',
        options: [
          'A criação do mundo',
          'A peregrinação de Israel no deserto e seus pecados',
          'A vida de Davi',
          'O ministério de João Batista',
        ],
        correctIndex: 1,
        explanation:
          'Paulo retoma Israel no deserto, lembrando que mesmo com tantas bênçãos eles caíram em pecado.',
      },
      {
        text: 'Qual a advertência do v.12?',
        options: [
          'Quem orar mais será aprovado',
          'Quem julga estar firme, cuide-se para não cair',
          'Quem pregar será salvo',
          'Quem jejuar não pecará',
        ],
        correctIndex: 1,
        explanation:
          'O v.12 alerta: quem julga estar firme, cuide-se para não cair, em sintonia com o tema do pecado.',
      },
      {
        text: 'Qual é o consolo real prometido em 1 Coríntios 10:13?',
        options: [
          'Sofrimento sempre suportável',
          'Cura imediata',
          'Que Deus providencia uma saída na tentação',
          'Riqueza material',
        ],
        correctIndex: 2,
        explanation:
          'A promessa é que Deus dá um escape na tentação, para que o cristão não precise ceder ao pecado.',
      },
      {
        text: 'O que Paulo diz em 2 Coríntios 1:8-9 sobre seu próprio sofrimento?',
        options: [
          'Que foi pequeno',
          'Que foi muito além da capacidade de suportar, ao ponto de perder a esperança da vida',
          'Que mal lembra',
          'Que foi resolvido com oração de uma manhã',
        ],
        correctIndex: 1,
        explanation:
          'Paulo escreve que seu sofrimento foi muito além do que podiam suportar, ao ponto de perderem a esperança da vida.',
      },
      {
        text: 'Por que isso prova que a frase popular é equivocada?',
        options: [
          'Porque Paulo era um homem fraco',
          'Porque mostra que sofrimento real pode sim exceder a capacidade humana',
          'Porque a carta é apócrifa',
          'Porque Paulo se referia apenas a si mesmo',
        ],
        correctIndex: 1,
        explanation:
          'O testemunho de Paulo mostra que sofrimento pode exceder a capacidade humana, contrariando a frase popular.',
      },
      {
        text: 'Em 2 Coríntios 12:9, como Paulo descreve a graça de Deus?',
        options: [
          'Suficiente, e o poder de Deus se aperfeiçoa na fraqueza',
          'Limitada à liderança',
          'Exclusiva dos apóstolos',
          'Substituível por jejum',
        ],
        correctIndex: 0,
        explanation:
          'A graça é suficiente, e o poder de Deus se aperfeiçoa na fraqueza, segundo 2 Coríntios 12:9.',
      },
      {
        text: 'A promessa real para o cristão diante do sofrimento, segundo a aula, é:',
        options: [
          'Que vai ser sempre suportável',
          'Que Deus estará presente, com graça suficiente',
          'Que o sofrimento será curto',
          'Que será revertido em prosperidade',
        ],
        correctIndex: 1,
        explanation:
          'A promessa real é a presença de Deus na dor, com graça suficiente, não que o sofrimento será leve.',
      },
      {
        text: 'O exemplo de Israel é apresentado no capítulo como:',
        options: [
          'Modelo a ser imitado',
          'Advertência para os coríntios e para nós',
          'Curiosidade histórica sem aplicação',
          'Profecia da volta de Cristo',
        ],
        correctIndex: 1,
        explanation:
          'O v.11 diz que aquelas coisas foram escritas como advertência para os que vivem no fim dos tempos.',
      },
    ],
  },
  {
    number: 9,
    title: 'Aula 09, Romanos 8:28 e o bem que Deus produz',
    description:
      'Sabemos que Deus age em todas as coisas para o bem dos que o amam. Você vai entender por que esse "bem" não é conforto e nem sucesso, mas conformidade com Cristo. Lendo Romanos 8:18 a 30 com atenção, descobrimos uma corrente dourada da salvação que sustenta o cristão em meio ao sofrimento, com um propósito definido por Deus.',
    youtubeId: 'ZShtrHLFc6Y',
    durationSeconds: 317,
    versesRefs: [
      { bookSlug: 'romanos', chapter: 8, verseStart: 18, verseEnd: 31, testament: 'new' },
    ],
    questions: [
      {
        text: 'Qual é o tema do trecho que antecede Romanos 8:28?',
        options: [
          'Casamento',
          'Sofrimento, gemido da criação e fraqueza humana',
          'Os dons espirituais',
          'A ceia do Senhor',
        ],
        correctIndex: 1,
        explanation:
          'O contexto trata de sofrimento, gemido da criação, fraqueza humana e a intercessão do Espírito.',
      },
      {
        text: 'Segundo o v.29, qual é o "bem" que Deus produz?',
        options: [
          'Sucesso financeiro',
          'Cura física imediata',
          'Conformidade à imagem de Cristo',
          'Reconhecimento social',
        ],
        correctIndex: 2,
        explanation:
          'O bem é a conformidade à imagem de Cristo, propósito da predestinação no v.29.',
      },
      {
        text: 'A "corrente dourada da salvação" no v.30 inclui, em ordem:',
        options: [
          'Conheceu, predestinou, chamou, justificou, glorificou',
          'Chamou, conheceu, justificou, predestinou, glorificou',
          'Predestinou, justificou, conheceu, chamou, glorificou',
          'Chamou, justificou, glorificou, santificou, ressuscitou',
        ],
        correctIndex: 0,
        explanation:
          'A ordem é: conheceu, predestinou, chamou, justificou, glorificou. Cada elo é obra de Deus.',
      },
      {
        text: 'Por que Paulo usa o verbo "glorificou" no passado?',
        options: [
          'Erro de cópia',
          'Porque na perspectiva de Deus é tão certo que é como já feito',
          'Porque já se cumpriu fisicamente',
          'Porque só vale para os apóstolos',
        ],
        correctIndex: 1,
        explanation:
          'Na perspectiva soberana de Deus, a glorificação é tão certa que Paulo a coloca no passado.',
      },
      {
        text: 'O que faz o Espírito Santo, segundo os vv.26-27?',
        options: [
          'Profere sentenças',
          'Intercede por nós com gemidos inexprimíveis',
          'Substitui o cristão na obediência',
          'Concede dons financeiros',
        ],
        correctIndex: 1,
        explanation:
          'O Espírito intercede por nós com gemidos inexprimíveis, porque nem sabemos orar como deveríamos.',
      },
      {
        text: 'A promessa de Romanos 8:28 NÃO ensina:',
        options: [
          'Que Deus está trabalhando em meio ao sofrimento',
          'Que o objetivo é conformar o cristão à imagem de Cristo',
          'Que tudo dará certo nos termos humanos de conforto',
          'Que Deus é fiel ao seu propósito',
        ],
        correctIndex: 2,
        explanation:
          'O texto não promete que tudo dará certo nos termos humanos. Promete propósito divino em meio ao sofrimento.',
      },
      {
        text: 'A pergunta retórica do v.31 conclui com:',
        options: [
          'Quem nos separará?',
          'Se Deus é por nós, quem será contra nós?',
          'Quem entende os caminhos do Senhor?',
          'Quem nos condena?',
        ],
        correctIndex: 1,
        explanation:
          'Paulo conclui no v.31 com a pergunta: se Deus é por nós, quem será contra nós?',
      },
      {
        text: 'O sofrimento, segundo a aula, no plano de Deus é:',
        options: [
          'Aleatório',
          'Punição',
          'Ferramenta para conformar o cristão à imagem de Cristo',
          'Sinal de incredulidade',
        ],
        correctIndex: 2,
        explanation:
          'O sofrimento é descrito como ferramenta soberana de Deus para conformar o cristão à imagem de Cristo.',
      },
      {
        text: 'Quem são os destinatários da promessa do v.28?',
        options: [
          'Toda a humanidade',
          'Apenas os judeus',
          'Os que amam a Deus, chamados segundo o seu propósito',
          'Apenas os pastores',
        ],
        correctIndex: 2,
        explanation:
          'A promessa é dirigida aos que amam a Deus e foram chamados segundo o seu propósito.',
      },
      {
        text: 'A aula encerra o módulo 2 com qual conclusão geral?',
        options: [
          'O contexto imediato é opcional',
          'O contexto muda completamente versículos famosos como Jr 29:11, Fp 4:13, Mt 18:20, Mt 7:1, 1Co 10:13 e Rm 8:28',
          'Todos os versículos têm leitura única',
          'A teologia da prosperidade é correta',
        ],
        correctIndex: 1,
        explanation:
          'O encerramento do módulo lista os seis versículos analisados e mostra como o contexto altera profundamente o sentido de cada um.',
      },
    ],
  },
  {
    number: 10,
    title: 'Aula 10, Como ler narrativas sem inventar doutrina',
    description:
      'Nem tudo que a Bíblia registra, a Bíblia aprova. Você vai aprender a diferença entre descrição e prescrição, e por que ler narrativas como manual de prática pode produzir doutrinas que o texto nunca ensinou. Estudamos exemplos como o voto de Jefté, o pecado de Davi com Bate-Seba e a comunhão de bens em Atos.',
    youtubeId: '9YQyYc9h1Z4',
    durationSeconds: 329,
    versesRefs: [
      { bookSlug: 'juizes', chapter: 11, verseStart: 30, verseEnd: 31, testament: 'old' },
      { bookSlug: '2-samuel', chapter: 11, verseStart: 1, verseEnd: 17, testament: 'old' },
      { bookSlug: 'atos', chapter: 2, verseStart: 42, verseEnd: 47, testament: 'new' },
    ],
    questions: [
      {
        text: 'Qual frase resume a regra de leitura das narrativas?',
        options: [
          'Tudo que a Bíblia narra deve ser imitado',
          'Nem tudo que a Bíblia registra, a Bíblia aprova',
          'Toda narrativa é alegórica',
          'Narrativas só valem para o Antigo Testamento',
        ],
        correctIndex: 1,
        explanation:
          'A frase-chave é "Nem tudo que a Bíblia registra, a Bíblia aprova", base para distinguir descrição de prescrição.',
      },
      {
        text: 'Qual a diferença entre descrição e prescrição?',
        options: [
          'Descrição narra o que aconteceu, prescrição ordena como agir',
          'Descrição é Antigo Testamento, prescrição é Novo',
          'Descrição é literal, prescrição é simbólica',
          'Não há diferença',
        ],
        correctIndex: 0,
        explanation:
          'Descrição relata um fato, prescrição manda repetir. Confundir os dois gera doutrina indevida.',
      },
      {
        text: 'O voto de Jefté em Juízes 11 é apresentado como:',
        options: [
          'Modelo de fé a ser imitado',
          'Resultado de ignorância espiritual no período dos juízes',
          'Promessa cumprida com aprovação divina explícita',
          'Profecia messiânica',
        ],
        correctIndex: 1,
        explanation:
          'O voto de Jefté é fruto do caos espiritual do período de Juízes, não modelo a ser repetido.',
      },
      {
        text: 'Como o livro de Juízes termina, mostrando seu tom geral?',
        options: [
          'Com a coroação de Davi',
          'Com a frase: cada um fazia o que parecia certo aos seus olhos',
          'Com a entrega da Lei',
          'Com a derrota dos filisteus',
        ],
        correctIndex: 1,
        explanation:
          'Juízes encerra dizendo que cada um fazia o que parecia certo aos próprios olhos, marca do caos.',
      },
      {
        text: 'O episódio de Davi e Bate-Seba em 2 Samuel 11 mostra:',
        options: [
          'Que o pecado real foi tratado e gerou consequências graves',
          'Que Deus aprovou tudo',
          'Que a poligamia é normativa',
          'Que Davi não era responsável',
        ],
        correctIndex: 0,
        explanation:
          'O texto narra o pecado, a confrontação por Natã, a morte do filho e as consequências contínuas para a casa de Davi.',
      },
      {
        text: 'Qual o erro de ler Atos como manual normativo de prática eclesiástica?',
        options: [
          'Atos é poesia',
          'Atos é narrativa, descreve o que aconteceu, sem ordenar repetição em todos os casos',
          'Atos é apócrifo',
          'Atos não fala de igreja',
        ],
        correctIndex: 1,
        explanation:
          'Atos é narrativa. Nem tudo o que aconteceu na igreja primitiva é norma para todas as igrejas em todos os tempos.',
      },
      {
        text: 'A comunhão de bens em Atos 2 e 4 deve ser lida como:',
        options: [
          'Mandamento universal e obrigatório',
          'Exemplo lindo de generosidade, sem virar regra absoluta',
          'Profecia escatológica',
          'Doutrina econômica oficial',
        ],
        correctIndex: 1,
        explanation:
          'A comunhão de bens é descrita como exemplo de generosidade, não como mandamento universal.',
      },
      {
        text: 'Qual a pergunta-chave a se fazer diante de uma narrativa?',
        options: [
          'O texto é poético?',
          'O contexto está apresentando isso como exemplo, advertência ou simples fato?',
          'Quantas vezes esse evento se repete?',
          'A história é simbólica?',
        ],
        correctIndex: 1,
        explanation:
          'A pergunta-chave é: o contexto trata o fato como exemplo, advertência ou simples relato?',
      },
      {
        text: 'A narrativa bíblica ensina pelo:',
        options: [
          'Recorte isolado de um versículo',
          'Conjunto, pelas consequências, pelo desfecho e pelo padrão do livro',
          'Sentimento do leitor',
          'Comentário do pregador',
        ],
        correctIndex: 1,
        explanation:
          'A narrativa ensina pelo conjunto, com consequências, desfecho, comentários do autor e padrões.',
      },
      {
        text: 'Qual perigo a leitura ingênua de narrativa pode gerar?',
        options: [
          'Tornar o texto mais bonito',
          'Transformar erro humano em doutrina',
          'Criar versões alternativas do texto',
          'Eliminar versículos',
        ],
        correctIndex: 1,
        explanation:
          'O grande perigo é transformar erros humanos narrados em doutrina normativa para a igreja.',
      },
    ],
  },
  {
    number: 11,
    title: 'Aula 11, Como ler as cartas de Paulo sem distorcer',
    description:
      'Paulo escreveu cartas, não manuais de versículos soltos. Você vai aprender a seguir o argumento das epístolas paulinas, prestando atenção nos conectivos (portanto, pois, mas, todavia) que são pistas do raciocínio. Aplicamos isso a Romanos 3:23 e Efésios 2:8-10, vendo como o argumento completo dá força e equilíbrio a versículos clássicos.',
    youtubeId: 'zc44OTM4Sqg',
    durationSeconds: 349,
    versesRefs: [
      { bookSlug: 'romanos', chapter: 3, verseStart: 9, verseEnd: 23, testament: 'new' },
      { bookSlug: 'efesios', chapter: 2, verseStart: 1, verseEnd: 10, testament: 'new' },
    ],
    questions: [
      {
        text: 'Por que Paulo é apresentado como autor de argumentos, não de versículos soltos?',
        options: [
          'Porque escrevia em poesia',
          'Porque suas cartas têm começo, meio, fim e linha de raciocínio progressiva',
          'Porque escrevia somente para apóstolos',
          'Porque assinava as cartas no fim',
        ],
        correctIndex: 1,
        explanation:
          'Paulo escreve cartas com lógica progressiva. Cortar o argumento no meio distorce o sentido, mesmo que a citação esteja correta.',
      },
      {
        text: 'A força de Romanos 3:23 só aparece com:',
        options: [
          'A leitura isolada do versículo',
          'O argumento construído em Romanos 1, 2 e 3',
          'A análise gramatical do grego',
          'A comparação com o Talmude',
        ],
        correctIndex: 1,
        explanation:
          'Paulo prepara Romanos 3:23 desde o capítulo 1 (gentios) e 2 (judeus), até o veredicto: todos pecaram.',
      },
      {
        text: 'Em Romanos 1, Paulo argumenta sobre a culpa de quem?',
        options: ['Apenas dos judeus', 'Dos gentios', 'Dos cristãos', 'Dos governantes romanos'],
        correctIndex: 1,
        explanation:
          'No capítulo 1, Paulo mostra a culpa dos gentios, que conheciam Deus pela criação e o rejeitaram.',
      },
      {
        text: 'Em Romanos 2, ele mostra a culpa de:',
        options: ['Dos pagãos', 'Dos judeus', 'De ninguém', 'Dos anjos caídos'],
        correctIndex: 1,
        explanation:
          'No capítulo 2, Paulo vira a mesa e mostra que os judeus, mesmo com a Lei, também são culpados.',
      },
      {
        text: 'Em Efésios 2:1-3, qual é a condição do homem antes da salvação?',
        options: [
          'Bom moralmente',
          'Mortos em transgressões e pecados',
          'Em busca sincera de Deus',
          'Espiritualmente vivos, mas confusos',
        ],
        correctIndex: 1,
        explanation:
          'O homem é descrito como morto em transgressões e pecados, seguindo o curso deste mundo.',
      },
      {
        text: 'O contraste central de Efésios 2 é:',
        options: [
          'Lei e graça',
          'Morte e vida',
          'Pobreza e riqueza',
          'Judeus e gentios',
        ],
        correctIndex: 1,
        explanation:
          'O contraste é morte (vv.1-3) e vida em Cristo (vv.4-5), preparando a declaração da salvação pela graça.',
      },
      {
        text: 'Segundo Efésios 2:10, somos salvos:',
        options: [
          'Por obras',
          'Para obras',
          'Sem obras eternamente',
          'Pelas obras dos pais',
        ],
        correctIndex: 1,
        explanation:
          'O v.10 mostra que não somos salvos por obras, mas para boas obras preparadas por Deus.',
      },
      {
        text: 'Qual conjunto de palavras Paulo usa como pistas do argumento?',
        options: [
          'Aleluia, amém, glória',
          'Portanto, pois, porque, mas, todavia, por essa razão',
          'Disse, falou, gritou',
          'Veja, ouça, lembre',
        ],
        correctIndex: 1,
        explanation:
          'Os conectivos lógicos como portanto, pois, mas e todavia são pistas do desenvolvimento do argumento.',
      },
      {
        text: 'A regra prática para ler epístolas é:',
        options: [
          'Ler apenas o capítulo 1',
          'Nunca ler um versículo de carta sem ler o parágrafo, e quando possível, o capítulo inteiro',
          'Ler somente em latim',
          'Buscar uma palavra-chave por capítulo',
        ],
        correctIndex: 1,
        explanation:
          'A regra é ler o parágrafo inteiro, e quando possível o capítulo, para acompanhar o argumento progressivo.',
      },
      {
        text: 'Quando Paulo usa "portanto", ele está:',
        options: [
          'Mudando de assunto',
          'Tirando uma conclusão do que disse antes',
          'Iniciando a carta',
          'Saudando a igreja',
        ],
        correctIndex: 1,
        explanation:
          'Portanto é conclusivo: Paulo está tirando conclusão do que já argumentou.',
      },
    ],
  },
  {
    number: 12,
    title: 'Aula 12, Salmos, provérbios e profecia: contexto imediato em cada gênero',
    description:
      'A última aula do curso. Você vai aprender por que provérbios não são promessas, salmos não são doutrinas e profecia não é adivinhação, e como o contexto imediato funciona de modo distinto em cada um desses gêneros. Encerra o curso com a regra geral: antes de interpretar, pergunte sempre qual é o gênero do texto.',
    youtubeId: 'PdEu_QK5u24',
    durationSeconds: 433,
    versesRefs: [
      { bookSlug: 'proverbios', chapter: 22, verseStart: 6, verseEnd: 6, testament: 'old' },
      { bookSlug: 'salmos', chapter: 37, verseStart: 4, verseEnd: 4, testament: 'old' },
      { bookSlug: 'isaias', chapter: 14, verseStart: 4, verseEnd: 15, testament: 'old' },
    ],
    questions: [
      {
        text: 'Provérbios são, segundo a aula:',
        options: [
          'Promessas absolutas e individuais',
          'Princípios gerais de sabedoria, não garantias absolutas',
          'Profecias diretas',
          'Doutrinas sistemáticas',
        ],
        correctIndex: 1,
        explanation:
          'Provérbios expressam princípios gerais de como a vida geralmente funciona, não garantias individuais.',
      },
      {
        text: 'Provérbios 22:6, lido como promessa absoluta, gera:',
        options: [
          'Mais responsabilidade pastoral',
          'Culpa indevida nos pais quando o filho se desvia',
          'Maturidade emocional',
          'Preparação para o ministério',
        ],
        correctIndex: 1,
        explanation:
          'Lê-lo como garantia gera culpa indevida em pais cujos filhos se desviam, distorcendo o gênero.',
      },
      {
        text: 'A aplicação correta de Provérbios 22:6 é:',
        options: [
          'Garantir que o filho jamais se desviará',
          'Fazer o que está ao alcance com fidelidade e confiar o resultado a Deus',
          'Educar somente pela disciplina física',
          'Forçar o filho à carreira ministerial',
        ],
        correctIndex: 1,
        explanation:
          'Faça com fidelidade o que está ao seu alcance e confie a Deus o resultado, esse é o uso responsável do provérbio.',
      },
      {
        text: 'O Salmo 37 trata, em seu contexto, de:',
        options: [
          'Casamento',
          'Descanso em Deus diante da prosperidade dos ímpios',
          'Sacrifícios no templo',
          'Genealogia de Davi',
        ],
        correctIndex: 1,
        explanation:
          'O Salmo 37 trata de descansar em Deus quando os ímpios parecem prosperar.',
      },
      {
        text: 'Salmo 37:4 promete que, ao se deleitar no Senhor:',
        options: [
          'Deus realiza qualquer desejo que você já tem',
          'Os seus desejos são transformados, alinhando-se aos de Deus',
          'Deus dá longevidade automática',
          'Deus envia anjos visíveis',
        ],
        correctIndex: 1,
        explanation:
          'Ao se deleitar em Deus, os desejos do coração são transformados e se alinham aos d`Ele.',
      },
      {
        text: 'Salmos são, em sua maioria:',
        options: [
          'Tratado doutrinário',
          'Poesia, com linguagem figurada, hipérbole e paralelismo',
          'Profecia direta',
          'Genealogia',
        ],
        correctIndex: 1,
        explanation:
          'Salmos são poesia. Usam imagens, paralelismo, hipérbole. Pedem leitura sensível ao gênero.',
      },
      {
        text: 'Quando o salmista diz que os montes saltam como carneiros, ele:',
        options: [
          'Faz geologia',
          'Anuncia profecia',
          'Celebra a grandeza de Deus com imagem poética',
          'Comete erro',
        ],
        correctIndex: 2,
        explanation:
          'É linguagem poética celebrando a grandeza de Deus, não descrição literal.',
      },
      {
        text: 'Isaías 14:12-15, em seu contexto imediato, fala primariamente de:',
        options: [
          'A queda de Satanás',
          'O rei da Babilônia',
          'O Anticristo',
          'O messias sofredor',
        ],
        correctIndex: 1,
        explanation:
          'O v.4 deixa claro: é uma sátira contra o rei da Babilônia. A leitura sobre Satanás vem de tradição posterior.',
      },
      {
        text: 'Sobre profecia bíblica, qual a postura recomendada?',
        options: [
          'Dogmatismo absoluto',
          'Cautela e humildade interpretativa, com uso comedido da linguagem simbólica',
          'Negação',
          'Releitura como mito',
        ],
        correctIndex: 1,
        explanation:
          'A profecia exige cautela. Linguagem simbólica e grandiosa pede humildade interpretativa.',
      },
      {
        text: 'Qual a regra geral que fecha o curso?',
        options: [
          'Sempre cite versículos isolados',
          'Antes de interpretar qualquer texto, pergunte qual é o gênero',
          'Sempre prefira o sentido alegórico',
          'Sempre aplique antes de entender',
        ],
        correctIndex: 1,
        explanation:
          'A regra é: antes de interpretar, pergunte qual é o gênero do texto e respeite as regras desse gênero, sempre lendo o contexto imediato.',
      },
      {
        text: 'Se o texto é narrativa, qual a pergunta orientadora?',
        options: [
          'O texto está descrevendo ou prescrevendo?',
          'É poesia ou prosa?',
          'Tem rima ou não?',
          'Aparece em qual capítulo?',
        ],
        correctIndex: 0,
        explanation:
          'Em narrativa, a pergunta-chave é se o texto descreve um fato ou prescreve uma prática.',
      },
      {
        text: 'Se o texto é uma carta de Paulo, a regra é:',
        options: [
          'Cortar versículos avulsos',
          'Seguir o argumento sem cortar no meio',
          'Apenas memorizar',
          'Pular o introdutório',
        ],
        correctIndex: 1,
        explanation:
          'Em cartas, segue-se o argumento do autor, sem cortar o raciocínio no meio.',
      },
      {
        text: 'Se o texto é Salmo, a regra é:',
        options: [
          'Tratar como prosa científica',
          'Respeitar a linguagem poética',
          'Buscar sentido literal sempre',
          'Reescrever como narrativa',
        ],
        correctIndex: 1,
        explanation:
          'Salmos são poesia e devem ser lidos com sensibilidade ao gênero, sem violentá-los como prosa literal.',
      },
      {
        text: 'Se o texto é provérbio, a regra é:',
        options: [
          'Ler como princípio, não como promessa',
          'Ler como contrato jurídico',
          'Ler como profecia futura',
          'Aplicar como mandamento',
        ],
        correctIndex: 0,
        explanation:
          'Provérbios são princípios gerais de sabedoria. Tratá-los como promessa absoluta é violentar o gênero.',
      },
      {
        text: 'Se o texto é profecia, a regra é:',
        options: [
          'Aplicar tudo de forma literal e dogmática',
          'Ter cautela com o claro e com o simbólico, com humildade interpretativa',
          'Ignorar o sentido original',
          'Construir agendas detalhadas do futuro',
        ],
        correctIndex: 1,
        explanation:
          'Profecia exige cautela. Não construir doutrinas inteiras nem agendas detalhadas a partir de trechos simbólicos.',
      },
      {
        text: 'Qual ferramenta vale para todos os gêneros segundo a aula?',
        options: [
          'A leitura cronológica',
          'O contexto imediato',
          'A repetição diária',
          'A pregação semanal',
        ],
        correctIndex: 1,
        explanation:
          'A regra que vale para todos os gêneros é ler o contexto imediato. Sempre, sem exceção.',
      },
      {
        text: 'Quantas aulas e quantos módulos compõem o curso?',
        options: [
          '10 aulas em 2 módulos',
          '12 aulas em 3 módulos',
          '8 aulas em 4 módulos',
          '15 aulas em 1 módulo',
        ],
        correctIndex: 1,
        explanation:
          'O curso possui 12 aulas distribuídas em três módulos.',
      },
      {
        text: 'O que a aula sugere como próximo passo de estudo após esse curso?',
        options: [
          'Ler somente comentários',
          'Curso de Teologia Sistemática do canal',
          'Aposentar-se da Bíblia',
          'Estudar grego avançado',
        ],
        correctIndex: 1,
        explanation:
          'O encerramento aponta o curso de Teologia Sistemática como próximo passo natural.',
      },
      {
        text: 'A aula afirma que ao ignorar o gênero literário, o leitor:',
        options: [
          'Lê com mais profundidade',
          'Ignora as regras do jogo e erra a interpretação',
          'Acessa o sentido espiritual real',
          'Recebe revelação direta',
        ],
        correctIndex: 1,
        explanation:
          'Ignorar o gênero é ignorar as regras do jogo e leva à distorção interpretativa.',
      },
      {
        text: 'A síntese final do curso é:',
        options: [
          'Cada texto significa o que o leitor sentir',
          'Antes de interpretar, identifique o gênero e leia sempre o contexto imediato',
          'Comentários substituem o contexto',
          'A devoção dispensa estudo',
        ],
        correctIndex: 1,
        explanation:
          'A síntese é dupla: identifique o gênero e nunca dispense o contexto imediato. É a regra de ouro do curso.',
      },
    ],
  },
]

// Helper para gerar IDs de pergunta/opção determinísticos
function questionId(lessonNumber: number, qIdx: number) {
  return `l${lessonNumber}q${qIdx + 1}`
}
function optionId(lessonNumber: number, qIdx: number, oIdx: number) {
  return `${questionId(lessonNumber, qIdx)}o${oIdx + 1}`
}

// ---------------------------------------------------------------------------
// Mutation pública (interna): cria todo o curso de uma vez.
// ---------------------------------------------------------------------------

export const seedInterpretacaoBiblica = internalMutation({
  args: {
    creatorClerkId: v.string(),
    ebookStorageId: v.id('_storage'),
    ebookSize: v.number(),
  },
  handler: async (ctx, { creatorClerkId, ebookStorageId, ebookSize }) => {
    // Idempotência por slug
    const existing = await ctx.db
      .query('courses')
      .withIndex('by_slug', (q) => q.eq('slug', COURSE_SLUG))
      .unique()
    if (existing) {
      throw new Error(`Curso já existe (id ${existing._id}). Apague antes de reseed.`)
    }

    const courseId = await ctx.db.insert('courses', {
      creatorId: creatorClerkId,
      title: COURSE_TITLE,
      description: COURSE_DESCRIPTION,
      thumbnail: COURSE_THUMB,
      category: 'Hermenêutica',
      level: 'iniciante',
      isPublished: true,
      totalLessons: LESSONS.length,
      totalStudents: 0,
      totalModules: MODULES.length,
      tags: TAGS,
      language: 'Português',
      slug: COURSE_SLUG,
      passingScore: 70,
    })

    let lessonsCreated = 0
    let quizzesCreated = 0
    let materialsCreated = 0

    for (let mIdx = 0; mIdx < MODULES.length; mIdx++) {
      const m = MODULES[mIdx]
      const moduleId = await ctx.db.insert('modules', {
        courseId,
        creatorId: creatorClerkId,
        title: m.title,
        order: mIdx + 1,
      })

      let orderInModule = 1
      for (const lessonNumber of m.lessonNumbers) {
        const lesson = LESSONS.find((l) => l.number === lessonNumber)!
        const lessonSlug = toSlug(`aula-${String(lessonNumber).padStart(2, '0')}-${lesson.title.replace(/aula\s+\d+,?\s*/i, '')}`)
        const lessonId: Id<'lessons'> = await ctx.db.insert('lessons', {
          moduleId,
          courseId,
          creatorId: creatorClerkId,
          title: lesson.title,
          description: lesson.description,
          youtubeUrl: `https://www.youtube.com/watch?v=${lesson.youtubeId}`,
          durationSeconds: lesson.durationSeconds,
          order: orderInModule++,
          isPublished: true,
          hasMandatoryQuiz: true,
          allowQuizRetry: true,
          slug: lessonSlug,
          versesRefs: lesson.versesRefs,
        })
        lessonsCreated++

        // Quiz
        const questions = lesson.questions.map((q, qIdx) => {
          const opts = q.options.map((text, oIdx) => ({
            id: optionId(lesson.number, qIdx, oIdx),
            text,
          }))
          return {
            id: questionId(lesson.number, qIdx),
            text: q.text,
            options: opts,
            correctOptionId: opts[q.correctIndex].id,
            explanation: q.explanation,
          }
        })
        await ctx.db.insert('quizzes', {
          lessonId,
          courseId,
          creatorId: creatorClerkId,
          questions,
        })
        quizzesCreated++

        // Material: eBook em todas as aulas (mesmo storageId reutilizado)
        await ctx.db.insert('lessonMaterials', {
          lessonId,
          courseId,
          creatorId: creatorClerkId,
          name: 'eBook completo, Curso de Interpretação Bíblica.pdf',
          size: ebookSize,
          mimeType: 'application/pdf',
          storageId: ebookStorageId,
          order: 1,
          createdAt: Date.now(),
        })
        materialsCreated++
      }
    }

    return {
      courseId,
      slug: COURSE_SLUG,
      modulesCreated: MODULES.length,
      lessonsCreated,
      quizzesCreated,
      materialsCreated,
      totalQuestions: LESSONS.reduce((acc, l) => acc + l.questions.length, 0),
    }
  },
})

// Helper para gerar URL de upload do PDF
export const generateEbookUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

// Helper para atualizar bio + instagram do criador
export const updateCreatorProfile = internalMutation({
  args: {
    clerkId: v.string(),
    bio: v.string(),
    instagram: v.string(),
  },
  handler: async (ctx, { clerkId, bio, instagram }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()
    if (!user) throw new Error('Usuário não encontrado')
    await ctx.db.patch(user._id, { bio, instagram })
    return { ok: true, userId: user._id }
  },
})
