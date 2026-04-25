import { query } from './_generated/server'
import { requireAdmin } from './lib/auth'

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

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const newUsers30d = users.filter((u) => u._creationTime >= thirtyDaysAgo).length
    const newEnrollments30d = enrollments.filter((e) => e._creationTime >= thirtyDaysAgo).length

    const publishedCourses = courses.filter((c) => c.isPublished).length
    const certificatesIssued = enrollments.filter((e) => e.certificateIssued).length

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
