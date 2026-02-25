import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Navbar from "../../components/ui/Navbar";
import YouTubePlayer from "../../components/ui/YouTubePlayer";
import LessonComments from "../../components/ui/LessonComments";
import { extractYouTubeId } from "../../lib/levels";

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { user } = useUser();
  const navigate = useNavigate();

  const lesson = useQuery(api.lessons.getLesson, { lessonId: lessonId as Id<"lessons"> });
  const quiz = useQuery(api.quizzes.getQuizByLesson, { lessonId: lessonId as Id<"lessons"> });
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");
  const existingProgress = useQuery(
    api.progress.getLessonProgress,
    me ? { userId: me._id, lessonId: lessonId as Id<"lessons"> } : "skip"
  );

  const completeLesson = useMutation(api.progress.completeLesson);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  // Quiz is unlocked if already completed OR after watching 90% of the video
  const [videoUnlocked, setVideoUnlocked] = useState(false);

  if (!lesson) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Carregando aula...
        </div>
      </>
    );
  }

  const youtubeId = extractYouTubeId(lesson.videoUrl);
  const alreadyCompleted = existingProgress?.completed === true;
  // If the lesson was already completed, no need to watch the video again
  const quizUnlocked = alreadyCompleted || videoUnlocked;

  function handleSelectAnswer(questionIndex: number, optionIndex: number) {
    if (submitted || alreadyCompleted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  async function handleSubmitQuiz() {
    if (!me || !quiz) return;

    const correctCount = quiz.questions.reduce((acc, q, i) => {
      return selectedAnswers[i] === q.correctIndex ? acc + 1 : acc;
    }, 0);

    const result = await completeLesson({
      userId: me._id,
      lessonId: lessonId as Id<"lessons">,
      quizScore: correctCount,
      totalQuestions: quiz.questions.length,
    });

    setSubmitted(true);
    setXpEarned(result?.xpEarned ?? null);
  }

  const allAnswered = quiz ? Object.keys(selectedAnswers).length === quiz.questions.length : false;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 py-10 px-6">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Navegação */}
          <Link
            to={`/cursos/${courseId}`}
            className="text-slate-500 hover:text-amber-400 text-sm transition-colors"
          >
            ← Voltar ao Curso
          </Link>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>

          {/* Player YouTube */}
          {youtubeId ? (
            <YouTubePlayer
              videoId={youtubeId}
              onUnlocked={() => setVideoUnlocked(true)}
              unlockThreshold={0.9}
            />
          ) : (
            <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
              <span className="text-4xl">🎬</span>
              <p>URL de vídeo inválida</p>
            </div>
          )}

          {/* Quiz */}
          {quiz && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-white font-semibold text-lg">Quiz da Aula</h2>
                {alreadyCompleted && (
                  <span className="text-green-400 text-sm font-medium bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
                    Aula Concluída ✓
                  </span>
                )}
              </div>

              {/* Locked overlay */}
              {!quizUnlocked ? (
                <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                  <span className="text-4xl">🔒</span>
                  <p className="text-white font-semibold">Quiz bloqueado</p>
                  <p className="text-slate-400 text-sm max-w-xs">
                    Assista pelo menos 90% do vídeo para liberar as perguntas.
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* XP ganho */}
                  {(submitted || alreadyCompleted) && xpEarned !== null && (
                    <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 text-amber-400 font-semibold text-sm">
                      +{xpEarned} XP ganhos!
                    </div>
                  )}

                  <div className="space-y-6">
                    {quiz.questions.map((q, qi) => {
                      const userAnswer = selectedAnswers[qi];
                      const isAnswered = userAnswer !== undefined;
                      const showResult = submitted || alreadyCompleted;

                      return (
                        <div key={qi} className="space-y-3">
                          <p className="text-white font-medium">
                            {qi + 1}. {q.question}
                          </p>
                          <div className="space-y-2">
                            {q.options.map((option, oi) => {
                              let style = "border-slate-700 text-slate-300 hover:border-amber-400/50 cursor-pointer";

                              if (showResult) {
                                if (oi === q.correctIndex) {
                                  style = "border-green-500 bg-green-500/10 text-green-300 cursor-default";
                                } else if (oi === userAnswer && oi !== q.correctIndex) {
                                  style = "border-red-500 bg-red-500/10 text-red-300 cursor-default";
                                } else {
                                  style = "border-slate-700 text-slate-500 cursor-default";
                                }
                              } else if (isAnswered && oi === userAnswer) {
                                style = "border-amber-400 bg-amber-400/10 text-amber-300 cursor-pointer";
                              }

                              return (
                                <button
                                  key={oi}
                                  onClick={() => handleSelectAnswer(qi, oi)}
                                  disabled={submitted || alreadyCompleted}
                                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${style}`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botão enviar */}
                  {!submitted && !alreadyCompleted && (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={!allAnswered}
                      className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold py-3 rounded-xl transition-colors"
                    >
                      {allAnswered ? "Enviar Respostas" : "Responda todas as perguntas"}
                    </button>
                  )}

                  {/* Resultado e próxima aula */}
                  {(submitted || alreadyCompleted) && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => navigate(`/cursos/${courseId}`)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-colors"
                      >
                        Voltar ao Curso
                      </button>
                      <button
                        onClick={() => navigate(`/cursos/${courseId}`)}
                        className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold py-3 rounded-xl transition-colors"
                      >
                        Próxima Aula →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sem quiz */}
          {quiz === null && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">
              Nenhum quiz disponível para esta aula.
            </div>
          )}

          {/* Comentários */}
          {me && (
            <LessonComments
              lessonId={lessonId as Id<"lessons">}
              meId={me._id}
              meRole={me.role}
            />
          )}

        </div>
      </main>
    </>
  );
}
