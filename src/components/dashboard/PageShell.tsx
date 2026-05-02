import type { ReactNode } from 'react'
import { brandEyebrowClass, brandIconBadgeClass, brandPanelClass, brandPanelSoftClass, brandStatusPillClass, cn } from '@/lib/brand'

interface DashboardPageShellProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  maxWidthClass?: string
  children: ReactNode
}

interface DashboardMetricCardProps {
  icon: ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
}

interface DashboardEmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function DashboardPageShell({
  eyebrow,
  title,
  description,
  actions,
  maxWidthClass = 'max-w-6xl',
  children,
}: DashboardPageShellProps) {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className={cn('mx-auto space-y-8', maxWidthClass)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className={brandEyebrowClass}>{eyebrow}</p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-7 text-white/56 md:text-base">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {children}
      </div>
    </div>
  )
}

export function DashboardMetricCard({ icon, label, value, sub, accent = false }: DashboardMetricCardProps) {
  return (
    <div className={cn('p-5 sm:p-6', accent ? brandPanelSoftClass : brandPanelClass)}>
      <div className={cn('mb-4', accent ? 'flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]' : brandIconBadgeClass)}>
        {icon}
      </div>
      <p className="font-display text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm font-medium text-white/74">{label}</p>
      {sub ? <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/28">{sub}</p> : null}
    </div>
  )
}

export function DashboardEmptyState({ icon, title, description, action }: DashboardEmptyStateProps) {
  return (
    <div className={cn('p-10 text-center sm:p-12', brandPanelClass)}>
      <div className={cn('mx-auto mb-5', brandIconBadgeClass)}>{icon}</div>
      <h3 className="font-display text-2xl font-bold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/54">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function DashboardSectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/34">{children}</h2>
}

export function DashboardStatusPill({
  tone = 'neutral',
  children,
  liveRegion,
}: {
  tone?: 'success' | 'accent' | 'neutral' | 'info'
  children: ReactNode
  // Quando true, anuncia para leitores de tela (use só em feedback transitório
  // de mutação, NÃO em badges estáticos como "Publicado"/"Rascunho").
  liveRegion?: boolean
}) {
  if (liveRegion) {
    return (
      <span role="status" aria-live="polite" className={brandStatusPillClass(tone)}>
        {children}
      </span>
    )
  }
  return <span className={brandStatusPillClass(tone)}>{children}</span>
}
