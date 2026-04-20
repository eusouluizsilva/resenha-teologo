import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    perfil: v.union(v.literal('aluno'), v.literal('criador'), v.literal('instituicao')),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    institution: v.optional(v.string()),
    cnpj: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
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
    totalDonationsReceived: v.optional(v.number()),
  }).index('by_clerkId', ['clerkId']),

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
  }).index('by_creatorId', ['creatorId']).index('by_published', ['isPublished']),

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
  })
    .index('by_courseId', ['courseId'])
    .index('by_moduleId', ['moduleId'])
    .index('by_creatorId', ['creatorId']),

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
  })
    .index('by_studentId', ['studentId'])
    .index('by_student_lesson', ['studentId', 'lessonId'])
    .index('by_student_course', ['studentId', 'courseId']),

  donations: defineTable({
    creatorId: v.string(),
    studentId: v.string(),
    studentName: v.optional(v.string()),
    amountCents: v.number(),
    message: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('completed'), v.literal('failed')),
    stripePaymentId: v.optional(v.string()),
  }).index('by_creatorId', ['creatorId']),
})
