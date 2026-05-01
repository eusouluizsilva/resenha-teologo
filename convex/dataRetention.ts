// Cron mensal de purga real de soft-deletes.
//
// Comentários (lessonComments, courseComments, postComments) ficam com
// deletedAt setado quando o autor exclui ou um admin remove. A flag preserva o
// thread (filhos não viram órfãos) por algum tempo. Após 30 dias o registro é
// efetivamente apagado para honrar LGPD ("direito ao esquecimento") e reduzir
// peso da tabela.

import { internalMutation } from './_generated/server'

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

export const purgeSoftDeleted = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - RETENTION_MS
    let purged = 0

    const lessonComments = await ctx.db.query('lessonComments').collect()
    for (const c of lessonComments) {
      if (c.deletedAt && c.deletedAt < cutoff) {
        await ctx.db.delete(c._id)
        purged++
      }
    }

    const courseComments = await ctx.db.query('courseComments').collect()
    for (const c of courseComments) {
      if (c.deletedAt && c.deletedAt < cutoff) {
        await ctx.db.delete(c._id)
        purged++
      }
    }

    const postComments = await ctx.db.query('postComments').collect()
    for (const c of postComments) {
      if (c.deletedAt && c.deletedAt < cutoff) {
        await ctx.db.delete(c._id)
        purged++
      }
    }

    console.log(`[dataRetention] purged ${purged} comentários soft-deletados há mais de 30 dias`)
    return { purged }
  },
})
