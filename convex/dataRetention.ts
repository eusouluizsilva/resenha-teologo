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
//
// Estratégia: usa índices by_deletedAt/by_acceptedAt para varrer apenas os
// candidatos. take(BATCH) por execução; se a tabela ainda tiver candidatos
// após o batch, reagenda via scheduler para outra rodada na sequência. Evita
// .collect() em tabelas que crescem indefinidamente.

import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias para soft-deletes
const CONSENT_PII_TTL_MS = 365 * 24 * 60 * 60 * 1000 // 12 meses para IP/UA em consents
const BATCH = 500

export const purgeSoftDeleted = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - RETENTION_MS

    const lessonBatch = await ctx.db
      .query('lessonComments')
      .withIndex('by_deletedAt', (q) => q.gt('deletedAt', 0).lte('deletedAt', cutoff))
      .take(BATCH)
    const courseBatch = await ctx.db
      .query('courseComments')
      .withIndex('by_deletedAt', (q) => q.gt('deletedAt', 0).lte('deletedAt', cutoff))
      .take(BATCH)
    const postBatch = await ctx.db
      .query('postComments')
      .withIndex('by_deletedAt', (q) => q.gt('deletedAt', 0).lte('deletedAt', cutoff))
      .take(BATCH)

    await Promise.all([
      ...lessonBatch.map((c) => ctx.db.delete(c._id)),
      ...courseBatch.map((c) => ctx.db.delete(c._id)),
      ...postBatch.map((c) => ctx.db.delete(c._id)),
    ])

    const purged = lessonBatch.length + courseBatch.length + postBatch.length
    console.log(`[dataRetention] purged ${purged} comentários soft-deletados há mais de 30 dias`)

    // Reagenda se ainda há trabalho. Não usamos await intencionalmente para o
    // próximo run não bloquear esta resposta — o scheduler garante execução.
    if (lessonBatch.length === BATCH || courseBatch.length === BATCH || postBatch.length === BATCH) {
      await ctx.scheduler.runAfter(0, internal.dataRetention.purgeSoftDeleted, {})
    }

    return { purged }
  },
})

export const purgeConsentPii = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - CONSENT_PII_TTL_MS
    const batch = await ctx.db
      .query('consents')
      .withIndex('by_acceptedAt', (q) => q.lte('acceptedAt', cutoff))
      .take(BATCH)

    let anonymized = 0
    await Promise.all(
      batch.map(async (c) => {
        if (c.ipAddress || c.userAgent) {
          await ctx.db.patch(c._id, { ipAddress: undefined, userAgent: undefined })
          anonymized++
        }
      }),
    )

    console.log(`[dataRetention] anonymized ${anonymized} consents com IP/UA mais antigos que 12 meses`)

    if (batch.length === BATCH) {
      await ctx.scheduler.runAfter(0, internal.dataRetention.purgeConsentPii, {})
    }

    return { anonymized }
  },
})
