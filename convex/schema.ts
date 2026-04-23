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
  }).index('by_creatorId', ['creatorId']).index('by_published', ['isPublished']).index('by_slug', ['slug']),

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
})
