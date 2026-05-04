import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@convex/_generated/api'
import { cn, brandPrimaryButtonClass, brandInputClass } from '@/lib/brand'
import { BotaoSeguir } from '@/components/blog/BotaoSeguir'
import { BotaoDoar } from '@/components/doar/BotaoDoar'
import { SeloVerificado } from '@/components/SeloVerificado'
import { BotaoBuscarPerfil } from '@/components/dashboard/BotaoBuscarPerfil'
import { useBreadcrumbJsonLd, useJsonLd, useSeo } from '@/lib/seo'
import { Skeleton } from '@/components/ui/Skeleton'

const PROFILE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5', filled ? 'text-[#F37E20]' : 'text-white/20', className)}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/48">{label}</p>
    </div>
  )
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition-all hover:border-white/14 hover:text-white"
    >
      {icon}
      <span>{label}</span>
    </a>
  )
}

function CourseProgressCard({
  courseTitle,
  percentage,
  certificateIssued,
}: {
  courseTitle: string
  percentage: number
  certificateIssued: boolean
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white leading-snug">{courseTitle}</p>
        {certificateIssued && (
          <span className="flex-shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
            Concluído
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
          <span>Progresso</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[#F37E20] transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function TestimonialCard({
  text,
  authorName,
  authorAvatarUrl,
  authorHandle,
  createdAt,
}: {
  text: string
  authorName: string
  authorAvatarUrl?: string
  authorHandle?: string
  createdAt: number
}) {
  const initials = authorName.slice(0, 2).toUpperCase()
  const date = new Date(createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-center gap-3">
        {authorAvatarUrl ? (
          <img src={authorAvatarUrl} alt={authorName} loading="lazy" decoding="async" className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#F37E20]/16 bg-[#F37E20]/10">
            <span className="text-xs font-semibold text-[#F2BD8A]">{initials}</span>
          </div>
        )}
        <div>
          {authorHandle ? (
            <Link to={`/${authorHandle}`} className="text-sm font-medium text-white hover:text-[#F2BD8A]">
              {authorName}
            </Link>
          ) : (
            <p className="text-sm font-medium text-white">{authorName}</p>
          )}
          <p className="text-xs text-white/36">{date}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  )
}

function RatingSubmit({
  profileHandle,
  myRating,
}: {
  profileHandle: string
  myRating: number | null
}) {
  const [hovered, setHovered] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState<number | null>(null)
  const submitRating = useMutation(api.ratings.submit)

  async function handleRate(stars: number) {
    setLoading(true)
    setError('')
    try {
      await submitRating({ profileHandle, stars })
      setSubmitted(stars)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar avaliação.')
    } finally {
      setLoading(false)
    }
  }

  const displayRating = submitted ?? myRating

  if (displayRating !== null) {
    return (
      <div className="flex items-center gap-1 pt-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <StarIcon key={s} filled={s <= displayRating} />
        ))}
        <span className="ml-2 text-xs text-white/40">Sua avaliação</span>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-sm text-white/52">Avaliar este perfil:</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            disabled={loading}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(s)}
            className="transition-transform hover:scale-110 disabled:opacity-50"
          >
            <StarIcon filled={s <= hovered} />
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  )
}

function TestimonialSubmit({ profileHandle }: { profileHandle: string }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const submitTestimonial = useMutation(api.testimonials.submit)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await submitTestimonial({ profileHandle, text })
      setSuccess(true)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar depoimento.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-[1.4rem] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
        <p className="text-sm font-medium text-emerald-300">Depoimento enviado para aprovação.</p>
        <p className="mt-1 text-xs text-white/42">O dono do perfil precisa aprovar antes de ser exibido.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        className={cn(brandInputClass, 'min-h-[100px] resize-none')}
        placeholder="Escreva um depoimento... (máx. 500 caracteres)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        required
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/28">{text.length}/500</span>
        <button type="submit" disabled={loading || text.trim().length === 0} className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-xs')}>
          {loading ? 'Enviando...' : 'Enviar depoimento'}
        </button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </form>
  )
}

export function PerfilPublicoPage() {
  const { handle } = useParams<{ handle: string }>()
  const { isSignedIn } = useAuth()

  const profile = useQuery(api.publicProfiles.getByHandle, { handle: handle ?? '' })
  const stats = useQuery(
    api.publicProfiles.getPublicStats,
    profile ? { userId: profile.userId } : 'skip'
  )
  const testimonials = useQuery(
    api.testimonials.listApproved,
    profile ? { profileUserId: profile.userId } : 'skip'
  )
  const ratingData = useQuery(
    api.ratings.getAverage,
    profile ? { profileUserId: profile.userId } : 'skip'
  )
  const myRating = useQuery(
    api.ratings.getMyRating,
    profile && isSignedIn ? { profileUserId: profile.userId } : 'skip'
  )
  const articles = useQuery(
    api.posts.listByAuthor,
    profile ? { authorUserId: profile.userId, limit: 50 } : 'skip'
  )
  const courses = useQuery(
    api.publicProfiles.listCoursesByCreator,
    profile ? { authorUserId: profile.userId } : 'skip'
  )
  const spotlight = useQuery(
    api.publicProfiles.getProfileSpotlight,
    profile ? { authorUserId: profile.userId } : 'skip'
  )

  const [activeTab, setActiveTab] = useState<'sobre' | 'cursos' | 'artigos' | 'depoimentos'>('sobre')

  const profileUrl = `${PROFILE_ORIGIN}/${handle ?? ''}`
  const profileTitle = profile
    ? `${profile.name ?? profile.handle ?? 'Perfil'}, Resenha do Teólogo`
    : 'Perfil, Resenha do Teólogo'
  const profileDescription = profile
    ? profile.bio?.slice(0, 200) ??
      `Perfil de ${profile.name} na Resenha do Teólogo. Cursos gratuitos e artigos sobre teologia.`
    : 'Perfil público na Resenha do Teólogo.'

  useSeo({
    title: profileTitle,
    description: profileDescription,
    url: profileUrl,
    image: profile?.avatarUrl ?? null,
    imageAlt: profile ? `Foto de ${profile.name}` : null,
    type: 'website',
    authorName: profile?.name ?? null,
  })

  useBreadcrumbJsonLd(
    profile
      ? [
          { name: 'Início', url: `${PROFILE_ORIGIN}/` },
          { name: profile.name, url: profileUrl },
        ]
      : null,
  )

  useJsonLd(
    profile
      ? (() => {
          const isInstitution = profile.functions.includes('instituicao')
          const sameAs: string[] = []
          if (profile.website) sameAs.push(profile.website)
          if (profile.youtubeChannel) sameAs.push(profile.youtubeChannel)
          if (profile.instagram)
            sameAs.push(`https://instagram.com/${profile.instagram.replace('@', '')}`)
          if (profile.facebook) sameAs.push(profile.facebook)
          if (profile.linkedin) sameAs.push(profile.linkedin)
          if (profile.twitter)
            sameAs.push(`https://twitter.com/${profile.twitter.replace('@', '')}`)

          const base: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': isInstitution ? 'Organization' : 'Person',
            name: profile.name,
            url: profileUrl,
            description: profile.bio ?? undefined,
          }
          if (profile.avatarUrl) base.image = profile.avatarUrl
          if (sameAs.length > 0) base.sameAs = sameAs
          if (!isInstitution && profile.functions.includes('criador')) {
            base.jobTitle = 'Professor de teologia'
            base.affiliation = {
              '@type': 'EducationalOrganization',
              name: 'Resenha do Teólogo',
              url: `${PROFILE_ORIGIN}/`,
            }
          }
          return base
        })()
      : null,
  )

  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-[#0F141A] text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Skeleton variant="dark" className="h-24 w-24" rounded="full" />
            <Skeleton variant="dark" className="h-7 w-56" />
            <Skeleton variant="dark" className="h-4 w-40" />
            <Skeleton variant="dark" className="h-4 w-72" />
            <div className="flex gap-2">
              <Skeleton variant="dark" className="h-9 w-28" rounded="full" />
              <Skeleton variant="dark" className="h-9 w-24" rounded="full" />
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <Skeleton variant="dark" className="h-32 w-full" rounded="xl" />
                <div className="mt-3 space-y-2">
                  <Skeleton variant="dark" className="h-4 w-2/3" />
                  <Skeleton variant="dark" className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (profile === null) {
    return (
      <div className="relative flex min-h-screen flex-col bg-[#0F141A] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-[10%] h-64 w-64 rounded-full bg-[#F37E20]/8 blur-[140px]" />
        </div>
        <header className="relative z-10 border-b border-white/6 px-6 py-4">
          <Link to="/">
            <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
          </Link>
        </header>
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/28 mx-auto">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-white">Perfil não encontrado</h1>
          <p className="mt-3 text-sm text-white/48">O handle <span className="text-white/70">@{handle}</span> não existe ou não está disponível publicamente.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-white/62 transition-all hover:border-white/20 hover:text-white">
            Voltar para o início
          </Link>
        </div>
      </div>
    )
  }

  const initials = profile.name.slice(0, 2).toUpperCase()
  const isCreatorOrInstitution = profile.functions.includes('criador') || profile.functions.includes('instituicao')

  const functionLabels: Record<string, string> = {
    aluno: 'Aluno',
    criador: 'Professor',
    instituicao: 'Instituição',
  }

  const hasSocials = profile.website || profile.youtubeChannel || profile.instagram || profile.facebook || profile.linkedin || profile.twitter
  const hasChurch = profile.denomination || profile.churchName || profile.churchRole || profile.churchInstagram

  return (
    <div className="relative min-h-screen bg-[#0F141A] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[6%] h-72 w-72 rounded-full bg-[#F37E20]/6 blur-[160px]" />
        <div className="absolute right-[6%] top-[20%] h-80 w-80 rounded-full bg-white/3 blur-[160px]" />
      </div>

      <header className="relative z-10 border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <BotaoBuscarPerfil />
          {!isSignedIn && (
            <Link to="/entrar" className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/62 transition-all hover:border-white/20 hover:text-white">
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6">

        {/* Hero */}
        <div className="text-center">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              loading="eager"
              decoding="async"
              className="mx-auto h-24 w-24 rounded-[1.6rem] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
            />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[1.6rem] border border-[#F37E20]/16 bg-[#F37E20]/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <span className="font-display text-2xl font-bold text-[#F2BD8A]">{initials}</span>
            </div>
          )}

          <h1 className="mt-5 flex items-center justify-center gap-2 font-display text-3xl font-bold text-white">
            <span>{profile.name}</span>
            <SeloVerificado handle={profile.handle} size="lg" />
          </h1>
          {profile.handle && (
            <p className="mt-1 text-sm text-white/42">@{profile.handle}</p>
          )}

          {profile.functions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {profile.functions.map((fn) => (
                <span
                  key={fn}
                  className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/10 px-3 py-1 text-xs font-semibold text-[#F2BD8A]"
                >
                  {functionLabels[fn] ?? fn}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <BotaoSeguir authorUserId={profile.userId} authorName={profile.name} tone="dark" />
            <BotaoDoar tone="dark" variant="inline" />
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/72">
            <svg className="h-3.5 w-3.5 text-[#F2BD8A]" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span className="font-semibold text-white">
              {(profile.followerCount ?? 0).toLocaleString('pt-BR')}
            </span>
            <span className="text-white/56">
              {profile.followerCount === 1 ? 'seguidor' : 'seguidores'}
            </span>
          </div>
        </div>

        {/* Tabs Sobre / Cursos / Artigos */}
        <div className="mt-8 flex justify-center gap-2 text-sm">
          {([
            { id: 'sobre', label: 'Sobre' },
            { id: 'cursos', label: `Cursos${courses ? ` (${courses.length})` : ''}` },
            { id: 'artigos', label: `Artigos${articles ? ` (${articles.length})` : ''}` },
            { id: 'depoimentos', label: `Depoimentos${testimonials ? ` (${testimonials.length})` : ''}` },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 font-semibold transition-all',
                activeTab === tab.id
                  ? 'border-[#F37E20]/40 bg-[#F37E20]/15 text-[#F2BD8A]'
                  : 'border-white/8 bg-white/[0.025] text-white/64 hover:border-white/16 hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sobre */}
        {activeTab === 'sobre' && (
          <>
            {profile.bio && (
              <div className="mt-8">
                <p className="text-sm leading-7 text-white/62">{profile.bio}</p>
              </div>
            )}

            {/* Spotlight: artigo top + curso top */}
            {spotlight && (spotlight.topPost || spotlight.topCourse) && (
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {spotlight.topPost && (
                  <Link
                    to={profile.handle ? `/blog/${profile.handle}/${spotlight.topPost.slug}` : '/blog'}
                    className="group block overflow-hidden rounded-[1.4rem] border border-white/7 bg-white/[0.025] transition-all hover:border-[#F37E20]/30 hover:bg-white/[0.04]"
                  >
                    {spotlight.topPost.coverImageUrl ? (
                      <div className="aspect-[16/9] w-full overflow-hidden bg-white/[0.04]">
                        <img
                          src={spotlight.topPost.coverImageUrl}
                          alt={spotlight.topPost.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] w-full items-center justify-center bg-[linear-gradient(135deg,rgba(243,126,32,0.10)_0%,rgba(243,126,32,0.02)_100%)]">
                        <svg className="h-10 w-10 text-white/24" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F2BD8A]">
                        Artigo em destaque
                      </p>
                      <h3 className="mt-2 font-display text-base font-semibold leading-snug text-white group-hover:text-[#F2BD8A]">
                        {spotlight.topPost.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-xs text-white/52">
                        {spotlight.topPost.excerpt}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-white/36">
                        <span>{spotlight.topPost.viewCount.toLocaleString('pt-BR')} leituras</span>
                        <span>· {spotlight.topPost.likeCount.toLocaleString('pt-BR')} curtidas</span>
                      </div>
                    </div>
                  </Link>
                )}
                {spotlight.topCourse && (
                  <Link
                    to={`/cursos/${spotlight.topCourse._id}`}
                    className="group block overflow-hidden rounded-[1.4rem] border border-white/7 bg-white/[0.025] transition-all hover:border-[#F37E20]/30 hover:bg-white/[0.04]"
                  >
                    {spotlight.topCourse.thumbnail ? (
                      <div className="aspect-[16/9] w-full overflow-hidden bg-white/[0.04]">
                        <img
                          src={spotlight.topCourse.thumbnail}
                          alt={spotlight.topCourse.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] w-full items-center justify-center bg-[linear-gradient(135deg,rgba(243,126,32,0.10)_0%,rgba(243,126,32,0.02)_100%)]">
                        <svg className="h-10 w-10 text-white/24" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F2BD8A]">
                        Curso em destaque
                      </p>
                      <h3 className="mt-2 font-display text-base font-semibold leading-snug text-white group-hover:text-[#F2BD8A]">
                        {spotlight.topCourse.title}
                      </h3>
                      {spotlight.topCourse.shortDescription && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-white/52">
                          {spotlight.topCourse.shortDescription}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-white/36">
                        <span>
                          {spotlight.topCourse.totalStudents.toLocaleString('pt-BR')}
                          {' '}
                          {spotlight.topCourse.totalStudents === 1 ? 'aluno' : 'alunos'}
                        </span>
                        <span>· {spotlight.topCourse.totalLessons} aulas</span>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* Cursos */}
        {activeTab === 'cursos' && (
          <div className="mt-8">
            {courses === undefined ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
              </div>
            ) : courses.length === 0 ? (
              <p className="text-center text-sm text-white/48">
                Este criador ainda não publicou cursos.
              </p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={String(course._id)}
                    to={`/cursos/${course._id}`}
                    className="block rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5 transition-all hover:border-[#F37E20]/30 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-4">
                      {course.thumbnail && (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          loading="lazy"
                          decoding="async"
                          className="h-20 w-28 flex-shrink-0 rounded-xl object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F2BD8A]">
                          {course.category}
                        </p>
                        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-white">
                          {course.title}
                        </h3>
                        {course.shortDescription && (
                          <p className="mt-1 line-clamp-2 text-xs text-white/52">
                            {course.shortDescription}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/36">
                          <span>{course.totalLessons} aulas</span>
                          <span>· {course.totalStudents.toLocaleString('pt-BR')} alunos</span>
                          <span>· {course.level}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Artigos */}
        {activeTab === 'artigos' && (
          <div className="mt-8">
            {articles === undefined ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
              </div>
            ) : articles.length === 0 ? (
              <p className="text-center text-sm text-white/48">
                Nenhum artigo publicado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {articles.map((post) => (
                  <Link
                    key={String(post._id)}
                    to={
                      profile.handle
                        ? `/blog/${profile.handle}/${post.slug}`
                        : `/blog`
                    }
                    className="block rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5 transition-all hover:border-[#F37E20]/30 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-4">
                      {post.coverImageUrl && (
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          loading="lazy"
                          decoding="async"
                          className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F2BD8A]">
                          {post.categorySlug.replace(/-/g, ' ')}
                        </p>
                        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-white">
                          {post.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-white/52">{post.excerpt}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/36">
                          <span>
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                          <span>· {post.viewCount.toLocaleString('pt-BR')} leituras</span>
                          <span>· {post.likeCount.toLocaleString('pt-BR')} curtidas</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rating (creators and institutions only) */}
        {isCreatorOrInstitution && ratingData !== undefined && (
          <div className="mt-8 rounded-[1.6rem] border border-white/7 bg-white/[0.025] p-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon key={s} filled={s <= Math.round(ratingData.average)} />
                ))}
              </div>
              <div>
                <span className="text-lg font-bold text-white">
                  {ratingData.count === 0 ? 'Sem avaliações' : ratingData.average.toFixed(1)}
                </span>
                {ratingData.count > 0 && (
                  <span className="ml-2 text-sm text-white/42">({ratingData.count} {ratingData.count === 1 ? 'avaliação' : 'avaliações'})</span>
                )}
              </div>
            </div>
            {isSignedIn && handle && (
              <div className="mt-4 border-t border-white/6 pt-4">
                <RatingSubmit
                  profileHandle={handle}
                  myRating={myRating ?? null}
                />
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {stats !== undefined && stats !== null && (
          <div className="mt-8">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">Progresso na plataforma</p>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Horas assistidas"
                value={`${Math.round(stats.totalWatchSeconds / 3600)}h`}
              />
              <StatCard
                label="Cursos concluídos"
                value={String(stats.totalCoursesCompleted)}
              />
              <StatCard
                label="Certificados"
                value={String(stats.certificateCount)}
              />
            </div>
          </div>
        )}

        {/* Course progress */}
        {stats !== undefined && stats !== null && stats.courses.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">Cursos em andamento</p>
            <div className="space-y-3">
              {stats.courses.map((course) => (
                <CourseProgressCard
                  key={String(course.courseId)}
                  courseTitle={course.courseTitle}
                  percentage={course.percentage}
                  certificateIssued={course.certificateIssued}
                />
              ))}
            </div>
          </div>
        )}

        {/* Social links */}
        {hasSocials && (
          <div className="mt-8">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">Redes sociais</p>
            <div className="flex flex-wrap gap-2">
              {profile.website && (
                <SocialLink
                  href={profile.website}
                  label="Website"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  }
                />
              )}
              {profile.youtubeChannel && (
                <SocialLink
                  href={profile.youtubeChannel}
                  label="YouTube"
                  icon={
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  }
                />
              )}
              {profile.instagram && (
                <SocialLink
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                  label="Instagram"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                    </svg>
                  }
                />
              )}
              {profile.facebook && (
                <SocialLink
                  href={profile.facebook}
                  label="Facebook"
                  icon={
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  }
                />
              )}
              {profile.linkedin && (
                <SocialLink
                  href={profile.linkedin}
                  label="LinkedIn"
                  icon={
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  }
                />
              )}
              {profile.twitter && (
                <SocialLink
                  href={`https://x.com/${profile.twitter.replace('@', '')}`}
                  label="X / Twitter"
                  icon={
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.907-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* Church / Community */}
        {hasChurch && (
          <div className="mt-8 rounded-[1.6rem] border border-white/7 bg-white/[0.025] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">Igreja e comunidade</p>
            <div className="mt-4 space-y-2">
              {profile.churchName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Igreja</span>
                  <span className="text-sm text-white">{profile.churchName}</span>
                </div>
              )}
              {profile.denomination && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Denominação</span>
                  <span className="text-sm text-white">{profile.denomination}</span>
                </div>
              )}
              {profile.churchRole && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Cargo</span>
                  <span className="text-sm text-white">{profile.churchRole}</span>
                </div>
              )}
              {profile.churchInstagram && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Instagram</span>
                  <a
                    href={`https://instagram.com/${profile.churchInstagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white hover:text-[#F2BD8A]"
                  >
                    @{profile.churchInstagram.replace('@', '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {activeTab === 'depoimentos' && (
          <div className="mt-8">
            {testimonials === undefined ? (
              <div className="text-center py-6">
                <div className="h-5 w-5 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin mx-auto" />
              </div>
            ) : testimonials.length === 0 ? (
              <p className="text-sm text-white/36">Nenhum depoimento aprovado ainda.</p>
            ) : (
              <div className="space-y-3">
                {testimonials.map((t) => (
                  <TestimonialCard
                    key={String(t._id)}
                    text={t.text}
                    authorName={t.authorName}
                    authorAvatarUrl={t.authorAvatarUrl}
                    authorHandle={t.authorHandle}
                    createdAt={t.createdAt}
                  />
                ))}
              </div>
            )}

            {isSignedIn && handle && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-white/62">Deixar um depoimento</p>
                <TestimonialSubmit profileHandle={handle} />
              </div>
            )}

            {!isSignedIn && (
              <p className="mt-4 text-sm text-white/36">
                <Link to="/entrar" className="text-[#F2BD8A] hover:underline">Entre na plataforma</Link> para deixar um depoimento.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
