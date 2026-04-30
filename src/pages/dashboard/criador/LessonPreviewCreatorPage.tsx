import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandSecondaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import { formatVerseReference, type BibleTestament } from '@/lib/bible/books'

type VerseRef = {
  bookSlug: string
  chapter: number
  verseStart: number
  verseEnd: number
  testament: BibleTestament
}

type Sibling = {
  _id: Id<'lessons'>
  title: string
  order: number
  isPublished: boolean
  durationSeconds: number | null
  isCurrent: boolean
}

type PreviewData = {
  lesson: {
    _id: Id<'lessons'>
    title: string
    description: string | null
    youtubeUrl: string
    durationSeconds: number | null
    slug: string | null
    order: number
    isPublished: boolean
    publishAt: number | null
    hasMandatoryQuiz: boolean
    versesRefs: VerseRef[]
  }
  course: {
    _id: Id<'courses'>
    title: string
    slug: string | null
    totalLessons: number
  }
  siblings: Sibling[]
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function formatDuration(s: number | null) {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export function LessonPreviewCreatorPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const data = useQuery(
    api.lessons.getForCreatorPreview,
    lessonId ? { lessonId: lessonId as Id<'lessons'> } : 'skip',
  ) as PreviewData | null | undefined

  if (data === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Preview da aula"
        title="Carregando preview"
        description="Aguarde um instante."
      >
        <div className={cn('h-72 animate-pulse', brandPanelClass)} />
      </DashboardPageShell>
    )
  }

  if (data === null) {
    return (
      <DashboardPageShell
        eyebrow="Preview da aula"
        title="Aula não encontrada"
        description="Esta aula não existe ou não pertence à sua conta."
      >
        <div className={cn('p-8 text-center', brandPanelClass)}>
          <Link
            to="/dashboard/cursos"
            className={brandSecondaryButtonClass}
          >
            Voltar para cursos
          </Link>
        </div>
      </DashboardPageShell>
    )
  }

  const ytId = extractYouTubeId(data.lesson.youtubeUrl)
  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`
    : null

  return (
    <DashboardPageShell
      eyebrow="Preview da aula"
      title={data.lesson.title}
      description={`Você está visualizando a aula como o aluno veria. Nada que você fizer aqui é registrado como progresso.`}
      maxWidthClass="max-w-6xl"
      actions={
        <>
          <Link
            to={`/dashboard/cursos/${courseId}/aula/${data.lesson._id}`}
            className={brandSecondaryButtonClass}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 10.5v6a2.25 2.25 0 01-2.25 2.25h-10.5A2.25 2.25 0 014.5 16.5v-10.5A2.25 2.25 0 016.75 3.75h6" />
            </svg>
            Editar aula
          </Link>
          <Link
            to={`/dashboard/cursos/${courseId}/modulos`}
            className={brandSecondaryButtonClass}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Voltar
          </Link>
        </>
      }
    >
      <div className={cn('flex flex-wrap items-center gap-2 p-4', brandPanelClass)}>
        <span className={brandStatusPillClass('accent')}>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Modo preview do criador
        </span>
        <span className="text-xs text-white/52">
          Curso: <strong className="text-white/82">{data.course.title}</strong>
        </span>
        <span className="text-xs text-white/52">
          Aula {data.lesson.order} de {data.course.totalLessons}
        </span>
        {data.lesson.isPublished ? (
          <span className={brandStatusPillClass('success')}>Publicada</span>
        ) : data.lesson.publishAt ? (
          <span className={brandStatusPillClass('info')}>Agendada</span>
        ) : (
          <span className={brandStatusPillClass('neutral')}>Rascunho</span>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className={cn('overflow-hidden p-0', brandPanelClass)}>
            {embedUrl ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={data.lesson.title}
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-[#10161E] flex items-center justify-center text-white/40">
                <p className="text-sm">URL de vídeo inválida ou não suportada para embed.</p>
              </div>
            )}
          </div>

          {data.lesson.description ? (
            <div className={cn('p-6 sm:p-8', brandPanelClass)}>
              <h2 className="font-display text-lg font-semibold text-white">Sobre esta aula</h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-7 text-white/72">
                {data.lesson.description}
              </div>
            </div>
          ) : (
            <div className={cn('p-6 sm:p-8 text-center text-sm text-white/40', brandPanelClass)}>
              Esta aula ainda não tem descrição. O aluno não verá nada neste bloco.
            </div>
          )}

          {data.lesson.versesRefs.length > 0 ? (
            <div className={cn('p-6 sm:p-8', brandPanelClass)}>
              <h2 className="font-display text-lg font-semibold text-white">Versículos referenciados</h2>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
                {data.lesson.versesRefs.map((v, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F37E20]/50" />
                    <span>{formatVerseReference(v)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.lesson.hasMandatoryQuiz ? (
            <div className={cn('p-6 sm:p-8', brandPanelClass)}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/22 bg-[#F37E20]/10 text-[#F37E20]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Quiz obrigatório</h2>
                  <p className="mt-1 text-sm leading-7 text-white/64">
                    Esta aula tem quiz obrigatório. O aluno precisa responder antes de avançar.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className={cn('p-5', brandPanelClass)}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/34">
              Aulas do curso
            </h3>
            <ol className="mt-3 space-y-1">
              {data.siblings.map((sib) => (
                <li key={sib._id}>
                  <Link
                    to={`/dashboard/cursos/${courseId}/aula/${sib._id}/preview`}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all',
                      sib.isCurrent
                        ? 'border-[#F37E20]/30 bg-[#F37E20]/8 text-white'
                        : 'border-white/8 bg-white/3 text-white/72 hover:border-white/16 hover:bg-white/5',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                        sib.isCurrent
                          ? 'bg-[#F37E20]/30 text-white'
                          : 'bg-white/8 text-white/60',
                      )}
                    >
                      {sib.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{sib.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs">
                        {sib.durationSeconds ? (
                          <span className="text-white/40">
                            {formatDuration(sib.durationSeconds)}
                          </span>
                        ) : null}
                        {!sib.isPublished ? (
                          <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/40">
                            Rascunho
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className={cn('p-5', brandPanelClass)}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/34">
              Como o aluno verá
            </h3>
            <ul className="mt-3 space-y-2 text-xs leading-6 text-white/56">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F37E20]/60" />
                Player com anti-skip, rastreamento de progresso e atalhos.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F37E20]/60" />
                Sidebar com lista de aulas e progresso individual.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F37E20]/60" />
                Caderno e flashcards para anotações pessoais.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F37E20]/60" />
                Quiz ao final, se marcado como obrigatório.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </DashboardPageShell>
  )
}
