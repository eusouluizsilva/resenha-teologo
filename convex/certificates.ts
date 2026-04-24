// Verificação pública de certificado. Qualquer pessoa com o código impresso no
// PDF pode conferir em /verificar/:code. Expomos somente: nome do aluno, título
// do curso, criador, data de conclusão, nota final. Não retornamos email,
// clerkId ou qualquer dado sensível. O código é derivado dos 16 primeiros
// caracteres alfanuméricos do enrollmentId em maiúsculo (mesma função do PDF).

import { v } from 'convex/values'
import { query } from './_generated/server'

function normalizeCode(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export const verify = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const normalized = normalizeCode(code)
    if (normalized.length < 8) return null

    // Percorremos os enrollments com certificateIssued=true e comparamos pelo
    // prefixo do _id normalizado. Este scan é O(N) sobre enrollments emitidos
    // — aceitável para o volume da Fase 1. Se escalarmos, migrar para índice
    // por hash do code armazenado no documento.
    const allCerts = await ctx.db.query('enrollments').collect()

    const match = allCerts.find((e) => {
      if (!e.certificateIssued) return false
      const enrollmentCode = normalizeCode(e._id as unknown as string).slice(0, 16)
      return enrollmentCode === normalized.slice(0, 16)
    })

    if (!match) return null

    const course = await ctx.db.get(match.courseId)
    if (!course) return null

    const student = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', match.studentId))
      .unique()
    const creator = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', course.creatorId))
      .unique()

    return {
      valid: true as const,
      studentName: student?.name ?? 'Aluno',
      courseTitle: course.title,
      creatorName: creator?.name ?? '',
      completedAt: match.completedAt ?? null,
      finalScore: match.finalScore ?? null,
      verificationCode: normalized.slice(0, 16),
    }
  },
})
