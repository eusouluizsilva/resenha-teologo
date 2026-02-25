import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface LessonCommentsProps {
  lessonId: Id<"lessons">;
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

interface CommentItemProps {
  comment: {
    _id: Id<"comments">;
    body: string;
    authorName: string;
    authorRole: string;
    authorId: Id<"users">;
    createdAt: number;
    lessonId: Id<"lessons">;
    parentId?: Id<"comments">;
  };
  meId: Id<"users">;
  meRole: "admin" | "pastor" | "member";
  depth?: number;
}

function CommentItem({ comment, meId, meRole, depth = 0 }: CommentItemProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const replies = useQuery(api.comments.getReplies, { parentId: comment._id });
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);

  const canDelete = comment.authorId === meId || meRole === "admin";

  async function submitReply() {
    if (!replyText.trim()) return;
    setSubmitting(true);
    await addComment({
      lessonId: comment.lessonId,
      authorId: meId,
      body: replyText,
      parentId: comment._id,
    });
    setReplyText("");
    setShowReplyBox(false);
    setSubmitting(false);
  }

  return (
    <div className={depth > 0 ? "ml-6 border-l border-slate-800 pl-4" : ""}>
      <div className="flex gap-3 group">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5">
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-medium">{comment.authorName}</span>
            <RoleBadge role={comment.authorRole} />
            <span className="text-slate-600 text-xs">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{comment.body}</p>
          <div className="flex items-center gap-3 pt-0.5">
            {depth === 0 && (
              <button
                onClick={() => setShowReplyBox((v) => !v)}
                className="text-slate-500 hover:text-amber-400 text-xs transition-colors"
              >
                Responder
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => deleteComment({ commentId: comment._id, requesterId: meId })}
                className="text-slate-600 hover:text-red-400 text-xs transition-colors opacity-0 group-hover:opacity-100"
              >
                Excluir
              </button>
            )}
          </div>

          {showReplyBox && (
            <div className="mt-2 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder="Escreva sua resposta..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-400/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitReply}
                  disabled={submitting || !replyText.trim()}
                  className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Responder
                </button>
                <button
                  onClick={() => { setShowReplyBox(false); setReplyText(""); }}
                  className="text-slate-500 hover:text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              meId={meId}
              meRole={meRole}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LessonComments({ lessonId, meId, meRole }: LessonCommentsProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const comments = useQuery(api.comments.getCommentsByLesson, { lessonId });
  const addComment = useMutation(api.comments.addComment);

  // Only top-level comments (no parentId)
  const topLevel = comments?.filter((c) => c.parentId === undefined) ?? [];

  async function handleSubmit() {
    if (!body.trim()) return;
    setSubmitting(true);
    await addComment({ lessonId, authorId: meId, body });
    setBody("");
    setSubmitting(false);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h2 className="text-white font-semibold text-lg">
          Perguntas e Comentários
          {topLevel.length > 0 && (
            <span className="ml-2 text-slate-500 text-sm font-normal">({topLevel.length})</span>
          )}
        </h2>
      </div>

      <div className="p-6 space-y-5">
        {/* New comment form */}
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Tem uma dúvida ou comentário sobre esta aula?"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-400/50 transition-colors"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !body.trim()}
              className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
            >
              {submitting ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>

        {/* Comment list */}
        {comments === undefined && (
          <p className="text-slate-500 text-sm">Carregando comentários...</p>
        )}
        {topLevel.length === 0 && comments !== undefined && (
          <p className="text-slate-600 text-sm text-center py-4">
            Nenhum comentário ainda. Seja o primeiro a perguntar!
          </p>
        )}
        <div className="space-y-5">
          {topLevel.map((comment) => (
            <CommentItem key={comment._id} comment={comment} meId={meId} meRole={meRole} />
          ))}
        </div>
      </div>
    </div>
  );
}
