import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { AnimatePresence } from 'framer-motion'
import { LandingPage } from '@/pages/LandingPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { RegisterAlunoPage } from '@/pages/auth/RegisterAlunoPage'
import { RegisterCriadorPage } from '@/pages/auth/RegisterCriadorPage'
import { RegisterInstituicaoPage } from '@/pages/auth/RegisterInstituicaoPage'
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
import type { Perfil } from '@/lib/perfil'
import { PrivacidadePage, TermosPage } from '@/pages/legal/LegalPages'

function DashboardRouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
    </div>
  )
}

function EmConstrucao({
  title = 'Área em construção',
  description = 'Esta seção ainda está sendo refinada para seguir a mesma direção editorial e institucional do restante da plataforma.',
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

function RequirePerfil({
  allowed,
  children,
}: {
  allowed: Perfil[]
  children: ReactNode
}) {
  const { user } = useUser()
  const { perfil, isLoading } = useCurrentAppUser()

  if (!user || isLoading) {
    return <DashboardRouteLoader />
  }

  if (!allowed.includes(perfil)) {
    return <EmConstrucao title="Acesso não disponível neste perfil" description="Seu perfil atual entrou corretamente no dashboard, mas esta área pertence a outra camada do produto." />
  }

  return <>{children}</>
}

function DashboardIndexPage() {
  const { user } = useUser()
  const { perfil, isLoading } = useCurrentAppUser()

  if (!user || isLoading) {
    return <DashboardRouteLoader />
  }

  if (perfil === 'criador') {
    return <VisaoGeralPage />
  }

  if (perfil === 'instituicao') {
    return (
      <DashboardPageShell
        eyebrow="Painel institucional"
        title="Visão geral"
        description="O shell do dashboard já respeita seu perfil. Agora a próxima etapa é liberar gestão de membros, relatórios e acompanhamento coletivo dentro da mesma base."
        maxWidthClass="max-w-4xl"
      >
        <EmConstrucao
          title="Base institucional pronta para crescer"
          description="Seu acesso institucional já cai no contexto correto. Os módulos operacionais, membros e relatórios serão conectados sobre esta mesma estrutura."
        />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Painel do aluno"
      title="Visão geral"
      description="O dashboard já diferencia aluno, criador e instituição. A próxima entrega conecta cursos em andamento, progresso e certificados com a mesma linguagem editorial."
      maxWidthClass="max-w-4xl"
    >
      <EmConstrucao
        title="Área do aluno em ativação"
        description="O acesso do aluno já está separado corretamente. Agora vamos conectar matrícula, continuidade de estudo, progresso e certificados sem misturar sua experiência com o painel do criador."
      />
    </DashboardPageShell>
  )
}

function DashboardPerfilPage() {
  const { user } = useUser()
  const { perfil, isLoading } = useCurrentAppUser()

  if (!user || isLoading) {
    return <DashboardRouteLoader />
  }

  if (perfil === 'criador' || perfil === 'instituicao') {
    return <PerfilPage />
  }

  return (
    <DashboardPageShell
      eyebrow="Conta"
      title="Meu perfil"
      description="A edição completa do perfil do aluno entra em uma etapa seguinte. Por enquanto, a plataforma já reconhece seu perfil corretamente e protege o acesso dentro do dashboard único."
      maxWidthClass="max-w-4xl"
    >
      <EmConstrucao
        title="Perfil do aluno em preparação"
        description="A próxima camada vai exibir identidade, dados de estudo e preferências do aluno com a mesma clareza visual do restante da plataforma."
      />
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

          {/* Autenticação */}
          <Route path="/entrar" element={<SignInPage />} />
          <Route path="/cadastro" element={<SignUpPage />} />
          <Route path="/cadastro/aluno" element={<RegisterAlunoPage />} />
          <Route path="/cadastro/criador" element={<RegisterCriadorPage />} />
          <Route path="/cadastro/instituicao" element={<RegisterInstituicaoPage />} />
          <Route path="/sso-callback" element={<SSOCallbackPage />} />
          <Route path="/termos" element={<TermosPage />} />
          <Route path="/privacidade" element={<PrivacidadePage />} />

          {/* Dashboard unificado */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardIndexPage />} />

            {/* Criador */}
            <Route path="cursos" element={<RequirePerfil allowed={['criador']}><CursosPage /></RequirePerfil>} />
            <Route path="cursos/novo" element={<RequirePerfil allowed={['criador']}><NovoCursoPage /></RequirePerfil>} />
            <Route path="cursos/:id" element={<RequirePerfil allowed={['criador']}><EditarInfoCursoPage /></RequirePerfil>} />
            <Route path="cursos/:id/modulos" element={<RequirePerfil allowed={['criador']}><EditarCursoPage /></RequirePerfil>} />
            <Route path="cursos/:courseId/aula/:lessonId" element={<RequirePerfil allowed={['criador']}><EditarAulaPage /></RequirePerfil>} />
            <Route path="financeiro" element={<RequirePerfil allowed={['criador']}><FinanceiroPage /></RequirePerfil>} />

            {/* Aluno */}
            <Route path="meus-cursos" element={<RequirePerfil allowed={['aluno']}><EmConstrucao title="Meus cursos em preparação" description="O painel do aluno já foi separado do criador. Agora vamos conectar matrícula, progresso e continuidade de estudo." /></RequirePerfil>} />
            <Route path="certificados" element={<RequirePerfil allowed={['aluno']}><EmConstrucao title="Certificados em preparação" description="A emissão e a listagem dos certificados serão liberadas junto com o ciclo completo de progresso, quiz e conclusão." /></RequirePerfil>} />

            {/* Instituição */}
            <Route path="membros" element={<RequirePerfil allowed={['instituicao']}><EmConstrucao title="Membros em preparação" description="A estrutura institucional já está reservada no dashboard. A próxima entrega conecta gestão de membros e acompanhamento coletivo." /></RequirePerfil>} />
            <Route path="relatorios" element={<RequirePerfil allowed={['instituicao']}><EmConstrucao title="Relatórios em preparação" description="Os relatórios institucionais serão liberados sobre o mesmo dashboard, com permissões e visão próprias para igrejas e instituições." /></RequirePerfil>} />

            {/* Compartilhado */}
            <Route path="perfil" element={<DashboardPerfilPage />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
