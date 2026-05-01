// Botao de apoio com doacao. Visivel apenas para admin enquanto o sistema de
// pagamentos (Stripe/Pix) nao esta em producao. Quando estiver, retirar a
// condicao isAdmin no DashboardSidebar e aqui (ver feedback_visibilidade_admin).

import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { cn } from '@/lib/brand'

interface DonateButtonProps {
  tone?: 'dark' | 'light'
  variant?: 'inline' | 'card'
  className?: string
}

export function DonateButton({ tone = 'dark', variant = 'inline', className }: DonateButtonProps) {
  const isAdmin = useQuery(api.admin.amIAdmin, {})
  if (!isAdmin) return null

  const heart = (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )

  if (variant === 'card') {
    return (
      <Link
        to="/apoie"
        className={cn(
          'group flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 transition-all duration-200',
          tone === 'dark'
            ? 'border-[#F37E20]/24 bg-[#F37E20]/8 text-white hover:border-[#F37E20]/40 hover:bg-[#F37E20]/12'
            : 'border-[#F37E20]/40 bg-[#F37E20]/8 text-gray-800 hover:bg-[#F37E20]/14',
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl',
              tone === 'dark' ? 'bg-[#F37E20]/12 text-[#F2BD8A]' : 'bg-[#F37E20]/14 text-[#F37E20]',
            )}
          >
            {heart}
          </span>
          <div>
            <p className="text-sm font-semibold">Apoiar com doação</p>
            <p className={cn('text-xs', tone === 'dark' ? 'text-white/52' : 'text-gray-500')}>
              Mantenha o conteúdo gratuito para todos.
            </p>
          </div>
        </div>
        <span className={cn('text-xs', tone === 'dark' ? 'text-white/40' : 'text-gray-400')}>
          Saiba mais
        </span>
      </Link>
    )
  }

  return (
    <Link
      to="/apoie"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
        tone === 'dark'
          ? 'border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F2BD8A] hover:border-[#F37E20]/50 hover:bg-[#F37E20]/16 hover:text-white'
          : 'border-[#F37E20] bg-[#F37E20] text-white shadow-sm hover:bg-[#e06e10]',
        className,
      )}
    >
      {heart}
      <span>Apoiar com doação</span>
    </Link>
  )
}
