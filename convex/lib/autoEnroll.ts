import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { isAdminEmail } from './auth'

// Auto-enrollment: todo usuario da plataforma deve estar matriculado por padrao
// em todos os cursos publicados pelo dono (admin). Quando admin publica um
// curso novo, retroativamente matricula todos os usuarios existentes. Quando
// um novo usuario se cadastra, matricula nos cursos atuais do admin.
//
// Regras:
// - Apenas cursos com isPublished=true entram na regra (rascunhos nao).
// - Cursos institucionais (visibility='institution') NAO entram, pois exigem
//   ser membro da instituicao.
// - Idempotente: se ja existe enrollment, nao cria duplicado.
// - Atualiza totalStudents do curso para refletir a contagem real.
// - Nao matricula o proprio criador no curso dele.

async function getAdminClerkIds(ctx: MutationCtx): Promise<Set<string>> {
  // Como ADMIN_EMAILS hoje tem 1 valor, full scan é aceitavel. Se crescer pra
  // muitos admins, indexar by_email no schema.
  const allUsers = await ctx.db.query('users').collect()
  const ids = new Set<string>()
  for (const u of allUsers) {
    if (isAdminEmail(u.email)) ids.add(u.clerkId)
  }
  return ids
}

async function listAdminAutoEnrollCourses(ctx: MutationCtx): Promise<Doc<'courses'>[]> {
  const adminIds = await getAdminClerkIds(ctx)
  if (adminIds.size === 0) return []

  const result: Doc<'courses'>[] = []
  for (const adminId of adminIds) {
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', adminId))
      .collect()
    for (const c of courses) {
      if (!c.isPublished) continue
      if (c.visibility === 'institution') continue
      result.push(c)
    }
  }
  return result
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

// Matricula um usuario em todos os cursos publicos publicados do(s) admin(s).
// Chamado no upsert/syncFromWebhook de usuarios. Silencioso se nao houver
// admin ou cursos elegiveis. Pula se o proprio usuario for admin (nao se
// matricula no proprio curso).
export async function autoEnrollUserInAdminCourses(
  ctx: MutationCtx,
  studentClerkId: string,
): Promise<number> {
  const courses = await listAdminAutoEnrollCourses(ctx)
  let created = 0
  for (const c of courses) {
    if (c.creatorId === studentClerkId) continue
    const did = await enrollOnce(ctx, c._id, studentClerkId)
    if (did) created += 1
  }
  return created
}

// Matricula todos os usuarios existentes em um curso especifico. Chamado
// quando admin publica um curso pela primeira vez. Tambem usado no backfill
// por curso.
export async function autoEnrollAllUsersInCourse(
  ctx: MutationCtx,
  courseId: Id<'courses'>,
): Promise<number> {
  const course = await ctx.db.get(courseId)
  if (!course) return 0
  if (!course.isPublished) return 0
  if (course.visibility === 'institution') return 0

  const adminIds = await getAdminClerkIds(ctx)
  if (!adminIds.has(course.creatorId)) return 0

  const users = await ctx.db.query('users').collect()
  let created = 0
  for (const u of users) {
    if (u.clerkId === course.creatorId) continue
    const did = await enrollOnce(ctx, courseId, u.clerkId)
    if (did) created += 1
  }
  return created
}
