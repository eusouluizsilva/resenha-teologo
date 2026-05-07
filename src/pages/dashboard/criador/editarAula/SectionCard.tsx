import { brandPanelClass, cn } from '@/lib/brand'
import { DashboardSectionLabel } from '@/components/dashboard/PageShell'

export function SectionCard({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('overflow-hidden', brandPanelClass)}>
      <div className="border-b border-white/8 px-6 py-4 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F37E20]/14 px-2 font-display text-[11px] font-bold text-[#F37E20]">
          {badge}
        </span>
        <div>
          <DashboardSectionLabel>{title}</DashboardSectionLabel>
          {subtitle && <p className="mt-2 text-sm leading-7 text-white/54">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
