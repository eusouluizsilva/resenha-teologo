import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import AdminLayout from "../../components/admin/AdminLayout";
import { extractYouTubeId } from "../../lib/levels";

function WelcomeVideoPreview({ url }: { url: string }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return <p className="text-red-400 text-xs">URL inválida: {url}</p>;
  }
  return (
    <div className="aspect-video w-full max-w-lg rounded-xl overflow-hidden border border-slate-700">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Vídeo de Boas-Vindas"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

export default function AdminCourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const course = useQuery(api.courses.getCourse, { courseId: courseId as Id<"courses"> });
  const modules = useQuery(api.modules.getModulesByCourse, { courseId: courseId as Id<"courses"> });

  const updateCourse = useMutation(api.courses.updateCourse);
  const createModule = useMutation(api.modules.createModule);
  const updateModule = useMutation(api.modules.updateModule);
  const deleteModule = useMutation(api.modules.deleteModule);

  // Course edit state
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [courseWelcomeVideo, setCourseWelcomeVideo] = useState("");

  // New module state
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  function startEditCourse() {
    if (!course) return;
    setCourseTitle(course.title);
    setCourseDesc(course.description);
    setCourseThumbnail(course.thumbnailUrl ?? "");
    setCourseWelcomeVideo(course.welcomeVideoUrl ?? "");
    setEditingCourse(true);
  }

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    await updateCourse({
      courseId: courseId as Id<"courses">,
      title: courseTitle.trim(),
      description: courseDesc.trim(),
      thumbnailUrl: courseThumbnail.trim() || undefined,
      welcomeVideoUrl: courseWelcomeVideo.trim() || undefined,
    });
    setEditingCourse(false);
  }

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    await createModule({
      courseId: courseId as Id<"courses">,
      title: newModuleTitle.trim(),
      order: (modules?.length ?? 0) + 1,
    });
    setNewModuleTitle("");
    setAddingModule(false);
  }

  async function handleDeleteModule(moduleId: Id<"modules">) {
    if (!confirm("Excluir este módulo e todas as suas aulas?")) return;
    await deleteModule({ moduleId });
  }

  if (!course || !modules) {
    return (
      <AdminLayout title="Editor de Curso">
        <div className="text-slate-400">Carregando...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={course.title}
      actions={
        <button
          onClick={() => navigate("/admin/cursos")}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Voltar aos Cursos
        </button>
      }
    >
      <div className="space-y-8">

        {/* Course Info */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Informações do Curso</h2>
            {!editingCourse && (
              <button
                onClick={startEditCourse}
                className="text-slate-400 hover:text-amber-400 text-sm transition-colors"
              >
                Editar
              </button>
            )}
          </div>
          {editingCourse ? (
            <form onSubmit={handleSaveCourse} className="space-y-3">
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
                placeholder="Título"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <textarea
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                required
                rows={3}
                placeholder="Descrição"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
              <input
                type="url"
                value={courseThumbnail}
                onChange={(e) => setCourseThumbnail(e.target.value)}
                placeholder="URL da thumbnail (opcional)"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Vídeo de Boas-Vindas (YouTube)</label>
                <input
                  type="text"
                  value={courseWelcomeVideo}
                  onChange={(e) => setCourseWelcomeVideo(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                />
                <p className="text-slate-600 text-xs mt-1">Exibido no topo da página do curso para todos os membros.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCourse(false)}
                  className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">{course.description}</p>
              {course.thumbnailUrl && (
                <p className="text-slate-600 text-xs truncate">{course.thumbnailUrl}</p>
              )}
              {course.welcomeVideoUrl ? (
                <div className="space-y-1.5">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Vídeo de Boas-Vindas</p>
                  <WelcomeVideoPreview url={course.welcomeVideoUrl} />
                </div>
              ) : (
                <p className="text-slate-600 text-xs italic">Nenhum vídeo de boas-vindas configurado.</p>
              )}
              <div className="pt-1">
                <button
                  onClick={() =>
                    updateCourse({
                      courseId: courseId as Id<"courses">,
                      status: course.status === "published" ? "draft" : "published",
                    })
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    course.status === "published"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  {course.status === "published" ? "Publicado — clique para despublicar" : "Rascunho — clique para publicar"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Modules */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Módulos</h2>
            <button
              onClick={() => setAddingModule((v) => !v)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              + Novo Módulo
            </button>
          </div>

          {addingModule && (
            <form
              onSubmit={handleAddModule}
              className="flex gap-3 items-center bg-slate-900 border border-amber-400/30 rounded-xl px-4 py-3"
            >
              <input
                autoFocus
                type="text"
                placeholder="Nome do módulo"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                required
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setAddingModule(false)}
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                ✕
              </button>
            </form>
          )}

          {modules.length === 0 && (
            <p className="text-slate-500 text-sm py-4">Nenhum módulo ainda. Adicione um módulo acima.</p>
          )}

          <div className="space-y-4">
            {modules.map((mod) => (
              <ModuleSection
                key={mod._id}
                moduleId={mod._id}
                title={mod.title}
                courseId={courseId as Id<"courses">}
                onDelete={() => handleDeleteModule(mod._id)}
                onRename={(title) => updateModule({ moduleId: mod._id, title })}
                navigate={navigate}
              />
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function ModuleSection({
  moduleId,
  title,
  courseId,
  onDelete,
  onRename,
  navigate,
}: {
  moduleId: Id<"modules">;
  title: string;
  courseId: Id<"courses">;
  onDelete: () => void;
  onRename: (title: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const lessons = useQuery(api.lessons.getLessonsByModule, { moduleId });
  const createLesson = useMutation(api.lessons.createLesson);
  const updateLesson = useMutation(api.lessons.updateLesson);
  const deleteLesson = useMutation(api.lessons.deleteLesson);

  const [editing, setEditing] = useState(false);
  const [moduleTitle, setModuleTitle] = useState(title);
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<Id<"lessons"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVideo, setEditVideo] = useState("");

  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonTitle.trim() || !lessonVideoUrl.trim()) return;
    await createLesson({
      moduleId,
      title: lessonTitle.trim(),
      videoUrl: lessonVideoUrl.trim(),
      order: (lessons?.length ?? 0) + 1,
    });
    setLessonTitle("");
    setLessonVideoUrl("");
    setAddingLesson(false);
  }

  function startEditLesson(lessonId: Id<"lessons">, currentTitle: string, currentVideo: string) {
    setEditingLessonId(lessonId);
    setEditTitle(currentTitle);
    setEditVideo(currentVideo);
  }

  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLessonId) return;
    await updateLesson({ lessonId: editingLessonId, title: editTitle, videoUrl: editVideo });
    setEditingLessonId(null);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Module header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRename(moduleTitle);
              setEditing(false);
            }}
            className="flex gap-2 flex-1"
          >
            <input
              autoFocus
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400"
            />
            <button type="submit" className="text-amber-400 text-sm px-2">Salvar</button>
            <button type="button" onClick={() => setEditing(false)} className="text-slate-500 text-sm px-2">✕</button>
          </form>
        ) : (
          <h3 className="text-white font-semibold">{title}</h3>
        )}
        <div className="flex items-center gap-3 shrink-0">
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-amber-400 text-xs transition-colors">
              Renomear
            </button>
          )}
          <button onClick={onDelete} className="text-slate-500 hover:text-red-400 text-xs transition-colors">
            Excluir
          </button>
        </div>
      </div>

      {/* Lessons */}
      <ul className="divide-y divide-slate-800">
        {lessons === undefined && (
          <li className="px-5 py-3 text-slate-500 text-sm">Carregando aulas...</li>
        )}
        {lessons?.map((lesson) => (
          <li key={lesson._id} className="px-5 py-3">
            {editingLessonId === lesson._id ? (
              <form onSubmit={handleSaveLesson} className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={editVideo}
                  onChange={(e) => setEditVideo(e.target.value)}
                  required
                  placeholder="URL do YouTube"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400"
                />
                <div className="flex gap-2">
                  <button type="submit" className="text-amber-400 text-xs px-2 py-1">Salvar</button>
                  <button type="button" onClick={() => setEditingLessonId(null)} className="text-slate-500 text-xs px-2 py-1">Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white text-sm">{lesson.title}</p>
                  <p className="text-slate-600 text-xs truncate max-w-xs mt-0.5">{lesson.videoUrl}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => navigate(`/admin/cursos/${courseId}/aulas/${lesson._id}/quiz`)}
                    className="text-slate-400 hover:text-amber-400 text-xs transition-colors"
                  >
                    Quiz
                  </button>
                  <button
                    onClick={() => startEditLesson(lesson._id, lesson.title, lesson.videoUrl)}
                    className="text-slate-400 hover:text-amber-400 text-xs transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Excluir esta aula?")) return;
                      await deleteLesson({ lessonId: lesson._id });
                    }}
                    className="text-slate-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}

        {/* Add lesson form */}
        {addingLesson ? (
          <li className="px-5 py-4">
            <form onSubmit={handleAddLesson} className="space-y-2">
              <input
                autoFocus
                type="text"
                placeholder="Título da aula"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
              <input
                type="text"
                placeholder="URL do YouTube"
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Adicionar Aula
                </button>
                <button
                  type="button"
                  onClick={() => setAddingLesson(false)}
                  className="text-slate-400 hover:text-white text-sm px-3 py-1.5 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </li>
        ) : (
          <li className="px-5 py-3">
            <button
              onClick={() => setAddingLesson(true)}
              className="text-slate-500 hover:text-amber-400 text-sm transition-colors"
            >
              + Adicionar Aula
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
