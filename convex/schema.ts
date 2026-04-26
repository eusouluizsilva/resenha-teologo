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
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_handle', ['handle']),

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
  })
    .index('by_createdByUserId', ['createdByUserId']),

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
    .index('by_courseId_slug', ['courseId', 'slug']),

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
    .index('by_student_course', ['studentId', 'courseId']),

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
  }).index('by_creator_at', ['creatorId', 'at']),

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
})
