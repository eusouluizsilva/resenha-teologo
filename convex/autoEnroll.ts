// Wrapper de auto-enrollment chunked. O helper em lib/autoEnroll.ts agenda
// este internalMutation para processar usuarios em batches via paginate.
// Mantem cada batch dentro do orcamento de mutation (8s/8000 writes), suporta
// matricula em massa de cursos do perfil oficial sem estourar limites.

import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

const BATCH_SIZE = 100

export const enrollUsersChunk = internalMutation({
  args: {
    courseId: v.id('courses'),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { courseId, cursor }) => {
    const course = await ctx.db.get(courseId)
    if (!course) return
    if (!course.isPublished) return
    if (course.visibility === 'institution') return

    const page = await ctx.db.query('users').paginate({ cursor, numItems: BATCH_SIZE })

    let createdInBatch = 0
    for (const u of page.page) {
      if (u.clerkId === course.creatorId) continue
      const existing = await ctx.db
        .query('enrollments')
        .withIndex('by_student_course', (q) =>
          q.eq('studentId', u.clerkId).eq('courseId', courseId),
        )
        .unique()
      if (existing) continue
      await ctx.db.insert('enrollments', {
        courseId,
        studentId: u.clerkId,
        certificateIssued: false,
      })
      createdInBatch += 1
    }

    if (createdInBatch > 0) {
      const fresh = await ctx.db.get(courseId)
      if (fresh) {
        await ctx.db.patch(courseId, {
          totalStudents: (fresh.totalStudents ?? 0) + createdInBatch,
        })
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.autoEnroll.enrollUsersChunk, {
        courseId,
        cursor: page.continueCursor,
      })
    }
  },
})
