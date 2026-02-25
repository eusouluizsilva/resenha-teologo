import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import AdminLayout from "../../components/admin/AdminLayout";

type Announcement = {
  _id: Id<"announcements">;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  active: boolean;
  createdAt: number;
};

export default function AdminAnnouncementsPage() {
  const { user } = useUser();
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");
  const announcements = useQuery(api.announcements.listAll);
  const createAnnouncement = useMutation(api.announcements.create);
  const updateAnnouncement = useMutation(api.announcements.update);
  const removeAnnouncement = useMutation(api.announcements.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"announcements"> | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setLinkUrl("");
    setActive(true);
    setShowForm(true);
  }

  function openEdit(item: Announcement) {
    setEditingId(item._id);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setImageUrl(item.imageUrl);
    setLinkUrl(item.linkUrl ?? "");
    setActive(item.active);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;
    setSaving(true);

    if (editingId) {
      await updateAnnouncement({
        announcementId: editingId,
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || undefined,
        active,
        requesterId: me?._id,
      });
    } else {
      await createAnnouncement({
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || undefined,
        active,
        requesterId: me?._id,
      });
    }

    setSaving(false);
    closeForm();
  }

  async function handleToggleActive(item: Announcement) {
    await updateAnnouncement({
      announcementId: item._id,
      active: !item.active,
      requesterId: me?._id,
    });
  }

  async function handleDelete(id: Id<"announcements">) {
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;
    await removeAnnouncement({ announcementId: id, requesterId: me?._id });
  }

  return (
    <AdminLayout
      title="Anúncios"
      actions={
        <button
          onClick={openCreate}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Novo Aviso
        </button>
      }
    >
      <div className="space-y-6">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-amber-400/30 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-white font-semibold">
              {editingId ? "Editar Aviso" : "Novo Aviso"}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Título *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
              <input
                type="url"
                placeholder="URL da imagem *"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <input
                type="url"
                placeholder="URL do link (opcional)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="accent-amber-400 w-4 h-4"
                />
                Ativo (visível no painel)
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
              >
                {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
              </button>
              <button
                type="button"
                onClick={closeForm}
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
                <th className="px-5 py-3 font-medium">Imagem</th>
                <th className="px-5 py-3 font-medium">Título</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Criado em</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {announcements === undefined && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Carregando avisos...
                  </td>
                </tr>
              )}
              {announcements?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Nenhum aviso criado ainda.
                  </td>
                </tr>
              )}
              {announcements?.map((item) => (
                <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-10 object-cover rounded-lg"
                    />
                  </td>
                  <td className="px-5 py-3 text-white font-medium max-w-xs">
                    <p className="truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-slate-500 text-xs truncate">{item.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        item.active
                          ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {item.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4 justify-end">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-slate-400 hover:text-amber-400 text-xs transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
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
