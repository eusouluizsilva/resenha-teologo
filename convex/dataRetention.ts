// Cron mensal de purga real de soft-deletes + anonimização de consents antigos.
//
// Comentários (lessonComments, courseComments, postComments) ficam com
// deletedAt setado quando o autor exclui ou um admin remove. A flag preserva o
// thread (filhos não viram órfãos) por algum tempo. Após 30 dias o registro é
// efetivamente apagado para honrar LGPD ("direito ao esquecimento") e reduzir
// peso da tabela.
//
// Consents (aceite de termos): mantemos o registro do consentimento para fins
// legais, mas removemos ipAddress e userAgent após 12 meses. Esses campos só
// servem como prova de autenticidade no momento do aceite; depois disso são
// dados pessoais armazenados além do necessário (LGPD art. 15).

import { internalMutation } from './_generated/server'

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias para soft-deletes
const CONSENT_PII_TTL_MS = 365 * 24 * 60 * 60 * 1000 // 12 meses para IP/UA em consents

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

export const purgeConsentPii = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - CONSENT_PII_TTL_MS
    let anonymized = 0

    const consents = await ctx.db.query('consents').collect()
    for (const c of consents) {
      if (c.acceptedAt < cutoff && (c.ipAddress || c.userAgent)) {
        await ctx.db.patch(c._id, { ipAddress: undefined, userAgent: undefined })
        anonymized++
      }
    }

    console.log(`[dataRetention] anonymized ${anonymized} consents com IP/UA mais antigos que 12 meses`)
    return { anonymized }
  },
})
