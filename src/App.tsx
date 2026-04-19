import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

const EmConstrucao = () => (
  <div className="p-8 flex items-center justify-center min-h-screen">
    <p className="text-white/40 text-sm">Em construção</p>
  </div>
)

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

          {/* Dashboard unificado */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<VisaoGeralPage />} />

            {/* Criador */}
            <Route path="cursos" element={<CursosPage />} />
            <Route path="cursos/novo" element={<NovoCursoPage />} />
            <Route path="cursos/:id" element={<EditarInfoCursoPage />} />
            <Route path="cursos/:id/modulos" element={<EditarCursoPage />} />
            <Route path="cursos/:courseId/aula/:lessonId" element={<EditarAulaPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />

            {/* Aluno */}
            <Route path="meus-cursos" element={<EmConstrucao />} />
            <Route path="certificados" element={<EmConstrucao />} />

            {/* Instituição */}
            <Route path="membros" element={<EmConstrucao />} />
            <Route path="relatorios" element={<EmConstrucao />} />

            {/* Compartilhado */}
            <Route path="perfil" element={<PerfilPage />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
