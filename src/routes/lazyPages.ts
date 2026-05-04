// Imports lazy de todas as páginas. Mantidos em arquivo separado pra não
// inflar App.tsx, e pra facilitar achar o code-split de uma rota específica
// quando algum bundle ficar grande demais.

import { lazy } from 'react'

// Auth
export const SignInPage = lazy(() =>
  import('@/pages/SignInPage').then((m) => ({ default: m.SignInPage })),
)
export const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
export const SSOCallbackPage = lazy(() =>
  import('@/pages/auth/SSOCallbackPage').then((m) => ({ default: m.SSOCallbackPage })),
)

// Criador
export const VisaoGeralPage = lazy(() =>
  import('@/pages/dashboard/criador/VisaoGeralPage').then((m) => ({ default: m.VisaoGeralPage })),
)
export const CursosPage = lazy(() =>
  import('@/pages/dashboard/criador/CursosPage').then((m) => ({ default: m.CursosPage })),
)
export const NovoCursoPage = lazy(() =>
  import('@/pages/dashboard/criador/NovoCursoPage').then((m) => ({ default: m.NovoCursoPage })),
)
export const EditarCursoPage = lazy(() =>
  import('@/pages/dashboard/criador/EditarCursoPage').then((m) => ({ default: m.EditarCursoPage })),
)
export const EditarInfoCursoPage = lazy(() =>
  import('@/pages/dashboard/criador/EditarInfoCursoPage').then((m) => ({
    default: m.EditarInfoCursoPage,
  })),
)
export const EditarAulaPage = lazy(() =>
  import('@/pages/dashboard/criador/EditarAulaPage').then((m) => ({ default: m.EditarAulaPage })),
)
export const LessonPreviewCreatorPage = lazy(() =>
  import('@/pages/dashboard/criador/LessonPreviewCreatorPage').then((m) => ({
    default: m.LessonPreviewCreatorPage,
  })),
)
export const MetricasCursoPage = lazy(() =>
  import('@/pages/dashboard/criador/MetricasCursoPage').then((m) => ({
    default: m.MetricasCursoPage,
  })),
)
export const CoautoresPage = lazy(() =>
  import('@/pages/dashboard/criador/CoautoresPage').then((m) => ({
    default: m.CoautoresPage,
  })),
)
export const CursosCompartilhadosPage = lazy(() =>
  import('@/pages/dashboard/criador/CursosCompartilhadosPage').then((m) => ({
    default: m.CursosCompartilhadosPage,
  })),
)
export const FinanceiroPage = lazy(() =>
  import('@/pages/dashboard/criador/FinanceiroPage').then((m) => ({ default: m.FinanceiroPage })),
)
export const AlunosPage = lazy(() =>
  import('@/pages/dashboard/criador/AlunosPage').then((m) => ({ default: m.AlunosPage })),
)
export const PerguntasPage = lazy(() =>
  import('@/pages/dashboard/criador/PerguntasPage'),
)
export const PerfilPage = lazy(() =>
  import('@/pages/dashboard/criador/PerfilPage').then((m) => ({ default: m.PerfilPage })),
)
export const MinhaLojaPage = lazy(() =>
  import('@/pages/dashboard/criador/MinhaLojaPage').then((m) => ({
    default: m.MinhaLojaPage,
  })),
)
export const BancoQuestoesPage = lazy(() =>
  import('@/pages/dashboard/criador/BancoQuestoesPage').then((m) => ({
    default: m.BancoQuestoesPage,
  })),
)

// Admin
export const AdminPage = lazy(() =>
  import('@/pages/dashboard/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
)
export const NotificacoesAdminPage = lazy(() =>
  import('@/pages/dashboard/admin/NotificacoesAdminPage').then((m) => ({
    default: m.NotificacoesAdminPage,
  })),
)
export const CursosAdminPage = lazy(() =>
  import('@/pages/dashboard/admin/CursosAdminPage').then((m) => ({
    default: m.CursosAdminPage,
  })),
)
export const ComentariosAdminPage = lazy(() =>
  import('@/pages/dashboard/admin/ComentariosAdminPage').then((m) => ({
    default: m.ComentariosAdminPage,
  })),
)

// Aluno
export const MeusCursosPage = lazy(() =>
  import('@/pages/dashboard/aluno/MeusCursosPage').then((m) => ({ default: m.MeusCursosPage })),
)
export const CertificadosPage = lazy(() =>
  import('@/pages/dashboard/aluno/CertificadosPage').then((m) => ({
    default: m.CertificadosPage,
  })),
)
export const CheckoutCertificadoPage = lazy(() =>
  import('@/pages/dashboard/aluno/CheckoutCertificadoPage').then((m) => ({
    default: m.CheckoutCertificadoPage,
  })),
)
export const ComoConseguirCertificadoPage = lazy(() =>
  import('@/pages/dashboard/aluno/ComoConseguirCertificadoPage').then((m) => ({
    default: m.ComoConseguirCertificadoPage,
  })),
)
export const CadernoPage = lazy(() =>
  import('@/pages/dashboard/aluno/CadernoPage').then((m) => ({ default: m.CadernoPage })),
)
export const FlashcardsPage = lazy(() =>
  import('@/pages/dashboard/aluno/FlashcardsPage').then((m) => ({ default: m.FlashcardsPage })),
)
export const MeusPedidosPage = lazy(() =>
  import('@/pages/dashboard/aluno/MeusPedidosPage').then((m) => ({ default: m.MeusPedidosPage })),
)
export const PedidoDetalhePage = lazy(() =>
  import('@/pages/dashboard/aluno/PedidoDetalhePage').then((m) => ({ default: m.PedidoDetalhePage })),
)
export const BibliaPage = lazy(() => import('@/pages/dashboard/aluno/BibliaPage'))
export const CursoInternoPage = lazy(() =>
  import('@/pages/dashboard/aluno/CursoInternoPage').then((m) => ({
    default: m.CursoInternoPage,
  })),
)
export const AulaPage = lazy(() =>
  import('@/pages/dashboard/aluno/AulaPage').then((m) => ({ default: m.AulaPage })),
)
export const AlunoDashboardPage = lazy(() =>
  import('@/pages/dashboard/aluno/AlunoDashboardPage').then((m) => ({
    default: m.AlunoDashboardPage,
  })),
)

// Instituição
export const MembrosPage = lazy(() =>
  import('@/pages/dashboard/instituicao/MembrosPage').then((m) => ({
    default: m.MembrosPage,
  })),
)
export const InstituicaoDashboardPage = lazy(() =>
  import('@/pages/dashboard/instituicao/InstituicaoDashboardPage').then((m) => ({
    default: m.InstituicaoDashboardPage,
  })),
)
export const CursosInstituicaoPage = lazy(() =>
  import('@/pages/dashboard/instituicao/CursosInstituicaoPage').then((m) => ({
    default: m.CursosInstituicaoPage,
  })),
)
export const RelatoriosPage = lazy(() =>
  import('@/pages/dashboard/instituicao/RelatoriosPage').then((m) => ({
    default: m.RelatoriosPage,
  })),
)
export const BrandingPage = lazy(() =>
  import('@/pages/dashboard/instituicao/BrandingPage').then((m) => ({
    default: m.BrandingPage,
  })),
)
export const CursosObrigatoriosPage = lazy(() =>
  import('@/pages/dashboard/instituicao/CursosObrigatoriosPage').then((m) => ({
    default: m.CursosObrigatoriosPage,
  })),
)

// Trilhas (instituição + criador)
export const TrilhasPage = lazy(() =>
  import('@/pages/dashboard/trilhas/TrilhasPage').then((m) => ({
    default: m.TrilhasPage,
  })),
)
export const EditarTrilhaPage = lazy(() =>
  import('@/pages/dashboard/trilhas/EditarTrilhaPage').then((m) => ({
    default: m.EditarTrilhaPage,
  })),
)

// Compartilhado
export const PlanosPage = lazy(() =>
  import('@/pages/dashboard/PlanosPage').then((m) => ({ default: m.PlanosPage })),
)
export const FuncoesPage = lazy(() =>
  import('@/pages/dashboard/FuncoesPage').then((m) => ({ default: m.FuncoesPage })),
)

// Blog dashboard
export const MeuBlogPage = lazy(() =>
  import('@/pages/dashboard/blog/MeuBlogPage').then((m) => ({ default: m.MeuBlogPage })),
)
export const NovoArtigoPage = lazy(() =>
  import('@/pages/dashboard/blog/NovoArtigoPage').then((m) => ({ default: m.NovoArtigoPage })),
)
export const EditarArtigoPage = lazy(() =>
  import('@/pages/dashboard/blog/EditarArtigoPage').then((m) => ({ default: m.EditarArtigoPage })),
)

// Público
export const CatalogPage = lazy(() =>
  import('@/pages/public/CatalogPage').then((m) => ({ default: m.CatalogPage })),
)
export const CourseDetailPage = lazy(() =>
  import('@/pages/public/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })),
)
export const LessonPreviewPage = lazy(() =>
  import('@/pages/public/LessonPreviewPage').then((m) => ({ default: m.LessonPreviewPage })),
)
export const PublicBibliaPage = lazy(() =>
  import('@/pages/public/BibliaPage').then((m) => ({ default: m.BibliaPage })),
)
export const SupportPage = lazy(() =>
  import('@/pages/public/SupportPage').then((m) => ({ default: m.SupportPage })),
)
export const ContactPage = lazy(() =>
  import('@/pages/public/ContactPage').then((m) => ({ default: m.ContactPage })),
)
export const PublicProfilePage = lazy(() =>
  import('@/pages/public/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })),
)
export const VerifyCertificatePage = lazy(() =>
  import('@/pages/public/VerifyCertificatePage').then((m) => ({
    default: m.VerifyCertificatePage,
  })),
)
export const AcceptInvitePage = lazy(() =>
  import('@/pages/public/AcceptInvitePage').then((m) => ({
    default: m.AcceptInvitePage,
  })),
)
export const TrilhaPublicaPage = lazy(() =>
  import('@/pages/public/TrilhaPublicaPage').then((m) => ({
    default: m.TrilhaPublicaPage,
  })),
)
export const SobrePage = lazy(() =>
  import('@/pages/public/SobrePage').then((m) => ({ default: m.SobrePage })),
)
export const StatusPage = lazy(() =>
  import('@/pages/public/StatusPage').then((m) => ({ default: m.StatusPage })),
)
export const LojaPage = lazy(() =>
  import('@/pages/public/LojaPage').then((m) => ({ default: m.LojaPage })),
)
export const ProdutoPage = lazy(() =>
  import('@/pages/public/ProdutoPage').then((m) => ({ default: m.ProdutoPage })),
)
export const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

// Blog público
export const BlogIndexPage = lazy(() =>
  import('@/pages/public/blog/BlogIndexPage').then((m) => ({ default: m.BlogIndexPage })),
)
export const BlogCategoryPage = lazy(() =>
  import('@/pages/public/blog/BlogCategoryPage').then((m) => ({ default: m.BlogCategoryPage })),
)
export const BlogPostPage = lazy(() =>
  import('@/pages/public/blog/BlogPostPage').then((m) => ({ default: m.BlogPostPage })),
)

// Legal (mesmo módulo, dois exports)
export const PrivacidadePage = lazy(() =>
  import('@/pages/legal/LegalPages').then((m) => ({ default: m.PrivacidadePage })),
)
export const TermosPage = lazy(() =>
  import('@/pages/legal/LegalPages').then((m) => ({ default: m.TermosPage })),
)
