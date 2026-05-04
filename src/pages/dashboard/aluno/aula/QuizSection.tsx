import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'
import type { QuizData, QuizProgressState } from './types'

export function QuizSection({
  quiz,
  courseId,
  lessonId,
  progress,
  quizUnlocked,
  allowRetry,
  reachedThreshold,
}: {
  quiz: QuizData | null
  courseId: Id<'courses'>
  lessonId: Id<'lessons'>
  progress: QuizProgressState | null
  quizUnlocked: boolean
  allowRetry: boolean
  reachedThreshold: boolean
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [requestingRetry, setRequestingRetry] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitQuiz = useMutation(api.student.submitQuiz)
  const requestRetry = useMutation(api.student.requestQuizRetry)

  const alreadyAnswered =
    progress?.quizScore !== undefined && !progress?.quizRetryPending
  const retryPending = Boolean(progress?.quizRetryPending)
  const passed = (progress?.quizPassed ?? false) && alreadyAnswered

  async function handleSubmit() {
    if (!quiz) return
    const answeredAll = quiz.questions.every((q) => answers[q.id])
    if (!answeredAll) {
      setError('Responda todas as perguntas antes de enviar.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitQuiz({
        lessonId,
        courseId,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      })
      setAnswers({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar quiz')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRetry() {
    setRequestingRetry(true)
    setError(null)
    try {
      await requestRetry({ lessonId, courseId })
      setAnswers({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao solicitar retry')
    } finally {
      setRequestingRetry(false)
    }
  }

  // ─── Estado: aula sem quiz ──
  if (!quiz) return null

  // ─── Cabeçalho comum ──
  const header = (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <div>
        <h2 className="font-display text-lg font-bold text-gray-800">
          Quiz da aula
        </h2>
        <p className="text-xs text-gray-500">
          Responda para registrar seu progresso e avançar para o certificado.
        </p>
      </div>
    </div>
  )

  // ─── Estado: retry pendente (aluno pediu refazer, precisa reassistir) ──
  if (retryPending) {
    return (
      <section className="mt-10">
        {header}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-bold text-amber-800">Reassistir a aula</p>
          <p className="mt-1 text-sm text-amber-700">
            Você solicitou refazer este quiz. Assista novamente até 95% para
            liberar uma nova tentativa.
          </p>
        </div>
      </section>
    )
  }

  // ─── Estado: já respondido e não-pendente ──
  if (alreadyAnswered) {
    const score = progress?.quizScore ?? 0
    return (
      <section className="mt-10">
        {header}
        <div
          className={cn(
            'rounded-2xl border p-6',
            passed
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                passed
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              )}
            >
              {passed ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div>
              <p
                className={cn(
                  'font-bold text-lg',
                  passed ? 'text-emerald-700' : 'text-red-700'
                )}
              >
                {score}%
              </p>
              <p className="text-sm text-gray-600">
                {passed
                  ? 'Aprovado. Avance para a próxima aula.'
                  : 'Abaixo de 70%. Continue estudando.'}
              </p>
            </div>
          </div>

          {quiz.questions.map((q) => (
            <div key={q.id} className="mb-3 last:mb-0">
              <p className="text-sm font-medium text-gray-700 mb-2">{q.text}</p>
              {q.explanation && (
                <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100">
                  {q.explanation}
                </p>
              )}
            </div>
          ))}

          {allowRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={requestingRetry}
              className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:border-[#F37E20]/40 hover:text-[#F37E20] disabled:opacity-60"
            >
              {requestingRetry
                ? 'Preparando retry...'
                : 'Refazer quiz (reassistir a aula primeiro)'}
            </button>
          )}
          {error && <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      </section>
    )
  }

  // ─── Estado: bloqueado (ainda não assistiu 95%) ──
  if (!quizUnlocked) {
    return (
      <section className="mt-10">
        {header}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">
            Quiz bloqueado
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {reachedThreshold
              ? 'Confirmando sua conclusão...'
              : 'Assista pelo menos 95% da aula para destravar o quiz.'}
          </p>
        </div>
      </section>
    )
  }

  // ─── Estado: liberado, ainda não respondido ──
  return (
    <section className="mt-10">
      {header}
      <div className="space-y-4">
        {quiz.questions.map((q, qi) => (
          <div
            key={q.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="mb-3 text-sm font-semibold text-gray-800">
              {qi + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-all',
                    answers[q.id] === opt.id
                      ? 'border-[#F37E20]/40 bg-[#F37E20]/6 text-[#F37E20] font-semibold'
                      : 'border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                    }
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all',
                      answers[q.id] === opt.id
                        ? 'border-[#F37E20] bg-[#F37E20]'
                        : 'border-gray-300'
                    )}
                  >
                    {answers[q.id] === opt.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  {opt.text}
                </label>
              ))}
            </div>
          </div>
        ))}

        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-xl bg-[#F37E20] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-60"
        >
          {submitting ? 'Enviando...' : 'Enviar respostas'}
        </button>
      </div>
    </section>
  )
}
