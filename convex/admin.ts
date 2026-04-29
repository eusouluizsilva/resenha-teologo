import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireAdmin } from './lib/auth'
import {
  autoEnrollAllUsersInCourse,
  autoEnrollUserInOfficialCourses,
  autoFollowOfficial,
} from './lib/autoEnroll'
import { checkAndIssueCertificate } from './student'

// Verifica se o usuário atual é admin da plataforma. Usado pelo front para
// decidir se exibe a aba Admin. Retorna false (sem lançar) para usuários
// comuns, para não poluir logs de erro.
export const amIAdmin = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requireAdmin(ctx)
      return true
    } catch {
      return false
    }
  },
})

// Métricas globais da plataforma. Visíveis apenas para admin. Propositalmente
// usa collect() em tabelas inteiras, aceitável nesta escala inicial. Se o
// volume crescer, migrar para contadores denormalizados em tabela separada.
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const users = await ctx.db.query('users').collect()
    const courses = await ctx.db.query('courses').collect()
    const enrollments = await ctx.db.query('enrollments').collect()
    const donations = await ctx.db.query('donations').collect()
    const userFunctions = await ctx.db.query('userFunctions').collect()
    const posts = await ctx.db.query('posts').collect()

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const newUsers30d = users.filter((u) => u._creationTime >= thirtyDaysAgo).length
    const newEnrollments30d = enrollments.filter((e) => e._creationTime >= thirtyDaysAgo).length

    const publishedCourses = courses.filter((c) => c.isPublished).length
    const certificatesIssued = enrollments.filter((e) => e.certificateIssued).length

    const publishedPosts = posts.filter((p) => p.status === 'published').length
    const draftPosts = posts.filter((p) => p.status === 'draft').length
    const newPosts30d = posts.filter(
      (p) => p.status === 'published' && (p.publishedAt ?? 0) >= thirtyDaysAgo,
    ).length

    const completedDonations = donations.filter((d) => d.status === 'completed')
    const totalDonationCents = completedDonations.reduce((acc, d) => acc + d.amountCents, 0)
    const donationCount = completedDonations.length

    const countsByFunction = userFunctions.reduce<Record<string, number>>((acc, f) => {
      acc[f.function] = (acc[f.function] ?? 0) + 1
      return acc
    }, {})

    return {
      totalUsers: users.length,
      newUsers30d,
      totalProfessors: countsByFunction['criador'] ?? 0,
      totalStudents: countsByFunction['aluno'] ?? 0,
      totalInstitutions: countsByFunction['instituicao'] ?? 0,
      totalCourses: courses.length,
      publishedCourses,
      totalEnrollments: enrollments.length,
      newEnrollments30d,
      certificatesIssued,
      totalDonationCents,
      donationCount,
      totalPosts: posts.length,
      publishedPosts,
      draftPosts,
      newPosts30d,
    }
  },
})

// Métricas de tráfego internas, agregadas em memória sobre a tabela pageViews.
// Usa o índice by_at pra recortar a janela temporal sem varrer tudo. Janela
// padrão: 30d. Compara com a janela anterior de mesmo tamanho pra calcular
// delta. Para escala futura (>1M views), migrar pra snapshot diário em cron.
export const getAnalytics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days }) => {
    await requireAdmin(ctx)

    const window = days ?? 30
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const periodStart = now - window * dayMs
    const prevPeriodStart = now - 2 * window * dayMs

    const current = await ctx.db
      .query('pageViews')
      .withIndex('by_at', (q) => q.gte('at', periodStart))
      .collect()

    const previous = await ctx.db
      .query('pageViews')
      .withIndex('by_at', (q) => q.gte('at', prevPeriodStart).lt('at', periodStart))
      .collect()

    const totalViews = current.length
    const totalViewsPrev = previous.length
    const uniqueSessions = new Set(current.map((v) => v.sessionId)).size
    const uniqueSessionsPrev = new Set(previous.map((v) => v.sessionId)).size
    const uniqueUsers = new Set(
      current.filter((v) => v.userId).map((v) => v.userId as string),
    ).size

    // Views por dia (array de {date: 'YYYY-MM-DD', views, sessions}).
    const byDay = new Map<string, { views: number; sessions: Set<string> }>()
    for (const v of current) {
      const d = new Date(v.at)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      const existing = byDay.get(key) ?? { views: 0, sessions: new Set() }
      existing.views += 1
      existing.sessions.add(v.sessionId)
      byDay.set(key, existing)
    }
    const viewsByDay = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, x]) => ({ date, views: x.views, sessions: x.sessions.size }))

    // Top 10 páginas por views.
    const byPage = new Map<string, number>()
    for (const v of current) {
      byPage.set(v.page, (byPage.get(v.page) ?? 0) + 1)
    }
    const topPages = Array.from(byPage.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Top 8 referrers (domínio extraído).
    const byRef = new Map<string, number>()
    for (const v of current) {
      if (!v.referrer) continue
      let host = ''
      try {
        host = new URL(v.referrer).hostname.replace(/^www\./, '')
      } catch {
        continue
      }
      if (!host) continue
      // Filtra self-referrals da própria plataforma
      if (host === 'resenhadoteologo.com') continue
      byRef.set(host, (byRef.get(host) ?? 0) + 1)
    }
    const topReferrers = Array.from(byRef.entries())
      .map(([host, views]) => ({ host, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)

    // Breakdown por device.
    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 }
    for (const v of current) {
      if (v.device === 'mobile') deviceCounts.mobile += 1
      else if (v.device === 'desktop') deviceCounts.desktop += 1
      else if (v.device === 'tablet') deviceCounts.tablet += 1
      else deviceCounts.unknown += 1
    }

    return {
      window,
      totalViews,
      totalViewsPrev,
      uniqueSessions,
      uniqueSessionsPrev,
      uniqueUsers,
      viewsByDay,
      topPages,
      topReferrers,
      deviceCounts,
    }
  },
})

// Lista os usuários mais recentes (últimos 50). Útil para o admin acompanhar
// novos cadastros e bloquear contas suspeitas quando necessário.
export const listRecentUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const users = await ctx.db.query('users').order('desc').take(50)
    return users.map((u) => ({
      _id: u._id,
      clerkId: u.clerkId,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      handle: u.handle,
      createdAt: u._creationTime,
    }))
  },
})

// Lista TODOS os usuários cadastrados na plataforma. Usado pelo modal "Todos
// os usuários" no admin. Inclui as funções ativas, cursos criados e
// matriculas (com nomes) numa unica resposta. Faz O(N) full-scan de
// users/userFunctions/courses/enrollments e monta maps em memoria, evitando
// N+1. Aceitavel na escala atual.
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const users = await ctx.db.query('users').order('desc').collect()
    const allFunctions = await ctx.db.query('userFunctions').collect()
    const allCourses = await ctx.db.query('courses').collect()
    const allEnrollments = await ctx.db.query('enrollments').collect()
    const allProgress = await ctx.db.query('progress').collect()

    const fnByUser = new Map<string, string[]>()
    for (const f of allFunctions) {
      const list = fnByUser.get(f.userId) ?? []
      list.push(f.function)
      fnByUser.set(f.userId, list)
    }

    // Conta aulas que o aluno comecou a assistir (watchedSeconds > 0),
    // independente de ter atingido o limiar de 95% do video ou de ter feito
    // o quiz. Cada progress eh 1 aula tocada.
    const lessonsCompletedByStudent = new Map<string, number>()
    for (const p of allProgress) {
      if ((p.watchedSeconds ?? 0) <= 0) continue
      lessonsCompletedByStudent.set(
        p.studentId,
        (lessonsCompletedByStudent.get(p.studentId) ?? 0) + 1,
      )
    }

    const courseById = new Map<string, { title: string; slug: string | null }>()
    const ownedByCreator = new Map<string, number>()
    for (const c of allCourses) {
      courseById.set(c._id, { title: c.title, slug: c.slug ?? null })
      ownedByCreator.set(c.creatorId, (ownedByCreator.get(c.creatorId) ?? 0) + 1)
    }

    const enrolledByStudent = new Map<string, { courseId: string; title: string }[]>()
    for (const e of allEnrollments) {
      const course = courseById.get(e.courseId)
      if (!course) continue
      const list = enrolledByStudent.get(e.studentId) ?? []
      list.push({ courseId: e.courseId, title: course.title })
      enrolledByStudent.set(e.studentId, list)
    }

    return users.map((u) => {
      const enrolled = enrolledByStudent.get(u.clerkId) ?? []
      return {
        _id: u._id,
        clerkId: u.clerkId,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        handle: u.handle,
        country: u.country ?? null,
        city: u.city ?? null,
        state: u.state ?? null,
        createdAt: u._creationTime,
        functions: fnByUser.get(u.clerkId) ?? [],
        ownedCoursesCount: ownedByCreator.get(u.clerkId) ?? 0,
        enrollmentsCount: enrolled.length,
        enrolledCourses: enrolled,
        lessonsCompletedCount: lessonsCompletedByStudent.get(u.clerkId) ?? 0,
        isPremium: u.isPremium ?? false,
      }
    })
  },
})

// Detalhes completos de um usuário para o admin: cadastros (matrículas,
// cursos criados, posts publicados, certificados, doações, instituições).
// Usado no painel de detalhe dentro do modal de usuários. Limita a 50 itens
// por categoria para não estourar payload em usuários muito ativos.
export const getUserDetail = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx)

    const user = await ctx.db.get(userId)
    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    const clerkId = user.clerkId

    const functions = await ctx.db
      .query('userFunctions')
      .withIndex('by_userId', (q) => q.eq('userId', clerkId))
      .collect()

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', clerkId))
      .collect()

    const progressRecords = await ctx.db
      .query('progress')
      .withIndex('by_studentId', (q) => q.eq('studentId', clerkId))
      .collect()
    // "Aulas assistidas" = qualquer aula tocada (watchedSeconds > 0),
    // independente de quiz ou de atingir 95% do video.
    const lessonsCompleted = progressRecords.filter(
      (p) => (p.watchedSeconds ?? 0) > 0,
    ).length

    const enrollmentsWithCourse = await Promise.all(
      enrollments.slice(0, 50).map(async (e) => {
        const course = await ctx.db.get(e.courseId)
        return {
          _id: e._id,
          courseId: e.courseId,
          courseTitle: course?.title ?? 'Curso removido',
          courseSlug: course?.slug ?? null,
          enrolledAt: e._creationTime,
          completedAt: e.completedAt ?? null,
          certificateIssued: e.certificateIssued,
          finalScore: e.finalScore ?? null,
        }
      }),
    )

    const ownedCourses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', clerkId))
      .collect()

    const ownedCoursesShape = ownedCourses.slice(0, 50).map((c) => ({
      _id: c._id,
      title: c.title,
      slug: c.slug ?? null,
      isPublished: c.isPublished,
      totalLessons: c.totalLessons,
      totalStudents: c.totalStudents,
      createdAt: c._creationTime,
    }))

    const posts = await ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorUserId', clerkId))
      .collect()

    const postsShape = posts.slice(0, 50).map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      publishedAt: p.publishedAt ?? null,
      viewCount: p.viewCount,
      likeCount: p.likeCount,
    }))

    // donations não tem índice por studentId (doador). Filtra full-table; em
    // escala atual é aceitável. Se ficar pesado, adicionar by_studentId no schema.
    const donations = await ctx.db
      .query('donations')
      .filter((q) => q.eq(q.field('studentId'), clerkId))
      .collect()

    const donationsShape = donations.slice(0, 50).map((d) => ({
      _id: d._id,
      amountCents: d.amountCents,
      status: d.status,
      createdAt: d._creationTime,
    }))

    const totalDonatedCents = donations
      .filter((d) => d.status === 'completed')
      .reduce((acc, d) => acc + d.amountCents, 0)

    const certificatesCount = enrollments.filter((e) => e.certificateIssued).length

    return {
      user: {
        _id: user._id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        handle: user.handle ?? null,
        bio: user.bio ?? null,
        country: user.country ?? null,
        city: user.city ?? null,
        state: user.state ?? null,
        denomination: user.denomination ?? null,
        churchName: user.churchName ?? null,
        churchRole: user.churchRole ?? null,
        createdAt: user._creationTime,
        isPremium: user.isPremium ?? false,
      },
      functions: functions.map((f) => ({ function: f.function, enabledAt: f.enabledAt })),
      counts: {
        enrollments: enrollments.length,
        ownedCourses: ownedCourses.length,
        posts: posts.length,
        publishedPosts: posts.filter((p) => p.status === 'published').length,
        donations: donations.length,
        completedDonations: donations.filter((d) => d.status === 'completed').length,
        certificates: certificatesCount,
        lessonsCompleted,
        totalDonatedCents,
      },
      enrollments: enrollmentsWithCourse,
      ownedCourses: ownedCoursesShape,
      posts: postsShape,
      donations: donationsShape,
    }
  },
})

// Backfill: para cada usuario da plataforma, garante (a) seguir o perfil
// oficial @resenhadoteologo e (b) estar matriculado em todos os cursos
// publicos publicados pelo perfil oficial. Idempotente. Usado pelo botao
// "Sincronizar agora" no modal de usuarios para retroagir a regra automatica.
// Tambem disparavel via:
//   npx convex run --prod admin:backfillAdminEnrollments '{}'
export const backfillAdminEnrollments = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const allUsers = await ctx.db.query('users').collect()
    let enrollmentsCreated = 0
    let followsCreated = 0
    let usersTouched = 0
    for (const u of allUsers) {
      const enrolled = await autoEnrollUserInOfficialCourses(ctx, u.clerkId)
      const followed = await autoFollowOfficial(ctx, u.clerkId)
      if (enrolled > 0 || followed) usersTouched += 1
      enrollmentsCreated += enrolled
      if (followed) followsCreated += 1
    }
    return {
      totalEnrollmentsCreated: enrollmentsCreated,
      totalFollowsCreated: followsCreated,
      usersWithNewEnrollments: usersTouched,
    }
  },
})

// Backfill: define profileVisibility='public' (e showProgressPublicly=true)
// em todo usuario sem o campo definido. Tornar a configuracao explicita no
// banco facilita listagens admin e mantem o default consistente entre
// inserts antigos e novos. Idempotente. Rodar via:
//   npx convex run --prod admin:backfillProfileVisibilityPublic '{}'
export const backfillProfileVisibilityPublic = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query('users').collect()
    let visibilityPatched = 0
    let progressPatched = 0
    for (const u of allUsers) {
      const patch: { profileVisibility?: 'public'; showProgressPublicly?: boolean } = {}
      if (u.profileVisibility === undefined) {
        patch.profileVisibility = 'public'
        visibilityPatched += 1
      }
      if (u.showProgressPublicly === undefined) {
        patch.showProgressPublicly = true
        progressPatched += 1
      }
      if (patch.profileVisibility !== undefined || patch.showProgressPublicly !== undefined) {
        await ctx.db.patch(u._id, patch)
      }
    }
    return {
      total: allUsers.length,
      visibilityPatched,
      progressPatched,
    }
  },
})

// Backfill por curso: matricula todos os usuarios existentes em um curso
// especifico (apenas se for de admin, publicado e publico). Util quando admin
// quer forcar a sincronizacao de um curso novo. Internal: rodar via
//   npx convex run --prod admin:backfillEnrollmentsForCourse '{"courseId":"..."}'
export const backfillEnrollmentsForCourse = internalMutation({
  args: { courseId: v.id('courses') },
  handler: async (ctx, { courseId }) => {
    const created = await autoEnrollAllUsersInCourse(ctx, courseId)
    return { created }
  },
})

// Broadcast de notificacao in-app (sininho). Idempotencia por dedupeKey:
// marcamos a notificacao com link `${baseLink}?bk=<dedupeKey>` (ou
// `internal://broadcast?bk=<dedupeKey>` quando nao ha link) e pulamos quem
// ja tiver recebido, para rerodar sem duplicar.
//
// Segmento permite filtrar por funcao ativa (alunos, criadores, instituicoes)
// ou enviar para todos. Sem segmento, envia para todos os usuarios cadastrados.
//
// Internal mutation: usado pela CLI e pelo wrapper publico abaixo.
export const broadcastNotification = internalMutation({
  args: {
    title: v.string(),
    body: v.optional(v.string()),
    link: v.optional(v.string()),
    dedupeKey: v.string(),
    segment: v.optional(
      v.union(
        v.literal('all'),
        v.literal('aluno'),
        v.literal('criador'),
        v.literal('instituicao'),
        v.literal('sem_funcao'),
      ),
    ),
  },
  handler: async (ctx, { title, body, link, dedupeKey, segment }) => {
    const allUsers = await ctx.db.query('users').collect()
    const seg = segment ?? 'all'

    let recipients = allUsers
    if (seg !== 'all') {
      const allFunctions = await ctx.db.query('userFunctions').collect()
      const fnByUser = new Map<string, Set<string>>()
      for (const f of allFunctions) {
        const set = fnByUser.get(f.userId) ?? new Set<string>()
        set.add(f.function)
        fnByUser.set(f.userId, set)
      }

      if (seg === 'sem_funcao') {
        recipients = allUsers.filter((u) => {
          const fns = fnByUser.get(u.clerkId)
          return !fns || fns.size === 0
        })
      } else {
        recipients = allUsers.filter((u) => fnByUser.get(u.clerkId)?.has(seg))
      }
    }

    // Marca todas as notificacoes com link interno deduplicavel. Mesmo quando o
    // admin nao passa link, geramos um sentinela `internal://broadcast?bk=...`
    // exclusivamente para podermos detectar duplicidade. O front trata link
    // ausente/sentinela como sem destino (nao navega).
    const baseLink = link ?? 'internal://broadcast'
    const finalLink = `${baseLink}${baseLink.includes('?') ? '&' : '?'}bk=${dedupeKey}`

    let inserted = 0
    let skipped = 0
    const now = Date.now()

    for (const u of recipients) {
      const existing = await ctx.db
        .query('notifications')
        .withIndex('by_user', (q) => q.eq('userId', u.clerkId))
        .filter((q) => q.eq(q.field('link'), finalLink))
        .first()
      if (existing) {
        skipped += 1
        continue
      }

      await ctx.db.insert('notifications', {
        userId: u.clerkId,
        kind: 'generic',
        title,
        body,
        link: link ? finalLink : undefined,
        createdAt: now,
      })
      inserted += 1
    }

    return {
      totalUsers: allUsers.length,
      eligible: recipients.length,
      inserted,
      skipped,
    }
  },
})

// Wrapper publico chamavel pelo painel admin (front). Reusa a logica interna
// para nao duplicar codigo. requireAdmin garante que apenas o dono envia.
export const sendBroadcastNotification = mutation({
  args: {
    title: v.string(),
    body: v.optional(v.string()),
    link: v.optional(v.string()),
    dedupeKey: v.string(),
    segment: v.union(
      v.literal('all'),
      v.literal('aluno'),
      v.literal('criador'),
      v.literal('instituicao'),
      v.literal('sem_funcao'),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const title = args.title.trim()
    if (title.length === 0) throw new Error('Título obrigatório.')
    if (title.length > 120) throw new Error('Título acima de 120 caracteres.')
    const body = args.body?.trim()
    if (body && body.length > 500) throw new Error('Mensagem acima de 500 caracteres.')
    const link = args.link?.trim() || undefined
    if (link && !link.startsWith('/') && !link.startsWith('http')) {
      throw new Error('Link deve começar com / (rota interna) ou http (URL externa).')
    }
    const dedupeKey = args.dedupeKey.trim()
    if (dedupeKey.length === 0) throw new Error('Chave de deduplicação obrigatória.')

    const allUsers = await ctx.db.query('users').collect()
    const seg = args.segment

    let recipients = allUsers
    if (seg !== 'all') {
      const allFunctions = await ctx.db.query('userFunctions').collect()
      const fnByUser = new Map<string, Set<string>>()
      for (const f of allFunctions) {
        const set = fnByUser.get(f.userId) ?? new Set<string>()
        set.add(f.function)
        fnByUser.set(f.userId, set)
      }

      if (seg === 'sem_funcao') {
        recipients = allUsers.filter((u) => {
          const fns = fnByUser.get(u.clerkId)
          return !fns || fns.size === 0
        })
      } else {
        recipients = allUsers.filter((u) => fnByUser.get(u.clerkId)?.has(seg))
      }
    }

    const baseLink = link ?? 'internal://broadcast'
    const finalLink = `${baseLink}${baseLink.includes('?') ? '&' : '?'}bk=${dedupeKey}`

    let inserted = 0
    let skipped = 0
    const now = Date.now()

    for (const u of recipients) {
      const existing = await ctx.db
        .query('notifications')
        .withIndex('by_user', (q) => q.eq('userId', u.clerkId))
        .filter((q) => q.eq(q.field('link'), finalLink))
        .first()
      if (existing) {
        skipped += 1
        continue
      }

      await ctx.db.insert('notifications', {
        userId: u.clerkId,
        kind: 'generic',
        title,
        body,
        link: link ? finalLink : undefined,
        createdAt: now,
      })
      inserted += 1
    }

    return {
      totalUsers: allUsers.length,
      eligible: recipients.length,
      inserted,
      skipped,
    }
  },
})

// Estima quantos usuarios receberiam um broadcast antes de envia-lo. Usado
// pelo painel admin para mostrar "vai notificar X pessoas" antes de confirmar.
export const previewBroadcastAudience = query({
  args: {
    segment: v.union(
      v.literal('all'),
      v.literal('aluno'),
      v.literal('criador'),
      v.literal('instituicao'),
      v.literal('sem_funcao'),
    ),
  },
  handler: async (ctx, { segment }) => {
    await requireAdmin(ctx)

    const allUsers = await ctx.db.query('users').collect()
    if (segment === 'all') {
      return { totalUsers: allUsers.length, eligible: allUsers.length }
    }

    const allFunctions = await ctx.db.query('userFunctions').collect()
    const fnByUser = new Map<string, Set<string>>()
    for (const f of allFunctions) {
      const set = fnByUser.get(f.userId) ?? new Set<string>()
      set.add(f.function)
      fnByUser.set(f.userId, set)
    }

    let eligible: number
    if (segment === 'sem_funcao') {
      eligible = allUsers.filter((u) => {
        const fns = fnByUser.get(u.clerkId)
        return !fns || fns.size === 0
      }).length
    } else {
      eligible = allUsers.filter((u) => fnByUser.get(u.clerkId)?.has(segment)).length
    }

    return { totalUsers: allUsers.length, eligible }
  },
})

// Lista os ultimos broadcasts (notificacoes generic com bk= no link). Agrupa
// por dedupeKey, retorna titulo, mensagem, link original (sem o bk), quantos
// receberam e quando foi o primeiro envio. Limitado aos 30 mais recentes.
export const listRecentBroadcasts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    // Pega as ultimas 800 notificacoes generic globalmente, suficiente para
    // reconstruir os ultimos broadcasts mesmo com 5-10k usuarios. Ordenacao
    // descrescente por _creationTime (default).
    const recent = await ctx.db
      .query('notifications')
      .order('desc')
      .filter((q) => q.eq(q.field('kind'), 'generic'))
      .take(800)

    type Group = {
      dedupeKey: string
      title: string
      body?: string
      link?: string
      count: number
      firstAt: number
    }
    const groups = new Map<string, Group>()

    for (const n of recent) {
      if (!n.link) continue
      const m = n.link.match(/[?&]bk=([^&]+)/)
      if (!m) continue
      const key = decodeURIComponent(m[1])
      const baseLink = n.link
        .replace(/([?&])bk=[^&]+&?/, (_, p1) => (p1 === '?' ? '?' : ''))
        .replace(/[?&]$/, '')
      const cleanLink = baseLink.startsWith('internal://broadcast') ? undefined : baseLink

      const existing = groups.get(key)
      if (existing) {
        existing.count += 1
        if (n.createdAt < existing.firstAt) existing.firstAt = n.createdAt
      } else {
        groups.set(key, {
          dedupeKey: key,
          title: n.title,
          body: n.body,
          link: cleanLink,
          count: 1,
          firstAt: n.createdAt,
        })
      }
    }

    return Array.from(groups.values())
      .sort((a, b) => b.firstAt - a.firstAt)
      .slice(0, 30)
  },
})

// Lista os cursos mais recentes (últimos 30) com nome do professor dono.
export const listRecentCourses = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const courses = await ctx.db.query('courses').order('desc').take(30)
    return await Promise.all(
      courses.map(async (c) => {
        const creator = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', c.creatorId))
          .unique()
        return {
          _id: c._id,
          title: c.title,
          slug: c.slug,
          isPublished: c.isPublished,
          totalLessons: c.totalLessons,
          totalStudents: c.totalStudents,
          createdAt: c._creationTime,
          creatorName: creator?.name ?? 'Professor',
          creatorHandle: creator?.handle,
        }
      })
    )
  },
})

// Top artigos do blog ordenados por leituras (viewCount). Volume baixo de
// posts publicados (~50) permite ordenar em memória sem índice dedicado por
// viewCount. Resolve o autor para exibir nome e handle no painel admin.
export const listTopPosts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const published = await ctx.db
      .query('posts')
      .withIndex('by_status_publishedAt', (q) => q.eq('status', 'published'))
      .collect()

    const top = published
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10)

    return await Promise.all(
      top.map(async (p) => {
        const author = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', p.authorUserId))
          .unique()
        return {
          _id: p._id,
          title: p.title,
          slug: p.slug,
          categorySlug: p.categorySlug,
          publishedAt: p.publishedAt,
          viewCount: p.viewCount,
          likeCount: p.likeCount,
          commentCount: p.commentCount,
          shareCount: p.shareCount,
          authorName: author?.name ?? 'Autor',
          authorHandle: author?.handle,
        }
      }),
    )
  },
})

// Apaga em cascata todos os dados associados a um clerkId. Usado pelo dono da
// plataforma para remover contas de teste ou banidas. Internal: nao expor ao
// cliente. Rodar via `npx convex run admin:deleteUserCascade '{"clerkId":"..."}'`.
export const deleteUserCascade = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const log: Record<string, number> = {}

    // 1. Cursos do criador (cascata em modules, lessons, quizzes, materials,
    // enrollments, progress, courseQuestions, courseComments, courseRatings)
    const ownedCourses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', clerkId))
      .collect()

    for (const course of ownedCourses) {
      const courseId = course._id as Id<'courses'>

      const lessons = await ctx.db.query('lessons').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const lesson of lessons) {
        const lessonId = lesson._id as Id<'lessons'>
        const materials = await ctx.db.query('lessonMaterials').withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId)).collect()
        for (const m of materials) await ctx.db.delete(m._id)
        log.lessonMaterials = (log.lessonMaterials ?? 0) + materials.length

        const quizzesByLesson = await ctx.db.query('quizzes').withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId)).collect()
        for (const q of quizzesByLesson) await ctx.db.delete(q._id)
        log.quizzes = (log.quizzes ?? 0) + quizzesByLesson.length

        const lessonComments = await ctx.db.query('lessonComments').withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId)).collect()
        for (const c of lessonComments) await ctx.db.delete(c._id)
        log.lessonComments = (log.lessonComments ?? 0) + lessonComments.length

        const timestamps = await ctx.db.query('lessonTimestamps').withIndex('by_lessonId', (q) => q.eq('lessonId', lessonId)).collect()
        for (const t of timestamps) await ctx.db.delete(t._id)
        log.lessonTimestamps = (log.lessonTimestamps ?? 0) + timestamps.length

        await ctx.db.delete(lessonId)
      }
      log.lessons = (log.lessons ?? 0) + lessons.length

      const modules = await ctx.db.query('modules').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const m of modules) await ctx.db.delete(m._id)
      log.modules = (log.modules ?? 0) + modules.length

      const enrollments = await ctx.db.query('enrollments').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const e of enrollments) await ctx.db.delete(e._id)
      log.enrollments = (log.enrollments ?? 0) + enrollments.length

      const courseQuestions = await ctx.db.query('courseQuestions').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const cq of courseQuestions) await ctx.db.delete(cq._id)
      log.courseQuestions = (log.courseQuestions ?? 0) + courseQuestions.length

      const courseComments = await ctx.db.query('courseComments').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const cc of courseComments) await ctx.db.delete(cc._id)
      log.courseComments = (log.courseComments ?? 0) + courseComments.length

      const courseRatings = await ctx.db.query('courseRatings').withIndex('by_courseId', (q) => q.eq('courseId', courseId)).collect()
      for (const cr of courseRatings) await ctx.db.delete(cr._id)
      log.courseRatings = (log.courseRatings ?? 0) + courseRatings.length

      await ctx.db.delete(courseId)
    }
    log.courses = ownedCourses.length

    // 2. Instituicoes onde o usuario e dono (cascata em members + invites)
    const ownedInstitutions = await ctx.db
      .query('institutions')
      .withIndex('by_createdByUserId', (q) => q.eq('createdByUserId', clerkId))
      .collect()

    for (const inst of ownedInstitutions) {
      const instId = inst._id
      const members = await ctx.db.query('institutionMembers').withIndex('by_institutionId', (q) => q.eq('institutionId', instId)).collect()
      for (const m of members) await ctx.db.delete(m._id)
      log.institutionMembers = (log.institutionMembers ?? 0) + members.length

      const invites = await ctx.db.query('institutionInvites').withIndex('by_institutionId', (q) => q.eq('institutionId', instId)).collect()
      for (const i of invites) await ctx.db.delete(i._id)
      log.institutionInvites = (log.institutionInvites ?? 0) + invites.length

      await ctx.db.delete(instId)
    }
    log.institutions = ownedInstitutions.length

    // 3. Membros em outras instituicoes
    const memberships = await ctx.db.query('institutionMembers').withIndex('by_userId', (q) => q.eq('userId', clerkId)).collect()
    for (const m of memberships) await ctx.db.delete(m._id)
    log.institutionMembershipsAsMember = memberships.length

    // 4. Dados do aluno
    const enrollmentsAsStudent = await ctx.db.query('enrollments').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const e of enrollmentsAsStudent) await ctx.db.delete(e._id)
    log.enrollmentsAsStudent = enrollmentsAsStudent.length

    const progress = await ctx.db.query('progress').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const p of progress) await ctx.db.delete(p._id)
    log.progress = progress.length

    const notebooks = await ctx.db.query('notebooks').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const nb of notebooks) {
      const entries = await ctx.db.query('notebookEntries').withIndex('by_notebook', (q) => q.eq('notebookId', nb._id)).collect()
      for (const en of entries) await ctx.db.delete(en._id)
      log.notebookEntries = (log.notebookEntries ?? 0) + entries.length
      await ctx.db.delete(nb._id)
    }
    log.notebooks = notebooks.length

    const flashcardDecks = await ctx.db.query('flashcardDecks').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const deck of flashcardDecks) {
      const cards = await ctx.db.query('flashcards').withIndex('by_deckId', (q) => q.eq('deckId', deck._id)).collect()
      for (const c of cards) await ctx.db.delete(c._id)
      log.flashcards = (log.flashcards ?? 0) + cards.length
      await ctx.db.delete(deck._id)
    }
    log.flashcardDecks = flashcardDecks.length

    const studentTimestamps = await ctx.db.query('lessonTimestamps').withIndex('by_student_lesson', (q) => q.eq('studentId', clerkId)).collect()
    for (const t of studentTimestamps) await ctx.db.delete(t._id)
    log.lessonTimestampsAsStudent = studentTimestamps.length

    const stats = await ctx.db.query('studentStats').withIndex('by_studentId', (q) => q.eq('studentId', clerkId)).collect()
    for (const s of stats) await ctx.db.delete(s._id)
    log.studentStats = stats.length

    // 5. Comentarios e avaliacoes onde o usuario e autor
    const lessonCommentsByAuthor = await ctx.db.query('lessonComments').withIndex('by_authorId', (q) => q.eq('authorId', clerkId)).collect()
    for (const c of lessonCommentsByAuthor) await ctx.db.delete(c._id)
    log.lessonCommentsByAuthor = lessonCommentsByAuthor.length

    const courseCommentsByAuthor = await ctx.db.query('courseComments').withIndex('by_authorId', (q) => q.eq('authorId', clerkId)).collect()
    for (const c of courseCommentsByAuthor) await ctx.db.delete(c._id)
    log.courseCommentsByAuthor = courseCommentsByAuthor.length

    // 6. Outros
    const userFns = await ctx.db.query('userFunctions').withIndex('by_userId', (q) => q.eq('userId', clerkId)).collect()
    for (const f of userFns) await ctx.db.delete(f._id)
    log.userFunctions = userFns.length

    const consents = await ctx.db.query('consents').withIndex('by_userId', (q) => q.eq('userId', clerkId)).collect()
    for (const c of consents) await ctx.db.delete(c._id)
    log.consents = consents.length

    const creatorProfile = await ctx.db.query('creatorProfiles').withIndex('by_userId', (q) => q.eq('userId', clerkId)).collect()
    for (const cp of creatorProfile) await ctx.db.delete(cp._id)
    log.creatorProfiles = creatorProfile.length

    const notifications = await ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', clerkId)).collect()
    for (const n of notifications) await ctx.db.delete(n._id)
    log.notifications = notifications.length

    // 7. Users (registro principal)
    const userDoc = await ctx.db.query('users').withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId)).unique()
    if (userDoc) {
      await ctx.db.delete(userDoc._id)
      log.users = 1
    } else {
      log.users = 0
    }

    return { clerkId, deleted: log }
  },
})

// Util de teste/preview para o admin: marca todas as matriculas do usuario
// como 100% concluidas (todas as aulas com watchedSeconds=totalSeconds,
// completed=true, quizScore=100, quizPassed=true) e dispara
// checkAndIssueCertificate para emitir certificado de cada curso.
//
// Uso: serve para o admin visualizar a tela /dashboard/certificados com
// dados realistas sem precisar passar por todas as aulas/quizzes manualmente.
// E destrutivo: sobrescreve progress existentes do usuario.
export const simulateCompleteEnrollmentsForUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx)

    const user = await ctx.db.get(userId)
    if (!user) throw new Error('Usuario nao encontrado')
    const studentId = user.clerkId

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_studentId', (q) => q.eq('studentId', studentId))
      .collect()

    let touchedLessons = 0
    let issuedCertificates = 0
    const now = Date.now()

    for (const enrollment of enrollments) {
      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_courseId', (q) => q.eq('courseId', enrollment.courseId))
        .collect()
      const published = lessons.filter((l) => l.isPublished)

      for (const lesson of published) {
        const existing = await ctx.db
          .query('progress')
          .withIndex('by_student_lesson', (q) =>
            q.eq('studentId', studentId).eq('lessonId', lesson._id),
          )
          .unique()

        // Usa duracao real da aula quando disponivel; senao 600s (10min) como
        // valor sintetico que satisfaz o ratio de 95% do backend.
        const totalSeconds =
          existing?.totalSeconds && existing.totalSeconds > 0
            ? existing.totalSeconds
            : lesson.durationSeconds && lesson.durationSeconds > 0
              ? lesson.durationSeconds
              : 600

        if (existing) {
          await ctx.db.patch(existing._id, {
            watchedSeconds: totalSeconds,
            totalSeconds,
            completed: true,
            completedAt: existing.completedAt ?? now,
            quizScore: 100,
            quizPassed: true,
            quizRetryPending: undefined,
          })
        } else {
          await ctx.db.insert('progress', {
            studentId,
            lessonId: lesson._id,
            courseId: enrollment.courseId,
            watchedSeconds: totalSeconds,
            totalSeconds,
            completed: true,
            completedAt: now,
            quizScore: 100,
            quizPassed: true,
          })
        }
        touchedLessons += 1
      }

      const wasIssued = enrollment.certificateIssued ?? false
      await checkAndIssueCertificate(ctx, studentId, enrollment.courseId, enrollment._id)
      const after = await ctx.db.get(enrollment._id)
      if (!wasIssued && after?.certificateIssued) issuedCertificates += 1
    }

    return {
      enrollments: enrollments.length,
      touchedLessons,
      issuedCertificates,
    }
  },
})
