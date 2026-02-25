import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import PastorLayout from "../../components/pastor/PastorLayout";

interface QuestionDraft {
  question: string;
  options: string[];
  correctIndex: number;
}

function emptyQuestion(): QuestionDraft {
  return { question: "", options: ["", "", "", ""], correctIndex: 0 };
}

export default function PastorQuizBuilderPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const lesson = useQuery(api.lessons.getLesson, { lessonId: lessonId as Id<"lessons"> });
  const existingQuiz = useQuery(api.quizzes.getQuizByLesson, { lessonId: lessonId as Id<"lessons"> });
  const upsertQuiz = useMutation(api.quizzes.upsertQuiz);

  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existingQuiz) {
      setQuestions(existingQuiz.questions.map((q) => ({ ...q, options: [...q.options] })));
    }
  }, [existingQuiz]);

  function updateQuestion(qi: number, field: keyof QuestionDraft, value: string | number) {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qi] = { ...updated[qi], [field]: value };
      return updated;
    });
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qi].options];
      opts[oi] = value;
      updated[qi] = { ...updated[qi], options: opts };
      return updated;
    });
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(qi: number) {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== qi));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    for (const q of questions) {
      if (!q.question.trim()) return alert("Todas as perguntas devem ter texto.");
      for (const opt of q.options) {
        if (!opt.trim()) return alert("Todas as opções devem ser preenchidas.");
      }
    }

    setSaving(true);
    await upsertQuiz({
      lessonId: lessonId as Id<"lessons">,
      questions: questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
      })),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!lesson) {
    return (
      <PastorLayout title="Quiz Builder">
        <div className="text-slate-400">Carregando...</div>
      </PastorLayout>
    );
  }

  return (
    <PastorLayout
      title={`Quiz — ${lesson.title}`}
      actions={
        <button
          onClick={() => navigate(`/pastor/cursos/${courseId}`)}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Voltar ao Curso
        </button>
      }
    >
      <form onSubmit={handleSave} className="space-y-6">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Pergunta {qi + 1}</h3>
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                disabled={questions.length === 1}
                className="text-slate-500 hover:text-red-400 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Remover
              </button>
            </div>

            <input
              type="text"
              placeholder="Digite a pergunta..."
              value={q.question}
              onChange={(e) => updateQuestion(qi, "question", e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
            />

            <div className="space-y-2">
              <p className="text-slate-500 text-xs">Opções — clique no círculo para marcar a correta</p>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qi, "correctIndex", oi)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                      q.correctIndex === oi
                        ? "border-green-400 bg-green-400"
                        : "border-slate-600 hover:border-slate-400"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder={`Opção ${oi + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    required
                    className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              ))}
              <p className="text-slate-600 text-xs pt-1">
                Resposta correta: <span className="text-green-400">Opção {q.correctIndex + 1}</span>
              </p>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-slate-700 hover:border-amber-400/50 text-slate-500 hover:text-amber-400 rounded-2xl py-4 text-sm font-medium transition-colors"
        >
          + Adicionar Pergunta
        </button>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            {saving ? "Salvando..." : "Salvar Quiz"}
          </button>
          {saved && <span className="text-green-400 text-sm">Quiz salvo com sucesso!</span>}
          <span className="text-slate-500 text-sm">
            {questions.length} pergunta{questions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </form>
    </PastorLayout>
  );
}
