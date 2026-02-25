import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Navbar from "../../components/ui/Navbar";

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 font-medium">
        Professor
      </span>
    );
  }
  if (role === "pastor") {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-medium">
        Pastor
      </span>
    );
  }
  return null;
}

export default function CommunityPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useUser();
  const navigate = useNavigate();

  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");
  const post = useQuery(
    api.forum.getPost,
    postId ? { postId: postId as Id<"forumPosts"> } : "skip"
  );
  const replies = useQuery(
    api.forum.getReplies,
    postId ? { postId: postId as Id<"forumPosts"> } : "skip"
  );

  const addReply = useMutation(api.forum.addReply);
  const deleteReply = useMutation(api.forum.deleteReply);
  const deletePost = useMutation(api.forum.deletePost);
  const togglePin = useMutation(api.forum.togglePin);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleReply() {
    if (!text.trim() || !me || !postId) return;
    setSubmitting(true);
    await addReply({ postId: postId as Id<"forumPosts">, authorId: me._id, body: text });
    setText("");
    setSubmitting(false);
  }

  async function handleDeletePost() {
    if (!me || !postId) return;
    await deletePost({ postId: postId as Id<"forumPosts">, requesterId: me._id });
    navigate("/comunidade");
  }

  if (!me || post === undefined) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Carregando...
        </div>
      </>
    );
  }

  if (post === null) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Publicação não encontrada.{" "}
          <Link to="/comunidade" className="text-amber-400 hover:underline ml-1">
            Voltar
          </Link>
        </div>
      </>
    );
  }

  const canDelete = post.authorId === me._id || me.role === "admin";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 py-10 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            to="/comunidade"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-400 text-sm transition-colors"
          >
            ← Comunidade
          </Link>

          {/* Post */}
          <div
            className={`bg-slate-900 border rounded-2xl p-6 ${
              post.pinned ? "border-amber-400/40" : "border-slate-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {post.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-medium">{post.authorName}</span>
                  <RoleBadge role={post.authorRole} />
                  {post.pinned && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      Fixado
                    </span>
                  )}
                  <span className="text-slate-600 text-xs ml-auto">{formatDate(post.createdAt)}</span>
                </div>
                <h1 className="text-white font-bold text-2xl mt-2">{post.title}</h1>
                <p className="text-slate-300 text-base mt-3 leading-relaxed whitespace-pre-wrap">{post.body}</p>
              </div>
            </div>

            {/* Admin / author actions */}
            {(me.role === "admin" || canDelete) && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800 pl-12">
                {me.role === "admin" && (
                  <button
                    onClick={() =>
                      togglePin({ postId: postId as Id<"forumPosts">, requesterId: me._id })
                    }
                    className="text-slate-500 hover:text-amber-400 text-sm transition-colors"
                  >
                    {post.pinned ? "Desafixar" : "Fixar"}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeletePost}
                    className="text-slate-500 hover:text-red-400 text-sm transition-colors"
                  >
                    Excluir publicação
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Replies */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">
              {replies?.length ?? 0} resposta{(replies?.length ?? 0) !== 1 ? "s" : ""}
            </h2>

            {replies === undefined && (
              <p className="text-slate-500 text-sm">Carregando respostas...</p>
            )}

            <div className="space-y-4">
              {replies?.map((r) => (
                <div key={r._id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                    {r.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium">{r.authorName}</span>
                      <RoleBadge role={r.authorRole} />
                      <span className="text-slate-600 text-xs">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="text-slate-300 text-sm mt-1 leading-relaxed">{r.body}</p>
                  </div>
                  {(r.authorId === me._id || me.role === "admin") && (
                    <button
                      onClick={() => deleteReply({ replyId: r._id, requesterId: me._id })}
                      className="text-slate-600 hover:text-red-400 text-xs transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Reply form */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {me.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                  placeholder="Escreva uma resposta..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                />
                <button
                  onClick={handleReply}
                  disabled={submitting || !text.trim()}
                  className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
