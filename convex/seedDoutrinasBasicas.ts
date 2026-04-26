import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { toSlug } from './lib/slug'

// ---------------------------------------------------------------------------
// SEED, Curso "Doutrinas Basicas: Curso de Teologia"
//
// Estrutura completa do curso de Doutrinas Basicas do Pr Luiz Silva. O curso
// segue o esqueleto classico da teologia sistematica, organizado em modulos
// por loci. Esta versao contempla apenas as 19 aulas com video ja publicado
// (Aula 0 boas-vindas + Aulas 01 a 19), mais 36 aulas previstas (Cristologia,
// Pneumatologia, Soteriologia, Eclesiologia, Escatologia) que serao
// adicionadas conforme os videos forem ao ar.
//
// Curso marcado como `releaseStatus: 'in_progress'` desde o primeiro seed:
// certificado bloqueado, aluno ve "X de 55 aulas" e a mensagem "Toda quarta
// e sabado" no aviso de fim de fila.
//
// Quizzes serao adicionados em fase separada (Phase 3) lendo cada PDF de
// transcricao. Por enquanto, todas as aulas tem `hasMandatoryQuiz: false`
// para nao bloquear progresso.
//
// Disparar via:
//   npx convex run --prod seedDoutrinasBasicas:seedDoutrinasBasicas \
//     '{"creatorClerkId":"user_xxx"}'
//
// Idempotente: aborta se ja existe curso com o mesmo slug.
// ---------------------------------------------------------------------------

const COURSE_SLUG = 'curso-de-teologia-doutrinas-basicas'
const COURSE_TITLE = 'Curso de Teologia: Doutrinas Básicas'
// Capa do curso vem da thumb do video de boas-vindas. Pode ser substituida
// depois via /dashboard/cursos/:id (campo thumbnail).
const COURSE_THUMB = 'https://i.ytimg.com/vi/AvOhyIDzOMA/maxresdefault.jpg'

const COURSE_DESCRIPTION = `Curso completo e gratuito de Teologia Sistemática para iniciantes. Você vai aprender a base bíblica das principais doutrinas cristãs, organizadas no formato clássico da teologia: Bibliologia, Teologia Própria, Antropologia, Hamartiologia, Cristologia, Pneumatologia, Soteriologia, Eclesiologia e Escatologia.

São 55 aulas planejadas, lançadas duas vezes por semana, sempre às quartas e aos sábados. O curso ainda está em produção e cresce continuamente. Cada aula tem entre 6 e 11 minutos, vai direto ao ponto, com fundamentação bíblica, exemplos práticos e linguagem acessível para quem está começando os estudos teológicos.

Conteúdo 100% gratuito. Quizzes obrigatórios em cada aula para fixação. Como o curso ainda está em desenvolvimento, o certificado será emitido após o lançamento da última aula prevista, para quem alcançar 70% de aproveitamento.

Comece pela aula de boas-vindas e siga na ordem dos módulos. As aulas posteriores vão ficar disponíveis automaticamente conforme forem publicadas no canal.`

const TAGS = [
  'teologia',
  'doutrina',
  'sistemática',
  'bibliologia',
  'cristologia',
  'soteriologia',
]

const SCHEDULE_TEXT = 'Aulas novas toda quarta-feira e sábado.'
const EXPECTED_TOTAL_LESSONS = 55

type Verse = {
  bookSlug: string
  chapter: number
  verseStart: number
  verseEnd: number
  testament: 'old' | 'new'
}

type LessonSeed = {
  number: number
  title: string
  description: string
  youtubeId: string
  durationSeconds: number
  versesRefs?: Verse[]
}

const MODULES: { title: string; lessonNumbers: number[] }[] = [
  { title: 'Boas-vindas', lessonNumbers: [0] },
  { title: 'Módulo 1, Bibliologia', lessonNumbers: [1, 2, 3, 4, 5] },
  { title: 'Módulo 2, Teologia Própria (Doutrina de Deus)', lessonNumbers: [6, 7, 8, 9, 10, 11] },
  { title: 'Módulo 3, Antropologia (Doutrina do Homem)', lessonNumbers: [12, 13] },
  { title: 'Módulo 4, Hamartiologia (Doutrina do Pecado)', lessonNumbers: [14, 15, 16, 17, 18, 19] },
]

const LESSONS: LessonSeed[] = [
  {
    number: 0,
    title: 'COMECE POR AQUI: Boas-vindas ao Curso de Teologia',
    description:
      'Apresentação do curso, do método de estudo e da estrutura em módulos. Pr Luiz explica por que estudar teologia sistemática, como o curso vai funcionar e o que esperar das próximas aulas. Comece por aqui antes de avançar para a Aula 01.',
    youtubeId: 'AvOhyIDzOMA',
    durationSeconds: 155,
  },
  {
    number: 1,
    title: 'Aula 01, A Bíblia é confiável? (Revelação Geral e Especial)',
    description:
      'Primeira aula do módulo de Bibliologia. Você vai entender o que é revelação, a diferença entre revelação geral (criação, consciência, história) e especial (Escritura, Cristo) e por que a Bíblia é o ponto de partida confiável para toda doutrina cristã.',
    youtubeId: 'hxQahredBZo',
    durationSeconds: 512,
    versesRefs: [
      { bookSlug: 'romanos', chapter: 1, verseStart: 18, verseEnd: 23, testament: 'new' },
      { bookSlug: 'salmos', chapter: 19, verseStart: 1, verseEnd: 6, testament: 'old' },
      { bookSlug: 'hebreus', chapter: 1, verseStart: 1, verseEnd: 3, testament: 'new' },
    ],
  },
  {
    number: 2,
    title: 'Aula 02, Os Grandes Pactos de Deus (Alianças Bíblicas)',
    description:
      'A história da Bíblia é a história das alianças que Deus fez com a humanidade. Você estudará as principais (Adâmica, Noética, Abraâmica, Mosaica, Davídica e Nova Aliança) e como elas se conectam para formar o plano redentor de Cristo.',
    youtubeId: 'kmmC5ptCV0o',
    durationSeconds: 508,
    versesRefs: [
      { bookSlug: 'genesis', chapter: 12, verseStart: 1, verseEnd: 3, testament: 'old' },
      { bookSlug: '2-samuel', chapter: 7, verseStart: 12, verseEnd: 16, testament: 'old' },
      { bookSlug: 'jeremias', chapter: 31, verseStart: 31, verseEnd: 34, testament: 'old' },
    ],
  },
  {
    number: 3,
    title: 'Aula 03, A Bíblia contém erros? (Inspiração e Inerrância)',
    description:
      'O que significa dizer que a Bíblia é inspirada e inerrante. Você vai estudar 2 Timóteo 3:16, 2 Pedro 1:20-21 e a forma como a Igreja historicamente compreendeu a relação entre o autor humano e o Espírito Santo na produção do texto sagrado.',
    youtubeId: '5jfMqLXBYSI',
    durationSeconds: 485,
    versesRefs: [
      { bookSlug: '2-timoteo', chapter: 3, verseStart: 16, verseEnd: 17, testament: 'new' },
      { bookSlug: '2-pedro', chapter: 1, verseStart: 20, verseEnd: 21, testament: 'new' },
    ],
  },
  {
    number: 4,
    title: 'Aula 04, Quem escolheu os livros da Bíblia? (O Cânon Bíblico)',
    description:
      'A formação do cânon bíblico explicada de forma direta. Você vai entender por que temos 66 livros, como a Igreja primitiva reconheceu (e não escolheu) os livros canônicos, e por que apócrifos e gnósticos ficaram de fora.',
    youtubeId: 'LkYGHBqZsbo',
    durationSeconds: 384,
  },
  {
    number: 5,
    title: 'Aula 05, Como ler a Bíblia (com exemplos práticos)',
    description:
      'Iluminação, hermenêutica e os princípios básicos para ler a Bíblia com fidelidade. Você vai aprender a importância do contexto imediato, do gênero literário e da progressão da revelação para evitar interpretações distorcidas.',
    youtubeId: '4AkUSmhMSTY',
    durationSeconds: 652,
  },
  {
    number: 6,
    title: 'Aula 06, Deus existe? (Argumentos cosmológico, teleológico e moral)',
    description:
      'Primeira aula do módulo de Teologia Própria. Estudo dos clássicos argumentos da existência de Deus: cosmológico (causa primeira), teleológico (design) e moral (consciência), com referência a Romanos 1 e Salmo 19.',
    youtubeId: 'w136m2B3xjQ',
    durationSeconds: 529,
    versesRefs: [
      { bookSlug: 'salmos', chapter: 19, verseStart: 1, verseEnd: 4, testament: 'old' },
      { bookSlug: 'romanos', chapter: 1, verseStart: 18, verseEnd: 20, testament: 'new' },
    ],
  },
  {
    number: 7,
    title: 'Aula 07, Quem é Deus? (Atributos explicados)',
    description:
      'Os atributos comunicáveis e incomunicáveis de Deus. Você estudará santidade, eternidade, imutabilidade, onipotência, onisciência, onipresença, justiça, amor e fidelidade, e como cada um deles aparece na Escritura.',
    youtubeId: 'PUUA8Vua5LM',
    durationSeconds: 533,
  },
  {
    number: 8,
    title: 'Aula 08, A Trindade explicada (Deus é 1 ou 3?)',
    description:
      'A doutrina da Trindade tratada com profundidade e clareza. Um Deus em três Pessoas distintas (Pai, Filho e Espírito Santo). Você vai entender por que essa não é uma contradição matemática, mas o coração da revelação cristã.',
    youtubeId: 'A3dEOamYG_U',
    durationSeconds: 542,
    versesRefs: [
      { bookSlug: 'mateus', chapter: 28, verseStart: 19, verseEnd: 19, testament: 'new' },
      { bookSlug: '2-corintios', chapter: 13, verseStart: 13, verseEnd: 13, testament: 'new' },
    ],
  },
  {
    number: 9,
    title: 'Aula 09, Os nomes de Deus (Elohim, Yahweh, Adonai)',
    description:
      'Os principais nomes hebraicos de Deus: Elohim (Deus poderoso), Yahweh (o Eu Sou), Adonai (Senhor) e os nomes compostos (Yahweh-Jireh, Yahweh-Shalom etc.). Cada nome revela um aspecto do caráter do Deus que se revela.',
    youtubeId: '5Gf_-2nryRo',
    durationSeconds: 602,
    versesRefs: [
      { bookSlug: 'exodo', chapter: 3, verseStart: 13, verseEnd: 15, testament: 'old' },
    ],
  },
  {
    number: 10,
    title: 'Aula 10, Deus controla tudo? (Soberania e Decretos)',
    description:
      'A soberania de Deus e a doutrina dos decretos divinos. Como conciliar a soberania absoluta com a responsabilidade humana e o livre arbítrio. Tratamento direto, sem rodeios, partindo da exegese de Romanos 9 e Efésios 1.',
    youtubeId: 'p_qUojZgw-o',
    durationSeconds: 516,
    versesRefs: [
      { bookSlug: 'efesios', chapter: 1, verseStart: 4, verseEnd: 11, testament: 'new' },
      { bookSlug: 'romanos', chapter: 9, verseStart: 14, verseEnd: 24, testament: 'new' },
    ],
  },
  {
    number: 11,
    title: 'Aula 11, Deus criou o mal? (Teodiceia)',
    description:
      'A pergunta clássica da teodiceia. Se Deus é bom e soberano, por que existe o mal? Você vai estudar as respostas históricas (Agostinho, Calvino, Plantinga) e ver como a Bíblia trata o problema sem evadir a tensão.',
    youtubeId: 'qVijWBjGppU',
    durationSeconds: 393,
  },
  {
    number: 12,
    title: 'Aula 12, O que é o homem? (Corpo, Alma e Espírito)',
    description:
      'Primeira aula do módulo de Antropologia. Tricotomia versus dicotomia: o ser humano é composto de quantas partes? Você vai estudar Gênesis 2:7, 1 Tessalonicenses 5:23 e Hebreus 4:12 para chegar a uma resposta bíblica equilibrada.',
    youtubeId: 'ZAJDPiWw3iA',
    durationSeconds: 434,
    versesRefs: [
      { bookSlug: 'genesis', chapter: 2, verseStart: 7, verseEnd: 7, testament: 'old' },
      { bookSlug: '1-tessalonicenses', chapter: 5, verseStart: 23, verseEnd: 23, testament: 'new' },
      { bookSlug: 'hebreus', chapter: 4, verseStart: 12, verseEnd: 12, testament: 'new' },
    ],
  },
  {
    number: 13,
    title: 'Aula 13, O mundo espiritual (Anjos e sua natureza)',
    description:
      'A doutrina bíblica dos anjos. O que são, quando foram criados, qual é a função deles, hierarquia angélica (querubins, serafins, arcanjos) e por que o estudo dos anjos é parte da antropologia bíblica.',
    youtubeId: 'Rr1ZAFy61oM',
    durationSeconds: 409,
  },
  {
    number: 14,
    title: 'Aula 14, A queda dos anjos (Satanás e Demônios)',
    description:
      'Primeira aula do módulo de Hamartiologia. A origem do mal no plano cósmico: a queda de Lúcifer, a natureza dos demônios e o que a Bíblia revela (e o que não revela) sobre o mundo espiritual decaído. Tratamento alinhado à teologia reformada.',
    youtubeId: 'UdPGRhY3Hu4',
    durationSeconds: 375,
    versesRefs: [
      { bookSlug: 'isaias', chapter: 14, verseStart: 12, verseEnd: 15, testament: 'old' },
      { bookSlug: 'ezequiel', chapter: 28, verseStart: 12, verseEnd: 17, testament: 'old' },
    ],
  },
  {
    number: 15,
    title: 'Aula 15, O maior problema que a igreja tentou esconder',
    description:
      'A doutrina do pecado original e por que a igreja contemporânea evita pregar sobre ela. Estudo direto: o que é pecado, por que herdamos a natureza pecaminosa de Adão e por que essa doutrina é o coração da necessidade do Evangelho.',
    youtubeId: '9b7qEnQkTlo',
    durationSeconds: 531,
    versesRefs: [
      { bookSlug: 'romanos', chapter: 5, verseStart: 12, verseEnd: 21, testament: 'new' },
    ],
  },
  {
    number: 16,
    title: 'Aula 16, A anatomia do pecado (Ação, Natureza e Culpa)',
    description:
      'Pecado não é só o que você faz. É também o que você é. Você vai entender as três dimensões do pecado segundo a Escritura: ação (transgressão), natureza (corrupção) e culpa (imputação), e como cada dimensão exige uma resposta diferente do Evangelho.',
    youtubeId: 'J59-oFs8kq8',
    durationSeconds: 380,
  },
  {
    number: 17,
    title: 'Aula 17, A origem cósmica e humana do mal',
    description:
      'Como o mal entrou na criação? Estudo da queda em duas dimensões: cósmica (anjos rebeldes) e humana (Adão e Eva). Você vai entender por que o pecado não é uma falha de Deus, mas uma rebelião que tem responsáveis nomeados.',
    youtubeId: 'VOhJOByQQXg',
    durationSeconds: 389,
  },
  {
    number: 18,
    title: 'Aula 18, As consequências e as 6 rupturas da queda',
    description:
      'O pecado não rompeu uma coisa só. Rompeu seis. Você vai estudar as rupturas: com Deus, consigo mesmo, com o próximo, com a criação, com o trabalho e com o futuro. Cada ruptura é antecipação de uma das obras restauradoras de Cristo.',
    youtubeId: 'hOF4oNsUatQ',
    durationSeconds: 663,
    versesRefs: [
      { bookSlug: 'genesis', chapter: 3, verseStart: 14, verseEnd: 24, testament: 'old' },
    ],
  },
  {
    number: 19,
    title: 'Aula 19, A depravação total (O homem é incapaz?)',
    description:
      'O ponto culminante do módulo de Hamartiologia. O que a Bíblia ensina sobre a incapacidade total do homem caído de buscar a Deus por si mesmo. Estudo de Romanos 3, Efésios 2 e a base bíblica da doutrina da depravação total no contexto reformado.',
    youtubeId: '7oWRippDBns',
    durationSeconds: 526,
    versesRefs: [
      { bookSlug: 'romanos', chapter: 3, verseStart: 10, verseEnd: 18, testament: 'new' },
      { bookSlug: 'efesios', chapter: 2, verseStart: 1, verseEnd: 3, testament: 'new' },
    ],
  },
]

export const seedDoutrinasBasicas = internalMutation({
  args: { creatorClerkId: v.string() },
  handler: async (ctx, { creatorClerkId }) => {
    // Idempotencia por slug
    const existing = await ctx.db
      .query('courses')
      .withIndex('by_slug', (q) => q.eq('slug', COURSE_SLUG))
      .unique()
    if (existing) {
      throw new Error(`Curso ja existe (id ${existing._id}). Apague antes de reseed.`)
    }

    const courseId = await ctx.db.insert('courses', {
      creatorId: creatorClerkId,
      title: COURSE_TITLE,
      description: COURSE_DESCRIPTION,
      thumbnail: COURSE_THUMB,
      category: 'Teologia Sistemática',
      level: 'iniciante',
      isPublished: true,
      totalLessons: LESSONS.length,
      totalStudents: 0,
      totalModules: MODULES.length,
      tags: TAGS,
      language: 'Português',
      slug: COURSE_SLUG,
      passingScore: 70,
      releaseStatus: 'in_progress',
      expectedTotalLessons: EXPECTED_TOTAL_LESSONS,
      nextLessonScheduleText: SCHEDULE_TEXT,
      visibility: 'public',
    })

    let lessonsCreated = 0

    for (let mIdx = 0; mIdx < MODULES.length; mIdx++) {
      const m = MODULES[mIdx]
      const moduleId: Id<'modules'> = await ctx.db.insert('modules', {
        courseId,
        creatorId: creatorClerkId,
        title: m.title,
        order: mIdx + 1,
      })

      let orderInModule = 1
      for (const lessonNumber of m.lessonNumbers) {
        const lesson = LESSONS.find((l) => l.number === lessonNumber)
        if (!lesson) continue
        const slugBase =
          lessonNumber === 0
            ? 'aula-00-comece-por-aqui'
            : `aula-${String(lessonNumber).padStart(2, '0')}-${lesson.title.replace(/aula\s+\d+,?\s*/i, '')}`
        const lessonSlug = toSlug(slugBase)

        await ctx.db.insert('lessons', {
          moduleId,
          courseId,
          creatorId: creatorClerkId,
          title: lesson.title,
          description: lesson.description,
          youtubeUrl: `https://www.youtube.com/watch?v=${lesson.youtubeId}`,
          durationSeconds: lesson.durationSeconds,
          order: orderInModule++,
          isPublished: true,
          // Aula 0 nao tem quiz. Demais aulas ficam sem quiz nesta fase
          // (Phase 3 ativa o flag e popula a tabela quizzes lendo cada PDF).
          hasMandatoryQuiz: false,
          allowQuizRetry: true,
          slug: lessonSlug,
          versesRefs: lesson.versesRefs ?? [],
        })
        lessonsCreated++
      }
    }

    return {
      courseId,
      slug: COURSE_SLUG,
      modulesCreated: MODULES.length,
      lessonsCreated,
      expectedTotalLessons: EXPECTED_TOTAL_LESSONS,
    }
  },
})

// Helper para listar apenas os slugs das aulas criadas (util para Phase 3 de
// quizzes saber quais aulas atualizar).
export const listLessonsForQuizSeed = internalMutation({
  args: { creatorClerkId: v.string() },
  handler: async (ctx, { creatorClerkId }) => {
    const course = await ctx.db
      .query('courses')
      .withIndex('by_slug', (q) => q.eq('slug', COURSE_SLUG))
      .unique()
    if (!course) throw new Error('Curso Doutrinas Basicas nao encontrado')
    if (course.creatorId !== creatorClerkId) throw new Error('creatorClerkId nao confere')

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_courseId', (q) => q.eq('courseId', course._id))
      .collect()

    return lessons.map((l) => ({
      _id: l._id,
      slug: l.slug,
      title: l.title,
      order: l.order,
      hasMandatoryQuiz: l.hasMandatoryQuiz,
    }))
  },
})
