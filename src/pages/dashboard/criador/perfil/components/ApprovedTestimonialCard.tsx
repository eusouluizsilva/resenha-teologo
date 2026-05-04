import type { Id } from '@convex/_generated/dataModel'

export function ApprovedTestimonialCard({
  id,
  text,
  authorName,
  authorHandle,
  createdAt,
  onRemove,
}: {
  id: Id<'testimonials'>
  text: string
  authorName: string
  authorHandle?: string
  createdAt: number
  onRemove: (id: Id<'testimonials'>) => void
}) {
  const date = new Date(createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  const initials = authorName.slice(0, 2).toUpperCase()
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#F37E20]/16 bg-[#F37E20]/10">
            <span className="text-xs font-semibold text-[#F2BD8A]">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{authorName}</p>
            {authorHandle && (
              <p className="text-xs text-white/36">@{authorHandle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="text-xs text-white/28">{date}</span>
          <button
            onClick={() => onRemove(id)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/40 transition-all hover:border-red-400/20 hover:bg-red-400/8 hover:text-red-300"
          >
            Remover
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  )
}
