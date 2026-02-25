import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminCoursesPage() {
  const { user } = useUser();
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");
  const courses = useQuery(api.courses.listAll);
  const createCourse = useMutation(api.courses.createCourse);
  const updateCourse = useMutation(api.courses.updateCourse);
  const deleteCourse = useMutation(api.courses.deleteCourse);
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    const id = await createCourse({
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      createdBy: me?._id,
    });
    setSaving(false);
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setShowForm(false);
    navigate(`/admin/cursos/${id}`);
  }

  async function handleToggleStatus(courseId: Id<"courses">, status: "draft" | "published") {
    await updateCourse({
      courseId,
      status: status === "published" ? "draft" : "published",
      requesterId: me?._id,
    });
  }

  async function handleDelete(courseId: Id<"courses">) {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;
    await deleteCourse({ courseId, requesterId: me?._id });
  }

  return (
    <AdminLayout
      title="Cursos"
      actions={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Novo Curso
        </button>
      }
    >
      <div className="space-y-6">
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-slate-900 border border-amber-400/30 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-white font-semibold">Novo Curso</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Título do curso"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <textarea
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
              <input
                type="url"
                placeholder="URL da thumbnail (opcional)"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
              >
                {saving ? "Salvando..." : "Criar e Editar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="px-5 py-3 font-medium">Título</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Criado em</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {courses === undefined && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Carregando cursos...
                  </td>
                </tr>
              )}
              {courses?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Nenhum curso criado ainda.
                  </td>
                </tr>
              )}
              {courses?.map((course) => (
                <tr key={course._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{course.title}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleStatus(course._id, course.status)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        course.status === "published"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {course.status === "published" ? "Publicado" : "Rascunho"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {new Date(course.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4 justify-end">
                      <button
                        onClick={() => navigate(`/admin/cursos/${course._id}`)}
                        className="text-slate-400 hover:text-amber-400 text-xs transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(course._id)}
                        className="text-slate-500 hover:text-red-400 text-xs transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
