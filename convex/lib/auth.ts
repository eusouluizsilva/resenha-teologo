import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type Ctx = QueryCtx | MutationCtx
type Perfil = Doc<'users'>['perfil']

export async function requireIdentity(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Não autenticado')
  }
  return identity
}

export async function getCurrentUserRecord(ctx: Ctx) {
  const identity = await requireIdentity(ctx)
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique()

  return { identity, user }
}

export async function requireCurrentUser(ctx: Ctx) {
  const { identity, user } = await getCurrentUserRecord(ctx)
  if (!user) {
    throw new Error('Usuário não encontrado')
  }
  return { identity, user }
}

export async function requirePerfil(ctx: Ctx, perfis: Perfil[]) {
  const result = await requireCurrentUser(ctx)
  if (!perfis.includes(result.user.perfil)) {
    throw new Error('Não autorizado')
  }
  return result
}

// Verifica função ativa via tabela userFunctions (sistema atual)
// Aceita também o campo legado user.perfil como fallback
export async function requireUserFunction(ctx: Ctx, functions: string[]) {
  const { identity, user } = await requireCurrentUser(ctx)

  const records = await ctx.db
    .query('userFunctions')
    .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
    .collect()

  const active = records.map((r) => r.function as string)
  const hasViaTable = functions.some((fn) => active.includes(fn))
  const hasViaLegacy = functions.includes(user.perfil as string)

  if (!hasViaTable && !hasViaLegacy) {
    throw new Error('Função não ativa')
  }

  return { identity, user }
}

export function ensureIdentityMatches(identitySubject: string, expectedSubject: string) {
  if (identitySubject !== expectedSubject) {
    throw new Error('Não autorizado')
  }
}

// Lista de admins da plataforma. Por ora apenas o dono (Luiz). Usar email em vez
// de clerkId facilita a migração/rotação de contas sem redeploy. Comparação é
// case-insensitive para evitar falha por diferença de caixa.
const ADMIN_EMAILS = ['hello@resenhadoteologo.com']

export function isAdminEmail(email?: string | null) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function requireAdmin(ctx: Ctx) {
  const { identity, user } = await requireCurrentUser(ctx)
  if (!isAdminEmail(user.email)) {
    throw new Error('Não autorizado')
  }
  return { identity, user }
}

// Autorização por aula: permite o criador dono do curso OU aluno com matrícula
// ativa. Usado em queries/mutations que devem vazar dados apenas para quem
// pertence à turma.
export async function requireLessonAccess(
  ctx: Ctx,
  lessonId: Id<'lessons'>
) {
  const identity = await requireIdentity(ctx)
  const lesson = await ctx.db.get(lessonId)
  if (!lesson) throw new Error('Aula não encontrada')

  if (lesson.creatorId === identity.subject) {
    return { identity, lesson, role: 'criador' as const }
  }

  const enrollment = await ctx.db
    .query('enrollments')
    .withIndex('by_student_course', (q) =>
      q.eq('studentId', identity.subject).eq('courseId', lesson.courseId)
    )
    .unique()

  if (!enrollment) throw new Error('Não autorizado')

  return { identity, lesson, role: 'aluno' as const, enrollment }
}

// Autorização por curso: permite o professor dono OU aluno com matrícula ativa.
// Usado no fórum de curso (courseComments).
export async function requireCourseAccess(
  ctx: Ctx,
  courseId: Id<'courses'>
) {
  const identity = await requireIdentity(ctx)
  const course = await ctx.db.get(courseId)
  if (!course) throw new Error('Curso não encontrado')

  if (course.creatorId === identity.subject) {
    return { identity, course, role: 'criador' as const }
  }

  const enrollment = await ctx.db
    .query('enrollments')
    .withIndex('by_student_course', (q) =>
      q.eq('studentId', identity.subject).eq('courseId', courseId)
    )
    .unique()

  if (!enrollment) throw new Error('Não autorizado')

  return { identity, course, role: 'aluno' as const, enrollment }
}
