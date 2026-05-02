// Despacha notificações em massa via scheduler. Cada chunk roda em mutation
// isolada (orçamento limpo de docs lidos/escritos), evitando estourar os
// limites do Convex (8000 writes/mutation) quando a base de destinatários
// passa de algumas centenas. Substitui o pattern de chamar
// ctx.runMutation(internal.notifications.pushInternal, ...) num loop, que
// concentrava todos os writes na mesma transação raiz.

import type { MutationCtx } from '../_generated/server'
import { internal } from '../_generated/api'

export const NOTIF_CHUNK = 100

export type NotifyKind =
  | 'course_completed'
  | 'certificate_issued'
  | 'comment_reply'
  | 'comment_new'
  | 'course_published'
  | 'welcome'
  | 'reengagement'
  | 'generic'
  | 'post_published'
  | 'post_comment_new'
  | 'post_comment_reply'
  | 'profile_followed'
  | 'course_marked_complete'
  | 'lesson_scheduled_published'

export type NotifyTarget = {
  userId: string
  title: string
  body?: string
  link?: string
}

export async function scheduleBulkNotifications(
  ctx: MutationCtx,
  kind: NotifyKind,
  targets: NotifyTarget[],
) {
  if (targets.length === 0) return
  for (let i = 0; i < targets.length; i += NOTIF_CHUNK) {
    const chunk = targets.slice(i, i + NOTIF_CHUNK)
    await ctx.scheduler.runAfter(0, internal.notifications.bulkPushInternal, {
      kind,
      items: chunk,
    })
  }
}
