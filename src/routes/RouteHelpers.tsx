// Helpers reutilizados pelo App.tsx: spinners de fallback, gating por função
// (RequireFunction), index do dashboard que decide qual painel mostrar e o
// tracker de pageview. Mantidos fora de App.tsx pra deixar o arquivo de rotas
// focado em mapeamento path → component.

import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { useCurrentAppUser } from '@/lib/currentUser'
import { trackPageView, getSessionId } from '@/lib/analytics'
import { trackMetaPageView } from '@/lib/metaPixel'
import { detectDevice } from '@/lib/device'
import type { UserFunction } from '@/lib/functions'
import { VisaoGeralPage, AlunoDashboardPage, InstituicaoDashboardPage } from './lazyPages'

export function DashboardRouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
    </div>
  )
}

export function EmConstrucao({
  title = 'Área em construção',
  description = 'Esta seção ainda está sendo refinada.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-4xl">
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 19.5h16.5M4.5 16.5l1.256-7.287A2.25 2.25 0 017.973 7.5h8.054a2.25 2.25 0 012.217 1.713L19.5 16.5M9 11.25h6" />
            </svg>
          }
          title={title}
          description={description}
        />
      </div>
    </div>
  )
}

export function RequireFunction({
  allowed,
  children,
}: {
  allowed: UserFunction[]
  children: ReactNode
}) {
  const { user } = useUser()
  const { hasFunction, isLoading } = useCurrentAppUser()

  if (!user || isLoading) return <DashboardRouteLoader />

  const permitted = allowed.some((fn) => hasFunction(fn))
  if (!permitted) {
    return (
      <EmConstrucao
        title="Acesso não disponível"
        description="Esta área requer uma função que você ainda não ativou. Acesse Configurações para ativar."
      />
    )
  }

  return <>{children}</>
}

export function DashboardIndexPage() {
  const { user } = useUser()
  const { hasFunction, isLoading } = useCurrentAppUser()

  if (!user || isLoading) return <DashboardRouteLoader />

  if (hasFunction('criador')) return <VisaoGeralPage />
  if (hasFunction('aluno')) return <AlunoDashboardPage />
  if (hasFunction('instituicao')) return <InstituicaoDashboardPage />

  return (
    <DashboardPageShell
      eyebrow="Primeiros passos"
      title="Como você vai usar a plataforma?"
      description="Ative pelo menos uma função para desbloquear o menu e acessar seus recursos."
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        {[
          {
            title: 'Aluno',
            description: 'Acesse cursos, acompanhe progresso e receba certificados.',
            href: '/dashboard/funcoes',
          },
          {
            title: 'Professor',
            description: 'Publique cursos, organize módulos e acompanhe sua audiência.',
            href: '/dashboard/funcoes',
          },
          {
            title: 'Igreja ou instituição',
            description: 'Gerencie membros e acompanhe a formação da sua comunidade.',
            href: '/dashboard/funcoes',
          },
        ].map((item) => (
          <Link
            key={item.title}
            to={item.href}
            className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/7 bg-white/[0.025] p-5 transition-all hover:border-[#F37E20]/18 hover:bg-[#F37E20]/6"
          >
            <div>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-0.5 text-sm text-white/48">{item.description}</p>
            </div>
            <svg className="h-5 w-5 flex-shrink-0 text-white/28" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
        <p className="pt-2 text-center text-xs text-white/36">
          Você pode ativar mais de uma função e alterar isso a qualquer momento em{' '}
          <Link to="/dashboard/funcoes" className="text-[#F2BD8A] hover:underline">Configurações</Link>.
        </p>
      </div>
    </DashboardPageShell>
  )
}

// Dispara pageview no GA4, no Meta Pixel e no Convex (analytics interno) a cada
// navegação SPA. A atribuição por criador (CourseDetailPage, AulaPage) é feita
// dentro dessas páginas com creatorId/courseId/lessonId. Aqui cobrimos só
// path/referrer/device para o dashboard admin global. logPageView falha
// silenciosamente se Convex estiver offline.
export function RouteTracker() {
  const location = useLocation()
  const logPageView = useMutation(api.analytics.logPageView)
  useEffect(() => {
    const path = location.pathname + location.search
    trackPageView({ path })
    trackMetaPageView()
    logPageView({
      page: path,
      sessionId: getSessionId(),
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      device: detectDevice(),
    }).catch((err) => {
      console.warn('[analytics] logPageView falhou', err)
    })
  }, [location.pathname, location.search, logPageView])
  return null
}

export function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F141A]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
    </div>
  )
}
