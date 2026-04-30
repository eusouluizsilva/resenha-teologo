import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import {
  DashboardEmptyState,
  DashboardPageShell,
} from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

type SharedCourse = {
  _id: Id<'courseCoauthors'>
  courseId: Id<'courses'>
  title: string
  slug?: string
  isPublished: boolean
  role: 'editor' | 'reviewer'
  ownerName: string
  ownerHandle?: string
}

export function CursosCompartilhadosPage() {
  const list = useQuery(api.courseCoauthors.listForUser) as
    | SharedCourse[]
    | undefined

  if (list === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Compartilhados comigo"
        title="Cursos onde você é co-autor"
        description="Aguarde um instante."
      >
        <div className={cn('h-28 animate-pulse', brandPanelClass)} />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Compartilhados comigo"
      title="Cursos onde você é co-autor"
      description="Cursos de outros criadores em que você foi convidado para colaborar."
      maxWidthClass="max-w-5xl"
    >
      {list.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          }
          title="Você não foi adicionado a nenhum curso"
          description="Quando outro criador te adicionar como co-autor, o curso aparecerá aqui."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <li
              key={c._id}
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 p-4 transition-all hover:border-[#F37E20]/22',
                brandPanelClass,
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/dashboard/cursos/${c.courseId}/modulos`}
                    className="font-medium text-white hover:text-[#F2BD8A]"
                  >
                    {c.title}
                  </Link>
                  <span className={brandStatusPillClass(c.role === 'editor' ? 'accent' : 'info')}>
                    {c.role === 'editor' ? 'Editor' : 'Revisor'}
                  </span>
                  {!c.isPublished && (
                    <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
                      Rascunho
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-white/48">
                  Dono: {c.ownerName}
                  {c.ownerHandle ? ` (@${c.ownerHandle})` : ''}
                </p>
              </div>
              <Link
                to={`/dashboard/cursos/${c.courseId}/modulos`}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/72 transition-colors hover:border-[#F37E20]/30 hover:bg-[#F37E20]/8 hover:text-[#F2BD8A]"
              >
                Abrir
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  )
}
