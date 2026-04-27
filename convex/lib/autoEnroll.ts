import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

// Handle do perfil oficial. Todo cadastro novo passa a seguir este perfil
// automaticamente E e matriculado em todos os cursos publicos publicados por
// ele. Centralizado aqui para que enroll e follow usem a mesma fonte de
// verdade. Se mudar o handle oficial, mudar so esta constante.
export const OFFICIAL_HANDLE = 'resenhadoteologo'

// Auto-enrollment: todo usuario da plataforma deve estar matriculado por padrao
// em todos os cursos publicados pelo perfil oficial @resenhadoteologo. Quando
// o perfil oficial publica um curso novo, retroativamente matricula todos os
// usuarios existentes. Quando um novo usuario se cadastra, matricula nos
// cursos atuais.
//
// Regras:
// - Apenas cursos com isPublished=true entram na regra (rascunhos nao).
// - Cursos institucionais (visibility='institution') NAO entram, pois exigem
//   ser membro da instituicao.
// - Idempotente: se ja existe enrollment, nao cria duplicado.
// - Atualiza totalStudents do curso para refletir a contagem real.
// - Nao matricula o proprio criador no curso dele.

export async function getOfficialUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'> | null> {
  return await ctx.db
    .query('users')
    .withIndex('by_handle', (q) => q.eq('handle', OFFICIAL_HANDLE))
    .unique()
}

async function listOfficialAutoEnrollCourses(
  ctx: MutationCtx,
): Promise<Doc<'courses'>[]> {
  const official = await getOfficialUser(ctx)
  if (!official) return []

  const courses = await ctx.db
    .query('courses')
    .withIndex('by_creatorId', (q) => q.eq('creatorId', official.clerkId))
    .collect()

  return courses.filter((c) => c.isPublished && c.visibility !== 'institution')
}

async function enrollOnce(
  ctx: MutationCtx,
  courseId: Id<'courses'>,
  studentClerkId: string,
): Promise<boolean> {
  const existing = await ctx.db
    .query('enrollments')
    .withIndex('by_student_course', (q) =>
      q.eq('studentId', studentClerkId).eq('courseId', courseId),
    )
    .unique()
  if (existing) return false

  await ctx.db.insert('enrollments', {
    courseId,
    studentId: studentClerkId,
    certificateIssued: false,
  })

  const course = await ctx.db.get(courseId)
  if (course) {
    await ctx.db.patch(courseId, { totalStudents: (course.totalStudents ?? 0) + 1 })
  }
  return true
}

async function followOnce(
  ctx: MutationCtx,
  followerClerkId: string,
  authorClerkId: string,
): Promise<boolean> {
  if (followerClerkId === authorClerkId) return false
  const existing = await ctx.db
    .query('profileFollows')
    .withIndex('by_pair', (q) =>
      q.eq('followerUserId', followerClerkId).eq('authorUserId', authorClerkId),
    )
    .unique()
  if (existing) return false

  await ctx.db.insert('profileFollows', {
    followerUserId: followerClerkId,
    authorUserId: authorClerkId,
    notifyArticles: true,
    notifyCourses: true,
    notifyLessons: false,
    emailDigest: false,
    createdAt: Date.now(),
  })

  const author = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', authorClerkId))
    .unique()
  if (author) {
    await ctx.db.patch(author._id, {
      followerCount: (author.followerCount ?? 0) + 1,
    })
  }
  return true
}

// Matricula um usuario em todos os cursos publicos publicados pelo perfil
// oficial. Chamado no upsert/syncFromWebhook de usuarios. Silencioso se nao
// houver perfil oficial ou cursos elegiveis. Pula se o proprio usuario for
// o oficial (nao se matricula no proprio curso).
export async function autoEnrollUserInOfficialCourses(
  ctx: MutationCtx,
  studentClerkId: string,
): Promise<number> {
  const courses = await listOfficialAutoEnrollCourses(ctx)
  let created = 0
  for (const c of courses) {
    if (c.creatorId === studentClerkId) continue
    const did = await enrollOnce(ctx, c._id, studentClerkId)
    if (did) created += 1
  }
  return created
}

// Matricula todos os usuarios existentes em um curso especifico. Chamado
// quando o perfil oficial publica um curso pela primeira vez. Tambem usado
// no backfill por curso.
export async function autoEnrollAllUsersInCourse(
  ctx: MutationCtx,
  courseId: Id<'courses'>,
): Promise<number> {
  const course = await ctx.db.get(courseId)
  if (!course) return 0
  if (!course.isPublished) return 0
  if (course.visibility === 'institution') return 0

  const official = await getOfficialUser(ctx)
  if (!official || course.creatorId !== official.clerkId) return 0

  const users = await ctx.db.query('users').collect()
  let created = 0
  for (const u of users) {
    if (u.clerkId === course.creatorId) continue
    const did = await enrollOnce(ctx, courseId, u.clerkId)
    if (did) created += 1
  }
  return created
}

// Faz um usuario seguir o perfil oficial. Idempotente. Chamado no
// upsert/syncFromWebhook e no backfill.
export async function autoFollowOfficial(
  ctx: MutationCtx,
  followerClerkId: string,
): Promise<boolean> {
  const official = await getOfficialUser(ctx)
  if (!official) return false
  return await followOnce(ctx, followerClerkId, official.clerkId)
}
