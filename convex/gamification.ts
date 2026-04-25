import { v } from 'convex/values'
import { internalMutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import type { MutationCtx } from './_generated/server'

// Gamificação do aluno: streak de dias consecutivos com atividade, total de
// aulas concluídas, total de cursos concluídos e pontos. Sem cron: tudo é
// atualizado lazily a partir de student.updateProgress/checkAndIssueCertificate.
// Dia é computado em UTC para ser consistente globalmente (o custo de "perder"
// um dia por causa de fuso é menor que a complexidade de detectar timezone).

export const POINTS_PER_LESSON = 10
export const POINTS_PER_COURSE = 50

function utcDateKey(ts: number): string {
  const d = new Date(ts)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function daysBetween(a: string, b: string): number {
  const pa = Date.UTC(
    Number(a.slice(0, 4)),
    Number(a.slice(5, 7)) - 1,
    Number(a.slice(8, 10)),
  )
  const pb = Date.UTC(
    Number(b.slice(0, 4)),
    Number(b.slice(5, 7)) - 1,
    Number(b.slice(8, 10)),
  )
  return Math.round((pb - pa) / 86_400_000)
}

async function upsertStats(
  ctx: MutationCtx,
  studentId: string,
): Promise<{ _id: import('./_generated/dataModel').Id<'studentStats'> }> {
  const existing = await ctx.db
    .query('studentStats')
    .withIndex('by_studentId', (q) => q.eq('studentId', studentId))
    .unique()
  if (existing) return existing

  const id = await ctx.db.insert('studentStats', {
    studentId,
    streak: 0,
    bestStreak: 0,
    totalLessonsCompleted: 0,
    totalCoursesCompleted: 0,
    points: 0,
    updatedAt: Date.now(),
  })
  return { _id: id }
}

// Registra conclusão de uma aula. Atualiza streak se é o primeiro estudo do dia,
// soma pontos, incrementa contador de aulas. Chamado internamente por
// student.updateProgress quando uma aula é marcada como completed pela primeira
// vez. Idempotente por aula: student.updateProgress só chama uma vez por lesson.
export const recordLessonComplete = internalMutation({
  args: { studentId: v.string() },
  handler: async (ctx, { studentId }) => {
    const stub = await upsertStats(ctx, studentId)
    const stats = await ctx.db.get(stub._id)
    if (!stats) return

    const now = Date.now()
    const today = utcDateKey(now)
    let streak = stats.streak
    let bestStreak = stats.bestStreak

    if (!stats.lastStudyDate) {
      streak = 1
    } else {
      const diff = daysBetween(stats.lastStudyDate, today)
      if (diff === 0) {
        // já estudou hoje, streak permanece
      } else if (diff === 1) {
        streak += 1
      } else if (diff > 1) {
        streak = 1
      }
      // diff < 0 (relógio atrasou): mantém estado atual
    }

    if (streak > bestStreak) bestStreak = streak

    await ctx.db.patch(stats._id, {
      streak,
      bestStreak,
      lastStudyDate: today,
      totalLessonsCompleted: stats.totalLessonsCompleted + 1,
      points: stats.points + POINTS_PER_LESSON,
      updatedAt: now,
    })
  },
})

export const recordCourseComplete = internalMutation({
  args: { studentId: v.string() },
  handler: async (ctx, { studentId }) => {
    const stub = await upsertStats(ctx, studentId)
    const stats = await ctx.db.get(stub._id)
    if (!stats) return

    await ctx.db.patch(stats._id, {
      totalCoursesCompleted: stats.totalCoursesCompleted + 1,
      points: stats.points + POINTS_PER_COURSE,
      updatedAt: Date.now(),
    })
  },
})

// Retorna stats do aluno autenticado. Calcula se o streak ainda está "vivo"
// (considera perdido se o último dia de estudo foi antes de ontem). streakAlive
// é só para a UI, não mutamos nada aqui.
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const stats = await ctx.db
      .query('studentStats')
      .withIndex('by_studentId', (q) => q.eq('studentId', identity.subject))
      .unique()

    if (!stats) {
      return {
        streak: 0,
        bestStreak: 0,
        totalLessonsCompleted: 0,
        totalCoursesCompleted: 0,
        points: 0,
        streakAlive: false,
        lastStudyDate: null as string | null,
      }
    }

    const today = utcDateKey(Date.now())
    const diff = stats.lastStudyDate ? daysBetween(stats.lastStudyDate, today) : null
    const streakAlive = diff !== null && diff <= 1

    return {
      streak: streakAlive ? stats.streak : 0,
      bestStreak: stats.bestStreak,
      totalLessonsCompleted: stats.totalLessonsCompleted,
      totalCoursesCompleted: stats.totalCoursesCompleted,
      points: stats.points,
      streakAlive,
      lastStudyDate: stats.lastStudyDate ?? null,
    }
  },
})

// Ranking: top alunos por pontos. Abre leaderboard social (sem expor handles/ids
// privados). Apenas autenticados acessam (reduz scraping). Limite 50.
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)

    const all = await ctx.db.query('studentStats').collect()
    const top = all
      .filter((s) => s.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 50)

    const withUsers = await Promise.all(
      top.map(async (s) => {
        const user = await ctx.db
          .query('users')
          .withIndex('by_clerkId', (q) => q.eq('clerkId', s.studentId))
          .unique()
        return {
          studentId: s.studentId,
          name: user?.name ?? 'Aluno',
          handle: user?.handle ?? null,
          avatarUrl: user?.avatarUrl ?? null,
          points: s.points,
          totalLessonsCompleted: s.totalLessonsCompleted,
          bestStreak: s.bestStreak,
        }
      }),
    )

    return withUsers
  },
})
