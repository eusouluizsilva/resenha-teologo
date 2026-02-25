import { useAuth, useUser } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/member/DashboardPage";

import CourseDetailPage from "./pages/member/CourseDetailPage";
import LessonPage from "./pages/member/LessonPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminCourseEditorPage from "./pages/admin/AdminCourseEditorPage";
import AdminMembersPage from "./pages/admin/AdminMembersPage";
import AdminQuizBuilderPage from "./pages/admin/AdminQuizBuilderPage";
import AdminAnnouncementsPage from "./pages/admin/AdminAnnouncementsPage";
import AdminVersesPage from "./pages/admin/AdminVersesPage";
import CommunityPage from "./pages/member/CommunityPage";
import RankingPage from "./pages/member/RankingPage";
import CommunityPostPage from "./pages/member/CommunityPostPage";
import PastorProfilePage from "./pages/member/PastorProfilePage";
import PastorCoursesPage from "./pages/pastor/PastorCoursesPage";
import PastorCourseEditorPage from "./pages/pastor/PastorCourseEditorPage";
import PastorQuizBuilderPage from "./pages/pastor/PastorQuizBuilderPage";
import UserSync from "./components/UserSync";

function ProtectedLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-lg">
        Carregando...
      </div>
    );
  }
  if (!isSignedIn) return <Navigate to="/entrar" replace />;

  return (
    <>
      <UserSync />
      <Outlet />
    </>
  );
}

function AdminLayout() {
  const { user, isLoaded } = useUser();
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");

  if (!isLoaded || me === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-lg">
        Verificando permissões...
      </div>
    );
  }
  if (!me || me.role !== "admin") return <Navigate to="/painel" replace />;

  return <Outlet />;
}

function PastorLayout() {
  const { user, isLoaded } = useUser();
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");

  if (!isLoaded || me === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-lg">
        Verificando permissões...
      </div>
    );
  }
  if (!me || (me.role !== "admin" && me.role !== "pastor")) return <Navigate to="/painel" replace />;

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/entrar" element={<SignInPage />} />
        <Route path="/cadastro" element={<SignUpPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/painel" replace />} />
          <Route path="/painel" element={<DashboardPage />} />
<Route path="/cursos/:courseId" element={<CourseDetailPage />} />
          <Route path="/cursos/:courseId/aulas/:lessonId" element={<LessonPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/comunidade" element={<CommunityPage />} />
          <Route path="/comunidade/:postId" element={<CommunityPostPage />} />
          <Route path="/pastores/:pastorId" element={<PastorProfilePage />} />

          <Route element={<AdminLayout />}>
            <Route path="/admin/cursos" element={<AdminCoursesPage />} />
            <Route path="/admin/cursos/:courseId" element={<AdminCourseEditorPage />} />
            <Route path="/admin/cursos/:courseId/aulas/:lessonId/quiz" element={<AdminQuizBuilderPage />} />
            <Route path="/admin/membros" element={<AdminMembersPage />} />
            <Route path="/admin/anuncios" element={<AdminAnnouncementsPage />} />
            <Route path="/admin/versiculo" element={<AdminVersesPage />} />
          </Route>

          <Route element={<PastorLayout />}>
            <Route path="/pastor/cursos" element={<PastorCoursesPage />} />
            <Route path="/pastor/cursos/:courseId" element={<PastorCourseEditorPage />} />
            <Route path="/pastor/cursos/:courseId/aulas/:lessonId/quiz" element={<PastorQuizBuilderPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
