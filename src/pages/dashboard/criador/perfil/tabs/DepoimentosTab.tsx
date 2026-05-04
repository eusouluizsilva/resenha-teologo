import { brandEyebrowClass, cn } from '@/lib/brand'
import type { FunctionReturnType } from 'convex/server'
import type { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { PendingTestimonialCard } from '../components/PendingTestimonialCard'
import { ApprovedTestimonialCard } from '../components/ApprovedTestimonialCard'

type Pending = FunctionReturnType<typeof api.testimonials.listPending>
type Approved = FunctionReturnType<typeof api.testimonials.listApproved>

export function DepoimentosTab({
  pendingTestimonials,
  approvedTestimonials,
  onApprove,
  onReject,
  onRemove,
}: {
  pendingTestimonials: Pending | undefined
  approvedTestimonials: Approved | undefined
  onApprove: (id: Id<'testimonials'>) => void
  onReject: (id: Id<'testimonials'>) => void
  onRemove: (id: Id<'testimonials'>) => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className={cn('mb-4', brandEyebrowClass)}>
          Aguardando aprovação
          {pendingTestimonials !== undefined && pendingTestimonials.length > 0 && (
            <span className="ml-2 rounded-full border border-[#F37E20]/20 bg-[#F37E20]/10 px-2 py-0.5 text-[10px] normal-case tracking-normal text-[#F2BD8A]">
              {pendingTestimonials.length}
            </span>
          )}
        </p>
        {pendingTestimonials === undefined ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
          </div>
        ) : pendingTestimonials.length === 0 ? (
          <p className="text-sm text-white/36">Nenhum depoimento aguardando aprovação.</p>
        ) : (
          <div className="space-y-3">
            {pendingTestimonials.map((t) => (
              <PendingTestimonialCard
                key={String(t._id)}
                id={t._id}
                text={t.text}
                authorName={t.authorName}
                createdAt={t.createdAt}
                onApprove={onApprove}
                onReject={onReject}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className={cn('mb-4', brandEyebrowClass)}>Publicados no perfil</p>
        {approvedTestimonials === undefined ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
          </div>
        ) : approvedTestimonials.length === 0 ? (
          <p className="text-sm text-white/36">Nenhum depoimento publicado ainda.</p>
        ) : (
          <div className="space-y-3">
            {approvedTestimonials.map((t) => (
              <ApprovedTestimonialCard
                key={String(t._id)}
                id={t._id}
                text={t.text}
                authorName={t.authorName}
                authorHandle={t.authorHandle}
                createdAt={t.createdAt}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
