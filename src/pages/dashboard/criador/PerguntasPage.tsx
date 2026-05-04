import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { brandPanelClass, brandPanelSoftClass, cn } from '@/lib/brand'
import { EmptyChatIllustration } from '@/components/ui/EmptyIllustration'

type Filter = 'pending' | 'answered' | 'all'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const iconChat = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
)

export default function PerguntasPage() {
  const [filter, setFilter] = useState<Filter>('pending')
  const entries = useQuery(api.courseQuestions.listForCreator, { filter })
  const answer = useMutation(api.courseQuestions.answer)
  const remove = useMutation(api.courseQuestions.remove)

  const [answeringId, setAnsweringId] = useState<Id<'courseQuestions'> | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmitAnswer(id: Id<'courseQuestions'>) {
    if (saving || !answerText.trim()) return
    setSaving(true)
    try {
      await answer({ id, answer: answerText.trim() })
      setAnsweringId(null)
      setAnswerText('')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: Id<'courseQuestions'>) {
    if (!window.confirm('Apagar esta pergunta? Esta ação é irreversível.')) return
    await remove({ id })
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'pending', label: 'Pendentes' },
    { id: 'answered', label: 'Respondidas' },
    { id: 'all', label: 'Todas' },
  ]

  const loading = entries === undefined
  const isEmpty = !loading && (entries?.length ?? 0) === 0

  return (
    <DashboardPageShell
      eyebrow="Professor"
      title="Perguntas dos alunos"
      description="Dúvidas privadas enviadas pelos seus alunos. Respostas ficam visíveis apenas para quem perguntou."
    >
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-semibold transition-all',
              filter === f.id
                ? 'border-[#F37E20]/40 bg-[#F37E20]/15 text-[#F2BD8A]'
                : 'border-white/8 bg-white/[0.03] text-white/56 hover:bg-white/[0.06]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={cn('p-8 text-center text-sm text-white/42', brandPanelClass)}>
          <div className="inline-flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-[#F37E20] animate-spin" />
            Carregando perguntas...
          </div>
        </div>
      ) : isEmpty ? (
        <DashboardEmptyState
          illustration={<EmptyChatIllustration />}
          icon={iconChat}
          title={filter === 'pending' ? 'Nenhuma pergunta pendente' : 'Nenhuma pergunta ainda'}
          description={
            filter === 'pending'
              ? 'Quando um aluno enviar uma dúvida privada, ela vai aparecer aqui para você responder.'
              : 'Assim que receber perguntas dos seus alunos, elas aparecem nesta tela.'
          }
        />
      ) : (
        <div className="space-y-4">
          {entries?.map((entry) => {
            const isAnswered = Boolean(entry.answeredAt)
            const isAnswering = answeringId === entry._id
            return (
              <div key={entry._id} className={cn('p-5', brandPanelClass)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {entry.studentAvatarUrl ? (
                      <img
                        src={entry.studentAvatarUrl}
                        alt={entry.studentName}
                        className="h-10 w-10 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F37E20]/16 bg-[#F37E20]/10">
                        <span className="text-xs font-semibold text-[#F2BD8A]">
                          {entry.studentName.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{entry.studentName}</p>
                      <p className="text-xs text-white/42">
                        {formatDate(entry.askedAt)} · {entry.courseTitle}
                        {entry.lessonTitle && ` · ${entry.lessonTitle}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      isAnswered
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                        : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                    )}
                  >
                    {isAnswered ? 'Respondida' : 'Pendente'}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/42">Pergunta</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/78">
                    {entry.question}
                  </p>
                </div>

                {isAnswered && entry.answer && (
                  <div className={cn('mt-4 p-3', brandPanelSoftClass)}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#F2BD8A]">Sua resposta</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/82">
                      {entry.answer}
                    </p>
                    <p className="mt-2 text-xs text-white/42">
                      {entry.answeredAt ? formatDate(entry.answeredAt) : ''}
                    </p>
                  </div>
                )}

                {!isAnswered && (
                  <div className="mt-4">
                    {isAnswering ? (
                      <>
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          maxLength={4000}
                          placeholder="Sua resposta para o aluno..."
                          className="min-h-[100px] w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-6 text-white placeholder-white/36 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-white/42">{answerText.length} / 4.000</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAnsweringId(null)
                                setAnswerText('')
                              }}
                              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/56 hover:bg-white/[0.04]"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubmitAnswer(entry._id)}
                              disabled={saving || !answerText.trim()}
                              className="rounded-xl bg-[#F37E20] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#e06e10] disabled:opacity-60"
                            >
                              {saving ? 'Enviando...' : 'Enviar resposta'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAnsweringId(entry._id)
                            setAnswerText('')
                          }}
                          className="rounded-xl bg-[#F37E20] px-4 py-2 text-xs font-bold text-white hover:bg-[#e06e10]"
                        >
                          Responder
                        </button>
                        {entry.lessonId && (
                          <Link
                            to={`/dashboard/cursos/${entry.courseId}/modulos`}
                            className="text-xs font-semibold text-white/56 hover:text-white"
                          >
                            Abrir curso
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(entry._id)}
                          className="ml-auto text-xs font-semibold text-white/42 hover:text-red-400"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
