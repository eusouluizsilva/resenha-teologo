import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import type { Id } from './_generated/dataModel'

// ---------------------------------------------------------------------------
// SEED, Quizzes do Curso "Doutrinas Basicas"
//
// Phase 3 do plano: 5 perguntas por aula, geradas a partir dos PDFs de
// transcricao oficiais do Pastor Luiz Silva. Cobre Aulas 01 a 19. A Aula 0
// (boas-vindas) nao tem quiz por design.
//
// Cada item da array QUIZZES corresponde a uma aula. O matching com a tabela
// `lessons` e feito pelo `lessonNumber` (campo `order` dentro do modulo nao
// serve, pois cada modulo zera o order). Usamos o slug da aula que segue o
// padrao `aula-XX-...` para identificar a aula correta.
//
// Disparar via:
//   npx convex run --prod seedDoutrinasQuizzes:seedDoutrinasQuizzes \
//     '{"creatorClerkId":"user_xxx"}'
//
// Idempotente: se ja existir quiz para a aula, deleta e recria (permite
// atualizar perguntas via re-run).
// ---------------------------------------------------------------------------

const COURSE_SLUG = 'curso-de-teologia-doutrinas-basicas'

type QuizOption = { id: string; text: string }
type QuizQuestion = {
  id: string
  text: string
  options: QuizOption[]
  correctOptionId: string
  explanation?: string
}
type LessonQuiz = { lessonNumber: number; questions: QuizQuestion[] }

const QUIZZES: LessonQuiz[] = [
  {
    lessonNumber: 1,
    questions: [
      {
        id: 'q1',
        text: 'Qual a diferença central entre revelação geral e revelação especial?',
        options: [
          { id: 'a', text: 'A geral é dada apenas a profetas; a especial é vista por todos os povos.' },
          { id: 'b', text: 'A geral se manifesta na criação, na consciência e na história, e a especial se dá nas Escrituras e em Cristo.' },
          { id: 'c', text: 'A geral é o Antigo Testamento e a especial é o Novo Testamento.' },
          { id: 'd', text: 'A geral é a tradição da Igreja e a especial é a Bíblia.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A revelação geral é universal, alcançando todos os homens pela criação, consciência e história. A revelação especial é particular e salvadora, dada nas Escrituras e plenamente em Cristo.',
      },
      {
        id: 'q2',
        text: 'Segundo Romanos 1, qual é o efeito da revelação geral no homem caído?',
        options: [
          { id: 'a', text: 'Ela é suficiente para a salvação se o homem buscar a Deus.' },
          { id: 'b', text: 'Ela ainda não foi dada à humanidade e só será revelada na consumação.' },
          { id: 'c', text: 'Ela torna o homem indesculpável diante do Criador.' },
          { id: 'd', text: 'Ela contradiz a revelação especial das Escrituras.' },
        ],
        correctOptionId: 'c',
        explanation:
          'Romanos 1:18-23 ensina que a revelação geral é suficiente para condenar (deixa o homem indesculpável), mas não para salvar; a salvação depende da revelação especial em Cristo.',
      },
      {
        id: 'q3',
        text: 'Por que a Bíblia é considerada o ponto de partida confiável para toda doutrina cristã?',
        options: [
          { id: 'a', text: 'Porque foi escolhida por concílios humanos.' },
          { id: 'b', text: 'Porque é a revelação especial inspirada por Deus, plena em Cristo, conforme Hebreus 1:1-3.' },
          { id: 'c', text: 'Porque cada igreja interpreta segundo a sua tradição.' },
          { id: 'd', text: 'Porque foi escrita por homens muito sábios.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A autoridade bíblica deriva de sua origem divina (inspiração) e culmina em Cristo, a Palavra encarnada (Hebreus 1:1-3). Não vem de concílios ou de tradições humanas.',
      },
      {
        id: 'q4',
        text: 'Quais são os quatro contextos básicos para uma leitura responsável de qualquer texto bíblico?',
        options: [
          { id: 'a', text: 'Histórico, cultural, canônico e imediato.' },
          { id: 'b', text: 'Pessoal, devocional, místico e moral.' },
          { id: 'c', text: 'Patrístico, medieval, reformado e moderno.' },
          { id: 'd', text: 'Literal, alegórico, anagógico e tropológico.' },
        ],
        correctOptionId: 'a',
        explanation:
          'A aula apresenta quatro contextos indispensáveis para a hermenêutica fiel: o histórico, o cultural, o canônico (lugar do texto na Bíblia) e o imediato (versículos vizinhos).',
      },
      {
        id: 'q5',
        text: 'Qual texto bíblico mostra a progressão da revelação culminando em Cristo?',
        options: [
          { id: 'a', text: 'Salmo 23:1' },
          { id: 'b', text: 'Hebreus 1:1-3' },
          { id: 'c', text: 'Apocalipse 22:13' },
          { id: 'd', text: 'Mateus 5:17' },
        ],
        correctOptionId: 'b',
        explanation:
          'Hebreus 1:1-3 ensina que Deus, tendo falado de muitas maneiras pelos profetas, agora falou definitivamente pelo Filho, mostrando a progressão e a consumação da revelação em Cristo.',
      },
    ],
  },
  {
    lessonNumber: 2,
    questions: [
      {
        id: 'q1',
        text: 'O que é, na teologia bíblica, um pacto (aliança) entre Deus e os homens?',
        options: [
          { id: 'a', text: 'Um contrato comercial entre Deus e o povo.' },
          { id: 'b', text: 'Um vínculo soberano em que Deus estabelece compromissos com bênçãos e exigências.' },
          { id: 'c', text: 'Uma promessa condicional que Deus pode cancelar a qualquer momento.' },
          { id: 'd', text: 'Uma simples proposta moral sem consequência prática.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Pacto bíblico é um vínculo soberano estabelecido por Deus, com promessas, sinais e exigências. É a moldura em que toda a história da redenção se desenrola.',
      },
      {
        id: 'q2',
        text: 'Qual a diferença essencial entre o Pacto das Obras (Adão) e o Pacto da Graça (em Cristo)?',
        options: [
          { id: 'a', text: 'Os dois pactos exigem obras humanas para a salvação.' },
          { id: 'b', text: 'O Pacto das Obras dependia da obediência de Adão; o Pacto da Graça depende da obediência perfeita de Cristo em favor dos eleitos.' },
          { id: 'c', text: 'O Pacto das Obras é eterno; o Pacto da Graça é temporário.' },
          { id: 'd', text: 'Ambos foram quebrados por Cristo na cruz.' },
        ],
        correctOptionId: 'b',
        explanation:
          'No Pacto das Obras, Adão deveria obedecer e fracassou. No Pacto da Graça, Cristo, o último Adão, obedece em lugar do seu povo e oferece a salvação por pura graça.',
      },
      {
        id: 'q3',
        text: 'A aliança abraâmica (Gênesis 12) tem que tipo de promessa central?',
        options: [
          { id: 'a', text: 'Uma promessa militar para conquistar Canaã.' },
          { id: 'b', text: 'A promessa de descendência, terra e bênção universal pelas nações.' },
          { id: 'c', text: 'Uma promessa restrita à descendência biológica de Abraão.' },
          { id: 'd', text: 'Uma promessa de prosperidade financeira individual.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Em Gênesis 12:1-3 Deus promete a Abraão descendência, terra e bênção que alcançaria todas as nações, apontando para Cristo (Gálatas 3:8-16).',
      },
      {
        id: 'q4',
        text: 'A Nova Aliança profetizada em Jeremias 31:31-34 tem como característica central:',
        options: [
          { id: 'a', text: 'A reconstrução do templo físico em Jerusalém.' },
          { id: 'b', text: 'A escrita da lei de Deus no coração do povo, com perdão definitivo dos pecados.' },
          { id: 'c', text: 'A restauração política de Israel.' },
          { id: 'd', text: 'O cumprimento da circuncisão como sinal pactual.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Jeremias 31:31-34 anuncia a Nova Aliança em que Deus escreverá a lei nos corações e perdoará os pecados de modo definitivo, cumprida em Cristo (Hebreus 8).',
      },
      {
        id: 'q5',
        text: 'A aliança davídica (2 Samuel 7) aponta tipologicamente para:',
        options: [
          { id: 'a', text: 'O reinado eterno de Cristo, filho de Davi.' },
          { id: 'b', text: 'A queda da monarquia em Israel.' },
          { id: 'c', text: 'O fim da dinastia real para sempre.' },
          { id: 'd', text: 'A separação entre o reino do norte e o do sul.' },
        ],
        correctOptionId: 'a',
        explanation:
          '2 Samuel 7:12-16 promete a Davi uma descendência cujo trono será eterno. Essa promessa se cumpre em Cristo, o Filho de Davi e Rei eterno.',
      },
    ],
  },
  {
    lessonNumber: 3,
    questions: [
      {
        id: 'q1',
        text: 'O que significa o termo grego theopneustos, usado em 2 Timóteo 3:16?',
        options: [
          { id: 'a', text: '"Inspirado pelos homens".' },
          { id: 'b', text: '"Soprado por Deus".' },
          { id: 'c', text: '"Profecia humana".' },
          { id: 'd', text: '"Literatura sagrada".' },
        ],
        correctOptionId: 'b',
        explanation:
          'Theopneustos significa literalmente "soprado por Deus", indicando que a Escritura tem origem divina, não humana.',
      },
      {
        id: 'q2',
        text: 'O que a Igreja entende por "inspiração plenária e verbal" das Escrituras?',
        options: [
          { id: 'a', text: 'Apenas as ideias gerais foram inspiradas, não as palavras.' },
          { id: 'b', text: 'Toda a Escritura, em todas as suas palavras, foi inspirada por Deus.' },
          { id: 'c', text: 'Somente os ensinamentos morais são inspirados.' },
          { id: 'd', text: 'Apenas o Novo Testamento foi inspirado verbalmente.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A inspiração plenária ensina que toda a Escritura é inspirada (não só partes), e a verbal afirma que isso alcança até as próprias palavras escolhidas pelos autores humanos.',
      },
      {
        id: 'q3',
        text: 'Segundo 2 Pedro 1:20-21, a profecia das Escrituras procede de:',
        options: [
          { id: 'a', text: 'Vontade humana exclusivamente.' },
          { id: 'b', text: 'Homens santos que falaram movidos pelo Espírito Santo.' },
          { id: 'c', text: 'Tradições orais sem origem divina.' },
          { id: 'd', text: 'Especulações filosóficas dos antigos.' },
        ],
        correctOptionId: 'b',
        explanation:
          '2 Pedro 1:20-21 afirma que nenhuma profecia veio por vontade humana, mas homens falaram da parte de Deus movidos pelo Espírito Santo.',
      },
      {
        id: 'q4',
        text: 'Por que a inerrância bíblica não anula a personalidade dos autores humanos?',
        options: [
          { id: 'a', text: 'Porque Deus ditou cada palavra de modo mecânico, sem usar a personalidade dos autores.' },
          { id: 'b', text: 'Porque o Espírito Santo conduziu os autores preservando seu estilo, vocabulário e contexto, sem permitir erro.' },
          { id: 'c', text: 'Porque os autores escreveram livremente e Deus apenas aprovou o resultado.' },
          { id: 'd', text: 'Porque a inerrância só vale para o autógrafo perdido.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Inspiração não é ditado mecânico. O Espírito conduziu os autores usando suas personalidades, contextos e estilos, mas garantindo a verdade do que foi escrito.',
      },
      {
        id: 'q5',
        text: 'Que casos arqueológicos confirmaram a confiabilidade histórica da Bíblia, mesmo após anos de ceticismo?',
        options: [
          { id: 'a', text: 'A descoberta dos registros do reino dos hititas e a inscrição de Tel Dan citando a Casa de Davi.' },
          { id: 'b', text: 'A descoberta do túmulo de Adão.' },
          { id: 'c', text: 'A descoberta do túmulo vazio de Jesus.' },
          { id: 'd', text: 'A descoberta da Arca de Noé no Monte Ararate.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Por muito tempo, hititas e a "Casa de Davi" foram tratados como mito. Achados como os arquivos hititas e a estela de Tel Dan confirmaram a historicidade dos relatos bíblicos.',
      },
    ],
  },
  {
    lessonNumber: 4,
    questions: [
      {
        id: 'q1',
        text: 'O que significa, na origem, a palavra grega "kanon"?',
        options: [
          { id: 'a', text: 'Lei sagrada.' },
          { id: 'b', text: 'Régua, norma, padrão de medida.' },
          { id: 'c', text: 'Concílio.' },
          { id: 'd', text: 'Livro santo.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Kanon vem do grego e significa "régua" ou "padrão de medida". Aplicado às Escrituras, indica os livros que servem de norma reconhecida da fé.',
      },
      {
        id: 'q2',
        text: 'Quais são os principais critérios usados pela Igreja primitiva para reconhecer um livro como canônico?',
        options: [
          { id: 'a', text: 'Antiguidade do papiro, beleza estilística e popularidade.' },
          { id: 'b', text: 'Apostolicidade, ortodoxia doutrinária e catolicidade (uso amplo na Igreja).' },
          { id: 'c', text: 'Aprovação imperial, datação precisa e ausência de polêmica.' },
          { id: 'd', text: 'Relevância política, interesse social e linguagem clara.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A Igreja antiga reconheceu (não criou) o cânon avaliando se um livro era apostólico (origem nos apóstolos), ortodoxo (em harmonia com a regra da fé) e católico (aceito amplamente pelas igrejas).',
      },
      {
        id: 'q3',
        text: 'Em que carta pascal de 367 d.C. aparece a primeira lista exatamente igual aos 27 livros do Novo Testamento que temos hoje?',
        options: [
          { id: 'a', text: 'Carta de Atanásio de Alexandria.' },
          { id: 'b', text: 'Carta do imperador Constantino.' },
          { id: 'c', text: 'Carta de Tertuliano.' },
          { id: 'd', text: 'Carta de Orígenes.' },
        ],
        correctOptionId: 'a',
        explanation:
          'A 39ª Carta Pascal de Atanásio (367 d.C.) é o primeiro registro com a lista idêntica aos 27 livros do Novo Testamento atual.',
      },
      {
        id: 'q4',
        text: 'Por que é incorreto afirmar que "o Concílio de Niceia (325) escolheu os livros da Bíblia"?',
        options: [
          { id: 'a', text: 'Porque Niceia tratou da divindade de Cristo (heresia ariana), não da definição do cânon.' },
          { id: 'b', text: 'Porque Niceia rejeitou a maioria dos livros do Novo Testamento.' },
          { id: 'c', text: 'Porque Niceia adicionou os livros gnósticos ao cânon.' },
          { id: 'd', text: 'Porque Niceia substituiu a Bíblia hebraica.' },
        ],
        correctOptionId: 'a',
        explanation:
          'O Concílio de Niceia (325) tratou da divindade de Cristo contra Ário. A definição do cânon ocorreu em outro processo histórico e Niceia não escolheu os livros da Bíblia.',
      },
      {
        id: 'q5',
        text: 'Por que os apócrifos e os "evangelhos" gnósticos não foram aceitos como canônicos?',
        options: [
          { id: 'a', text: 'Porque foram escritos em grego, não em hebraico.' },
          { id: 'b', text: 'Porque tinham origem tardia, doutrina contrária à fé apostólica e não eram aceitos pela Igreja universal.' },
          { id: 'c', text: 'Porque eram pequenos demais para entrar no códice.' },
          { id: 'd', text: 'Porque a maioria foi destruída por imperadores romanos.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Apócrifos e gnósticos foram excluídos por falharem nos critérios: muitos eram tardios, contradiziam a doutrina apostólica e não tinham reconhecimento amplo na Igreja católica (universal).',
      },
    ],
  },
  {
    lessonNumber: 5,
    questions: [
      {
        id: 'q1',
        text: 'Qual a diferença entre exegese e eisegese?',
        options: [
          { id: 'a', text: 'Exegese é "tirar de fora" do texto o que ele realmente diz; eisegese é "colocar dentro" do texto o que o leitor quer ouvir.' },
          { id: 'b', text: 'Exegese é leitura devocional; eisegese é estudo acadêmico.' },
          { id: 'c', text: 'Exegese é leitura alegórica; eisegese é leitura literal.' },
          { id: 'd', text: 'Exegese é o método católico; eisegese é o método protestante.' },
        ],
        correctOptionId: 'a',
        explanation:
          'O prefixo grego "ex-" significa "de fora" e "eis-" significa "para dentro". Exegese busca extrair o sentido do texto; eisegese impõe um sentido alheio ao texto.',
      },
      {
        id: 'q2',
        text: 'O que é a doutrina da Iluminação na hermenêutica bíblica?',
        options: [
          { id: 'a', text: 'A iluminação é o conhecimento intelectual da Bíblia em escolas teológicas.' },
          { id: 'b', text: 'É a obra do Espírito Santo que abre o entendimento do crente para receber e aplicar a Escritura.' },
          { id: 'c', text: 'É a recepção de novas revelações fora da Bíblia.' },
          { id: 'd', text: 'É a inspiração contínua que segue até hoje.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A inspiração foi dada uma vez aos autores. A iluminação é a obra contínua do Espírito Santo no leitor, abrindo a mente e o coração para receber e aplicar o que já foi escrito.',
      },
      {
        id: 'q3',
        text: 'Qual é a regra hermenêutica conhecida como "Analogia da Fé" (Analogia Fidei)?',
        options: [
          { id: 'a', text: 'A Escritura interpreta a Escritura: textos obscuros são lidos à luz dos textos claros.' },
          { id: 'b', text: 'Cada igreja interpreta segundo a sua tradição.' },
          { id: 'c', text: 'A leitura particular do crente é suficiente.' },
          { id: 'd', text: 'A última palavra é sempre do pastor.' },
        ],
        correctOptionId: 'a',
        explanation:
          'A Analogia da Fé ensina que a Escritura é o melhor intérprete de si mesma. Textos difíceis devem ser lidos à luz de textos claros sobre o mesmo tema.',
      },
      {
        id: 'q4',
        text: 'Qual desses não é um princípio básico de interpretação apresentado na aula?',
        options: [
          { id: 'a', text: 'Considerar o gênero literário do texto.' },
          { id: 'b', text: 'Respeitar o contexto imediato (versículos vizinhos).' },
          { id: 'c', text: 'Ler segundo o sentido subjetivo que o leitor sentir.' },
          { id: 'd', text: 'Aplicar a Analogia da Fé.' },
        ],
        correctOptionId: 'c',
        explanation:
          'Sentido subjetivo do leitor é a marca da eisegese. A hermenêutica fiel respeita gênero literário, contexto imediato e a analogia da fé.',
      },
      {
        id: 'q5',
        text: 'Por que ignorar o gênero literário (poesia, narrativa, profecia, epístola) leva a erros graves?',
        options: [
          { id: 'a', text: 'Porque cada gênero tem regras próprias de leitura, e tratar poesia como prosa narrativa distorce o sentido.' },
          { id: 'b', text: 'Porque o gênero literário é uma invenção moderna sem relação com a Bíblia.' },
          { id: 'c', text: 'Porque toda a Bíblia é literal e não usa figuras.' },
          { id: 'd', text: 'Porque o gênero literário só importa em textos não inspirados.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Cada gênero literário (narrativa, poesia, profecia, epístola, apocalíptico) tem suas convenções. Forçar uma leitura literal sobre poesia, ou metafórica sobre narrativa, gera distorção doutrinária.',
      },
    ],
  },
  {
    lessonNumber: 6,
    questions: [
      {
        id: 'q1',
        text: 'O argumento cosmológico para a existência de Deus afirma que:',
        options: [
          { id: 'a', text: 'O universo sempre existiu por si mesmo.' },
          { id: 'b', text: 'Tudo o que começa a existir tem uma causa, e o universo (que começou) aponta para uma Causa Primeira.' },
          { id: 'c', text: 'O universo é resultado do acaso absoluto.' },
          { id: 'd', text: 'O universo é uma ilusão da mente humana.' },
        ],
        correctOptionId: 'b',
        explanation:
          'O argumento cosmológico parte do princípio de causalidade: o universo teve um começo (corroborado pelo Big Bang), portanto demanda uma Causa Primeira não causada, eterna e poderosa.',
      },
      {
        id: 'q2',
        text: 'O argumento teleológico se baseia em:',
        options: [
          { id: 'a', text: 'O acaso e a ausência de design.' },
          { id: 'b', text: 'A complexidade especificada da criação (DNA, sintonia fina das constantes físicas) que aponta para um Designer inteligente.' },
          { id: 'c', text: 'A existência de paralelos religiosos entre culturas.' },
          { id: 'd', text: 'O sentimento universal de transcendência.' },
        ],
        correctOptionId: 'b',
        explanation:
          'O argumento teleológico (do design) observa a complexidade ordenada do universo (DNA, sintonia fina das constantes físicas, biossistemas) como evidência de um Designer inteligente.',
      },
      {
        id: 'q3',
        text: 'O argumento moral para a existência de Deus, popularizado por C. S. Lewis, ensina que:',
        options: [
          { id: 'a', text: 'A moral é puramente cultural e relativa.' },
          { id: 'b', text: 'Existe uma lei moral objetiva conhecida por todos os homens, e essa lei pressupõe um Legislador transcendente.' },
          { id: 'c', text: 'A moral foi inventada pelas religiões para controlar pessoas.' },
          { id: 'd', text: 'A moral é fruto da evolução biológica sem implicação espiritual.' },
        ],
        correctOptionId: 'b',
        explanation:
          'C. S. Lewis e outros apologetas argumentam que a consciência universal de uma lei moral objetiva (não meramente cultural) só faz sentido se houver um Legislador moral transcendente.',
      },
      {
        id: 'q4',
        text: 'Segundo Romanos 1:18-20, qual é a consequência de o homem suprimir a verdade revelada na criação?',
        options: [
          { id: 'a', text: 'Deus o desculpa porque a revelação não foi clara.' },
          { id: 'b', text: 'O homem fica indesculpável diante de Deus, pois a criação manifesta o eterno poder e a divindade do Criador.' },
          { id: 'c', text: 'O homem perde apenas uma oportunidade de conhecer Deus, sem culpa moral.' },
          { id: 'd', text: 'A criação não tem mais valor de testemunho.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Romanos 1:18-20 ensina que os atributos invisíveis de Deus se mostram pelas coisas criadas, de modo que os homens são indesculpáveis ao suprimirem essa verdade.',
      },
      {
        id: 'q5',
        text: 'Por que esses argumentos não substituem a fé cristã?',
        options: [
          { id: 'a', text: 'Porque eles podem indicar um Criador, mas não revelam plenamente quem é o Deus santo, trino e redentor revelado em Cristo.' },
          { id: 'b', text: 'Porque são todos falaciosos.' },
          { id: 'c', text: 'Porque foram condenados pelos reformadores.' },
          { id: 'd', text: 'Porque a Bíblia proíbe usar argumentos racionais.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Os argumentos clássicos podem apontar para a existência de um Criador (revelação geral), mas a salvação requer a revelação especial e a fé em Cristo crucificado e ressurreto.',
      },
    ],
  },
  {
    lessonNumber: 7,
    questions: [
      {
        id: 'q1',
        text: 'Qual é a diferença entre atributos comunicáveis e incomunicáveis de Deus?',
        options: [
          { id: 'a', text: 'Comunicáveis são aqueles que podem ser refletidos, em alguma medida, na criatura humana; incomunicáveis pertencem somente a Deus.' },
          { id: 'b', text: 'Comunicáveis se referem a Deus Pai; incomunicáveis se referem ao Filho.' },
          { id: 'c', text: 'Comunicáveis são os do Antigo Testamento; incomunicáveis são os do Novo Testamento.' },
          { id: 'd', text: 'Os dois termos são sinônimos.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Atributos incomunicáveis (asseidade, infinidade, imutabilidade) são exclusivos de Deus. Comunicáveis (santidade, justiça, amor, sabedoria) podem ser refletidos pela criatura, sempre de modo derivado e limitado.',
      },
      {
        id: 'q2',
        text: 'O que é a "asseidade" de Deus?',
        options: [
          { id: 'a', text: 'A capacidade de Deus mudar quando necessário.' },
          { id: 'b', text: 'A autoexistência de Deus: Ele existe em si mesmo, sem depender de nada nem de ninguém.' },
          { id: 'c', text: 'A presença de Deus no santuário.' },
          { id: 'd', text: 'A misericórdia de Deus para com os pecadores.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Asseidade vem do latim "a se" (de si mesmo). Indica que Deus é autoexistente: não depende de causa externa para existir, ao contrário de toda criatura.',
      },
      {
        id: 'q3',
        text: 'O atributo da imutabilidade ensina que:',
        options: [
          { id: 'a', text: 'Deus muda de planos conforme as orações dos homens.' },
          { id: 'b', text: 'Deus não muda em sua essência, caráter, vontade soberana ou propósitos eternos.' },
          { id: 'c', text: 'Deus mudou da ira no Antigo Testamento para o amor no Novo Testamento.' },
          { id: 'd', text: 'Deus pode aprender coisas novas com o passar do tempo.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A imutabilidade ensina que Deus é o mesmo em essência, caráter e propósito (Tg 1:17, Ml 3:6). Quando a Escritura usa linguagem de "arrependimento", trata-se de antropopatia (linguagem analógica humana).',
      },
      {
        id: 'q4',
        text: 'Por que a santidade é considerada o atributo central revelado em Isaías 6?',
        options: [
          { id: 'a', text: 'Porque os anjos clamam três vezes "Santo, Santo, Santo é o Senhor", indicando a perfeição moral absoluta de Deus.' },
          { id: 'b', text: 'Porque a santidade é mencionada apenas neste capítulo.' },
          { id: 'c', text: 'Porque a santidade só se aplica ao Filho.' },
          { id: 'd', text: 'Porque a santidade é um atributo opcional na descrição de Deus.' },
        ],
        correctOptionId: 'a',
        explanation:
          'A repetição tripla "Santo, Santo, Santo" (Isaías 6:3) é a forma hebraica de superlativo absoluto. A santidade descreve a transcendência moral e a separação radical de Deus em relação ao pecado.',
      },
      {
        id: 'q5',
        text: 'O atributo do amor de Deus, segundo a aula, deve ser entendido:',
        options: [
          { id: 'a', text: 'Em separado dos demais atributos, especialmente da justiça.' },
          { id: 'b', text: 'Em harmonia com a santidade e a justiça, evitando reduzir Deus a sentimentalismo e culminando na cruz de Cristo.' },
          { id: 'c', text: 'Como tolerância universal a todo comportamento humano.' },
          { id: 'd', text: 'Como um atributo apenas humano projetado em Deus.' },
        ],
        correctOptionId: 'b',
        explanation:
          'O amor de Deus não pode ser separado da santidade e da justiça. Na cruz, esses atributos se encontram: o amor que justifica o pecador é o mesmo amor que satisfaz a justiça pela morte do Filho.',
      },
    ],
  },
  {
    lessonNumber: 8,
    questions: [
      {
        id: 'q1',
        text: 'Qual é a formulação ortodoxa da doutrina da Trindade?',
        options: [
          { id: 'a', text: 'Três deuses em uma só substância.' },
          { id: 'b', text: 'Um só Deus, eternamente subsistente em três Pessoas distintas: Pai, Filho e Espírito Santo.' },
          { id: 'c', text: 'Um só Deus que se manifesta em três modos sucessivos.' },
          { id: 'd', text: 'Três aspectos de uma única Pessoa divina.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A Trindade ensina um só Deus em essência, eternamente existente em três Pessoas distintas: Pai, Filho e Espírito Santo. Não três deuses, nem três modos.',
      },
      {
        id: 'q2',
        text: 'O termo hebraico "echad", usado em Deuteronômio 6:4 ("o Senhor é um"), expressa:',
        options: [
          { id: 'a', text: 'Uma unidade absoluta solitária (sinônimo de "yachid").' },
          { id: 'b', text: 'Uma unidade composta, como o "cacho de uvas" — um por composição.' },
          { id: 'c', text: 'Pluralidade de deuses.' },
          { id: 'd', text: 'Apenas a unidade política do povo de Israel.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Echad (unidade composta) é diferente de yachid (unidade solitária). A escolha de echad em Dt 6:4 é compatível com a unidade triúna de Deus revelada plenamente no NT.',
      },
      {
        id: 'q3',
        text: 'Qual heresia ensina que Pai, Filho e Espírito são apenas três modos ou máscaras da mesma Pessoa?',
        options: [
          { id: 'a', text: 'Arianismo.' },
          { id: 'b', text: 'Triteísmo.' },
          { id: 'c', text: 'Modalismo (sabelianismo).' },
          { id: 'd', text: 'Adopcionismo.' },
        ],
        correctOptionId: 'c',
        explanation:
          'O Modalismo (ou Sabelianismo) nega as três Pessoas distintas, dizendo que Pai, Filho e Espírito são apenas modos sucessivos de manifestação de uma única Pessoa.',
      },
      {
        id: 'q4',
        text: 'O que é a Trindade Econômica, em distinção da Trindade Imanente?',
        options: [
          { id: 'a', text: 'A Trindade Econômica trata da operação das três Pessoas na história da redenção; a Imanente trata das relações eternas em Deus em si mesmo.' },
          { id: 'b', text: 'A Trindade Econômica significa que o Pai é maior que o Filho.' },
          { id: 'c', text: 'A Trindade Imanente é heresia.' },
          { id: 'd', text: 'São termos sinônimos.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Trindade Imanente descreve as relações eternas em Deus (Pai gera o Filho, Espírito procede). Econômica descreve como as Pessoas atuam distintamente na obra da criação e da redenção.',
      },
      {
        id: 'q5',
        text: 'O Arianismo, condenado em Niceia (325), ensinava o quê sobre o Filho?',
        options: [
          { id: 'a', text: 'Que o Filho é eterno e consubstancial ao Pai.' },
          { id: 'b', text: 'Que o Filho é uma criatura, a primeira e mais alta, mas não Deus em essência.' },
          { id: 'c', text: 'Que o Filho é apenas humano, sem divindade.' },
          { id: 'd', text: 'Que o Filho e o Pai são a mesma Pessoa.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Ário ensinou que houve um tempo em que o Filho não existia, sendo Ele a primeira e mais alta criatura. Niceia rejeitou isso e afirmou o Filho consubstancial (homoousios) ao Pai.',
      },
    ],
  },
  {
    lessonNumber: 9,
    questions: [
      {
        id: 'q1',
        text: 'Por que, na cultura bíblica, conhecer o nome (shem) de alguém é importante?',
        options: [
          { id: 'a', text: 'Porque o nome é apenas uma etiqueta para distinguir pessoas.' },
          { id: 'b', text: 'Porque o nome revela o caráter, a essência e a história da pessoa.' },
          { id: 'c', text: 'Porque o nome só importava para reis e profetas.' },
          { id: 'd', text: 'Porque o nome é trocado a cada geração.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Na mentalidade bíblica, o nome (shem) carrega a essência, o caráter e a história da pessoa. Por isso, conhecer os nomes de Deus é conhecer aspectos do seu próprio ser.',
      },
      {
        id: 'q2',
        text: 'O nome Elohim, que aparece em Gênesis 1:1, é um substantivo plural usado com verbo singular. Por quê?',
        options: [
          { id: 'a', text: 'Porque indica plural de majestade e antecipa a pluralidade de Pessoas na unidade divina.' },
          { id: 'b', text: 'Porque os hebreus adoravam vários deuses.' },
          { id: 'c', text: 'Porque é um erro de tradução.' },
          { id: 'd', text: 'Porque o autor estava confuso entre plural e singular.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Elohim é plural, mas usado com verbo singular para o Deus verdadeiro. Indica plural de majestade (plenitude de poder) e, à luz do NT, antecipa a pluralidade de Pessoas na unidade divina.',
      },
      {
        id: 'q3',
        text: 'Em Êxodo 3:14, Deus se revela a Moisés como "EU SOU O QUE SOU". Esse nome, Yahweh, aponta principalmente para:',
        options: [
          { id: 'a', text: 'A onipotência geográfica de Deus.' },
          { id: 'b', text: 'A asseidade e a imutabilidade: o Deus que É, que ERA e que HÁ DE VIR.' },
          { id: 'c', text: 'A onipresença universal.' },
          { id: 'd', text: 'O atributo da misericórdia somente.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Yahweh ("Eu Sou") aponta para a autoexistência (asseidade) e imutabilidade de Deus: aquele que existe por si mesmo, eternamente, e não muda com o tempo.',
      },
      {
        id: 'q4',
        text: 'O título Adonai enfatiza qual aspecto da relação entre Deus e o homem?',
        options: [
          { id: 'a', text: 'A intimidade afetuosa, sem implicações de submissão.' },
          { id: 'b', text: 'O direito de propriedade e senhorio: Deus é Senhor e Mestre, e o homem é servo e mordomo.' },
          { id: 'c', text: 'A igualdade entre Deus e a criatura.' },
          { id: 'd', text: 'A condição de Deus como amigo distante.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Adonai (literalmente "meus Senhores", plural de majestade) enfatiza Deus como Senhor, Dono e Mestre. Por isso, o homem não é dono do próprio tempo, dinheiro ou destino: é mordomo.',
      },
      {
        id: 'q5',
        text: 'O nome composto "Yahweh Jireh", revelado em Gênesis 22:14, significa:',
        options: [
          { id: 'a', text: 'O Senhor que cura.' },
          { id: 'b', text: 'O Senhor é minha bandeira.' },
          { id: 'c', text: 'O Senhor proverá.' },
          { id: 'd', text: 'O Senhor está ali.' },
        ],
        correctOptionId: 'c',
        explanation:
          'Yahweh Jireh ("o Senhor proverá") foi revelado a Abraão no monte do sacrifício de Isaque, quando Deus proveu o cordeiro substituto, antecipando tipologicamente o Cordeiro de Deus, Cristo.',
      },
    ],
  },
  {
    lessonNumber: 10,
    questions: [
      {
        id: 'q1',
        text: 'O que a teologia chama de "decretos eternos de Deus"?',
        options: [
          { id: 'a', text: 'Decisões que Deus toma a cada dia conforme a história avança.' },
          { id: 'b', text: 'O propósito eterno de Deus, baseado unicamente no conselho da Sua vontade, pelo qual Ele determinou tudo o que aconteceria.' },
          { id: 'c', text: 'Apenas as profecias bíblicas escritas.' },
          { id: 'd', text: 'As leis humanas aprovadas em concílios.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Os decretos eternos são o propósito que Deus, desde a eternidade e segundo o conselho da Sua vontade, determinou para todas as coisas (Ef 1:11, Is 46:10).',
      },
      {
        id: 'q2',
        text: 'Quais são duas características essenciais dos decretos divinos?',
        options: [
          { id: 'a', text: 'Imutáveis e incondicionais.' },
          { id: 'b', text: 'Provisórios e revisáveis.' },
          { id: 'c', text: 'Públicos e democráticos.' },
          { id: 'd', text: 'Limitados e contingentes.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Os decretos divinos são imutáveis (Deus não muda de plano) e incondicionais (não dependem de nada fora de Deus). Sua vontade é a causa primária de todas as coisas.',
      },
      {
        id: 'q3',
        text: 'Quando a Bíblia diz que Deus "se arrependeu", qual a explicação correta?',
        options: [
          { id: 'a', text: 'Que Deus mudou de plano por um erro anterior.' },
          { id: 'b', text: 'Que Deus aprendeu algo novo e revisou sua decisão.' },
          { id: 'c', text: 'Que se trata de antropopatia (linguagem analógica humana) descrevendo uma mudança no modo como Deus passa a tratar o homem, sem alteração no plano eterno.' },
          { id: 'd', text: 'Que Deus pecou e pediu perdão.' },
        ],
        correctOptionId: 'c',
        explanation:
          'A Escritura usa antropopatia (atribuir emoções humanas a Deus para acomodar nossa compreensão). O "arrependimento" descreve uma mudança no trato com os homens, não no plano pré-estabelecido.',
      },
      {
        id: 'q4',
        text: 'O que ensina o Compatibilismo bíblico?',
        options: [
          { id: 'a', text: 'Que Deus é apenas 50% soberano e o homem 50% livre.' },
          { id: 'b', text: 'Que a soberania absoluta de Deus e a responsabilidade moral do homem são plenamente compatíveis: Deus é 100% soberano e o homem é 100% responsável.' },
          { id: 'c', text: 'Que o homem é um robô programado.' },
          { id: 'd', text: 'Que Deus não governa as escolhas humanas.' },
        ],
        correctOptionId: 'b',
        explanation:
          'O Compatibilismo afirma que a soberania de Deus e a responsabilidade humana caminham juntas. O exemplo supremo é a cruz: planejada por Deus, mas Judas, Pilatos e os líderes foram plenamente culpados (At 2:23).',
      },
      {
        id: 'q5',
        text: 'Qual a diferença entre decreto eficaz e decreto permissivo?',
        options: [
          { id: 'a', text: 'No eficaz, Deus atua diretamente para causar o bem; no permissivo, Deus permite o mal moral pelas mãos das criaturas, governando-o para um bem maior.' },
          { id: 'b', text: 'O eficaz é só sobre a salvação; o permissivo é só sobre a criação.' },
          { id: 'c', text: 'O eficaz é antigo; o permissivo é moderno.' },
          { id: 'd', text: 'Os dois termos são equivalentes.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Decreto eficaz: Deus atua diretamente para o bem. Decreto permissivo: Deus permite, sem aprovar moralmente, que o mal aconteça pelas mãos das criaturas, e governa-o para a Sua glória (José no Egito).',
      },
    ],
  },
  {
    lessonNumber: 11,
    questions: [
      {
        id: 'q1',
        text: 'O que é teodiceia?',
        options: [
          { id: 'a', text: 'O estudo dos atributos de Deus.' },
          { id: 'b', text: 'O estudo da justiça de Deus diante da existência do mal e do sofrimento.' },
          { id: 'c', text: 'O estudo dos sacramentos.' },
          { id: 'd', text: 'O estudo dos profetas menores.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Teodiceia ("justiça de Deus") trata de como conciliar a bondade, a justiça e a soberania de Deus com a existência do mal moral e do sofrimento.',
      },
      {
        id: 'q2',
        text: 'O conceito teológico "privatio boni" descreve o mal como:',
        options: [
          { id: 'a', text: 'Uma substância criada por Deus.' },
          { id: 'b', text: 'A ausência, corrupção ou distorção do bem original.' },
          { id: 'c', text: 'Uma força eterna e independente.' },
          { id: 'd', text: 'Um aspecto neutro da criação.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Privatio boni ("privação do bem") descreve o mal como ausência ou corrupção do bem, não como substância criada. Tudo o que Deus criou era bom; o mal surge quando a criatura distorce essa bondade.',
      },
      {
        id: 'q3',
        text: 'Como a teologia reformada interpreta Isaías 45:7 ("eu... crio as trevas... crio a desgraça")?',
        options: [
          { id: 'a', text: 'O texto ensina que Deus é o autor moral do mal.' },
          { id: 'b', text: 'O texto se refere a juízos, calamidades e acontecimentos dolorosos sob o governo soberano de Deus, não a maldade moral em Deus.' },
          { id: 'c', text: 'O texto é uma adição posterior e deve ser ignorado.' },
          { id: 'd', text: 'O texto ensina que Deus criou o pecado.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A "desgraça" de Is 45:7 não indica maldade moral em Deus, mas calamidades, juízos e acontecimentos dolorosos sob Seu governo. Deus permanece santo em tudo o que decreta.',
      },
      {
        id: 'q4',
        text: 'Por que o teísmo aberto deve ser rejeitado pela teologia reformada?',
        options: [
          { id: 'a', text: 'Porque afirma que o futuro não está totalmente determinado e que certos males surpreendem a Deus, comprometendo a soberania divina.' },
          { id: 'b', text: 'Porque afirma a soberania absoluta de Deus.' },
          { id: 'c', text: 'Porque ensina o decreto permissivo.' },
          { id: 'd', text: 'Porque defende o compatibilismo.' },
        ],
        correctOptionId: 'a',
        explanation:
          'O teísmo aberto compromete a soberania divina ao dizer que Deus não conhece exaustivamente o futuro. Efésios 1:11 contradiz isso: Deus faz todas as coisas conforme o conselho da Sua vontade.',
      },
      {
        id: 'q5',
        text: 'Atos 2:23 mostra a tensão suprema entre soberania e responsabilidade na cruz de Cristo. Qual a leitura correta?',
        options: [
          { id: 'a', text: 'A morte de Cristo foi um acidente histórico.' },
          { id: 'b', text: 'A crucificação foi planejada eternamente por Deus, e ainda assim os homens perversos foram culpados pela ação.' },
          { id: 'c', text: 'Deus foi pego de surpresa pela rejeição humana.' },
          { id: 'd', text: 'Os líderes religiosos não tiveram responsabilidade.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Em At 2:23 vemos as duas verdades juntas: o plano eterno de Deus e a culpa real dos homens. A intenção humana era má, o propósito divino era santo, e o resultado foi a salvação.',
      },
    ],
  },
  {
    lessonNumber: 12,
    questions: [
      {
        id: 'q1',
        text: 'O que significa que o homem foi criado "à imagem de Deus" (imago Dei)?',
        options: [
          { id: 'a', text: 'Que o homem é fisicamente parecido com Deus.' },
          { id: 'b', text: 'Que o homem possui uma marca espiritual, moral e relacional dada por Deus, com dignidade objetiva derivada do próprio ato criador.' },
          { id: 'c', text: 'Que o homem é divino em essência.' },
          { id: 'd', text: 'Que apenas alguns povos foram criados à imagem de Deus.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A imago Dei não trata de aparência física (Deus é Espírito, Jo 4:24), mas de marca espiritual, moral e relacional dada por Deus. A dignidade humana é objetiva, criada e teológica.',
      },
      {
        id: 'q2',
        text: 'Qual a diferença entre tricotomismo e dicotomismo na antropologia bíblica?',
        options: [
          { id: 'a', text: 'O tricotomismo ensina que o homem é composto de corpo, alma e espírito como três partes distintas; o dicotomismo, que o homem é corpo e parte imaterial (alma e espírito como aspectos da mesma realidade).' },
          { id: 'b', text: 'O tricotomismo nega a alma; o dicotomismo nega o corpo.' },
          { id: 'c', text: 'Os dois ensinam exatamente o mesmo.' },
          { id: 'd', text: 'O tricotomismo é heresia condenada por Niceia.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Tricotomismo: corpo + alma + espírito (três partes distintas). Dicotomismo: corpo + parte imaterial (alma e espírito como termos quase sinônimos). A tradição reformada clássica tende ao dicotomismo.',
      },
      {
        id: 'q3',
        text: 'Qual posição sobre a origem da alma a aula apresenta como mais coerente, embora não seja artigo confessional universal na tradição reformada?',
        options: [
          { id: 'a', text: 'Emanação.' },
          { id: 'b', text: 'Pré-existencialismo.' },
          { id: 'c', text: 'Traducianismo (alma transmitida pelos pais juntamente com o corpo).' },
          { id: 'd', text: 'Reencarnação.' },
        ],
        correctOptionId: 'c',
        explanation:
          'A aula prefere o traducianismo, pois explica de forma mais orgânica a unidade da raça humana em Adão e a transmissão da natureza pecaminosa, embora seja tema com nuances entre reformados.',
      },
      {
        id: 'q4',
        text: 'Segundo o Catecismo de Westminster, qual é o fim principal do homem?',
        options: [
          { id: 'a', text: 'Construir uma sociedade justa.' },
          { id: 'b', text: 'Viver de modo confortável e produtivo.' },
          { id: 'c', text: 'Glorificar a Deus e gozá-lo para sempre.' },
          { id: 'd', text: 'Cumprir a lei e merecer o céu.' },
        ],
        correctOptionId: 'c',
        explanation:
          'O Breve Catecismo de Westminster responde: "O fim principal do homem é glorificar a Deus e gozá-lo para sempre", em harmonia com Is 43:7 e Rm 11:36.',
      },
      {
        id: 'q5',
        text: 'A doutrina da consciência da alma após a morte refuta diretamente:',
        options: [
          { id: 'a', text: 'O materialismo e a psicopaniquia ("sono da alma").' },
          { id: 'b', text: 'O Catecismo de Westminster.' },
          { id: 'c', text: 'A doutrina da Trindade.' },
          { id: 'd', text: 'O dicotomismo.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Filipenses 1:23 e Apocalipse 6:9-11 sustentam a consciência da alma após a morte, refutando o materialismo (que reduz o homem à matéria) e a psicopaniquia ("sono da alma").',
      },
    ],
  },
  {
    lessonNumber: 13,
    questions: [
      {
        id: 'q1',
        text: 'Segundo Salmo 148 e Colossenses 1:16, qual a primeira verdade sobre os anjos?',
        options: [
          { id: 'a', text: 'São seres eternos e divinos.' },
          { id: 'b', text: 'São criaturas, criados por Deus e para Deus, dependentes do Criador.' },
          { id: 'c', text: 'Surgiram naturalmente do mundo invisível.' },
          { id: 'd', text: 'São deuses inferiores que Yahweh aceita.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Anjos são criaturas. Salmo 148:5 declara: "ele deu a ordem e eles foram criados", e Colossenses 1:16 inclui o invisível na criação por meio de Cristo.',
      },
      {
        id: 'q2',
        text: 'Qual desses NÃO é um atributo dos anjos segundo a Escritura?',
        options: [
          { id: 'a', text: 'Possuem intelecto e vontade.' },
          { id: 'b', text: 'São seres pessoais e espirituais.' },
          { id: 'c', text: 'São onipotentes, oniscientes e onipresentes.' },
          { id: 'd', text: 'Servem ao Senhor.' },
        ],
        correctOptionId: 'c',
        explanation:
          'A Escritura nunca atribui aos anjos os atributos incomunicáveis de Deus (onipotência, onisciência, onipresença). São criaturas limitadas, ainda que superiores em poder ao homem.',
      },
      {
        id: 'q3',
        text: 'Quem é o "Anjo do Senhor", figura que aparece em várias passagens do Antigo Testamento?',
        options: [
          { id: 'a', text: 'Um anjo criado de hierarquia superior.' },
          { id: 'b', text: 'Provavelmente uma cristofania, isto é, manifestação do Filho de Deus antes da encarnação.' },
          { id: 'c', text: 'Um nome alternativo para Satanás antes da queda.' },
          { id: 'd', text: 'Apenas uma figura simbólica sem identidade pessoal.' },
        ],
        correctOptionId: 'b',
        explanation:
          'O Anjo do Senhor fala como Deus, recebe honra singular e age com autoridade divina. Intérpretes reformados o identificam como cristofania, manifestação do Filho antes da encarnação.',
      },
      {
        id: 'q4',
        text: 'Segundo Hebreus 1:14, qual é a função dos anjos em relação aos crentes?',
        options: [
          { id: 'a', text: 'São deuses menores que recebem oração.' },
          { id: 'b', text: 'São espíritos ministradores enviados para servir aqueles que herdarão a salvação.' },
          { id: 'c', text: 'São juízes finais dos crentes.' },
          { id: 'd', text: 'São substitutos do Espírito Santo.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Hebreus 1:14 ensina que os anjos são "espíritos ministradores enviados para servir aqueles que hão de herdar a salvação", sem que isso justifique oração ou devoção dirigida a eles.',
      },
      {
        id: 'q5',
        text: 'O que Colossenses 2:18 e Apocalipse 22:8-9 ensinam sobre a adoração dos anjos?',
        options: [
          { id: 'a', text: 'Que é prática válida para certas devoções.' },
          { id: 'b', text: 'Que é proibida: anjos fiéis recusam culto, pois somente Deus deve ser adorado.' },
          { id: 'c', text: 'Que é permitida apenas para arcanjos.' },
          { id: 'd', text: 'Que é tradição da Igreja primitiva.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Cl 2:18 condena explicitamente a adoração de anjos. Em Ap 22:8-9, quando João se prostra, o anjo o repreende: "Não faça isso! Sou conservo seu... Adore a Deus!"',
      },
    ],
  },
  {
    lessonNumber: 14,
    questions: [
      {
        id: 'q1',
        text: 'Qual é a posição reformada sobre a leitura de Isaías 14 e Ezequiel 28 para descrever a queda de Satanás?',
        options: [
          { id: 'a', text: 'Esses textos são, em primeiro lugar, sobre a queda de Satanás, sem qualquer contexto humano.' },
          { id: 'b', text: 'Devem ser usados com cautela: o contexto imediato trata de reis humanos, podendo conter ecos tipológicos da rebelião satânica, mas não construir cronologias especulativas.' },
          { id: 'c', text: 'Esses textos foram inseridos posteriormente e devem ser ignorados.' },
          { id: 'd', text: 'Esses textos refutam a existência de Satanás.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A leitura reformada usa Is 14 e Ez 28 com cautela hermenêutica: o contexto imediato é sobre reis humanos, mas a tradição cristã reconhece ecos tipológicos da rebelião satânica.',
      },
      {
        id: 'q2',
        text: 'A Bíblia ensina que Deus criou os anjos:',
        options: [
          { id: 'a', text: 'Já caídos e maus.' },
          { id: 'b', text: 'Bons, santos e responsáveis; alguns posteriormente se rebelaram.' },
          { id: 'c', text: 'Como simples energias impessoais.' },
          { id: 'd', text: 'Como divindades coeternas.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Deus criou seres bons e santos. O pecado não nasceu no Criador, mas surgiu na criatura. Anjos que se rebelaram tornaram-se demônios (Jd 6, 2 Pe 2:4).',
      },
      {
        id: 'q3',
        text: 'Por que a teologia reformada rejeita o dualismo na doutrina do mal?',
        options: [
          { id: 'a', text: 'Porque ensina que Deus e Satanás são forças equivalentes em luta eterna.' },
          { id: 'b', text: 'Porque afirma a soberania absoluta de Deus.' },
          { id: 'c', text: 'Porque ensina que Satanás é onipotente.' },
          { id: 'd', text: 'Porque defende a existência do diabo.' },
        ],
        correctOptionId: 'a',
        explanation:
          'O dualismo coloca Deus e Satanás como forças equivalentes. A fé bíblica rejeita isso: Deus não tem oposto, e Satanás é apenas uma criatura caída, finita e condenada.',
      },
      {
        id: 'q4',
        text: 'Quais atributos NÃO podem ser atribuídos a Satanás?',
        options: [
          { id: 'a', text: 'Onipotência, onisciência e onipresença.' },
          { id: 'b', text: 'Inteligência e vontade.' },
          { id: 'c', text: 'Capacidade de mentir e acusar.' },
          { id: 'd', text: 'Limitação e finitude.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Satanás é criatura finita: não é onipotente, onisciente ou onipresente. Sua ação é real, mas sempre subordinada à providência soberana de Deus, como mostra o livro de Jó.',
      },
      {
        id: 'q5',
        text: 'Segundo Efésios 6:10-18, qual é o caminho bíblico da resistência espiritual?',
        options: [
          { id: 'a', text: 'Curiosidade especulativa sobre hierarquias demoníacas.' },
          { id: 'b', text: 'Mapeamento de espíritos territoriais como regra doutrinária.' },
          { id: 'c', text: 'Vestir a armadura de Deus: verdade, justiça, evangelho, fé, salvação, Palavra e oração.' },
          { id: 'd', text: 'Rituais místicos e amuletos sagrados.' },
        ],
        correctOptionId: 'c',
        explanation:
          'Efésios 6 não orienta a igreja a especulações demonológicas, mas a vestir a armadura de Deus: verdade, justiça, evangelho, fé, salvação, Palavra e oração, permanecendo firme em Cristo.',
      },
    ],
  },
  {
    lessonNumber: 15,
    questions: [
      {
        id: 'q1',
        text: 'Por que o desaparecimento da doutrina do pecado enfraquece o evangelho?',
        options: [
          { id: 'a', text: 'Porque sem pecado real, a cruz se torna mero símbolo de inspiração e o perdão deixa de ser necessário.' },
          { id: 'b', text: 'Porque torna o evangelho mais atraente.' },
          { id: 'c', text: 'Porque mostra que Deus é mais misericordioso.' },
          { id: 'd', text: 'Porque cancela a necessidade de pregação.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Quando a doutrina do pecado some, o evangelho perde profundidade: se o homem não está perdido, a cruz se torna símbolo vago, e se a culpa não é real, o perdão é dispensável.',
      },
      {
        id: 'q2',
        text: 'Segundo Isaías 59:2, qual o efeito real do pecado na relação do homem com Deus?',
        options: [
          { id: 'a', text: 'Apenas tristeza emocional passageira.' },
          { id: 'b', text: 'Separação real entre o pecador e Deus, ao ponto de Deus esconder o rosto.' },
          { id: 'c', text: 'Nenhum efeito espiritual.' },
          { id: 'd', text: 'Aproximação automática de Deus.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Isaías 59:2 declara: "as suas maldades separaram vocês do seu Deus". O pecado é ruptura real, não simples imperfeição.',
      },
      {
        id: 'q3',
        text: 'Qual destas NÃO é uma das seis definições bíblicas de pecado apresentadas na aula?',
        options: [
          { id: 'a', text: 'Omissão do dever (Tg 4:17).' },
          { id: 'b', text: 'Transgressão da lei (1 Jo 3:4).' },
          { id: 'c', text: 'Doença psicológica.' },
          { id: 'd', text: 'Corrupção interior (Rm 7:15-17).' },
        ],
        correctOptionId: 'c',
        explanation:
          'A aula apresenta seis definições bíblicas: omissão do dever, atitude errada para com Deus, transgressão da lei, ofensa ao próximo, incredulidade e corrupção interior. Pecado não é mera doença psicológica.',
      },
      {
        id: 'q4',
        text: 'O que significa, segundo Calvino e Romanos 8:7, que o pecado é "alta traição cósmica"?',
        options: [
          { id: 'a', text: 'É apenas um tropeço comportamental sem gravidade espiritual.' },
          { id: 'b', text: 'É insubmissão moral contra a Majestade divina, recusando o senhorio de Deus para seguir a própria vontade.' },
          { id: 'c', text: 'É um problema unicamente social.' },
          { id: 'd', text: 'É uma fase normal do desenvolvimento humano.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Calvino mostra que a raiz do pecado está na soberba e na infidelidade. Romanos 8:7 confirma: a mentalidade da carne é inimiga de Deus. Pecar é dizer que a vontade humana vale mais que a do Criador.',
      },
      {
        id: 'q5',
        text: 'Segundo Romanos 5:20, qual a relação entre pecado e graça?',
        options: [
          { id: 'a', text: 'Onde o pecado abundou, superabundou a graça em Cristo.' },
          { id: 'b', text: 'A graça apenas iguala o pecado.' },
          { id: 'c', text: 'A graça apaga a necessidade de arrependimento.' },
          { id: 'd', text: 'O pecado é maior que a graça.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Romanos 5:20 declara que onde o pecado abundou, a graça superabundou. A graça não minimiza o pecado: ela o vence. Por isso, só quem entende a profundidade do pecado se admira da grandeza da redenção.',
      },
    ],
  },
  {
    lessonNumber: 16,
    questions: [
      {
        id: 'q1',
        text: 'Pecamos porque somos pecadores, ou somos pecadores porque pecamos? Qual a resposta bíblica?',
        options: [
          { id: 'a', text: 'Somos pecadores porque pecamos: a culpa começa com a primeira ação.' },
          { id: 'b', text: 'Pecamos porque somos pecadores: os atos visíveis brotam de uma natureza interior caída.' },
          { id: 'c', text: 'As duas coisas são igualmente verdadeiras e independentes.' },
          { id: 'd', text: 'Não há relação entre natureza e ato.' },
        ],
        correctOptionId: 'b',
        explanation:
          'O pecado visível é fruto podre que aparece na árvore. A natureza humana foi corrompida na queda, e dessa corrupção interior brotam as ações pecaminosas (Sl 51:5).',
      },
      {
        id: 'q2',
        text: 'Quais são as três dimensões do pecado descritas na "anatomia" da aula?',
        options: [
          { id: 'a', text: 'Ação, Natureza e Culpa.' },
          { id: 'b', text: 'Pensamento, Palavra e Obra.' },
          { id: 'c', text: 'Mente, Corpo e Alma.' },
          { id: 'd', text: 'Original, Atual e Futuro.' },
        ],
        correctOptionId: 'a',
        explanation:
          'A anatomia bíblica do pecado abrange Ação (atos concretos), Natureza (corrupção interior herdada) e Culpa (estado objetivo de condenação diante de Deus).',
      },
      {
        id: 'q3',
        text: 'O que significa "depravação total" na teologia reformada?',
        options: [
          { id: 'a', text: 'Que todo ser humano é tão perverso quanto poderia ser.' },
          { id: 'b', text: 'Que o pecado alcançou todas as dimensões da pessoa (mente, vontade, afetos, corpo), de modo que ninguém permanece moralmente intacto diante de Deus.' },
          { id: 'c', text: 'Que o homem perdeu sua humanidade.' },
          { id: 'd', text: 'Que apenas alguns povos são depravados.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Depravação total não significa máxima perversidade possível, mas que o pecado afetou cada dimensão do ser humano. Nenhuma faculdade permaneceu intocada.',
      },
      {
        id: 'q4',
        text: 'O que é a "representação federal" de Adão na teologia reformada?',
        options: [
          { id: 'a', text: 'Adão atuou apenas como indivíduo privado, sem afetar os demais.' },
          { id: 'b', text: 'Adão foi constituído por Deus como cabeça da raça humana, e sua culpa foi imputada a seus descendentes.' },
          { id: 'c', text: 'Adão e Eva tiveram igual representatividade pactual.' },
          { id: 'd', text: 'Adão representa apenas seus filhos diretos.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Adão foi cabeça federal da humanidade. Sua culpa foi imputada (lançada na conta) a seus descendentes. O mesmo princípio explica a justificação em Cristo, segundo Adão.',
      },
      {
        id: 'q5',
        text: 'Qual a diferença entre justificação e santificação?',
        options: [
          { id: 'a', text: 'Justificação é o ato forense de Deus que declara o pecador justo em Cristo (remove a condenação); santificação é o processo do Espírito que combate o pecado remanescente e produz crescimento em obediência.' },
          { id: 'b', text: 'Justificação é progressiva; santificação é instantânea.' },
          { id: 'c', text: 'Justificação depende de obras humanas; santificação é só de graça.' },
          { id: 'd', text: 'São termos equivalentes.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Justificação é declaração jurídica única: Deus declara justo o pecador unido a Cristo. Santificação é processo contínuo do Espírito mortificando o pecado e produzindo obediência. Romanos 8:1 fundamenta a primeira.',
      },
    ],
  },
  {
    lessonNumber: 17,
    questions: [
      {
        id: 'q1',
        text: 'O mal moral, na teologia bíblica, surgiu primeiramente:',
        options: [
          { id: 'a', text: 'Da matéria criada.' },
          { id: 'b', text: 'Da rebelião das criaturas racionais (anjos) contra o Criador.' },
          { id: 'c', text: 'De alguma falha original em Deus.' },
          { id: 'd', text: 'Do destino impessoal do universo.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A origem cósmica do mal está na rebelião das criaturas racionais. A teologia reformada reconhece que a queda dos anjos precede a queda humana, mantendo a bondade original da criação.',
      },
      {
        id: 'q2',
        text: 'A prova de Adão no Éden, segundo Gênesis 2:16-17, era arbitrária ou propositada?',
        options: [
          { id: 'a', text: 'Era arbitrária e injusta.' },
          { id: 'b', text: 'Era propositada: revelava que a vida humana deveria ser vivida em dependência, confiança e obediência ao Criador.' },
          { id: 'c', text: 'Era apenas simbólica e sem consequência real.' },
          { id: 'd', text: 'Era um teste impossível de cumprir.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A prova no Éden não era arbitrária. Era o teste pactual da obediência confiante. A obediência era o caminho da vida, e a desobediência traria morte real (Gn 2:17).',
      },
      {
        id: 'q3',
        text: 'Segundo 1 Timóteo 2:14 e Romanos 5:12, qual a diferença entre os pecados de Adão e Eva?',
        options: [
          { id: 'a', text: 'Eva foi enganada pela serpente; Adão pecou conscientemente, e por isso é tratado como representante federal da raça.' },
          { id: 'b', text: 'Eva pecou primeiro, e por isso só ela é culpada.' },
          { id: 'c', text: 'Adão não pecou.' },
          { id: 'd', text: 'A culpa foi exclusivamente da serpente.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Eva foi enganada (1 Tm 2:14). Adão pecou conscientemente, e como cabeça federal da raça, sua transgressão é a porta de entrada do pecado e da morte na humanidade (Rm 5:12).',
      },
      {
        id: 'q4',
        text: 'Por que afirmar que Deus "permitiu" a queda não O torna autor moral do pecado?',
        options: [
          { id: 'a', text: 'Porque Deus decretou todas as coisas de modo santo, sábio e justo, ordenando-as para a manifestação de Sua justiça e graça em Cristo, sem jamais ser causador moral do mal.' },
          { id: 'b', text: 'Porque Deus não viu o que aconteceu.' },
          { id: 'c', text: 'Porque a queda foi inesperada para Deus.' },
          { id: 'd', text: 'Porque Adão foi mais forte que Deus naquele momento.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Deus permitiu a queda dentro de Seu conselho eterno, ordenando-a para a manifestação de Sua justiça e graça. Ele não é autor moral do pecado; a culpa pertence à criatura que transgride.',
      },
      {
        id: 'q5',
        text: 'Como a Bíblia contrasta o "primeiro Adão" com o "último Adão"?',
        options: [
          { id: 'a', text: 'O primeiro Adão trouxe condenação; o último Adão (Cristo) traz justificação e vida (1 Co 15:22).' },
          { id: 'b', text: 'O primeiro foi melhor que o último.' },
          { id: 'c', text: 'Os dois trouxeram morte.' },
          { id: 'd', text: 'Os dois são apenas símbolos sem cumprimento histórico.' },
        ],
        correctOptionId: 'a',
        explanation:
          '1 Coríntios 15:22 ensina: "como em Adão todos morrem, em Cristo todos serão vivificados". Cristo, o último Adão, responde ao problema cósmico e humano do mal pela cruz e ressurreição.',
      },
    ],
  },
  {
    lessonNumber: 18,
    questions: [
      {
        id: 'q1',
        text: 'Segundo Romanos 5:12, como o pecado entrou no mundo?',
        options: [
          { id: 'a', text: 'Por culpa exclusiva de Eva.' },
          { id: 'b', text: 'Por meio de um homem (Adão), e por meio do pecado, a morte alcançou todos os homens.' },
          { id: 'c', text: 'Por meio dos demônios diretamente.' },
          { id: 'd', text: 'De forma misteriosa, sem causa identificável.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Romanos 5:12: "como o pecado entrou no mundo por um homem... assim a morte veio a todos os homens, porque todos pecaram". Adão é a porta de entrada da queda na humanidade.',
      },
      {
        id: 'q2',
        text: 'Quais são as seis rupturas da queda destacadas na aula?',
        options: [
          { id: 'a', text: 'Com Deus, consigo mesmo, com o próximo, com a natureza, na própria criação e com a vida eterna.' },
          { id: 'b', text: 'Com a Igreja, com a família, com o trabalho, com o governo, com a nação e com a língua.' },
          { id: 'c', text: 'Com o templo, com o sacerdócio, com o rei, com o profeta, com a lei e com a aliança.' },
          { id: 'd', text: 'Com a mente, com o coração, com o corpo, com a alma, com o espírito e com a vontade.' },
        ],
        correctOptionId: 'a',
        explanation:
          'As seis rupturas: com Deus (separação), consigo mesmo (medo, vergonha), com o próximo (acusação, conflito), com a natureza (terra amaldiçoada), na criação (Rm 8:22) e com a vida eterna (morte espiritual).',
      },
      {
        id: 'q3',
        text: 'Após a queda, em Gênesis 3:8, o que faz Adão quando ouve a voz de Deus no jardim?',
        options: [
          { id: 'a', text: 'Corre para Ele alegremente.' },
          { id: 'b', text: 'Esconde-se, retrato inaugural do coração humano caído.' },
          { id: 'c', text: 'Pede oração imediata.' },
          { id: 'd', text: 'Convida Deus a comer com ele.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Adão se esconde de Deus, em vez de correr para Ele. Esse gesto é o retrato inaugural do coração humano caído: alienação, fuga e medo da presença divina.',
      },
      {
        id: 'q4',
        text: 'Por que a "ruptura com a vida eterna" é a mais grave?',
        options: [
          { id: 'a', text: 'Porque o salário do pecado é a morte, não só física, mas eterna; sem solução vinda de fora do homem, a condenação permanece.' },
          { id: 'b', text: 'Porque é apenas uma metáfora literária.' },
          { id: 'c', text: 'Porque afeta apenas algumas pessoas.' },
          { id: 'd', text: 'Porque pode ser resolvida pela autoajuda.' },
        ],
        correctOptionId: 'a',
        explanation:
          'A ruptura com a vida eterna é a mais grave porque o salário do pecado é a morte (Rm 6:23), e somente Cristo, vindo de fora, pode resolver essa condenação.',
      },
      {
        id: 'q5',
        text: 'Segundo Romanos 5:19, qual o contraste central entre Adão e Cristo?',
        options: [
          { id: 'a', text: 'Pela desobediência de Adão muitos foram feitos pecadores; pela obediência de Cristo muitos serão feitos justos.' },
          { id: 'b', text: 'Os dois trouxeram bênção igual.' },
          { id: 'c', text: 'Adão pecou mais que Cristo.' },
          { id: 'd', text: 'Cristo apenas igualou o que Adão fez.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Romanos 5:19 contrasta Adão e Cristo: pela desobediência do primeiro, condenação; pela obediência do último, justificação. Onde o pecado trouxe ruptura, Cristo traz reconciliação.',
      },
    ],
  },
  {
    lessonNumber: 19,
    questions: [
      {
        id: 'q1',
        text: 'O que NÃO significa a expressão "depravação total" na teologia reformada?',
        options: [
          { id: 'a', text: 'Que cada ser humano pratique todas as formas possíveis de perversidade ou seja tão perverso quanto poderia ser.' },
          { id: 'b', text: 'Que o pecado atingiu todas as faculdades humanas.' },
          { id: 'c', text: 'Que o homem natural não pode amar a Deus salvificamente sem graça.' },
          { id: 'd', text: 'Que existe corrupção em mente, vontade e afetos.' },
        ],
        correctOptionId: 'a',
        explanation:
          'Depravação total NÃO significa máxima perversidade possível em cada pessoa. A graça comum restringe o mal. A doutrina afirma que o pecado afetou TODAS as faculdades humanas, sem que nenhuma permaneça intacta.',
      },
      {
        id: 'q2',
        text: 'O que ensina a doutrina reformada da "graça comum"?',
        options: [
          { id: 'a', text: 'Que Deus salva a todos automaticamente.' },
          { id: 'b', text: 'Que Deus restringe o mal, preserva estruturas sociais, concede dons e senso de justiça relativo, sem que isso signifique salvação.' },
          { id: 'c', text: 'Que a salvação é resultado do esforço humano.' },
          { id: 'd', text: 'Que não existe diferença entre salvos e perdidos.' },
        ],
        correctOptionId: 'b',
        explanation:
          'A graça comum é a operação geral de Deus que restringe o mal e preserva a sociedade, distinta da graça salvadora particular. Explica por que nem toda sociedade é caos absoluto.',
      },
      {
        id: 'q3',
        text: 'Segundo 1 Coríntios 2:14, qual o estado da mente do homem natural diante das coisas espirituais?',
        options: [
          { id: 'a', text: 'Compreende plenamente sem o Espírito.' },
          { id: 'b', text: 'Não aceita nem é capaz de entender as coisas do Espírito de Deus, pois lhe são loucura.' },
          { id: 'c', text: 'Aceita com curiosidade neutra.' },
          { id: 'd', text: 'Sempre obedece quando ouve.' },
        ],
        correctOptionId: 'b',
        explanation:
          '1 Co 2:14: o homem natural não aceita as coisas do Espírito, pois lhe são loucura, "porque elas são discernidas espiritualmente". O problema não é falta de informação, mas corrupção moral do entendimento.',
      },
      {
        id: 'q4',
        text: 'Segundo João 3:19, qual a inclinação afetiva do homem caído?',
        options: [
          { id: 'a', text: 'Ama naturalmente a luz.' },
          { id: 'b', text: 'Ama as trevas, porque suas obras são más.' },
          { id: 'c', text: 'É indiferente entre luz e trevas.' },
          { id: 'd', text: 'Decide com perfeita neutralidade.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Jo 3:19 mostra que o homem natural ama as trevas, não a luz. Não basta apresentar o evangelho de modo atraente: o coração precisa ser regenerado para amar a Deus.',
      },
      {
        id: 'q5',
        text: 'A metáfora bíblica de Efésios 2:4-5 sobre a condição do homem fora de Cristo é:',
        options: [
          { id: 'a', text: 'Doença leve que precisa de orientação.' },
          { id: 'b', text: 'Cadáver espiritual que não coopera com a própria ressurreição; a salvação é obra da misericórdia soberana de Deus que vivifica.' },
          { id: 'c', text: 'Pessoa adormecida que basta ser despertada.' },
          { id: 'd', text: 'Atleta cansado que precisa de descanso.' },
        ],
        correctOptionId: 'b',
        explanation:
          'Ef 2:4-5: "estávamos mortos em transgressões... pela graça vocês são salvos". Um morto espiritual não coopera com sua própria ressurreição: a salvação é obra monergística da misericórdia de Deus.',
      },
    ],
  },
]

export const seedDoutrinasQuizzes = internalMutation({
  args: { creatorClerkId: v.string() },
  handler: async (ctx, { creatorClerkId }) => {
    const course = await ctx.db
      .query('courses')
      .withIndex('by_slug', (q) => q.eq('slug', COURSE_SLUG))
      .unique()
    if (!course) throw new Error('Curso Doutrinas Basicas nao encontrado. Rode seedDoutrinasBasicas antes.')
    if (course.creatorId !== creatorClerkId) throw new Error('creatorClerkId nao confere com o dono do curso.')

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', course._id))
      .collect()

    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const lessonQuiz of QUIZZES) {
      // Localiza a aula pelo prefixo "aula-XX-" no slug
      const prefix = `aula-${String(lessonQuiz.lessonNumber).padStart(2, '0')}-`
      const lesson = lessons.find((l) => l.slug?.startsWith(prefix))
      if (!lesson) {
        skipped++
        continue
      }

      // Idempotencia: se ja existe quiz para esta aula, deleta antes
      const existingQuiz = await ctx.db
        .query('quizzes')
        .withIndex('by_lessonId', (q) => q.eq('lessonId', lesson._id))
        .first()
      if (existingQuiz) {
        await ctx.db.delete(existingQuiz._id)
        updated++
      } else {
        inserted++
      }

      await ctx.db.insert('quizzes', {
        lessonId: lesson._id as Id<'lessons'>,
        courseId: course._id,
        creatorId: creatorClerkId,
        questions: lessonQuiz.questions,
      })

      // Ativa o flag de quiz obrigatorio na aula
      if (!lesson.hasMandatoryQuiz) {
        await ctx.db.patch(lesson._id, { hasMandatoryQuiz: true })
      }
    }

    return {
      courseId: course._id,
      lessonsTotal: lessons.length,
      quizzesInserted: inserted,
      quizzesUpdated: updated,
      lessonsNotFound: skipped,
      totalQuestions: QUIZZES.reduce((acc, q) => acc + q.questions.length, 0),
    }
  },
})
