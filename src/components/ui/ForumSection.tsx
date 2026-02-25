import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ForumSectionProps {
  meId: Id<"users">;
  meRole: "admin" | "pastor" | "member";
}

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

type Post = {
  _id: Id<"forumPosts">;
  title: string;
  body: string;
  authorId: Id<"users">;
  authorName: string;
  authorRole: string;
  createdAt: number;
  pinned?: boolean;
  replyCount: number;
};

function PostCard({
  post,
  meId,
  meRole,
}: {
  post: Post;
  meId: Id<"users">;
  meRole: "admin" | "pastor" | "member";
}) {
  const navigate = useNavigate();
  const deletePost = useMutation(api.forum.deletePost);
  const togglePin = useMutation(api.forum.togglePin);

  const canDelete = post.authorId === meId || meRole === "admin";

  function goToPost() {
    navigate(`/comunidade/${post._id}`);
  }

  return (
    <div
      onClick={goToPost}
      className={`bg-slate-900 border rounded-2xl overflow-hidden transition-colors cursor-pointer hover:border-slate-700 ${
        post.pinned ? "border-amber-400/40" : "border-slate-800"
      }`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5">
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
            <h3 className="text-white font-semibold text-lg mt-1">{post.title}</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed line-clamp-2">{post.body}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pl-12">
          <button
            onClick={(e) => { e.stopPropagation(); goToPost(); }}
            className="text-slate-500 hover:text-amber-400 text-xs transition-colors"
          >
            {post.replyCount > 0
              ? `${post.replyCount} resposta${post.replyCount > 1 ? "s" : ""}`
              : "Responder"}
          </button>
          {meRole === "admin" && (
            <button
              onClick={(e) => { e.stopPropagation(); togglePin({ postId: post._id, requesterId: meId }); }}
              className="text-slate-600 hover:text-amber-400 text-xs transition-colors"
            >
              {post.pinned ? "Desafixar" : "Fixar"}
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); deletePost({ postId: post._id, requesterId: meId }); }}
              className="text-slate-600 hover:text-red-400 text-xs transition-colors"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForumSection({ meId, meRole }: ForumSectionProps) {
  const [showNewPost, setShowNewPost] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const posts = useQuery(api.forum.getPosts);
  const createPost = useMutation(api.forum.createPost);

  // Sort: pinned first, then newest
  const sorted = posts
    ? [...posts].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      })
    : [];

  async function handleCreate() {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    await createPost({ authorId: meId, title, body });
    setTitle("");
    setBody("");
    setShowNewPost(false);
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Comunidade</h2>
          <p className="text-slate-400 text-sm mt-0.5">Tire dúvidas e compartilhe reflexões com a turma.</p>
        </div>
        <button
          onClick={() => setShowNewPost((v) => !v)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          + Nova Publicação
        </button>
      </div>

      {/* New post form */}
      {showNewPost && (
        <div className="bg-slate-900 border border-amber-400/20 rounded-2xl p-5 space-y-3">
          <h3 className="text-white font-semibold">Nova Publicação</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da sua publicação"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Escreva sua pergunta ou comentário..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-400/50 transition-colors"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowNewPost(false); setTitle(""); setBody(""); }}
              className="text-slate-500 hover:text-slate-300 text-sm px-4 py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting || !title.trim() || !body.trim()}
              className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
            >
              {submitting ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {posts === undefined && (
        <div className="text-slate-500 text-sm text-center py-8">Carregando publicações...</div>
      )}
      {sorted.length === 0 && posts !== undefined && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-600 text-sm">
          Nenhuma publicação ainda. Seja o primeiro a compartilhar!
        </div>
      )}
      <div className="space-y-3">
        {sorted.map((post) => (
          <PostCard key={post._id} post={post} meId={meId} meRole={meRole} />
        ))}
      </div>
    </div>
  );
}
