import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LandingPage } from '@/pages/LandingPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { RegisterAlunoPage } from '@/pages/auth/RegisterAlunoPage'
import { RegisterCriadorPage } from '@/pages/auth/RegisterCriadorPage'
import { RegisterInstituicaoPage } from '@/pages/auth/RegisterInstituicaoPage'
import { SSOCallbackPage } from '@/pages/auth/SSOCallbackPage'
import { CriadorLayout } from '@/components/dashboard/criador/CriadorLayout'
import { VisaoGeralPage } from '@/pages/dashboard/criador/VisaoGeralPage'
import { CursosPage } from '@/pages/dashboard/criador/CursosPage'
import { NovoCursoPage } from '@/pages/dashboard/criador/NovoCursoPage'
import { EditarCursoPage } from '@/pages/dashboard/criador/EditarCursoPage'
import { FinanceiroPage } from '@/pages/dashboard/criador/FinanceiroPage'
import { PerfilPage } from '@/pages/dashboard/criador/PerfilPage'
import { EditarAulaPage } from '@/pages/dashboard/criador/EditarAulaPage'
import { EditarInfoCursoPage } from '@/pages/dashboard/criador/EditarInfoCursoPage'

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

          {/* Dashboard do Criador */}
          <Route path="/dashboard/criador" element={<CriadorLayout />}>
            <Route index element={<VisaoGeralPage />} />
            <Route path="cursos" element={<CursosPage />} />
            <Route path="cursos/novo" element={<NovoCursoPage />} />
            <Route path="cursos/:id" element={<EditarInfoCursoPage />} />
            <Route path="cursos/:id/modulos" element={<EditarCursoPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="cursos/:courseId/aula/:lessonId" element={<EditarAulaPage />} />
          </Route>

          {/* Outros dashboards (a construir) */}
          <Route path="/dashboard/*" element={<div className="min-h-screen bg-[#0F141A] text-white flex items-center justify-center text-white/40">Em construção</div>} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
