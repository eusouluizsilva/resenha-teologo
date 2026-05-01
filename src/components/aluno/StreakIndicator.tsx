import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '@convex/_generated/api'
import { useCurrentAppUser } from '@/lib/currentUser'
import { cn } from '@/lib/brand'

// Pílula compacta com streak + pontos. Aparece no topbar do dashboard quando o
// usuário tem função de aluno. Click leva para o painel principal onde a
// gamificação completa é exibida.

type Props = { compact?: boolean }

export function StreakIndicator({ compact = false }: Props) {
  const { functions } = useCurrentAppUser()
  const isAluno = functions.includes('aluno')
  const stats = useQuery(api.gamification.getMyStats, isAluno ? {} : 'skip')

  if (!isAluno) return null
  if (!stats || stats.totalLessonsCompleted === 0) return null

  const streak = stats.streak ?? 0
  const alive = stats.streakAlive

  return (
    <Link
      to="/dashboard"
      title={`Sequência: ${streak} dia${streak === 1 ? '' : 's'} · ${stats.points} pontos`}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/82 transition-all hover:border-[#F37E20]/30 hover:bg-white/[0.07]',
        alive && streak > 0
          ? 'border-[#F37E20]/24'
          : 'border-white/10',
      )}
    >
      <svg
        className={cn('h-3.5 w-3.5', alive && streak > 0 ? 'text-[#F37E20]' : 'text-white/48')}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M13.5 0.67s.74 4.85-1.97 7.42c-2.71 2.57-4.13 6.49-1.85 9.49 0 0-3.25-1.41-3.6-4.69-.35-3.28 1.86-4.91 1.86-7.5 0-2.59 1.83-4.31 5.56-4.72zm-2.16 14.22c0 2.84 2.3 5.14 5.14 5.14 2.84 0 5.14-2.3 5.14-5.14 0-1.41-.57-2.69-1.49-3.62 0 1.31-1.06 2.37-2.37 2.37 0-2.46-1.74-4.5-4.06-4.99 0 1.05-.85 1.9-1.9 1.9-0.86 0-1.58-.57-1.81-1.34-.39 1.59-.65 3.62-.65 5.68z" />
      </svg>
      <span className="tabular-nums">{streak}</span>
      {!compact && <span className="text-white/52">{streak === 1 ? 'dia' : 'dias'}</span>}
    </Link>
  )
}
