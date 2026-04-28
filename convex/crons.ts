// Crons agendados do Convex. Cada job aqui é declarativo: o runtime do Convex
// agenda automaticamente conforme o cron expression. Não precisa de processo
// externo nem servidor de scheduler.
//
// Janela de execução em UTC. 12:00 UTC = 09:00 BRT (horário comercial Brasil).

import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Reengajamento diário: detecta alunos inativos há 7+ dias com cursos
// incompletos e envia email + notificação. Throttle de 14 dias por aluno.
crons.daily(
  'reengagement-daily',
  { hourUTC: 12, minuteUTC: 0 },
  internal.reengagement.run,
)

// Ranking diário do blog (03:00 UTC = 00:00 BRT). Recalcula snapshots por
// categoria + global usados pela LandingPage e BlogIndexPage.
crons.daily(
  'post-ranking-daily',
  { hourUTC: 3, minuteUTC: 0 },
  internal.postRanking.computeDailyRanking,
)

// Scheduled-publish runner: varre posts com status='scheduled' e publishAt
// vencido a cada 30 minutos. Tolerância máxima de ~30min por design.
// Reduzido de 5min para economizar execuções no Convex Free plan.
crons.interval(
  'post-scheduled-publish',
  { minutes: 30 },
  internal.postRanking.runScheduledPublish,
)

// Scheduled-publish runner para aulas (lessons.publishAt). Mesmo intervalo;
// flippa isPublished=false → true quando publishAt vence e notifica
// matriculados. Espelha o pattern dos posts.
crons.interval(
  'lesson-scheduled-publish',
  { minutes: 30 },
  internal.lessons.runScheduledPublish,
)

export default crons
