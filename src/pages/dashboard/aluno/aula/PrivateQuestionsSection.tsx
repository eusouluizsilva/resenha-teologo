import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'

function QuestionCard({
  entry,
  isEditing,
  editingText,
  onStartEdit,
  onCancelEdit,
  onChangeEditing,
  onSaveEdit,
  onDelete,
}: {
  entry: {
    _id: Id<'courseQuestions'>
    question: string
    answer?: string
    askedAt: number
    answeredAt?: number
  }
  isEditing: boolean
  editingText: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onChangeEditing: (v: string) => void
  onSaveEdit: () => void
  onDelete: () => void
}) {
  const isAnswered = Boolean(entry.answeredAt)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
          isAnswered
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        )}>
          {isAnswered ? 'Respondida' : 'Aguardando resposta'}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(entry.askedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Sua pergunta</p>
        {isEditing ? (
          <>
            <textarea
              value={editingText}
              onChange={(e) => onChangeEditing(e.target.value)}
              maxLength={2000}
              className="mt-1 min-h-[80px] w-full rounded-lg border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onSaveEdit}
                className="rounded-lg bg-[#F37E20] px-3 py-1 text-xs font-bold text-white hover:bg-[#e06e10]"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{entry.question}</p>
        )}
      </div>

      {isAnswered && entry.answer && (
        <div className="mt-3 rounded-lg border border-[#F37E20]/20 bg-[#F37E20]/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#F37E20]">Resposta do professor</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-800">{entry.answer}</p>
          {entry.answeredAt && (
            <p className="mt-2 text-xs text-gray-400">
              {new Date(entry.answeredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {!isAnswered && !isEditing && (
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <button type="button" onClick={onStartEdit} className="font-semibold hover:text-gray-700">
            Editar
          </button>
          <button type="button" onClick={onDelete} className="font-semibold hover:text-red-500">
            Remover
          </button>
        </div>
      )}
    </div>
  )
}

export function PrivateQuestionsSection({
  courseId,
  lessonId,
  isCreator,
}: {
  courseId: Id<'courses'>
  lessonId: Id<'lessons'>
  isCreator: boolean
}) {
  const entries = useQuery(
    api.courseQuestions.listMyByCourse,
    isCreator ? 'skip' : { courseId }
  )
  const ask = useMutation(api.courseQuestions.ask)
  const edit = useMutation(api.courseQuestions.editQuestion)
  const remove = useMutation(api.courseQuestions.remove)

  const [question, setQuestion] = useState('')
  const [saving, setSaving] = useState(false)
  const [attachToLesson, setAttachToLesson] = useState(true)
  const [editingId, setEditingId] = useState<Id<'courseQuestions'> | null>(null)
  const [editingText, setEditingText] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isCreator) return null

  async function handleAsk() {
    if (saving || !question.trim()) return
    setSaving(true)
    setError(null)
    try {
      await ask({
        courseId,
        lessonId: attachToLesson ? lessonId : undefined,
        question: question.trim(),
      })
      setQuestion('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a pergunta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit(id: Id<'courseQuestions'>) {
    if (!editingText.trim()) return
    setError(null)
    try {
      await edit({ id, question: editingText.trim() })
      setEditingId(null)
      setEditingText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar a edição.')
    }
  }

  async function handleDelete(id: Id<'courseQuestions'>) {
    if (!window.confirm('Remover esta pergunta?')) return
    setError(null)
    try {
      await remove({ id })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível remover a pergunta.')
    }
  }

  const lessonEntries = (entries ?? []).filter((e) => e.lessonId === lessonId)
  const otherEntries = (entries ?? []).filter((e) => e.lessonId !== lessonId)

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h.01M15.75 8.25h.01M8.25 14.25c.883 1.2 2.174 2 3.75 2s2.867-.8 3.75-2M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">Perguntas privadas ao professor</h2>
          <p className="text-xs text-gray-500">
            Envie uma dúvida em particular. Só você e o professor veem. Respostas aparecem aqui quando estiverem prontas.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Descreva sua dúvida para o professor. Seja específico, isso ajuda a resposta."
          maxLength={2000}
          className="min-h-[90px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={attachToLesson}
              onChange={(e) => setAttachToLesson(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#F37E20] focus:ring-[#F37E20]"
            />
            Vincular a esta aula
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{question.length} / 2.000</span>
            <button
              type="button"
              onClick={handleAsk}
              disabled={saving || !question.trim()}
              className="rounded-xl bg-[#F37E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-60"
            >
              {saving ? 'Enviando...' : 'Enviar pergunta'}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      {entries === undefined ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-xs text-gray-400">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
          Carregando...
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {lessonEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Nesta aula
              </h3>
              {lessonEntries.map((entry) => (
                <QuestionCard
                  key={entry._id}
                  entry={entry}
                  isEditing={editingId === entry._id}
                  editingText={editingText}
                  onStartEdit={() => {
                    setEditingId(entry._id)
                    setEditingText(entry.question)
                  }}
                  onCancelEdit={() => {
                    setEditingId(null)
                    setEditingText('')
                  }}
                  onChangeEditing={(v) => setEditingText(v)}
                  onSaveEdit={() => handleSaveEdit(entry._id)}
                  onDelete={() => handleDelete(entry._id)}
                />
              ))}
            </div>
          )}

          {otherEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Outras aulas deste curso
              </h3>
              {otherEntries.map((entry) => (
                <QuestionCard
                  key={entry._id}
                  entry={entry}
                  isEditing={editingId === entry._id}
                  editingText={editingText}
                  onStartEdit={() => {
                    setEditingId(entry._id)
                    setEditingText(entry.question)
                  }}
                  onCancelEdit={() => {
                    setEditingId(null)
                    setEditingText('')
                  }}
                  onChangeEditing={(v) => setEditingText(v)}
                  onSaveEdit={() => handleSaveEdit(entry._id)}
                  onDelete={() => handleDelete(entry._id)}
                />
              ))}
            </div>
          )}

          {lessonEntries.length === 0 && otherEntries.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-xs text-gray-400">
              Você ainda não enviou perguntas neste curso.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
