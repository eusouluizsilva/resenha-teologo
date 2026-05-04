import { cn } from '@/lib/brand'
import type { TabId } from '../types'

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: TabId; label: string }[]
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div className="mb-8 flex gap-0.5 overflow-x-auto border-b border-white/8 pb-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative shrink-0 px-4 pb-3 pt-1 text-sm font-medium transition-all duration-200',
            active === tab.id
              ? 'text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#F37E20] after:content-[""]'
              : 'text-white/44 hover:text-white/70',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
