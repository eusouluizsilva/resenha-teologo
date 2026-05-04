import { useMemo, useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '@convex/_generated/api'
import { useCurrentAppUser } from '@/lib/currentUser'
import { cn } from '@/lib/brand'
import { AdSlot } from '@/components/AdSlot'
import { getSessionId } from '@/lib/analytics'
import { useBreadcrumbJsonLd, useJsonLd, useSeo } from '@/lib/seo'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

function levelLabel(level: string) {
  if (level === 'iniciante') return 'Iniciante'
  if (level === 'intermediario') return 'Intermediário'
  return 'Avançado'
}

function levelColor(level: string) {
  if (level === 'iniciante') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  if (level === 'intermediario') return 'text-sky-400 bg-sky-400/10 border-sky-400/20'
  return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
}

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

function ModuleAccordion({
  mod,
  index,
  courseSlug,
}: {
  mod: { title: string; lessons: { _id: string; title: string; slug?: string; durationSeconds?: number; isPublished: boolean }[] }
  index: number
  courseSlug?: string
}) {
  const [open, setOpen] = useState(index === 0)
  const published = mod.lessons.filter((l) => l.isPublished)

  return (
    <div className="border-b border-white/6 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/4 text-[10px] font-bold text-white/50">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-white">{mod.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-white/38">{published.length} aulas</span>
          <svg
            className={cn('h-4 w-4 text-white/40 transition-transform duration-200', open && 'rotate-180')}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="pb-3">
          {published.map((lesson, li) => {
            const canPreview = courseSlug && lesson.slug
            const content = (
              <>
                <svg className="h-4 w-4 flex-shrink-0 text-white/28 group-hover:text-[#F2BD8A]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                </svg>
                <span className="flex-1 text-sm text-white/58 group-hover:text-white">{li + 1}. {lesson.title}</span>
                {lesson.durationSeconds && (
                  <span className="text-xs text-white/32">{formatSeconds(lesson.durationSeconds)}</span>
                )}
              </>
            )
            return canPreview ? (
              <Link
                key={lesson._id}
                to={`/cursos/${courseSlug}/${lesson.slug}`}
                className="group flex items-center gap-3 px-6 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                {content}
              </Link>
            ) : (
              <div key={lesson._id} className="group flex items-center gap-3 px-6 py-2.5">
                {content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CTAButton({
  courseId,
  courseSlug,
  isAuthenticated,
  isAluno,
  isEnrolled,
  isEnrolling,
  onEnroll,
}: {
  courseId: string
  courseSlug?: string
  isAuthenticated: boolean
  isAluno: boolean
  isEnrolled: boolean
  isEnrolling: boolean
  onEnroll: () => void
}) {
  const navigate = useNavigate()
  const courseRef = courseSlug ?? courseId

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <Link
          to={`/cadastro?redirect=/cursos/${courseRef}`}
          className="flex w-full items-center justify-center rounded-2xl bg-[#F37E20] px-6 py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#e06e10]"
        >
          Criar conta para se matricular
        </Link>
        <Link
          to={`/entrar?redirect=/cursos/${courseRef}`}
          className="flex w-full items-center justify-center rounded-2xl border border-white/14 px-6 py-3 text-sm font-semibold text-white/72 transition-all duration-200 hover:border-white/24 hover:text-white"
        >
          Já tenho conta. Entrar
        </Link>
        <p className="text-center text-xs text-white/36">Gratuito. Sem cartão de crédito.</p>
      </div>
    )
  }

  if (!isAluno) {
    return (
      <div className="space-y-3">
        <Link
          to="/dashboard/funcoes"
          className="flex w-full items-center justify-center rounded-2xl bg-[#F37E20] px-6 py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#e06e10]"
        >
          Ativar função Aluno para estudar
        </Link>
        <p className="text-center text-xs text-white/36">Ative a função Aluno no painel e volte para se matricular.</p>
      </div>
    )
  }

  if (isEnrolled) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/dashboard/meus-cursos/${courseRef}`)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-emerald-600"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
        </svg>
        Continuar curso
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onEnroll}
        disabled={isEnrolling}
        className="flex w-full items-center justify-center rounded-2xl bg-[#F37E20] px-6 py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#e06e10] disabled:opacity-60"
      >
        {isEnrolling ? 'Matriculando...' : 'Matricular gratuitamente'}
      </button>
      <p className="text-center text-xs text-white/36">Gratuito. Acesso imediato.</p>
    </div>
  )
}

export function CursoDetalhePage() {
  const { courseId: courseIdOrSlug } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const { hasFunction, isLoading: userLoading } = useCurrentAppUser()

  const course = useQuery(
    api.catalog.getPublicByIdOrSlug,
    courseIdOrSlug ? { idOrSlug: courseIdOrSlug } : 'skip'
  )

  const enrollment = useQuery(
    api.enrollments.isEnrolled,
    user && course ? { courseId: course._id } : 'skip'
  )

  const enroll = useMutation(api.enrollments.enroll)
  const logPageView = useMutation(api.analytics.logPageView)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'
  const courseUrl = course
    ? `${origin}/cursos/${course.slug ?? course._id}`
    : `${origin}/cursos`

  useSeo({
    title: course
      ? `${course.title}, curso de teologia gratuito, Resenha do Teólogo`
      : 'Curso, Resenha do Teólogo',
    description:
      course?.description?.slice(0, 200) ??
      'Curso gratuito de teologia na Resenha do Teólogo.',
    url: courseUrl,
    image: course?.thumbnail ?? null,
    type: 'website',
    authorName: course?.creatorName ?? null,
  })

  const courseJsonLd = useMemo(() => {
    if (!course) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: course.description ?? '',
      url: courseUrl,
      provider: {
        '@type': 'EducationalOrganization',
        name: 'Resenha do Teólogo',
        sameAs: 'https://resenhadoteologo.com',
      },
      ...(course.thumbnail && { image: course.thumbnail }),
      inLanguage: 'pt-BR',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: 0,
        priceCurrency: 'BRL',
        category: 'Free',
        availability: 'https://schema.org/InStock',
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        inLanguage: 'pt-BR',
      },
      educationalLevel: course.level,
      about: course.category,
      author: {
        '@type': 'Person',
        name: course.creatorName,
      },
    }
  }, [course, courseUrl])
  useJsonLd(courseJsonLd)

  useBreadcrumbJsonLd(
    course
      ? [
          { name: 'Início', url: `${origin}/` },
          { name: 'Cursos', url: `${origin}/cursos` },
          { name: course.title, url: courseUrl },
        ]
      : null,
  )

  // FAQ JSON-LD (Schema.org) para SEO. Quando o curso tem perguntas
  // cadastradas, serializamos como FAQPage para Google exibir como rich
  // snippet de "Perguntas frequentes" nos resultados.
  const faqJsonLd = useMemo(() => {
    const faq = (course as { faq?: Array<{ question: string; answer: string }> } | null)?.faq
    if (!faq || faq.length === 0) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer,
        },
      })),
    }
  }, [course])
  useJsonLd(faqJsonLd)

  // Atribui a pageview ao criador (revenue share). Roda uma vez por carga
  // do curso. Falha em silêncio se Convex estiver offline.
  useEffect(() => {
    if (!course) return
    logPageView({
      page: window.location.pathname,
      sessionId: getSessionId(),
      creatorId: course.creatorId,
      courseId: course._id,
    }).catch(() => { /* silencioso */ })
  }, [course, logPageView])

  const isAuthenticated = Boolean(user)
  const isAluno = hasFunction('aluno')
  const isEnrolled = Boolean(enrollment)

  async function handleEnroll() {
    if (!course) return
    setEnrolling(true)
    setEnrollError(null)
    try {
      await enroll({ courseId: course._id })
      navigate(`/dashboard/meus-cursos/${course.slug ?? course._id}?matriculado=1`)
    } catch (e) {
      setEnrollError(e instanceof Error ? e.message : 'Erro ao matricular')
    } finally {
      setEnrolling(false)
    }
  }

  if (course === undefined || userLoading) {
    return (
      <PublicPageShell>
      <div className="min-h-screen bg-[#0F141A]">
        {!user && (
          <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0F141A]/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
              <Link to="/">
                <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
              </Link>
              <Link to="/cursos" className="text-sm text-white/54 hover:text-white transition-colors">Cursos</Link>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-white/8" />
                <div className="h-6 w-24 rounded-full bg-white/8" />
                <div className="h-6 w-16 rounded-full bg-white/8" />
              </div>
              <div className="h-10 w-3/4 rounded-xl bg-white/8" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-white/6" />
                <div className="h-4 w-11/12 rounded bg-white/6" />
                <div className="h-4 w-2/3 rounded bg-white/6" />
              </div>
              <div className="aspect-video w-full rounded-2xl bg-white/8" />
            </div>
            <div>
              <div className="rounded-2xl border border-white/8 bg-[#151B23] p-6 space-y-4">
                <div className="aspect-video w-full rounded-xl bg-white/8" />
                <div className="h-12 w-full rounded-2xl bg-white/8" />
                <div className="h-10 w-full rounded-2xl bg-white/6" />
              </div>
            </div>
          </div>
        </main>
      </div>
      </PublicPageShell>
    )
  }

  if (!course) {
    return (
      <PublicPageShell>
      <div className="min-h-screen bg-[#0F141A] text-white">
        {!user && (
          <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0F141A]/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
              <Link to="/">
                <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
              </Link>
              <Link to="/cursos" className="text-sm text-white/54 hover:text-white transition-colors">Cursos</Link>
            </div>
          </header>
        )}
        <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5 px-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <svg className="h-8 w-8 text-white/50" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Curso não encontrado</h1>
            <p className="mt-2 text-sm leading-7 text-white/56">
              Este curso pode ter sido removido, despublicado ou ainda não está visível para o público.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/cursos"
              className="rounded-2xl bg-[#F37E20] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e06e10] transition-colors"
            >
              Ver catálogo
            </Link>
            <Link
              to="/"
              className="rounded-2xl border border-white/14 px-5 py-3 text-sm font-semibold text-white/72 hover:border-white/24 hover:text-white transition-colors"
            >
              Página inicial
            </Link>
          </div>
        </main>
      </div>
      </PublicPageShell>
    )
  }

  const totalPublishedLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.isPublished).length,
    0
  )
  const totalDuration = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.durationSeconds ?? 0), 0),
    0
  )

  return (
    <PublicPageShell>
    <div className="min-h-screen bg-[#0F141A]">
      {!user && (
        <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0F141A]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link to="/">
              <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
            </Link>
            <nav className="flex items-center gap-3">
              <Link to="/cursos" className="text-sm text-white/54 hover:text-white transition-colors">Cursos</Link>
              <Link to="/entrar" className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white">Entrar</Link>
              <Link to="/cadastro" className="rounded-2xl bg-[#F37E20] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#e06e10]">Criar conta</Link>
            </nav>
          </div>
        </header>
      )}

      {/* Breadcrumb */}
      <div className="border-b border-white/4 bg-[#0F141A]">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-2 text-xs text-white/36">
            <Link to="/cursos" className="hover:text-white/60 transition-colors">Cursos</Link>
            <span>/</span>
            <span className="text-white/54 line-clamp-1">{course.title}</span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">

          {/* Coluna principal */}
          <div className="space-y-8">
            {/* Hero */}
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', levelColor(course.level))}>
                  {levelLabel(course.level)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold text-white/52">
                  {course.category}
                </span>
                <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold text-[#F2BD8A]">
                  Gratuito
                </span>
              </div>

              <h1 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                {course.title}
              </h1>
              <p className="mt-4 text-base leading-8 text-white/60">{course.description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/46">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  {course.totalModules} módulos
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                  </svg>
                  {totalPublishedLessons} aulas
                </span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatSeconds(totalDuration)} de conteúdo
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  {course.totalStudents} alunos
                </span>
              </div>
            </div>

            {/* Thumbnail */}
            {course.thumbnail && (
              <div className="overflow-hidden rounded-2xl border border-white/8">
                <img src={course.thumbnail} alt={course.title} loading="eager" decoding="async" fetchPriority="high" className="w-full aspect-video object-cover" />
              </div>
            )}

            {/* Certificado */}
            <div className="rounded-2xl border border-[#F37E20]/16 bg-[#F37E20]/6 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#F37E20]/20 bg-[#F37E20]/10 text-[#F37E20]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Certificado de conclusão</p>
                  <p className="mt-1 text-sm text-white/54">
                    Conclua todas as aulas e obtenha média mínima de 70% nos quizzes para receber seu certificado.
                  </p>
                </div>
              </div>
            </div>

            {/* Estrutura do curso */}
            <div>
              <h2 className="mb-4 font-display text-xl font-bold text-white">Estrutura do curso</h2>
              <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#151B23]">
                {course.modules.map((mod, i) => (
                  <ModuleAccordion key={mod._id} mod={mod} index={i} courseSlug={course.slug} />
                ))}
              </div>
            </div>

            {/* Criador */}
            <div className="rounded-2xl border border-white/8 bg-[#151B23] p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/36">Professor do curso</p>
              <div className="flex items-center gap-4">
                {course.creatorAvatarUrl ? (
                  <img src={course.creatorAvatarUrl} alt={course.creatorName} loading="lazy" decoding="async" className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/16 bg-[#F37E20]/10">
                    <span className="text-lg font-bold text-[#F2BD8A]">{course.creatorName.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{course.creatorName}</p>
                  {course.creatorBio && (
                    <p className="mt-1 text-sm leading-6 text-white/48 line-clamp-2">{course.creatorBio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* FAQ do curso (acordeon) */}
            {(() => {
              const faq = (course as { faq?: Array<{ question: string; answer: string }> }).faq
              if (!faq || faq.length === 0) return null
              return (
                <div className="rounded-2xl border border-white/8 bg-[#151B23] p-6">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/36">
                    Perguntas frequentes
                  </p>
                  <div className="space-y-3">
                    {faq.map((entry, i) => (
                      <details
                        key={i}
                        className="group rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 transition-all open:border-[#F37E20]/24 open:bg-[#F37E20]/5"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
                          <span>{entry.question}</span>
                          <svg
                            className="h-4 w-4 flex-shrink-0 text-white/52 transition-transform group-open:rotate-180"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </summary>
                        <p className="mt-3 text-sm leading-7 text-white/64">{entry.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Coluna lateral — CTA sticky */}
          <div>
            <div className="sticky top-20 rounded-2xl border border-white/10 bg-[#151B23] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
              {course.thumbnail && (
                <div className="mb-5 overflow-hidden rounded-xl border border-white/8">
                  <img src={course.thumbnail} alt={course.title} loading="lazy" decoding="async" className="w-full aspect-video object-cover" />
                </div>
              )}

              <div className="mb-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.58 3.737 3.745 3.745 0 01-3.596 1.436 3.745 3.745 0 01-2.807 1.324 3.745 3.745 0 01-2.807-1.324 3.745 3.745 0 01-3.597-1.436 3.745 3.745 0 01-.58-3.737A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.58-3.737 3.745 3.745 0 013.597-1.436 3.745 3.745 0 012.807-1.324 3.745 3.745 0 012.807 1.324 3.745 3.745 0 013.596 1.436 3.745 3.745 0 01.58 3.737A3.745 3.745 0 0121 12z" />
                  </svg>
                  <span className="text-sm text-white/72">Acesso completo e gratuito</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.58 3.737 3.745 3.745 0 01-3.596 1.436 3.745 3.745 0 01-2.807 1.324 3.745 3.745 0 01-2.807-1.324 3.745 3.745 0 01-3.597-1.436 3.745 3.745 0 01-.58-3.737A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.58-3.737 3.745 3.745 0 013.597-1.436 3.745 3.745 0 012.807-1.324 3.745 3.745 0 012.807 1.324 3.745 3.745 0 013.596 1.436 3.745 3.745 0 01.58 3.737A3.745 3.745 0 0121 12z" />
                  </svg>
                  <span className="text-sm text-white/72">{totalPublishedLessons} aulas em {course.totalModules} módulos</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.58 3.737 3.745 3.745 0 01-3.596 1.436 3.745 3.745 0 01-2.807 1.324 3.745 3.745 0 01-2.807-1.324 3.745 3.745 0 01-3.597-1.436 3.745 3.745 0 01-.58-3.737A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.58-3.737 3.745 3.745 0 013.597-1.436 3.745 3.745 0 012.807-1.324 3.745 3.745 0 012.807 1.324 3.745 3.745 0 013.596 1.436 3.745 3.745 0 01.58 3.737A3.745 3.745 0 0121 12z" />
                  </svg>
                  <span className="text-sm text-white/72">Certificado de conclusão</span>
                </div>
              </div>

              {enrollError && (
                <div className="mb-4 rounded-xl border border-red-400/18 bg-red-400/8 px-4 py-3 text-sm text-red-300">
                  {enrollError}
                </div>
              )}

              <CTAButton
                courseId={course._id}
                courseSlug={course.slug}
                isAuthenticated={isAuthenticated}
                isAluno={isAluno}
                isEnrolled={isEnrolled}
                isEnrolling={enrolling}
                onEnroll={handleEnroll}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto my-10 max-w-3xl px-6">
          <AdSlot
            slotId="course-detail-footer"
            creatorId={course.creatorId}
            courseId={course._id}
            responsive
          />
        </div>
      </main>
    </div>
    </PublicPageShell>
  )
}
