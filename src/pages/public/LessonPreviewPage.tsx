// Preview público da aula. Usuário anônimo (ou logado-mas-não-matriculado)
// vê título, descrição, lista de aulas do curso, mas o player é substituído
// por um overlay LessonGate.

import { useParams, Link, Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '@convex/_generated/api'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { LessonGate } from '@/components/public/LessonGate'
import { useBreadcrumbJsonLd, useJsonLd, useSeo } from '@/lib/seo'

function formatSeconds(s: number | null) {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export function LessonPreviewPage() {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>()
  const { isSignedIn } = useUser()

  const data = useQuery(
    api.lessons.getPublicPreview,
    courseSlug && lessonSlug ? { courseSlug, lessonSlug } : 'skip',
  )

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'
  const lessonUrl = `${origin}/cursos/${courseSlug}/${lessonSlug}`

  useSeo({
    title: data
      ? `${data.lesson.title}, ${data.course.title}, Resenha do Teólogo`
      : 'Aula, Resenha do Teólogo',
    description:
      data?.lesson.description ??
      data?.course.title ??
      'Aula gratuita de teologia na Resenha do Teólogo.',
    url: lessonUrl,
    image: data?.lesson.youtubeVideoId
      ? `https://i.ytimg.com/vi/${data.lesson.youtubeVideoId}/hqdefault.jpg`
      : data?.course.thumbnail ?? null,
    type: 'website',
    authorName: data?.course.creatorName ?? null,
  })

  const lessonJsonLd =
    data &&
    ({
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: data.lesson.title,
      description: data.lesson.description ?? '',
      url: lessonUrl,
      inLanguage: 'pt-BR',
      isAccessibleForFree: true,
      isPartOf: {
        '@type': 'Course',
        name: data.course.title,
        url: `${origin}/cursos/${data.course.slug ?? data.course._id}`,
      },
      author: {
        '@type': 'Person',
        name: data.course.creatorName,
      },
    } as Record<string, unknown>)
  useJsonLd(lessonJsonLd)

  useBreadcrumbJsonLd(
    data
      ? [
          { name: 'Início', url: `${origin}/` },
          { name: 'Cursos', url: `${origin}/cursos` },
          {
            name: data.course.title,
            url: `${origin}/cursos/${data.course.slug ?? data.course._id}`,
          },
          { name: data.lesson.title, url: lessonUrl },
        ]
      : null,
  )

  if (!courseSlug || !lessonSlug) return <Navigate to="/cursos" replace />

  if (data === undefined) {
    return (
      <PublicPageShell>
      <div className="min-h-screen bg-[#0F141A] text-white">
        <main className="mx-auto max-w-6xl animate-pulse px-5 pt-28 pb-24 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div className="aspect-video w-full rounded-2xl bg-white/8" />
              <div className="h-4 w-32 rounded-full bg-white/8" />
              <div className="h-9 w-3/4 rounded-xl bg-white/8" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-white/6" />
                <div className="h-4 w-11/12 rounded bg-white/6" />
                <div className="h-4 w-2/3 rounded bg-white/6" />
              </div>
            </div>
            <aside>
              <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5 space-y-3">
                <div className="h-4 w-24 rounded-full bg-white/8" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 w-full rounded-xl bg-white/6" />
                ))}
              </div>
            </aside>
          </div>
        </main>
      </div>
      </PublicPageShell>
    )
  }

  if (data === null) {
    return (
      <PublicPageShell>
      <div className="min-h-screen bg-[#0F141A] text-white">
        <main className="pt-32 pb-24">
          <div className="mx-auto max-w-2xl px-5 text-center">
            <h1 className="font-display text-3xl font-bold">Aula não encontrada</h1>
            <p className="mt-3 text-sm text-white/56">
              Esta aula não existe ou o curso não está disponível publicamente.
            </p>
            <Link
              to="/cursos"
              className="mt-6 inline-flex rounded-2xl bg-[#F37E20] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e06e10]"
            >
              Ver catálogo de cursos
            </Link>
          </div>
        </main>
      </div>
      </PublicPageShell>
    )
  }

  const { lesson, course, siblingLessons } = data
  const thumbnailUrl = lesson.youtubeVideoId
    ? `https://i.ytimg.com/vi/${lesson.youtubeVideoId}/hqdefault.jpg`
    : course.thumbnail ?? null
  const courseHref = `/cursos/${course.slug ?? course._id}`

  return (
    <PublicPageShell>
    <div className="min-h-screen bg-[#0F141A] text-white">
      <main className="pt-28 pb-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mb-6">
            <Link
              to={courseHref}
              className="inline-flex items-center gap-2 text-sm text-white/56 transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {course.title}
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <LessonGate
                thumbnailUrl={thumbnailUrl}
                courseId={course._id}
                courseSlug={course.slug}
                isAuthenticated={!!isSignedIn}
              />

              <div className="mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                  {course.category}
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">
                  {lesson.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/48">
                  {lesson.durationSeconds && <span>{formatSeconds(lesson.durationSeconds)}</span>}
                  <span>· Aula {lesson.order + 1} de {course.totalLessons}</span>
                </div>

                {lesson.description && (
                  <p className="mt-6 text-sm leading-7 text-white/72">{lesson.description}</p>
                )}

                {(lesson.versesRefs.length > 0 || lesson.verses.length > 0) && (
                  <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                      Versículos referenciados
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm text-white/72">
                      {lesson.versesRefs.length > 0
                        ? lesson.versesRefs.map((v, i) => (
                            <li key={i}>
                              {v.bookSlug.replace(/-/g, ' ')} {v.chapter}:{v.verseStart}
                              {v.verseEnd > v.verseStart ? `-${v.verseEnd}` : ''}
                            </li>
                          ))
                        : lesson.verses.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                )}

                <div className="mt-8 rounded-2xl border border-[#F37E20]/16 bg-[#F37E20]/8 p-5">
                  <div className="flex items-center gap-3">
                    {course.creatorAvatarUrl ? (
                      <img
                        src={course.creatorAvatarUrl}
                        alt={course.creatorName}
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F37E20]/16 text-sm font-semibold text-[#F2BD8A]">
                        {course.creatorName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Professor</p>
                      {course.creatorHandle ? (
                        <Link
                          to={`/${course.creatorHandle}`}
                          className="font-medium text-white hover:text-[#F2BD8A]"
                        >
                          {course.creatorName}
                        </Link>
                      ) : (
                        <p className="font-medium text-white">{course.creatorName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {course.description && (
                  <section className="mt-8">
                    <h2 className="font-display text-xl font-bold text-white">
                      Sobre o curso, {course.title}
                    </h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/72">
                      {course.description}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/48">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {course.totalLessons} aulas
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 capitalize">
                        Nível {course.level}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {course.category}
                      </span>
                    </div>
                  </section>
                )}

                <section className="mt-8 rounded-[1.6rem] border border-[#F37E20]/24 bg-gradient-to-br from-[#F37E20]/12 to-[#F37E20]/4 p-6 md:p-8">
                  <h2 className="font-display text-xl font-bold text-white md:text-2xl">
                    {isSignedIn
                      ? `Comece a estudar, ${course.title}`
                      : 'Pronto para estudar de verdade?'}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">
                    Acesso completo ao curso, quizzes para fixar o aprendizado, certificado emitido em PDF e caderno digital. Tudo gratuito.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={
                        isSignedIn
                          ? courseHref
                          : `/cadastro?redirect=${encodeURIComponent(courseHref)}`
                      }
                      className="inline-flex items-center justify-center rounded-2xl bg-[#F37E20] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgba(243,126,32,0.30)] transition-all hover:bg-[#e06e10]"
                    >
                      {isSignedIn ? 'Ir para o curso' : 'Criar conta gratuita'}
                    </Link>
                    <Link
                      to={courseHref}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white/76 transition-all hover:border-white/20 hover:text-white"
                    >
                      Ver todas as aulas do curso
                    </Link>
                  </div>
                  {course.creatorHandle && (
                    <p className="mt-4 text-xs text-white/48">
                      Mais cursos e artigos do professor:{' '}
                      <Link
                        to={`/${course.creatorHandle}`}
                        className="font-semibold text-[#F2BD8A] hover:underline"
                      >
                        {course.creatorName}
                      </Link>
                    </p>
                  )}
                </section>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 self-start">
              <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                  Aulas do curso
                </p>
                <ul className="mt-4 space-y-1">
                  {siblingLessons.map((l, i) => {
                    const href = l.slug
                      ? `/cursos/${courseSlug}/${l.slug}`
                      : `/cursos/${courseSlug}`
                    return (
                      <li key={String(l._id)}>
                        <Link
                          to={href}
                          className={
                            l.isCurrent
                              ? 'flex items-center gap-3 rounded-xl border border-[#F37E20]/24 bg-[#F37E20]/10 px-3 py-2.5'
                              : 'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]'
                          }
                        >
                          <span
                            className={
                              l.isCurrent
                                ? 'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F37E20] text-[10px] font-bold text-white'
                                : 'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/14 text-[10px] font-bold text-white/50'
                            }
                          >
                            {i + 1}
                          </span>
                          <span
                            className={
                              l.isCurrent
                                ? 'flex-1 truncate text-sm font-semibold text-[#F2BD8A]'
                                : 'flex-1 truncate text-sm text-white/68'
                            }
                          >
                            {l.title}
                          </span>
                          {l.durationSeconds && (
                            <span className="text-xs text-white/32">
                              {formatSeconds(l.durationSeconds)}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
    </PublicPageShell>
  )
}
