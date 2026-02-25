import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Navbar from "../../components/ui/Navbar";
import { extractYouTubeId } from "../../lib/levels";

class SectionGuard extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function EnrollButton({ userId, courseId }: { userId: Id<"users">; courseId: Id<"courses"> }) {
  const enrolled = useQuery(api.enrollments.isEnrolled, { userId, courseId });
  const enroll = useMutation(api.enrollments.enroll);

  if (enrolled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-green-400 font-semibold bg-green-400/10 border border-green-400/20 px-4 py-2 rounded-xl">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        Inscrito
      </span>
    );
  }

  return (
    <button
      onClick={() => enroll({ userId, courseId })}
      className="bg-slate-800 text-slate-300 font-bold text-sm px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700 hover:text-white active:scale-95 transition-all"
    >
      Inscrever-se
    </button>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useUser();

  const course = useQuery(api.courses.getCourse, { courseId: courseId as Id<"courses"> });
  const modules = useQuery(api.modules.getModulesByCourse, { courseId: courseId as Id<"courses"> });
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");
  const myProgress = useQuery(api.progress.getMyProgress, me ? { userId: me._id } : "skip");

  const completedLessonIds = new Set(
    (myProgress ?? []).filter((p) => p.completed).map((p) => p.lessonId)
  );

  if (!course || !modules) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Carregando curso...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 py-10 px-6">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-start gap-6">
            {course.thumbnailUrl && (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-32 h-20 object-cover rounded-xl shrink-0"
              />
            )}
            <div className="flex-1">
              <Link to="/painel" className="text-slate-500 hover:text-amber-400 text-sm transition-colors">
                ← Voltar ao Painel
              </Link>
              <h1 className="text-3xl font-bold text-white mt-2">{course.title}</h1>
              <p className="text-slate-400 mt-1">{course.description}</p>
              {me && (
                <div className="mt-4">
                  <SectionGuard>
                    <EnrollButton userId={me._id} courseId={courseId as Id<"courses">} />
                  </SectionGuard>
                </div>
              )}
            </div>
          </div>

          {/* Vídeo de Boas-Vindas */}
          {course.welcomeVideoUrl && (() => {
            const videoId = extractYouTubeId(course.welcomeVideoUrl);
            if (!videoId) return null;
            return (
              <div className="space-y-3">
                <div>
                  <h2 className="text-white font-semibold text-lg">Bem-vindo ao curso</h2>
                  <p className="text-slate-400 text-sm mt-0.5">Assista ao vídeo de apresentação antes de começar.</p>
                </div>
                <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="Vídeo de Boas-Vindas"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            );
          })()}

          {/* Módulos e Aulas */}
          {modules.length === 0 && (
            <p className="text-slate-500 text-center py-12">Nenhum módulo disponível ainda.</p>
          )}

          <div className="space-y-4">
            {modules.map((mod) => (
              <ModuleBlock
                key={mod._id}
                moduleId={mod._id}
                title={mod.title}
                courseId={courseId as Id<"courses">}
                completedLessonIds={completedLessonIds}
              />
            ))}
          </div>

        </div>
      </main>
    </>
  );
}

function ModuleBlock({
  moduleId,
  title,
  courseId,
  completedLessonIds,
}: {
  moduleId: Id<"modules">;
  title: string;
  courseId: Id<"courses">;
  completedLessonIds: Set<Id<"lessons">>;
}) {
  const lessons = useQuery(api.lessons.getLessonsByModule, { moduleId });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-white font-semibold">{title}</h2>
      </div>
      <ul className="divide-y divide-slate-800">
        {lessons === undefined && (
          <li className="px-5 py-4 text-slate-500 text-sm">Carregando aulas...</li>
        )}
        {lessons?.map((lesson, index) => {
          const isCompleted = completedLessonIds.has(lesson._id);
          // first lesson always unlocked; subsequent lessons require previous to be completed
          const prevLesson = lessons[index - 1];
          const isUnlocked = index === 0 || (prevLesson && completedLessonIds.has(prevLesson._id));

          return (
            <li key={lesson._id}>
              {isUnlocked ? (
                <Link
                  to={`/cursos/${courseId}/aulas/${lesson._id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-slate-800/50 transition-colors group"
                >
                  <LessonStatusIcon completed={isCompleted} />
                  <span className={`flex-1 text-sm ${isCompleted ? "text-slate-400 line-through" : "text-white group-hover:text-amber-400 transition-colors"}`}>
                    {lesson.title}
                  </span>
                  {isCompleted && <span className="text-green-400 text-xs font-medium">Concluída</span>}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-5 py-4 opacity-50 cursor-not-allowed">
                  <span className="text-slate-500">🔒</span>
                  <span className="text-slate-500 text-sm">{lesson.title}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LessonStatusIcon({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-green-400 text-xs">
        ✓
      </span>
    );
  }
  return (
    <span className="w-6 h-6 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-xs">
      ▶
    </span>
  );
}
