import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import AdminLayout from "../../components/admin/AdminLayout";

type Verse = {
  _id: Id<"dailyVerses">;
  reference: string;
  text: string;
  imageUrl?: string;
  date: string;
  active: boolean;
};

const today = new Date().toISOString().slice(0, 10);

export default function AdminVersesPage() {
  const { user } = useUser();
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");
  const verses = useQuery(api.dailyVerses.listAll);
  const createVerse = useMutation(api.dailyVerses.create);
  const updateVerse = useMutation(api.dailyVerses.update);
  const removeVerse = useMutation(api.dailyVerses.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"dailyVerses"> | null>(null);
  const [reference, setReference] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [date, setDate] = useState(today);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingId(null);
    setReference("");
    setText("");
    setImageUrl("");
    setDate(today);
    setActive(true);
    setShowForm(true);
  }

  function openEdit(v: Verse) {
    setEditingId(v._id);
    setReference(v.reference);
    setText(v.text);
    setImageUrl(v.imageUrl ?? "");
    setDate(v.date);
    setActive(v.active);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !text.trim() || !date) return;
    setSaving(true);
    if (editingId) {
      await updateVerse({
        verseId: editingId,
        reference: reference.trim(),
        text: text.trim(),
        imageUrl: imageUrl.trim() || undefined,
        date,
        active,
        requesterId: me?._id,
      });
    } else {
      await createVerse({
        reference: reference.trim(),
        text: text.trim(),
        imageUrl: imageUrl.trim() || undefined,
        date,
        active,
        requesterId: me?._id,
      });
    }
    setSaving(false);
    closeForm();
  }

  async function handleToggleActive(v: Verse) {
    await updateVerse({ verseId: v._id, active: !v.active, requesterId: me?._id });
  }

  async function handleDelete(id: Id<"dailyVerses">) {
    if (!confirm("Excluir este versículo?")) return;
    await removeVerse({ verseId: id, requesterId: me?._id });
  }

  return (
    <AdminLayout
      title="Versículo do Dia"
      actions={
        <button
          onClick={openCreate}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Novo Versículo
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
              {editingId ? "Editar Versículo" : "Novo Versículo"}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Referência (ex: João 3:16) *"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <textarea
                placeholder="Texto do versículo *"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
              <input
                type="url"
                placeholder="URL da imagem de fundo (opcional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-slate-400 text-xs mb-1">Data *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none mt-4">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-amber-400 w-4 h-4"
                  />
                  Ativo
                </label>
              </div>
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
                <th className="px-5 py-3 font-medium">Referência</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {verses === undefined && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              )}
              {verses?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Nenhum versículo cadastrado ainda.
                  </td>
                </tr>
              )}
              {verses?.map((v) => (
                <tr key={v._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{v.reference}</p>
                    <p className="text-slate-500 text-xs line-clamp-1 mt-0.5">{v.text}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{v.date}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(v)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        v.active
                          ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {v.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4 justify-end">
                      <button
                        onClick={() => openEdit(v)}
                        className="text-slate-400 hover:text-amber-400 text-xs transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
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
