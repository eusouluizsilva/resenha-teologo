import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../../convex/_generated/api'
import {
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  cn,
} from '@/lib/brand'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { useSeo } from '@/lib/seo'

export function TrilhaPublicaPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { isSignedIn } = useUser()

  const trilha = useQuery(
    api.learningPaths.getBySlug,
    slug ? { slug } : 'skip',
  )
  const myEnrollments = useQuery(api.learningPaths.listMyEnrollments, {})
  const enroll = useMutation(api.learningPaths.enroll)

  useSeo({
    title: trilha
      ? `${trilha.title} · Trilha de aprendizagem`
      : 'Trilha de aprendizagem',
    description:
      trilha?.description?.slice(0, 160) ??
      'Trilha de aprendizagem teológica gratuita.',
    url: trilha
      ? `https://resenhadoteologo.com/trilhas/${trilha.slug}`
      : 'https://resenhadoteologo.com/cursos',
    type: 'website',
  })

  if (trilha === undefined) {
    return (
      <PublicPageShell>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className={cn('h-32 animate-pulse', brandPanelClass)} />
        </div>
      </PublicPageShell>
    )
  }

  if (trilha === null) {
    return (
      <PublicPageShell>
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-bold text-white">
            Trilha não encontrada
          </h1>
          <p className="mt-2 text-sm text-white/56">
            Esta trilha não existe ou ainda não foi publicada.
          </p>
          <Link to="/cursos" className={cn(brandSecondaryButtonClass, 'mt-6 inline-flex')}>
            Voltar ao catálogo
          </Link>
        </div>
      </PublicPageShell>
    )
  }

  const myEnrollment = myEnrollments?.find((e) => e.pathId === trilha._id)

  return (
    <PublicPageShell>
      <article className="mx-auto max-w-4xl px-6 py-12">
        {trilha.coverUrl && (
          <img
            src={trilha.coverUrl}
            alt={trilha.title}
            className="mb-6 aspect-[16/7] w-full rounded-3xl object-cover"
          />
        )}
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
          Trilha de aprendizagem
          {trilha.institutionName ? ` · ${trilha.institutionName}` : ''}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
          {trilha.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
          {trilha.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isSignedIn ? (
            myEnrollment ? (
              <span className={cn(brandSecondaryButtonClass, 'cursor-default')}>
                Você já está inscrito
              </span>
            ) : (
              <button
                type="button"
                onClick={() => enroll({ pathId: trilha._id })}
                className={brandPrimaryButtonClass}
              >
                Iniciar trilha
              </button>
            )
          ) : (
            <Link to="/entrar" className={brandPrimaryButtonClass}>
              Entrar para iniciar
            </Link>
          )}
          {myEnrollment && (
            <span className="text-xs text-white/56">
              Progresso: {myEnrollment.completedCount}/{myEnrollment.totalCourses}{' '}
              cursos concluídos
            </span>
          )}
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/52">
            Cursos da trilha
          </h2>
          <ul className="space-y-3">
            {trilha.items.map((it, idx) => (
              <li
                key={it.courseId}
                className={cn(
                  'flex items-center gap-4 p-4 transition-all hover:border-[#F37E20]/22',
                  brandPanelClass,
                )}
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F37E20]/12 text-sm font-semibold text-[#F2BD8A]">
                  {idx + 1}
                </span>
                {it.thumbnail ? (
                  <img
                    src={it.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-16 w-24 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-16 w-24 flex-shrink-0 rounded-xl bg-white/8" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {it.title}
                  </p>
                  <p className="mt-0.5 text-xs text-white/48">
                    {it.totalLessons} aulas
                  </p>
                </div>
                {it.slug && (
                  <Link
                    to={`/cursos/${it.slug}`}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/72 transition-colors hover:border-[#F37E20]/30 hover:bg-[#F37E20]/8 hover:text-[#F2BD8A]"
                  >
                    Ver curso
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </PublicPageShell>
  )
}
