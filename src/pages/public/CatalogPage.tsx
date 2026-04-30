import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '../../../convex/_generated/api'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'
import { AdSlot } from '@/components/AdSlot'
import { useBreadcrumbJsonLd, useJsonLd, useSeo } from '@/lib/seo'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

function normalizeSearch(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

const CATEGORIES = ['Teologia Sistematica', 'Historia Biblica', 'Hermeneutica', 'Apologetica', 'Etica Crista', 'Novo Testamento', 'Antigo Testamento']
const LEVELS = [
  { value: 'iniciante' as const, label: 'Iniciante' },
  { value: 'intermediario' as const, label: 'Intermediário' },
  { value: 'avancado' as const, label: 'Avançado' },
]
const LANGUAGES = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano', 'Grego', 'Hebraico', 'Latim']

function levelTone(level: string): 'success' | 'info' | 'accent' {
  if (level === 'iniciante') return 'success'
  if (level === 'intermediario') return 'info'
  return 'accent'
}

function levelLabel(level: string) {
  const found = LEVELS.find((l) => l.value === level)
  return found?.label ?? level
}

type CatalogCourse = {
  _id: string
  title: string
  description: string
  thumbnail?: string | null
  category: string
  level: string
  language?: string
  creatorName: string
  totalLessons: number
  totalStudents?: number
  avgRating: number | null
  ratingsCount: number
  releaseStatus?: 'in_progress' | 'complete'
  expectedTotalLessons?: number
}

function CourseCard({ course }: { course: CatalogCourse }) {
  const thumb = course.thumbnail ?? null

  return (
    <Link
      to={`/cursos/${course._id}`}
      className={cn(
        'group flex flex-col overflow-hidden transition-all duration-200 hover:border-white/14 hover:shadow-[0_32px_80px_rgba(0,0,0,0.35)]',
        brandPanelClass,
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#111820]">
        {thumb ? (
          <img src={thumb} alt={course.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-white/14" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
            </svg>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/10 bg-[#0F141A]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm">
            Gratuito
          </span>
          {course.releaseStatus === 'in_progress' ? (
            <span className="rounded-full border border-[#F37E20]/30 bg-[#F37E20]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F2BD8A] backdrop-blur-sm">
              Em produção
              {course.expectedTotalLessons
                ? ` • ${course.totalLessons}/${course.expectedTotalLessons}`
                : ''}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={brandStatusPillClass(levelTone(course.level))}>{levelLabel(course.level)}</span>
          <span className={brandStatusPillClass('neutral')}>{course.category}</span>
          {course.language && course.language !== 'Português' ? (
            <span className={brandStatusPillClass('neutral')}>{course.language}</span>
          ) : null}
        </div>

        <h3 className="font-display text-base font-semibold leading-snug text-white group-hover:text-[#F2BD8A] transition-colors duration-200">
          {course.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/48">
          {course.description}
        </p>

        <div className="mt-4 border-t border-white/6 pt-4 space-y-3">
          {/* Criador e aulas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/42">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <span className="text-xs text-white/42">{course.creatorName}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-white/34">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              {course.totalLessons} aulas
            </div>
          </div>

          {/* Inscritos e avaliações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-white/34">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span>{(course.totalStudents ?? 0).toLocaleString('pt-BR')} inscritos</span>
            </div>

            {course.avgRating !== null && course.ratingsCount > 0 ? (
              <div className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-[#F37E20]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z" />
                </svg>
                <span className="text-xs font-semibold text-[#F2BD8A]">{course.avgRating}</span>
                <span className="text-xs text-white/28">({course.ratingsCount})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-white/16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z" />
                </svg>
                <span className="text-xs text-white/24">Sem avaliações</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export function CatalogPage() {
  const { isSignedIn } = useAuth()
  const [params, setParams] = useSearchParams()
  const activeCategory = params.get('categoria') || undefined
  const levelParam = params.get('nivel')
  const activeLevel: 'iniciante' | 'intermediario' | 'avancado' | undefined =
    levelParam === 'iniciante' || levelParam === 'intermediario' || levelParam === 'avancado'
      ? levelParam
      : undefined
  const activeLanguage = params.get('idioma') || undefined
  const searchTerm = params.get('q') ?? ''

  function updateParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (!value) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }
  const setSearchTerm = (v: string) => updateParam('q', v || undefined)
  const setActiveCategory = (v: string | undefined) => updateParam('categoria', v)
  const setActiveLevel = (v: 'iniciante' | 'intermediario' | 'avancado' | undefined) =>
    updateParam('nivel', v)
  const setActiveLanguage = (v: string | undefined) => updateParam('idioma', v)

  const courses = useQuery(api.catalog.listPublished, {
    category: activeCategory,
    level: activeLevel,
    language: activeLanguage,
  })

  const isLoading = courses === undefined

  const filteredCourses = useMemo(() => {
    if (!courses) return courses
    const q = normalizeSearch(searchTerm)
    if (!q) return courses
    return courses.filter((c) => {
      const haystack = normalizeSearch(
        `${c.title ?? ''} ${c.description ?? ''} ${c.creatorName ?? ''} ${c.category ?? ''}`,
      )
      return haystack.includes(q)
    })
  }, [courses, searchTerm])

  const canonicalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/cursos`
      : 'https://resenhadoteologo.com/cursos'

  useSeo({
    title: 'Catálogo de cursos de teologia, gratuito, Resenha do Teólogo',
    description:
      'Catálogo gratuito de cursos de teologia, hermenêutica, apologética e estudos bíblicos. Conteúdo de criadores e instituições, no seu ritmo, com certificado.',
    url: canonicalUrl,
    type: 'website',
  })

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'

  useBreadcrumbJsonLd([
    { name: 'Início', url: `${origin}/` },
    { name: 'Cursos', url: `${origin}/cursos` },
  ])

  const itemListJsonLd = useMemo(() => {
    if (!filteredCourses || filteredCourses.length === 0) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Cursos de teologia',
      itemListElement: filteredCourses.slice(0, 30).map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/cursos/${c._id}`,
        name: c.title,
      })),
    }
  }, [filteredCourses, origin])
  useJsonLd(itemListJsonLd)

  return (
    <PublicPageShell>
    <div className="min-h-screen bg-[#0F141A]">
      {!isSignedIn && (
        <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0F141A]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link to="/">
              <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/entrar"
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:border-white/20 hover:text-white"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="rounded-2xl bg-[#F37E20] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#e06e10]"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Cabecalho */}
        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">Catálogo</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-white md:text-4xl">Cursos de teologia</h1>
          <p className="mt-3 text-sm leading-7 text-white/54">
            Todos os cursos são gratuitos. Escolha uma trilha, estude no seu ritmo e receba certificado ao concluir.
          </p>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/32" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, criador, categoria"
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/32 outline-none transition-colors focus:border-[#F37E20]/40 focus:bg-white/[0.05]"
              aria-label="Buscar cursos"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
                aria-label="Limpar busca"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveLevel(undefined)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200',
                !activeLevel
                  ? 'border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F2BD8A]'
                  : 'border-white/8 text-white/48 hover:border-white/16 hover:text-white/70',
              )}
            >
              Todos os níveis
            </button>
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setActiveLevel(activeLevel === l.value ? undefined : l.value)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200',
                  activeLevel === l.value
                    ? 'border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F2BD8A]'
                    : 'border-white/8 text-white/48 hover:border-white/16 hover:text-white/70',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(undefined)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200',
                !activeCategory
                  ? 'border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F2BD8A]'
                  : 'border-white/8 text-white/48 hover:border-white/16 hover:text-white/70',
              )}
            >
              Todas as categorias
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? undefined : cat)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200',
                  activeCategory === cat
                    ? 'border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F2BD8A]'
                    : 'border-white/8 text-white/48 hover:border-white/16 hover:text-white/70',
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveLanguage(undefined)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200',
                !activeLanguage
                  ? 'border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F2BD8A]'
                  : 'border-white/8 text-white/48 hover:border-white/16 hover:text-white/70',
              )}
            >
              Todos os idiomas
            </button>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(activeLanguage === lang ? undefined : lang)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200',
                  activeLanguage === lang
                    ? 'border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F2BD8A]'
                    : 'border-white/8 text-white/48 hover:border-white/16 hover:text-white/70',
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn('animate-pulse overflow-hidden', brandPanelClass)}>
                <div className="aspect-video w-full bg-white/6" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-24 rounded-full bg-white/8" />
                  <div className="h-5 w-3/4 rounded-lg bg-white/8" />
                  <div className="h-4 w-full rounded-lg bg-white/6" />
                  <div className="h-4 w-2/3 rounded-lg bg-white/6" />
                </div>
              </div>
            ))}
          </div>
        ) : !filteredCourses || filteredCourses.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base text-white/42">
              {searchTerm
                ? `Nenhum curso encontrado para "${searchTerm}".`
                : 'Nenhum curso encontrado para os filtros selecionados.'}
            </p>
            <button
              onClick={() => { setActiveCategory(undefined); setActiveLevel(undefined); setActiveLanguage(undefined); setSearchTerm('') }}
              className="mt-4 text-sm font-medium text-[#F2BD8A] underline underline-offset-4 hover:text-[#F37E20]"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </main>

      <div className="mx-auto my-8 max-w-3xl px-6">
        <AdSlot slotId="catalog-footer" responsive />
      </div>

      <footer className="border-t border-white/6 py-8 text-center">
        <p className="text-xs text-white/28">Resenha do Teólogo. Todos os direitos reservados.</p>
      </footer>
    </div>
    </PublicPageShell>
  )
}
