import { mutation, query } from './_generated/server'
import { requireCurrentUser } from './lib/auth'

// Funções de gestão de conta exigidas pela LGPD/GDPR: exportar todos os dados
// pessoais em formato portátil e excluir a conta. A exclusão remove dados
// pessoais e vínculos, mas mantém doações com studentId anonimizado para
// cumprir obrigações fiscais da plataforma.

// Retorna um snapshot completo dos dados do usuário atual. O frontend serializa
// em JSON e faz download. Inclui: perfil, funções, consentimentos, matrículas,
// progresso, certificados, cadernos, anotações, comentários (próprios), testemunhos
// (escritos e recebidos) e avaliações.
export const exportMyData = query({
  args: {},
  handler: async (ctx) => {
    const { identity, user } = await requireCurrentUser(ctx)
    const userId = identity.subject

    const [
      functions,
      consents,
      enrollments,
      progress,
      notebooks,
      notebookEntries,
      comments,
      authoredTestimonials,
      receivedTestimonials,
      authoredRatings,
      courseRatings,
      ownedCourses,
    ] = await Promise.all([
      ctx.db.query('userFunctions').withIndex('by_userId', (q) => q.eq('userId', userId)).collect(),
      ctx.db.query('consents').withIndex('by_userId', (q) => q.eq('userId', userId)).collect(),
      ctx.db.query('enrollments').withIndex('by_studentId', (q) => q.eq('studentId', userId)).collect(),
      ctx.db.query('progress').withIndex('by_studentId', (q) => q.eq('studentId', userId)).collect(),
      ctx.db.query('notebooks').withIndex('by_studentId', (q) => q.eq('studentId', userId)).collect(),
      ctx.db.query('notebookEntries').filter((q) => q.eq(q.field('studentId'), userId)).collect(),
      ctx.db.query('lessonComments').withIndex('by_authorId', (q) => q.eq('authorId', userId)).collect(),
      ctx.db.query('testimonials').filter((q) => q.eq(q.field('authorId'), userId)).collect(),
      ctx.db.query('testimonials').withIndex('by_profileUserId', (q) => q.eq('profileUserId', userId)).collect(),
      ctx.db.query('ratings').filter((q) => q.eq(q.field('authorId'), userId)).collect(),
      ctx.db.query('courseRatings').filter((q) => q.eq(q.field('studentId'), userId)).collect(),
      ctx.db.query('courses').withIndex('by_creatorId', (q) => q.eq('creatorId', userId)).collect(),
    ])

    return {
      exportedAt: new Date().toISOString(),
      user,
      functions,
      consents,
      enrollments,
      progress,
      notebooks,
      notebookEntries,
      comments,
      authoredTestimonials,
      receivedTestimonials,
      authoredRatings,
      courseRatings,
      ownedCourses: ownedCourses.map((c) => ({ _id: c._id, title: c.title, isPublished: c.isPublished })),
    }
  },
})

// Remove a conta do usuário e todos os dados vinculados. Criadores com cursos
// publicados precisam despublicar antes. Doações completadas são preservadas
// com studentId anonimizado para conformidade fiscal da plataforma.
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const { identity, user } = await requireCurrentUser(ctx)
    const userId = identity.subject

    // Criadores com cursos publicados não podem deletar sem primeiro despublicar
    // ou transferir os cursos. Evita quebra de dados para alunos matriculados.
    const publishedCourses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', userId))
      .filter((q) => q.eq(q.field('isPublished'), true))
      .collect()
    if (publishedCourses.length > 0) {
      throw new Error(
        'Despublique todos os seus cursos antes de excluir a conta. ' +
          'Alunos matriculados perderiam acesso caso a exclusão fosse feita agora.'
      )
    }

    // Funções do usuário
    const functions = await ctx.db
      .query('userFunctions')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()
    for (const f of functions) await ctx.db.delete(f._id)

    // Consentimentos (deletados com a conta; LGPD permite porque o usuário
    // exerce direito ao apagamento).
    const consents = await ctx.db
      .query('consents')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()
    for (const c of consents) await ctx.db.delete(c._id)

    // Matrículas e progresso (dados pessoais de aprendizado)
    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', userId))
      .collect()
    for (const e of enrollments) {
      const course = await ctx.db.get(e.courseId)
      if (course) {
        await ctx.db.patch(e.courseId, {
          totalStudents: Math.max(0, (course.totalStudents ?? 1) - 1),
        })
      }
      await ctx.db.delete(e._id)
    }

    const progress = await ctx.db
      .query('progress')
      .withIndex('by_studentId', (q) => q.eq('studentId', userId))
      .collect()
    for (const p of progress) await ctx.db.delete(p._id)

    // Cadernos e entradas (conteúdo pessoal)
    const notebooks = await ctx.db
      .query('notebooks')
      .withIndex('by_studentId', (q) => q.eq('studentId', userId))
      .collect()
    for (const n of notebooks) await ctx.db.delete(n._id)

    const entries = await ctx.db
      .query('notebookEntries')
      .filter((q) => q.eq(q.field('studentId'), userId))
      .collect()
    for (const e of entries) await ctx.db.delete(e._id)

    // Comentários: soft-delete preserva estrutura das threads sem expor dados.
    const lessonComments = await ctx.db
      .query('lessonComments')
      .withIndex('by_authorId', (q) => q.eq('authorId', userId))
      .collect()
    const now = Date.now()
    for (const c of lessonComments) {
      await ctx.db.patch(c._id, {
        authorName: 'Usuário excluído',
        authorAvatarUrl: undefined,
        text: '[comentário removido pelo autor]',
        deletedAt: now,
      })
    }

    const courseComments = await ctx.db
      .query('courseComments')
      .filter((q) => q.eq(q.field('authorId'), userId))
      .collect()
    for (const c of courseComments) {
      await ctx.db.patch(c._id, {
        authorName: 'Usuário excluído',
        authorAvatarUrl: undefined,
        text: '[comentário removido pelo autor]',
        deletedAt: now,
      })
    }

    const postComments = await ctx.db
      .query('postComments')
      .withIndex('by_authorId', (q) => q.eq('authorId', userId))
      .collect()
    for (const c of postComments) {
      await ctx.db.patch(c._id, {
        authorName: 'Usuário excluído',
        authorAvatarUrl: undefined,
        text: '[comentário removido pelo autor]',
        deletedAt: now,
      })
    }

    // Likes/shares/helpful em posts: hard-delete por serem dados puramente
    // pessoais sem dependência estrutural.
    const postLikes = await ctx.db
      .query('postLikes')
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect()
    for (const l of postLikes) await ctx.db.delete(l._id)

    const postShares = await ctx.db
      .query('postShares')
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect()
    for (const s of postShares) await ctx.db.delete(s._id)

    const postCommentHelpful = await ctx.db
      .query('postCommentHelpful')
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect()
    for (const h of postCommentHelpful) await ctx.db.delete(h._id)

    const profileFollows = await ctx.db
      .query('profileFollows')
      .filter((q) => q.eq(q.field('followerUserId'), userId))
      .collect()
    for (const f of profileFollows) await ctx.db.delete(f._id)

    const courseQuestions = await ctx.db
      .query('courseQuestions')
      .filter((q) => q.eq(q.field('studentId'), userId))
      .collect()
    for (const q of courseQuestions) await ctx.db.delete(q._id)

    const lessonTimestamps = await ctx.db
      .query('lessonTimestamps')
      .filter((q) => q.eq(q.field('studentId'), userId))
      .collect()
    for (const t of lessonTimestamps) await ctx.db.delete(t._id)

    const studentStats = await ctx.db
      .query('studentStats')
      .filter((q) => q.eq(q.field('studentId'), userId))
      .collect()
    for (const s of studentStats) await ctx.db.delete(s._id)

    const flashDecks = await ctx.db
      .query('flashcardDecks')
      .withIndex('by_studentId', (q) => q.eq('studentId', userId))
      .collect()
    for (const d of flashDecks) {
      const cards = await ctx.db
        .query('flashcards')
        .withIndex('by_deckId', (q) => q.eq('deckId', d._id))
        .collect()
      for (const c of cards) await ctx.db.delete(c._id)
      await ctx.db.delete(d._id)
    }

    const userNotifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const n of userNotifications) await ctx.db.delete(n._id)

    // Testemunhos e avaliações escritos pelo usuário (remove totalmente)
    const authoredTestimonials = await ctx.db
      .query('testimonials')
      .filter((q) => q.eq(q.field('authorId'), userId))
      .collect()
    for (const t of authoredTestimonials) await ctx.db.delete(t._id)

    const receivedTestimonials = await ctx.db
      .query('testimonials')
      .withIndex('by_profileUserId', (q) => q.eq('profileUserId', userId))
      .collect()
    for (const t of receivedTestimonials) await ctx.db.delete(t._id)

    const ratings = await ctx.db
      .query('ratings')
      .filter((q) => q.eq(q.field('authorId'), userId))
      .collect()
    for (const r of ratings) await ctx.db.delete(r._id)

    const courseRatings = await ctx.db
      .query('courseRatings')
      .filter((q) => q.eq(q.field('studentId'), userId))
      .collect()
    for (const r of courseRatings) await ctx.db.delete(r._id)

    // Perfil do criador (se existir)
    const creatorProfile = await ctx.db
      .query('creatorProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    if (creatorProfile) await ctx.db.delete(creatorProfile._id)

    // Memberships em instituições
    const memberships = await ctx.db
      .query('institutionMembers')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()
    for (const m of memberships) await ctx.db.delete(m._id)

    // Doações concluídas: anonimiza studentId para manter histórico fiscal.
    const donations = await ctx.db
      .query('donations')
      .filter((q) => q.eq(q.field('studentId'), userId))
      .collect()
    for (const d of donations) {
      await ctx.db.patch(d._id, {
        studentId: 'deleted-user',
        studentName: 'Usuário excluído',
      })
    }

    // Finalmente, o registro do usuário
    await ctx.db.delete(user._id)
  },
})
