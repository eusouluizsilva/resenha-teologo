import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { AnimatePresence } from 'framer-motion'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { CookieBanner } from '@/components/CookieBanner'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { PWAUpdateNotification } from '@/components/PWAUpdateNotification'
import { useCurrentAppUser } from '@/lib/currentUser'
import { trackPageView, getSessionId } from '@/lib/analytics'
import { trackMetaPageView } from '@/lib/metaPixel'
import { detectDevice } from '@/lib/device'
import { api } from '../convex/_generated/api'
import type { UserFunction } from '@/lib/functions'

// Code-splitting: rotas secundárias viram chunks sob demanda para manter o
// JS inicial enxuto. A LandingPage fica no bundle principal porque é o primeiro
// impacto de quem cai no domínio.
const SignInPage = lazy(() =>
  import('@/pages/SignInPage').then((m) => ({ default: m.SignInPage })),
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const SSOCallbackPage = lazy(() =>
  import('@/pages/auth/SSOCallbackPage').then((m) => ({ default: m.SSOCallbackPage })),
)
const VisaoGeralPage = lazy(() =>
  import('@/pages/dashboard/criador/VisaoGeralPage').then((m) => ({ default: m.VisaoGeralPage })),
)
const CursosPage = lazy(() =>
  import('@/pages/dashboard/criador/CursosPage').then((m) => ({ default: m.CursosPage })),
)
const NovoCursoPage = lazy(() =>
  import('@/pages/dashboard/criador/NovoCursoPage').then((m) => ({ default: m.NovoCursoPage })),
)
const EditarCursoPage = lazy(() =>
  import('@/pages/dashboard/criador/EditarCursoPage').then((m) => ({ default: m.EditarCursoPage })),
)
const EditarInfoCursoPage = lazy(() =>
  import('@/pages/dashboard/criador/EditarInfoCursoPage').then((m) => ({
    default: m.EditarInfoCursoPage,
  })),
)
const EditarAulaPage = lazy(() =>
  import('@/pages/dashboard/criador/EditarAulaPage').then((m) => ({ default: m.EditarAulaPage })),
)
const FinanceiroPage = lazy(() =>
  import('@/pages/dashboard/criador/FinanceiroPage').then((m) => ({ default: m.FinanceiroPage })),
)
const AlunosPage = lazy(() =>
  import('@/pages/dashboard/criador/AlunosPage').then((m) => ({ default: m.AlunosPage })),
)
const PerguntasPage = lazy(() =>
  import('@/pages/dashboard/criador/PerguntasPage'),
)
const AdminPage = lazy(() =>
  import('@/pages/dashboard/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
)
const NotificacoesAdminPage = lazy(() =>
  import('@/pages/dashboard/admin/NotificacoesAdminPage').then((m) => ({
    default: m.NotificacoesAdminPage,
  })),
)
const CursosAdminPage = lazy(() =>
  import('@/pages/dashboard/admin/CursosAdminPage').then((m) => ({
    default: m.CursosAdminPage,
  })),
)
const ComentariosAdminPage = lazy(() =>
  import('@/pages/dashboard/admin/ComentariosAdminPage').then((m) => ({
    default: m.ComentariosAdminPage,
  })),
)
const PerfilPage = lazy(() =>
  import('@/pages/dashboard/criador/PerfilPage').then((m) => ({ default: m.PerfilPage })),
)
const PrivacidadePage = lazy(() =>
  import('@/pages/legal/LegalPages').then((m) => ({ default: m.PrivacidadePage })),
)
const TermosPage = lazy(() =>
  import('@/pages/legal/LegalPages').then((m) => ({ default: m.TermosPage })),
)
const MeusCursosPage = lazy(() =>
  import('@/pages/dashboard/aluno/MeusCursosPage').then((m) => ({ default: m.MeusCursosPage })),
)
const CertificadosPage = lazy(() =>
  import('@/pages/dashboard/aluno/CertificadosPage').then((m) => ({
    default: m.CertificadosPage,
  })),
)
const ComoConseguirCertificadoPage = lazy(() =>
  import('@/pages/dashboard/aluno/ComoConseguirCertificadoPage').then((m) => ({
    default: m.ComoConseguirCertificadoPage,
  })),
)
const CadernoPage = lazy(() =>
  import('@/pages/dashboard/aluno/CadernoPage').then((m) => ({ default: m.CadernoPage })),
)
const FlashcardsPage = lazy(() =>
  import('@/pages/dashboard/aluno/FlashcardsPage').then((m) => ({ default: m.FlashcardsPage })),
)
const BibliaPage = lazy(() => import('@/pages/dashboard/aluno/BibliaPage'))
const CursoInternoPage = lazy(() =>
  import('@/pages/dashboard/aluno/CursoInternoPage').then((m) => ({
    default: m.CursoInternoPage,
  })),
)
const AulaPage = lazy(() =>
  import('@/pages/dashboard/aluno/AulaPage').then((m) => ({ default: m.AulaPage })),
)
const CatalogPage = lazy(() =>
  import('@/pages/public/CatalogPage').then((m) => ({ default: m.CatalogPage })),
)
const AlunoDashboardPage = lazy(() =>
  import('@/pages/dashboard/aluno/AlunoDashboardPage').then((m) => ({
    default: m.AlunoDashboardPage,
  })),
)
const CourseDetailPage = lazy(() =>
  import('@/pages/public/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })),
)
const LessonPreviewPage = lazy(() =>
  import('@/pages/public/LessonPreviewPage').then((m) => ({ default: m.LessonPreviewPage })),
)
const PublicBibliaPage = lazy(() =>
  import('@/pages/public/BibliaPage').then((m) => ({ default: m.BibliaPage })),
)
const SupportPage = lazy(() =>
  import('@/pages/public/SupportPage').then((m) => ({ default: m.SupportPage })),
)
const ContactPage = lazy(() =>
  import('@/pages/public/ContactPage').then((m) => ({ default: m.ContactPage })),
)
const PlanosPage = lazy(() =>
  import('@/pages/dashboard/PlanosPage').then((m) => ({ default: m.PlanosPage })),
)
const FuncoesPage = lazy(() =>
  import('@/pages/dashboard/FuncoesPage').then((m) => ({ default: m.FuncoesPage })),
)
const PublicProfilePage = lazy(() =>
  import('@/pages/public/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })),
)
const VerifyCertificatePage = lazy(() =>
  import('@/pages/public/VerifyCertificatePage').then((m) => ({
    default: m.VerifyCertificatePage,
  })),
)
const AcceptInvitePage = lazy(() =>
  import('@/pages/public/AcceptInvitePage').then((m) => ({
    default: m.AcceptInvitePage,
  })),
)
const MembrosPage = lazy(() =>
  import('@/pages/dashboard/instituicao/MembrosPage').then((m) => ({
    default: m.MembrosPage,
  })),
)
const InstituicaoDashboardPage = lazy(() =>
  import('@/pages/dashboard/instituicao/InstituicaoDashboardPage').then((m) => ({
    default: m.InstituicaoDashboardPage,
  })),
)
const CursosInstituicaoPage = lazy(() =>
  import('@/pages/dashboard/instituicao/CursosInstituicaoPage').then((m) => ({
    default: m.CursosInstituicaoPage,
  })),
)
const RelatoriosPage = lazy(() =>
  import('@/pages/dashboard/instituicao/RelatoriosPage').then((m) => ({
    default: m.RelatoriosPage,
  })),
)
const SobrePage = lazy(() =>
  import('@/pages/public/SobrePage').then((m) => ({ default: m.SobrePage })),
)
const LojaPage = lazy(() =>
  import('@/pages/public/LojaPage').then((m) => ({ default: m.LojaPage })),
)
const ProdutoPage = lazy(() =>
  import('@/pages/public/ProdutoPage').then((m) => ({ default: m.ProdutoPage })),
)
const MinhaLojaPage = lazy(() =>
  import('@/pages/dashboard/criador/MinhaLojaPage').then((m) => ({
    default: m.MinhaLojaPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const BlogIndexPage = lazy(() =>
  import('@/pages/public/blog/BlogIndexPage').then((m) => ({ default: m.BlogIndexPage })),
)
const BlogCategoryPage = lazy(() =>
  import('@/pages/public/blog/BlogCategoryPage').then((m) => ({ default: m.BlogCategoryPage })),
)
const BlogPostPage = lazy(() =>
  import('@/pages/public/blog/BlogPostPage').then((m) => ({ default: m.BlogPostPage })),
)
const MeuBlogPage = lazy(() =>
  import('@/pages/dashboard/blog/MeuBlogPage').then((m) => ({ default: m.MeuBlogPage })),
)
const NovoArtigoPage = lazy(() =>
  import('@/pages/dashboard/blog/NovoArtigoPage').then((m) => ({ default: m.NovoArtigoPage })),
)
const EditarArtigoPage = lazy(() =>
  import('@/pages/dashboard/blog/EditarArtigoPage').then((m) => ({ default: m.EditarArtigoPage })),
)

function DashboardRouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
    </div>
  )
}

function EmConstrucao({
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

function RequireFunction({
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

function DashboardIndexPage() {
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

// Dispara pageview no GA4, no Meta Pixel e no Convex (analytics interno) a
// cada navegação SPA. A atribuição por criador (CourseDetailPage, AulaPage) é
// feita dentro dessas páginas com creatorId/courseId/lessonId. Aqui cobrimos
// só path/referrer/device para o dashboard admin global. logPageView falha
// silenciosamente se Convex estiver offline.
function RouteTracker() {
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
    }).catch(() => { /* silencioso */ })
  }, [location.pathname, location.search, logPageView])
  return null
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F141A]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <CookieBanner />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/cursos" element={<CatalogPage />} />
          <Route path="/cursos/:courseId" element={<CourseDetailPage />} />
          <Route path="/cursos/:courseSlug/:lessonSlug" element={<LessonPreviewPage />} />
          <Route path="/biblia" element={<PublicBibliaPage />} />
          <Route path="/apoie" element={<SupportPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="/verificar/:code" element={<VerifyCertificatePage />} />
          <Route path="/convite/:token" element={<AcceptInvitePage />} />
          <Route path="/sobre" element={<SobrePage />} />
          <Route path="/loja" element={<LojaPage />} />
          <Route path="/loja/:slug" element={<ProdutoPage />} />

          {/* Blog público (precisa vir antes de /:handle, que é catch-all) */}
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/categoria/:categorySlug" element={<BlogCategoryPage />} />
          <Route path="/blog/:handle/:postSlug" element={<BlogPostPage />} />

          <Route path="/:handle" element={<PublicProfilePage />} />

          {/* Autenticação */}
          <Route path="/entrar" element={<SignInPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/cadastro/aluno" element={<Navigate to="/cadastro" replace />} />
          <Route path="/cadastro/criador" element={<Navigate to="/cadastro" replace />} />
          <Route path="/cadastro/instituicao" element={<Navigate to="/cadastro" replace />} />
          <Route path="/sso-callback" element={<SSOCallbackPage />} />
          <Route path="/termos" element={<TermosPage />} />
          <Route path="/privacidade" element={<PrivacidadePage />} />

          {/* Dashboard unificado */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardIndexPage />} />

            {/* Criador */}
            <Route path="cursos" element={<RequireFunction allowed={['criador']}><CursosPage /></RequireFunction>} />
            <Route path="cursos/novo" element={<RequireFunction allowed={['criador']}><NovoCursoPage /></RequireFunction>} />
            <Route path="cursos/:id" element={<RequireFunction allowed={['criador']}><EditarInfoCursoPage /></RequireFunction>} />
            <Route path="cursos/:id/modulos" element={<RequireFunction allowed={['criador']}><EditarCursoPage /></RequireFunction>} />
            <Route path="cursos/:courseId/aula/:lessonId" element={<RequireFunction allowed={['criador']}><EditarAulaPage /></RequireFunction>} />
            <Route path="alunos" element={<RequireFunction allowed={['criador']}><AlunosPage /></RequireFunction>} />
            <Route path="perguntas" element={<RequireFunction allowed={['criador']}><PerguntasPage /></RequireFunction>} />
            <Route path="financeiro" element={<RequireFunction allowed={['criador']}><FinanceiroPage /></RequireFunction>} />
            <Route path="minha-loja" element={<RequireFunction allowed={['criador']}><MinhaLojaPage /></RequireFunction>} />

            {/* Aluno */}
            <Route path="meus-cursos" element={<RequireFunction allowed={['aluno']}><MeusCursosPage /></RequireFunction>} />
            <Route path="meus-cursos/:courseId" element={<RequireFunction allowed={['aluno']}><CursoInternoPage /></RequireFunction>} />
            <Route path="meus-cursos/:courseId/aula/:lessonId" element={<RequireFunction allowed={['aluno']}><AulaPage /></RequireFunction>} />
            <Route path="certificados" element={<RequireFunction allowed={['aluno']}><CertificadosPage /></RequireFunction>} />
            <Route path="certificados/como-conseguir" element={<ComoConseguirCertificadoPage />} />
            <Route path="caderno" element={<RequireFunction allowed={['aluno']}><CadernoPage /></RequireFunction>} />
            <Route path="flashcards" element={<RequireFunction allowed={['aluno']}><FlashcardsPage /></RequireFunction>} />
            <Route path="biblia" element={<BibliaPage />} />

            {/* Instituição */}
            <Route path="painel-instituicao" element={<RequireFunction allowed={['instituicao']}><InstituicaoDashboardPage /></RequireFunction>} />
            <Route path="membros" element={<RequireFunction allowed={['instituicao']}><MembrosPage /></RequireFunction>} />
            <Route path="cursos-instituicao" element={<RequireFunction allowed={['instituicao']}><CursosInstituicaoPage /></RequireFunction>} />
            <Route path="relatorios" element={<RequireFunction allowed={['instituicao']}><RelatoriosPage /></RequireFunction>} />

            {/* Blog (autoria) — disponível para qualquer função, gating é feito no
                IdentitySelector dentro do editor (que só lista identidades válidas) */}
            <Route path="blog" element={<MeuBlogPage />} />
            <Route path="blog/novo" element={<NovoArtigoPage />} />
            <Route path="blog/:postId" element={<EditarArtigoPage />} />

            {/* Compartilhado */}
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="meu-perfil-publico" element={<Navigate to="/dashboard/perfil" replace />} />
            <Route path="funcoes" element={<FuncoesPage />} />
            <Route path="planos" element={<PlanosPage />} />

            {/* Admin (acesso validado server-side por email) */}
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/notificacoes" element={<NotificacoesAdminPage />} />
            <Route path="admin/cursos" element={<CursosAdminPage />} />
            <Route path="admin/comentarios" element={<ComentariosAdminPage />} />

            {/* Catch-all dentro do dashboard */}
            <Route
              path="*"
              element={
                <EmConstrucao
                  title="Página do dashboard não encontrada"
                  description="O endereço acessado não existe. Use o menu lateral para navegar."
                />
              }
            />
          </Route>

          {/* Catch-all global (multi-segmentos não cobertos por /:handle) */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </AnimatePresence>
    </BrowserRouter>
  )
}
