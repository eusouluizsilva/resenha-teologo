import type { Id } from '@convex/_generated/dataModel'

export function PendingTestimonialCard({
  id,
  text,
  authorName,
  createdAt,
  onApprove,
  onReject,
  onRemove,
}: {
  id: Id<'testimonials'>
  text: string
  authorName: string
  createdAt: number
  onApprove: (id: Id<'testimonials'>) => void
  onReject: (id: Id<'testimonials'>) => void
  onRemove: (id: Id<'testimonials'>) => void
}) {
  const date = new Date(createdAt).toLocaleDateString('pt-BR')
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{authorName}</p>
          <p className="text-xs text-white/36">{date}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => onApprove(id)}
            className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-400/20"
          >
            Aprovar
          </button>
          <button
            onClick={() => onReject(id)}
            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-400/20"
          >
            Rejeitar
          </button>
          <button
            onClick={() => onRemove(id)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/40 transition-all hover:border-red-400/20 hover:bg-red-400/8 hover:text-red-300"
          >
            Excluir
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  )
}
