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

export default crons
