import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { AnimatePresence } from 'framer-motion'
import { LandingPage } from '@/pages/LandingPage'
import { SignInPage } from '@/pages/SignInPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { SSOCallbackPage } from '@/pages/auth/SSOCallbackPage'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { VisaoGeralPage } from '@/pages/dashboard/criador/VisaoGeralPage'
import { CursosPage } from '@/pages/dashboard/criador/CursosPage'
import { NovoCursoPage } from '@/pages/dashboard/criador/NovoCursoPage'
import { EditarCursoPage } from '@/pages/dashboard/criador/EditarCursoPage'
import { EditarInfoCursoPage } from '@/pages/dashboard/criador/EditarInfoCursoPage'
import { EditarAulaPage } from '@/pages/dashboard/criador/EditarAulaPage'
import { FinanceiroPage } from '@/pages/dashboard/criador/FinanceiroPage'
import { PerfilPage } from '@/pages/dashboard/criador/PerfilPage'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { useCurrentAppUser } from '@/lib/currentUser'
import type { UserFunction } from '@/lib/functions'
import { PrivacidadePage, TermosPage } from '@/pages/legal/LegalPages'
import { MeusCursosPage } from '@/pages/dashboard/aluno/MeusCursosPage'
import { CertificadosPage } from '@/pages/dashboard/aluno/CertificadosPage'
import { CursoInternoPage } from '@/pages/dashboard/aluno/CursoInternoPage'
import { AulaPage } from '@/pages/dashboard/aluno/AulaPage'
import { CatalogPage } from '@/pages/public/CatalogPage'
import { CourseDetailPage } from '@/pages/public/CourseDetailPage'
import { PlanosPage } from '@/pages/dashboard/PlanosPage'
import { FuncoesPage } from '@/pages/dashboard/FuncoesPage'
import { PublicProfilePage } from '@/pages/public/PublicProfilePage'

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
        description="Esta área requer uma função que você ainda não ativou. Acesse Minhas funções para configurar."
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

  if (hasFunction('aluno')) {
    return (
      <DashboardPageShell
        eyebrow="Painel do aluno"
        title="Bem-vindo de volta"
        description="Acesse seus cursos, acompanhe o progresso e resgate seus certificados."
        maxWidthClass="max-w-4xl"
      >
        <EmConstrucao
          title="Área do aluno em ativação"
          description="Seus cursos em andamento e progresso serão exibidos aqui em breve."
        />
      </DashboardPageShell>
    )
  }

  if (hasFunction('instituicao')) {
    return (
      <DashboardPageShell
        eyebrow="Painel institucional"
        title="Visão geral"
        description="Gestão de membros, cursos vinculados e relatórios da sua instituição."
        maxWidthClass="max-w-4xl"
      >
        <EmConstrucao
          title="Ambiente institucional em preparação"
          description="Configure os dados da sua instituição e comece a adicionar membros."
        />
      </DashboardPageShell>
    )
  }

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
            title: 'Criador de conteúdo',
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
          <Link to="/dashboard/funcoes" className="text-[#F2BD8A] hover:underline">Minhas funções</Link>.
        </p>
      </div>
    </DashboardPageShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Público */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/cursos" element={<CatalogPage />} />
          <Route path="/cursos/:courseId" element={<CourseDetailPage />} />
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
            <Route path="financeiro" element={<RequireFunction allowed={['criador']}><FinanceiroPage /></RequireFunction>} />

            {/* Aluno */}
            <Route path="meus-cursos" element={<RequireFunction allowed={['aluno']}><MeusCursosPage /></RequireFunction>} />
            <Route path="meus-cursos/:courseId" element={<RequireFunction allowed={['aluno']}><CursoInternoPage /></RequireFunction>} />
            <Route path="meus-cursos/:courseId/aula/:lessonId" element={<RequireFunction allowed={['aluno']}><AulaPage /></RequireFunction>} />
            <Route path="certificados" element={<RequireFunction allowed={['aluno']}><CertificadosPage /></RequireFunction>} />

            {/* Instituição */}
            <Route path="membros" element={<RequireFunction allowed={['instituicao']}><EmConstrucao title="Membros em preparação" description="A gestão de membros será liberada em breve." /></RequireFunction>} />
            <Route path="cursos-instituicao" element={<RequireFunction allowed={['instituicao']}><EmConstrucao title="Cursos vinculados em preparação" description="A vinculação de cursos a membros será liberada em breve." /></RequireFunction>} />
            <Route path="relatorios" element={<RequireFunction allowed={['instituicao']}><EmConstrucao title="Relatórios em preparação" description="Os relatórios institucionais serão liberados em breve." /></RequireFunction>} />

            {/* Compartilhado */}
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="meu-perfil-publico" element={<Navigate to="/dashboard/perfil" replace />} />
            <Route path="funcoes" element={<FuncoesPage />} />
            <Route path="planos" element={<PlanosPage />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
