import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    perfil: v.optional(v.union(v.literal('aluno'), v.literal('criador'), v.literal('instituicao'))),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    country: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneCountry: v.optional(v.string()),
    instagram: v.optional(v.string()),
    facebook: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    address: v.optional(v.string()),
    addressNumber: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    cep: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    institution: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    denomination: v.optional(v.string()),
    churchRole: v.optional(v.string()),
    churchName: v.optional(v.string()),
    churchInstagram: v.optional(v.string()),
    totalDonationsReceived: v.optional(v.number()),
    handle: v.optional(v.string()),
    profileVisibility: v.optional(v.union(v.literal('public'), v.literal('unlisted'))),
    showProgressPublicly: v.optional(v.boolean()),
    // Quando true, AdSense não é renderizado para este usuário. Default false
    // (ausente). Será ligado pelo webhook do Stripe quando a Fase 4 implementar
    // assinaturas. Manualmente patcheável via Convex Dashboard pra testes.
    isPremium: v.optional(v.boolean()),
    // Contador denormalizado de profileFollows. Atualizado por
    // profileFollows.follow/unfollow.
    followerCount: v.optional(v.number()),
    // Código de indicação único do usuário. Gerado on-demand pela primeira
    // visita à página /indicar. Outras pessoas que se cadastram com ?ref=CODE
    // ficam linkadas ao referrer via tabela referrals.
    referralCode: v.optional(v.string()),
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_handle', ['handle'])
    .index('by_email', ['email'])
    .index('by_referralCode', ['referralCode']),

  userFunctions: defineTable({
    userId: v.string(),
    function: v.union(v.literal('aluno'), v.literal('criador'), v.literal('instituicao')),
    enabledAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_function', ['userId', 'function']),

  consents: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal('geral'),
      v.literal('aluno'),
      v.literal('criador'),
      v.literal('instituicao')
    ),
    documentVersion: v.string(),
    acceptedAt: v.number(),
    revokedAt: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index('by_userId', ['userId']),

  institutions: defineTable({
    name: v.string(),
    type: v.union(v.literal('igreja'), v.literal('ensino'), v.literal('empresa')),
    createdByUserId: v.string(),
    cnpj: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    denomination: v.optional(v.string()),
    denominationName: v.optional(v.string()),
    responsibleRole: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.optional(v.string()),
      number: v.optional(v.string()),
      complement: v.optional(v.string()),
      neighborhood: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
    })),
    // Branding institucional. themeColor é o accent (#hex) que substitui
    // #F37E20 nas páginas /instituicao/:id (futuras). logoUrl é o logo da
    // instituição mostrado no topo das páginas dela. Slug é a chave pública.
    themeColor: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
  })
    .index('by_createdByUserId', ['createdByUserId'])
    .index('by_slug', ['slug']),

  institutionMembers: defineTable({
    institutionId: v.id('institutions'),
    userId: v.string(),
    role: v.union(v.literal('dono'), v.literal('admin'), v.literal('membro')),
    addedAt: v.number(),
    addedByUserId: v.string(),
    status: v.union(v.literal('pendente'), v.literal('ativo'), v.literal('removido')),
  })
    .index('by_institutionId', ['institutionId'])
    .index('by_userId', ['userId'])
    .index('by_institution_user', ['institutionId', 'userId']),

  institutionInvites: defineTable({
    institutionId: v.id('institutions'),
    email: v.string(),
    token: v.string(),
    sentAt: v.number(),
    expiresAt: v.number(),
    status: v.union(v.literal('pendente'), v.literal('aceito'), v.literal('expirado')),
    sentByUserId: v.string(),
  })
    .index('by_institutionId', ['institutionId'])
    .index('by_token', ['token']),

  creatorProfiles: defineTable({
    userId: v.string(),
    channelName: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    bioProfessional: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    pixKey: v.optional(v.string()),
  }).index('by_userId', ['userId']),

  courses: defineTable({
    creatorId: v.string(),
    title: v.string(),
    description: v.string(),
    thumbnail: v.optional(v.string()),
    category: v.string(),
    level: v.union(v.literal('iniciante'), v.literal('intermediario'), v.literal('avancado')),
    isPublished: v.boolean(),
    totalLessons: v.number(),
    totalStudents: v.number(),
    totalModules: v.number(),
    tags: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    slug: v.optional(v.string()),
    // Nota mínima (0–100) para emissão de certificado. Default 70. O professor
    // pode aumentar para tornar o curso mais rigoroso. Nunca menor que 70.
    passingScore: v.optional(v.number()),
    // Quando true, o curso aceita que aulas sejam transmitidas ao vivo (via
    // YouTube/Vimeo Live). Apenas informativo para o aluno; o player continua
    // igual ao de vídeos gravados.
    hasLiveStream: v.optional(v.boolean()),
    // URL pública da live (YouTube Live, Vimeo Live etc.) quando hasLiveStream
    // está ativo. Não é cadastrado por aula, apenas no curso.
    liveStreamUrl: v.optional(v.string()),
    // Instituição à qual o curso está vinculado. Quando `visibility` é
    // 'institution', apenas membros ativos desta instituição podem se
    // matricular e ver o curso no catálogo. Em 'public' (ou ausente) o curso
    // aparece no catálogo público normalmente, independente de ter
    // institutionId definido.
    institutionId: v.optional(v.id('institutions')),
    visibility: v.optional(v.union(v.literal('public'), v.literal('institution'))),
    // Estado de produção do curso. 'in_progress' = ainda em desenvolvimento, o
    // criador está publicando aulas aos poucos; certificado fica bloqueado até
    // virar 'complete'. 'complete' (ou ausente, para cursos legados) = curso
    // finalizado; certificado é emitido normalmente quando o aluno termina
    // todas as aulas publicadas.
    releaseStatus: v.optional(v.union(v.literal('in_progress'), v.literal('complete'))),
    // Total previsto de aulas quando o criador finalizar a produção. Mostrado
    // ao aluno como "X/Y aulas" e usado para comunicar progresso real do curso.
    // Opcional; quando ausente a UI mostra apenas o número atual de aulas.
    expectedTotalLessons: v.optional(v.number()),
    // Mensagem livre do criador sobre o cronograma das próximas aulas em curso
    // 'in_progress'. Ex.: "Toda quarta e sábado", "Lançamentos quinzenais",
    // "Aulas extras conforme demanda". Quando vazio, a UI cai para a frase
    // padrão "Você será notificado quando uma nova aula sair". Apenas exibido
    // ao aluno que já concluiu todas as aulas atualmente publicadas.
    nextLessonScheduleText: v.optional(v.string()),
    // Média e contagem de avaliações denormalizadas (mantidas por
    // student.rateCourse). Catalog.listPublished lê em O(1) sem N+1 sobre
    // courseRatings. Quando ausente significa "ainda não recalculado" e a UI
    // cai para "sem avaliações".
    avgRating: v.optional(v.number()),
    ratingsCount: v.optional(v.number()),
    // FAQ pré-cadastrada pelo professor. Renderizada na página pública do
    // curso e exposta como JSON-LD FAQPage para SEO. Lista de objetos
    // {question, answer} simples; nada estruturado além disso para manter o
    // editor leve.
    faq: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
  })
    .index('by_creatorId', ['creatorId'])
    .index('by_published', ['isPublished'])
    .index('by_slug', ['slug'])
    .index('by_institutionId', ['institutionId']),

  modules: defineTable({
    courseId: v.id('courses'),
    creatorId: v.string(),
    title: v.string(),
    order: v.number(),
  }).index('by_courseId', ['courseId']).index('by_creatorId', ['creatorId']),

  lessons: defineTable({
    moduleId: v.id('modules'),
    courseId: v.id('courses'),
    creatorId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    youtubeUrl: v.string(),
    durationSeconds: v.optional(v.number()),
    order: v.number(),
    isPublished: v.boolean(),
    hasMandatoryQuiz: v.boolean(),
    slug: v.optional(v.string()),
    // Legado: lista livre de referências em texto (ex. "João 3:16"). Campo
    // preservado para não quebrar documentos pré-migração, nunca mais escrito
    // pelo criador. A UI prioriza versesRefs quando presente.
    verses: v.optional(v.array(v.string())),
    // Formato estruturado: cada referência tem livro (slug), capítulo, verso
    // inicial/final e testamento. Permite filtrar por tradução (grego/hebraico
    // só aparecem no testamento compatível) e buscar versículos via API.
    versesRefs: v.optional(v.array(v.object({
      bookSlug: v.string(),
      chapter: v.number(),
      verseStart: v.number(),
      verseEnd: v.number(),
      testament: v.union(v.literal('old'), v.literal('new')),
    }))),
    // Quando true, o aluno pode zerar a nota do quiz e refazer mediante nova
    // visualização integral da aula. Quando false/undefined, a nota é final.
    allowQuizRetry: v.optional(v.boolean()),
    // Data prevista de publicação. Usado em cursos com lançamento incremental
    // ('releaseStatus=in_progress'): o criador agenda quando uma aula deve ir
    // ao ar; até lá ela aparece como "próxima aula em DD/MM" para o aluno.
    // Independente do isPublished (que continua sendo a fonte de verdade da
    // visibilidade real). Opcional para não afetar aulas já publicadas.
    publishAt: v.optional(v.number()),
  })
    .index('by_courseId', ['courseId'])
    .index('by_moduleId', ['moduleId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_courseId_slug', ['courseId', 'slug'])
    // Index composto usado pelo cron de scheduled-publish: scan apenas dos
    // candidatos (isPublished=false E publishAt definido) sem full-table scan.
    .index('by_published_publishAt', ['isPublished', 'publishAt']),

  quizzes: defineTable({
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    creatorId: v.string(),
    questions: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        options: v.array(v.object({ id: v.string(), text: v.string() })),
        correctOptionId: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
  })
    .index('by_lessonId', ['lessonId'])
    .index('by_creatorId', ['creatorId']),

  enrollments: defineTable({
    courseId: v.id('courses'),
    studentId: v.string(),
    completedAt: v.optional(v.number()),
    certificateIssued: v.boolean(),
    finalScore: v.optional(v.number()),
  })
    .index('by_courseId', ['courseId'])
    .index('by_studentId', ['studentId'])
    .index('by_student_course', ['studentId', 'courseId']),

  progress: defineTable({
    studentId: v.string(),
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    watchedSeconds: v.number(),
    totalSeconds: v.number(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    quizScore: v.optional(v.number()),
    quizPassed: v.optional(v.boolean()),
    // Número de tentativas de quiz já concluídas por este aluno nesta aula.
    // Usado apenas para registro/telemetria; não é limite.
    quizAttempts: v.optional(v.number()),
    // Quando true, o aluno pediu para refazer o quiz e ainda não reassistiu a
    // aula. Enquanto pendente: quizScore fica undefined, watchedSeconds foi
    // zerado, completed permanece true (aluno já concluiu esta aula antes),
    // e o quiz fica bloqueado até reatingir 95%. A média do curso ignora
    // aulas com esta flag. Certificado exige que não haja pendências.
    quizRetryPending: v.optional(v.boolean()),
    // Timestamp do último reset de watchedSeconds decorrente de retry. Permite
    // depuração e ordenação por "tentativa em andamento".
    watchResetAt: v.optional(v.number()),
  })
    .index('by_studentId', ['studentId'])
    .index('by_student_lesson', ['studentId', 'lessonId'])
    .index('by_student_course', ['studentId', 'courseId'])
    .index('by_lessonId', ['lessonId'])
    .index('by_courseId', ['courseId']),

  // Materiais complementares (apenas .pdf e .txt) anexados a uma aula.
  // Armazenados no Convex File Storage via storageId. Multi-tenant: creatorId
  // replica courseId para filtro direto sem join.
  lessonMaterials: defineTable({
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    creatorId: v.string(),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    storageId: v.id('_storage'),
    order: v.number(),
    createdAt: v.number(),
  })
    .index('by_lessonId', ['lessonId'])
    .index('by_courseId', ['courseId'])
    .index('by_creatorId', ['creatorId']),

  // Cadernos do aluno. Cada aluno pode ter múltiplos cadernos (ex. "Estudos
  // Paulinos", "Hermenêutica"). Entradas (notebookEntries) vinculam conteúdo
  // a uma aula específica dentro de um caderno escolhido.
  notebooks: defineTable({
    studentId: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_studentId', ['studentId']),

  notebookEntries: defineTable({
    studentId: v.string(),
    notebookId: v.id('notebooks'),
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    content: v.string(),
    updatedAt: v.number(),
  })
    .index('by_student_lesson', ['studentId', 'lessonId'])
    .index('by_notebook', ['notebookId'])
    .index('by_student_notebook_lesson', ['studentId', 'notebookId', 'lessonId']),

  // Comentários em aulas. Estrutura de thread de um nível: comentários com
  // parentId=undefined e respostas com parentId apontando ao comentário-pai.
  // isOfficial marca respostas do criador do curso (destacadas na UI).
  lessonComments: defineTable({
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    authorRole: v.union(v.literal('aluno'), v.literal('criador')),
    text: v.string(),
    parentId: v.optional(v.id('lessonComments')),
    isOfficial: v.optional(v.boolean()),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index('by_lessonId', ['lessonId'])
    .index('by_parentId', ['parentId'])
    .index('by_authorId', ['authorId']),

  // Flashcards do aluno com revisão espaçada simplificada (SM-2). Decks são
  // coleções do próprio aluno, podendo opcionalmente referenciar um curso para
  // agrupar por assunto. Cada card tem easiness/interval/dueAt atualizados
  // toda vez que o aluno avalia a resposta.
  flashcardDecks: defineTable({
    studentId: v.string(),
    title: v.string(),
    courseId: v.optional(v.id('courses')),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_studentId', ['studentId']),

  flashcards: defineTable({
    deckId: v.id('flashcardDecks'),
    studentId: v.string(),
    front: v.string(),
    back: v.string(),
    easiness: v.number(),
    intervalDays: v.number(),
    repetitions: v.number(),
    dueAt: v.number(),
    lastReviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_deckId', ['deckId'])
    .index('by_student_due', ['studentId', 'dueAt']),

  // Anotações de aula vinculadas a um timestamp do vídeo. Aluno clica "Anotar
  // este momento" no player e grava uma nota associada ao segundo atual. Ao
  // clicar em uma anotação salva, o player pula para aquele ponto. Um aluno
  // pode ter várias anotações em timestamps distintos na mesma aula.
  lessonTimestamps: defineTable({
    studentId: v.string(),
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    timestampSeconds: v.number(),
    note: v.string(),
    createdAt: v.number(),
  })
    .index('by_student_lesson', ['studentId', 'lessonId'])
    .index('by_lessonId', ['lessonId']),

  // Estatísticas de estudo do aluno para gamificação. Atualizado em lazy-update
  // quando o aluno conclui aulas ou cursos. streak conta dias consecutivos
  // (baseado em UTC day); bestStreak guarda o recorde pessoal. points cresce
  // cumulativamente (+10 por aula concluída, +50 por certificado emitido).
  // lastStudyDate é o dateKey YYYY-MM-DD do último dia com atividade.
  studentStats: defineTable({
    studentId: v.string(),
    streak: v.number(),
    bestStreak: v.number(),
    lastStudyDate: v.optional(v.string()),
    totalLessonsCompleted: v.number(),
    totalCoursesCompleted: v.number(),
    points: v.number(),
    updatedAt: v.number(),
    // Última vez que o cron de reengajamento disparou para este aluno (epoch ms).
    // Usado pra throttle: nunca reengajar mais de uma vez a cada 14 dias.
    lastReengagementAt: v.optional(v.number()),
  }).index('by_studentId', ['studentId']),

  // Perguntas privadas do aluno ao professor (dono do curso). Cada documento é
  // uma pergunta + resposta opcional. Apenas o aluno autor vê suas próprias
  // perguntas; o professor dono vê todas do seu curso. Opcionalmente vinculada
  // a uma aula específica para dar contexto.
  courseQuestions: defineTable({
    courseId: v.id('courses'),
    creatorId: v.string(),
    studentId: v.string(),
    studentName: v.string(),
    studentAvatarUrl: v.optional(v.string()),
    lessonId: v.optional(v.id('lessons')),
    question: v.string(),
    answer: v.optional(v.string()),
    askedAt: v.number(),
    answeredAt: v.optional(v.number()),
  })
    .index('by_course_student', ['courseId', 'studentId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_courseId', ['courseId'])
    .index('by_creator_answered', ['creatorId', 'answeredAt']),

  // Fórum por curso (nível acima das aulas). Mesma estrutura do lessonComments,
  // mas escopado ao curso inteiro. Aluno matriculado e professor dono têm
  // acesso de leitura/escrita. Respostas têm 1 nível.
  courseComments: defineTable({
    courseId: v.id('courses'),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    authorRole: v.union(v.literal('aluno'), v.literal('criador')),
    text: v.string(),
    parentId: v.optional(v.id('courseComments')),
    isOfficial: v.optional(v.boolean()),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index('by_courseId', ['courseId'])
    .index('by_parentId', ['parentId'])
    .index('by_authorId', ['authorId']),

  donations: defineTable({
    creatorId: v.string(),
    studentId: v.string(),
    studentName: v.optional(v.string()),
    amountCents: v.number(),
    message: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('completed'), v.literal('failed')),
    stripePaymentId: v.optional(v.string()),
  }).index('by_creatorId', ['creatorId']),

  testimonials: defineTable({
    authorId: v.string(),
    profileUserId: v.string(),
    text: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index('by_profileUserId', ['profileUserId'])
    .index('by_profileUserId_status', ['profileUserId', 'status'])
    .index('by_author_profile', ['authorId', 'profileUserId']),

  ratings: defineTable({
    authorId: v.string(),
    profileUserId: v.string(),
    stars: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_profileUserId', ['profileUserId'])
    .index('by_author_profile', ['authorId', 'profileUserId']),

  courseRatings: defineTable({
    studentId: v.string(),
    courseId: v.id('courses'),
    stars: v.number(),
    review: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_courseId', ['courseId'])
    .index('by_student_course', ['studentId', 'courseId']),

  // Notificações direcionadas a um usuário. `kind` identifica o tipo (curso
  // concluído, nova resposta em comentário, certificado emitido, etc.), `link`
  // aponta para o destino dentro do painel, `readAt` marca leitura. O sino do
  // header lista as 20 mais recentes, badge conta as não lidas.
  notifications: defineTable({
    userId: v.string(),
    kind: v.union(
      v.literal('course_completed'),
      v.literal('certificate_issued'),
      v.literal('comment_reply'),
      v.literal('comment_new'),
      v.literal('course_published'),
      v.literal('welcome'),
      v.literal('reengagement'),
      v.literal('generic'),
      v.literal('post_published'),
      v.literal('post_comment_new'),
      v.literal('post_comment_reply'),
      v.literal('profile_followed'),
      v.literal('course_marked_complete'),
      v.literal('lesson_scheduled_published'),
    ),
    title: v.string(),
    body: v.optional(v.string()),
    link: v.optional(v.string()),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_unread', ['userId', 'readAt']),

  // Impressões de anúncio AdSense atribuídas a um criador. Cada vez que um
  // <AdSlot> entra na viewport pela primeira vez na sessão, registramos uma
  // linha aqui. Base para revenue share: o criador com X% das impressões do
  // mês recebe X% da receita líquida do AdSense daquele mês. sessionId vem
  // do sessionStorage do navegador (UUID por aba). Index by_session_slot
  // permite deduplicar impressões repetidas.
  adImpressions: defineTable({
    creatorId: v.string(),
    courseId: v.optional(v.id('courses')),
    lessonId: v.optional(v.id('lessons')),
    slotId: v.string(),
    page: v.string(),
    userId: v.optional(v.string()),
    sessionId: v.string(),
    at: v.number(),
  })
    .index('by_creator_at', ['creatorId', 'at'])
    .index('by_session_slot', ['sessionId', 'slotId']),

  // Curtidas internas em aulas. Substitui o botão "Curtir no YouTube":
  // o aluno reage à aula dentro da plataforma, sem depender de OAuth ou de
  // sair para o YouTube. Index by_lesson_user garante unicidade lógica
  // (1 like por aluno por aula); by_lesson agrega contagem.
  lessonLikes: defineTable({
    lessonId: v.id('lessons'),
    courseId: v.id('courses'),
    userId: v.string(),
    at: v.number(),
  })
    .index('by_lesson', ['lessonId'])
    .index('by_lesson_user', ['lessonId', 'userId']),

  // Pageviews em páginas atribuídas a criador (catálogo do criador, detalhe
  // do curso, AulaPage). Backup interno do GA4 para reconciliar atribuição
  // sem depender de sampling do Google. Páginas genéricas da plataforma
  // (landing, /cursos) não geram linhas aqui.
  pageViews: defineTable({
    creatorId: v.optional(v.string()),
    courseId: v.optional(v.id('courses')),
    lessonId: v.optional(v.id('lessons')),
    page: v.string(),
    userId: v.optional(v.string()),
    sessionId: v.string(),
    at: v.number(),
    // Adicionados em 2026-04-26 para o dashboard admin de analytics interno.
    // Optional para compat com registros antigos.
    referrer: v.optional(v.string()),
    device: v.optional(
      v.union(v.literal('mobile'), v.literal('desktop'), v.literal('tablet')),
    ),
  })
    .index('by_creator_at', ['creatorId', 'at'])
    .index('by_at', ['at'])
    .index('by_page_at', ['page', 'at']),

  // ===== BLOG =====
  // Artigo publicável por qualquer usuário (aluno, criador, instituicao). A
  // identidade de publicação é capturada em authorIdentity; quando publica como
  // instituicao, authorInstitutionId aponta para a tabela institutions. URL
  // pública é /blog/:handle/:slug; slug é único por authorUserId. Métricas
  // (likeCount, commentCount, shareCount, viewCount) são denormalizadas e
  // atualizadas dentro das mutations correspondentes para evitar agregação cara
  // em queries de leitura.
  posts: defineTable({
    authorUserId: v.string(),
    authorIdentity: v.union(
      v.literal('aluno'),
      v.literal('criador'),
      v.literal('instituicao'),
    ),
    authorInstitutionId: v.optional(v.id('institutions')),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    bodyMarkdown: v.string(),
    coverImageStorageId: v.optional(v.id('_storage')),
    categorySlug: v.string(),
    tagSlugs: v.array(v.string()),
    status: v.union(
      v.literal('draft'),
      v.literal('scheduled'),
      v.literal('published'),
      v.literal('unlisted'),
      v.literal('removed'),
    ),
    publishAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
    likeCount: v.number(),
    commentCount: v.number(),
    shareCount: v.number(),
    viewCount: v.number(),
  })
    .index('by_author', ['authorUserId'])
    .index('by_status_publishedAt', ['status', 'publishedAt'])
    .index('by_category_publishedAt', ['categorySlug', 'publishedAt'])
    .index('by_author_slug', ['authorUserId', 'slug']),

  // Categorias editoriais. Slug é a chave estável; nome é exibido. order
  // controla a ordenação na navegação. Seedadas via internalMutation.
  postCategories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
  }).index('by_slug', ['slug']),

  // Tags livres. postCount é denormalizado e atualizado em publish/unpublish
  // para listagens populares sem N queries.
  postTags: defineTable({
    slug: v.string(),
    name: v.string(),
    postCount: v.number(),
  }).index('by_slug', ['slug']),

  // Snapshot diário do top por categoria. categorySlug='all' guarda ranking
  // global. Cron computa diariamente; queries de home consomem o último
  // snapshot por categoria em O(1).
  postRankingSnapshots: defineTable({
    categorySlug: v.string(),
    generatedAt: v.number(),
    topPostIds: v.array(v.id('posts')),
  }).index('by_category_at', ['categorySlug', 'generatedAt']),

  // Curtidas em artigos. Index by_post_user dá unicidade lógica (1 like por
  // usuário por post). likeCount em posts é mantido em sincronia pela mutation.
  postLikes: defineTable({
    postId: v.id('posts'),
    userId: v.string(),
    at: v.number(),
  })
    .index('by_post', ['postId'])
    .index('by_post_user', ['postId', 'userId']),

  // Cliques em compartilhamento. Anônimos contam (sessionId+postId dedup);
  // autenticados também passam userId para auditoria. Não confundir com share
  // real (essa métrica não é mensurável fora do Web Share API).
  postShares: defineTable({
    postId: v.id('posts'),
    userId: v.optional(v.string()),
    sessionId: v.string(),
    channel: v.optional(v.string()),
    at: v.number(),
  })
    .index('by_post', ['postId'])
    .index('by_session_post', ['sessionId', 'postId']),

  // Comentários em artigos. Mesma estrutura de lessonComments: parentId para
  // threading 1 nível, soft-delete via deletedAt, edição opcional via editedAt.
  // helpfulCount é o agregado denormalizado de postCommentHelpful (sem dislike).
  postComments: defineTable({
    postId: v.id('posts'),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    authorRole: v.union(
      v.literal('aluno'),
      v.literal('criador'),
      v.literal('instituicao'),
    ),
    text: v.string(),
    parentId: v.optional(v.id('postComments')),
    isOfficial: v.optional(v.boolean()),
    helpfulCount: v.number(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index('by_post', ['postId'])
    .index('by_parentId', ['parentId'])
    .index('by_authorId', ['authorId']),

  postCommentHelpful: defineTable({
    commentId: v.id('postComments'),
    userId: v.string(),
    at: v.number(),
  }).index('by_comment_user', ['commentId', 'userId']),

  // Assinaturas Stripe. Uma linha por (userId, plan). plan é o produto interno
  // ('aluno_premium', 'criador_sem_ads', 'plano_igreja'). status é o status da
  // subscription do Stripe ('active', 'past_due', 'canceled', 'incomplete', etc.).
  // currentPeriodEnd é o epoch ms do fim do ciclo atual; usado pra liberar
  // benefícios mesmo após cancelamento até o fim do período pago.
  // stripeCustomerId é único por (userId), criado on-demand no createCheckoutSession.
  // O webhook patcheia users.isPremium=true quando status=active.
  subscriptions: defineTable({
    userId: v.string(),
    plan: v.union(
      v.literal('aluno_premium'),
      v.literal('criador_sem_ads'),
      v.literal('plano_igreja'),
    ),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_stripeSubscriptionId', ['stripeSubscriptionId'])
    .index('by_stripeCustomerId', ['stripeCustomerId']),

  // Loja de produtos. Catálogo de itens fisicos/digitais (livros, ebooks, kits,
  // brindes). Não substitui cursos (cursos sao sempre gratuitos). status
  // controla visibilidade publica. priceCents em centavos BRL para evitar float.
  // Stripe checkout sera ligado em Live mode (Fase 4); por enquanto sem cobranca.
  products: defineTable({
    creatorId: v.string(),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    type: v.union(v.literal('fisico'), v.literal('digital'), v.literal('servico')),
    priceCents: v.number(),
    compareAtCents: v.optional(v.number()),
    coverUrl: v.optional(v.string()),
    galleryUrls: v.optional(v.array(v.string())),
    sku: v.optional(v.string()),
    stock: v.optional(v.number()),
    weightGrams: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    status: v.union(
      v.literal('draft'),
      v.literal('published'),
      v.literal('archived'),
    ),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_creatorId', ['creatorId'])
    .index('by_slug', ['slug'])
    .index('by_status', ['status']),

  // Pedidos. Por enquanto registra intent de compra para futura integracao
  // com Stripe Checkout. status: pending (criado, aguardando pagamento),
  // paid (Stripe webhook), shipped (criador marcou), delivered, cancelled.
  // amountCents = soma de items + shipping. items eh um snapshot do produto
  // no momento da compra (titulo, preco) para nao quebrar se produto mudar.
  orders: defineTable({
    userId: v.string(),
    creatorId: v.string(),
    items: v.array(
      v.object({
        productId: v.id('products'),
        title: v.string(),
        priceCents: v.number(),
        quantity: v.number(),
      }),
    ),
    amountCents: v.number(),
    shippingCents: v.optional(v.number()),
    currency: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('paid'),
      v.literal('shipped'),
      v.literal('delivered'),
      v.literal('cancelled'),
      v.literal('refunded'),
    ),
    stripePaymentIntentId: v.optional(v.string()),
    shippingAddress: v.optional(
      v.object({
        name: v.string(),
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
    ),
    notes: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    trackingCode: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_status', ['status'])
    .index('by_stripePaymentIntentId', ['stripePaymentIntentId']),

  // Seguir um autor. notify* controlam granularidade de notificação. emailDigest
  // reservado para Wave futura (digest semanal via Resend). by_pair garante
  // unicidade lógica (1 follow por par follower-author).
  profileFollows: defineTable({
    followerUserId: v.string(),
    authorUserId: v.string(),
    notifyArticles: v.boolean(),
    notifyCourses: v.boolean(),
    notifyLessons: v.boolean(),
    emailDigest: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_follower', ['followerUserId'])
    .index('by_author', ['authorUserId'])
    .index('by_pair', ['followerUserId', 'authorUserId']),

  // Marcações coloridas em versículos. Cada highlight aplica uma cor a um
  // versículo específico (livro+capítulo+verso). Um aluno pode ter no máximo
  // 1 highlight por verso (a UI sobrescreve se já existir). color é uma das
  // cores predefinidas do leitor.
  bibleHighlights: defineTable({
    studentId: v.string(),
    bookSlug: v.string(),
    chapter: v.number(),
    verse: v.number(),
    color: v.string(),
    createdAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_student_chapter', ['studentId', 'bookSlug', 'chapter'])
    .index('by_student_verse', ['studentId', 'bookSlug', 'chapter', 'verse']),

  // Anotações livres em versículos. Diferente do caderno (que vincula a aulas),
  // estes notes são exclusivamente sobre versículos. Texto opcional curto (até
  // 2000 chars). Um aluno pode ter múltiplas notas no mesmo verso.
  bibleNotes: defineTable({
    studentId: v.string(),
    bookSlug: v.string(),
    chapter: v.number(),
    verse: v.number(),
    note: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_student_chapter', ['studentId', 'bookSlug', 'chapter'])
    .index('by_student_verse', ['studentId', 'bookSlug', 'chapter', 'verse']),

  // Programa de indicação. Quando um usuário gera link de indicação, recebe
  // referralCode (slug curto) que ele compartilha. Quando outro se cadastra
  // pelo link, criamos linha referrals com status='registered'. Quando o
  // indicado conclui o primeiro curso, viramos para 'completed'. Não há
  // recompensa monetária ainda; é apenas tracking até a Fase 4.
  referrals: defineTable({
    referrerUserId: v.string(),
    referredUserId: v.optional(v.string()),
    referredEmail: v.optional(v.string()),
    code: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('registered'),
      v.literal('completed'),
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_referrerUserId', ['referrerUserId'])
    .index('by_referredUserId', ['referredUserId'])
    .index('by_code', ['code']),

  // Co-autores de curso. courseCoauthors permite que outro criador tenha
  // permissão de editar o curso (módulos, aulas, quiz) sem poder publicar nem
  // excluir. Por enquanto role é 'editor' apenas; reservado para 'reviewer' no
  // futuro (sem write).
  courseCoauthors: defineTable({
    courseId: v.id('courses'),
    userId: v.string(),
    role: v.union(v.literal('editor'), v.literal('reviewer')),
    addedAt: v.number(),
    addedByUserId: v.string(),
  })
    .index('by_courseId', ['courseId'])
    .index('by_userId', ['userId'])
    .index('by_course_user', ['courseId', 'userId']),

  // Banco de questões reutilizáveis pelo professor. Independente de qualquer
  // aula. O criador escolhe questões deste banco para incluir no quiz da
  // aula. Tags facilitam categorização (ex.: "Pentateuco", "Cristologia").
  questionBank: defineTable({
    creatorId: v.string(),
    text: v.string(),
    options: v.array(v.object({ id: v.string(), text: v.string() })),
    correctOptionId: v.string(),
    explanation: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_creatorId', ['creatorId']),

  // Trilhas de aprendizagem. Uma trilha é uma sequência ordenada de cursos
  // que pertencem a uma instituição (ou criador). pathItems guarda a ordem.
  // pathEnrollments rastreia matrículas em trilhas (independente de matrículas
  // de curso). Quando o aluno conclui o último curso da trilha, ela vira
  // 'completed'.
  learningPaths: defineTable({
    institutionId: v.optional(v.id('institutions')),
    creatorId: v.string(),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    coverUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_institutionId', ['institutionId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_slug', ['slug']),

  pathItems: defineTable({
    pathId: v.id('learningPaths'),
    courseId: v.id('courses'),
    order: v.number(),
  })
    .index('by_pathId', ['pathId'])
    .index('by_courseId', ['courseId']),

  pathEnrollments: defineTable({
    pathId: v.id('learningPaths'),
    studentId: v.string(),
    status: v.union(v.literal('active'), v.literal('completed')),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_studentId', ['studentId'])
    .index('by_pathId', ['pathId'])
    .index('by_student_path', ['studentId', 'pathId']),

  // Cursos obrigatórios para uma instituição (ou para um sub-grupo de membros).
  // Quando memberRole é definido, só vale para aquele papel; quando ausente,
  // vale para todos. Aluno membro vê banner "obrigatório" no catálogo.
  requiredAssignments: defineTable({
    institutionId: v.id('institutions'),
    courseId: v.id('courses'),
    memberRole: v.optional(v.union(v.literal('dono'), v.literal('admin'), v.literal('membro'))),
    addedAt: v.number(),
    addedByUserId: v.string(),
  })
    .index('by_institutionId', ['institutionId'])
    .index('by_courseId', ['courseId'])
    .index('by_institution_course', ['institutionId', 'courseId']),

  // Templates de descrição de curso e aula. Por padrão são globais (creatorId
  // ausente, criados via internalMutation seed); criadores também podem salvar
  // os próprios. kind diferencia 'course_description' de 'lesson_description'.
  courseTemplates: defineTable({
    creatorId: v.optional(v.string()),
    kind: v.union(v.literal('course_description'), v.literal('lesson_description')),
    title: v.string(),
    body: v.string(),
    createdAt: v.number(),
  })
    .index('by_creatorId', ['creatorId'])
    .index('by_kind', ['kind']),
})
