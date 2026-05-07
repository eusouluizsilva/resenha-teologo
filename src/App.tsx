import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { BannerCookies } from '@/components/BannerCookies'
import { CommandPalette } from '@/components/CommandPalette'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { PWAUpdateNotification } from '@/components/PWAUpdateNotification'
import {
  DashboardIndexPage,
  EmConstrucao,
  RequireFunction,
  RouteFallback,
  RouteTracker,
} from '@/routes/RouteHelpers'
import {
  AceitarConvitePage,
  AdminPage,
  AlunosPage,
  ApoiePage,
  AulaPage,
  AulaPreviewPage,
  BancoQuestoesPage,
  BibliaPage,
  BlogCategoryPage,
  BlogIndexPage,
  BlogPostPage,
  BrandingPage,
  CadastroPage,
  CadernoPage,
  CatalogoPage,
  CertificadosPage,
  CertificadosVendasPage,
  CheckoutCertificadoPage,
  CoautoresPage,
  ComentariosAdminPage,
  ComoConseguirCertificadoPage,
  ContatoPage,
  CursoDetalhePage,
  CursosAdminPage,
  CursosCompartilhadosPage,
  CursosInstituicaoPage,
  CursosObrigatoriosPage,
  CursosPage,
  CursoInternoPage,
  EditarArtigoPage,
  EditarAulaPage,
  EditarCursoPage,
  EditarInfoCursoPage,
  EditarTrilhaPage,
  EntrarPage,
  FinanceiroPage,
  FlashcardsPage,
  FuncoesPage,
  InstituicaoDashboardPage,
  AulaPreviewCriadorPage,
  LojaPage,
  MembrosPage,
  MetricasCursoPage,
  MeuBlogPage,
  MeusCursosPage,
  MeusPedidosPage,
  MinhaLojaPage,
  NotFoundPage,
  NotificacoesAdminPage,
  NovoArtigoPage,
  NovoCursoPage,
  PedidoDetalhePage,
  PerfilPage,
  PerfilPublicoPage,
  PerguntasPage,
  PlanosPage,
  PrivacidadePage,
  ProdutoPage,
  PublicBibliaPage,
  RelatoriosPage,
  SSOCallbackPage,
  SobrePage,
  StatusPage,
  TermosPage,
  TrilhaPublicaPage,
  TrilhasPage,
  VerificarCertificadoPage,
} from '@/routes/lazyPages'

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo
      </a>
      <RouteTracker />
      <BannerCookies />
      <CommandPalette />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Público */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/cursos" element={<CatalogoPage />} />
            <Route path="/cursos/:courseId" element={<CursoDetalhePage />} />
            <Route path="/cursos/:courseSlug/:lessonSlug" element={<AulaPreviewPage />} />
            <Route path="/biblia" element={<PublicBibliaPage />} />
            <Route path="/apoie" element={<ApoiePage />} />
            <Route path="/contato" element={<ContatoPage />} />
            <Route path="/verificar/:code" element={<VerificarCertificadoPage />} />
            <Route path="/convite/:token" element={<AceitarConvitePage />} />
            <Route path="/sobre" element={<SobrePage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/loja" element={<LojaPage />} />
            <Route path="/loja/:slug" element={<ProdutoPage />} />
            <Route path="/trilhas/:slug" element={<TrilhaPublicaPage />} />

            {/* Blog público (precisa vir antes de /:handle, que é catch-all) */}
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/categoria/:categorySlug" element={<BlogCategoryPage />} />
            <Route path="/blog/:handle/:postSlug" element={<BlogPostPage />} />

            <Route path="/:handle" element={<PerfilPublicoPage />} />

            {/* Autenticação */}
            <Route path="/entrar" element={<EntrarPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
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
              <Route path="cursos/:courseId/aula/:lessonId/preview" element={<RequireFunction allowed={['criador']}><AulaPreviewCriadorPage /></RequireFunction>} />
              <Route path="cursos/:courseId/metricas" element={<RequireFunction allowed={['criador']}><MetricasCursoPage /></RequireFunction>} />
              <Route path="cursos/:courseId/coautores" element={<RequireFunction allowed={['criador']}><CoautoresPage /></RequireFunction>} />
              <Route path="cursos-compartilhados" element={<RequireFunction allowed={['criador']}><CursosCompartilhadosPage /></RequireFunction>} />
              <Route path="alunos" element={<RequireFunction allowed={['criador']}><AlunosPage /></RequireFunction>} />
              <Route path="perguntas" element={<RequireFunction allowed={['criador']}><PerguntasPage /></RequireFunction>} />
              <Route path="financeiro" element={<RequireFunction allowed={['criador']}><FinanceiroPage /></RequireFunction>} />
              <Route path="minha-loja" element={<RequireFunction allowed={['criador']}><MinhaLojaPage /></RequireFunction>} />
              <Route path="banco-questoes" element={<RequireFunction allowed={['criador']}><BancoQuestoesPage /></RequireFunction>} />

              {/* Aluno */}
              <Route path="meus-cursos" element={<RequireFunction allowed={['aluno']}><MeusCursosPage /></RequireFunction>} />
              <Route path="meus-cursos/:courseId" element={<RequireFunction allowed={['aluno']}><CursoInternoPage /></RequireFunction>} />
              <Route path="meus-cursos/:courseId/aula/:lessonId" element={<RequireFunction allowed={['aluno']}><AulaPage /></RequireFunction>} />
              <Route path="certificados" element={<RequireFunction allowed={['aluno']}><CertificadosPage /></RequireFunction>} />
              <Route path="certificados/como-conseguir" element={<ComoConseguirCertificadoPage />} />
              <Route path="certificado/:courseId/checkout" element={<RequireFunction allowed={['aluno']}><CheckoutCertificadoPage /></RequireFunction>} />
              <Route path="caderno" element={<RequireFunction allowed={['aluno']}><CadernoPage /></RequireFunction>} />
              <Route path="flashcards" element={<RequireFunction allowed={['aluno']}><FlashcardsPage /></RequireFunction>} />
              <Route path="biblia" element={<BibliaPage />} />
              <Route path="pedidos" element={<MeusPedidosPage />} />
              <Route path="pedidos/:orderId" element={<PedidoDetalhePage />} />

              {/* Instituição */}
              <Route path="painel-instituicao" element={<RequireFunction allowed={['instituicao']}><InstituicaoDashboardPage /></RequireFunction>} />
              <Route path="membros" element={<RequireFunction allowed={['instituicao']}><MembrosPage /></RequireFunction>} />
              <Route path="cursos-instituicao" element={<RequireFunction allowed={['instituicao']}><CursosInstituicaoPage /></RequireFunction>} />
              <Route path="relatorios" element={<RequireFunction allowed={['instituicao']}><RelatoriosPage /></RequireFunction>} />
              <Route path="branding" element={<RequireFunction allowed={['instituicao']}><BrandingPage /></RequireFunction>} />
              <Route path="cursos-obrigatorios" element={<RequireFunction allowed={['instituicao']}><CursosObrigatoriosPage /></RequireFunction>} />
              <Route path="trilhas" element={<RequireFunction allowed={['instituicao', 'criador']}><TrilhasPage /></RequireFunction>} />
              <Route path="trilhas/:id" element={<RequireFunction allowed={['instituicao', 'criador']}><EditarTrilhaPage /></RequireFunction>} />

              {/* Blog (autoria) — disponível para qualquer função, gating é feito no
                  SeletorIdentidade dentro do editor (que só lista identidades válidas) */}
              <Route path="blog" element={<MeuBlogPage />} />
              <Route path="blog/novo" element={<NovoArtigoPage />} />
              <Route path="blog/:postId" element={<EditarArtigoPage />} />

              {/* Compartilhado */}
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="funcoes" element={<FuncoesPage />} />
              <Route path="planos" element={<PlanosPage />} />

              {/* Admin (acesso validado server-side por email) */}
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/notificacoes" element={<NotificacoesAdminPage />} />
              <Route path="admin/cursos" element={<CursosAdminPage />} />
              <Route path="admin/comentarios" element={<ComentariosAdminPage />} />
              <Route path="admin/certificados" element={<CertificadosVendasPage />} />

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
