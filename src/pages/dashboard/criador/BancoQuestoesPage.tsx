import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import {
  DashboardPageShell,
  DashboardEmptyState,
} from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPanelSoftClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import { uuid } from '@/lib/uuid'

type QuestionRow = {
  _id: Id<'questionBank'>
  text: string
  options: { id: string; text: string }[]
  correctOptionId: string
  explanation?: string
  tags?: string[]
  updatedAt: number
}

type DraftOption = { id: string; text: string }
type Draft = {
  text: string
  options: DraftOption[]
  correctOptionId: string
  explanation: string
  tagsRaw: string
}

function uid() {
  return uuid()
}

function emptyDraft(): Draft {
  const optA = { id: uid(), text: '' }
  return {
    text: '',
    options: [
      optA,
      { id: uid(), text: '' },
      { id: uid(), text: '' },
      { id: uid(), text: '' },
    ],
    correctOptionId: optA.id,
    explanation: '',
    tagsRaw: '',
  }
}

function fromRow(row: QuestionRow): Draft {
  return {
    text: row.text,
    options: row.options.map((o) => ({ id: o.id, text: o.text })),
    correctOptionId: row.correctOptionId,
    explanation: row.explanation ?? '',
    tagsRaw: (row.tags ?? []).join(', '),
  }
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
}

function QuestionEditor({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  saving,
  error,
  submitLabel,
}: {
  draft: Draft
  setDraft: React.Dispatch<React.SetStateAction<Draft>>
  onSubmit: () => void
  onCancel: () => void
  saving: boolean
  error: string
  submitLabel: string
}) {
  const canAddOption = draft.options.length < 6
  const canRemoveOption = draft.options.length > 2

  return (
    <div className={cn('space-y-5 p-6', brandPanelClass)}>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/52">Pergunta</label>
        <textarea
          rows={3}
          value={draft.text}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          className={brandInputClass}
          placeholder="Ex.: Qual é o livro mais antigo do Antigo Testamento?"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-medium text-white/52">
            Alternativas (marque a correta)
          </label>
          <span className="text-[11px] text-white/36">{draft.options.length}/6</span>
        </div>
        <div className="space-y-2">
          {draft.options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({ ...d, correctOptionId: opt.id }))
                }
                aria-label={`Marcar alternativa ${idx + 1} como correta`}
                className={cn(
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-all',
                  draft.correctOptionId === opt.id
                    ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                    : 'border-white/10 bg-white/4 text-white/40 hover:border-white/22',
                )}
              >
                {draft.correctOptionId === opt.id ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">{String.fromCharCode(65 + idx)}</span>
                )}
              </button>
              <input
                type="text"
                value={opt.text}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    options: d.options.map((o) =>
                      o.id === opt.id ? { ...o, text: e.target.value } : o,
                    ),
                  }))
                }
                className={brandInputClass}
                placeholder={`Alternativa ${String.fromCharCode(65 + idx)}`}
              />
              {canRemoveOption && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => {
                      const next = d.options.filter((o) => o.id !== opt.id)
                      const correct =
                        d.correctOptionId === opt.id
                          ? next[0]?.id ?? ''
                          : d.correctOptionId
                      return { ...d, options: next, correctOptionId: correct }
                    })
                  }
                  aria-label="Remover alternativa"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/48 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {canAddOption && (
          <button
            type="button"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                options: [...d.options, { id: uid(), text: '' }],
              }))
            }
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-white/10 px-3 py-1.5 text-xs font-medium text-white/56 transition-all hover:border-[#F37E20]/30 hover:text-[#F2BD8A]"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Adicionar alternativa
          </button>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/52">
          Explicação (opcional)
        </label>
        <textarea
          rows={2}
          value={draft.explanation}
          onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
          className={brandInputClass}
          placeholder="Mostrada ao aluno depois que ele responde."
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/52">
          Tags (separadas por vírgula)
        </label>
        <input
          type="text"
          value={draft.tagsRaw}
          onChange={(e) => setDraft((d) => ({ ...d, tagsRaw: e.target.value }))}
          className={brandInputClass}
          placeholder="ex.: antigo testamento, êxodo, profetas"
        />
        <p className="mt-1 text-[11px] text-white/36">
          Usadas para filtrar e reaproveitar perguntas em diferentes aulas.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
        >
          {saving ? 'Salvando...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={cn(brandSecondaryButtonClass, 'px-5 py-2.5 text-sm')}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export function BancoQuestoesPage() {
  const [tagFilter, setTagFilter] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<Id<'questionBank'> | null>(null)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const rows = useQuery(
    api.questionBank.list,
    tagFilter ? { tag: tagFilter } : {},
  ) as QuestionRow[] | undefined
  const tags = useQuery(api.questionBank.listTags, {}) as string[] | undefined

  const createMutation = useMutation(api.questionBank.create)
  const updateMutation = useMutation(api.questionBank.update)
  const removeMutation = useMutation(api.questionBank.remove)

  const correctOptionLabel = useMemo(() => {
    return (row: QuestionRow) => {
      const idx = row.options.findIndex((o) => o.id === row.correctOptionId)
      return idx >= 0 ? String.fromCharCode(65 + idx) : '?'
    }
  }, [])

  function startCreate() {
    setEditingId(null)
    setDraft(emptyDraft())
    setError('')
    setCreating(true)
  }

  function startEdit(row: QuestionRow) {
    setCreating(false)
    setEditingId(row._id)
    setDraft(fromRow(row))
    setError('')
  }

  function cancelEditor() {
    setCreating(false)
    setEditingId(null)
    setError('')
  }

  function validate(d: Draft): string {
    if (d.text.trim().length < 5) return 'Pergunta muito curta.'
    const filledOptions = d.options.filter((o) => o.text.trim().length > 0)
    if (filledOptions.length < 2) return 'Adicione ao menos 2 alternativas com texto.'
    if (!filledOptions.find((o) => o.id === d.correctOptionId)) {
      return 'Escolha uma alternativa correta entre as preenchidas.'
    }
    return ''
  }

  async function handleCreate() {
    const msg = validate(draft)
    if (msg) {
      setError(msg)
      return
    }
    setSaving(true)
    try {
      await createMutation({
        text: draft.text.trim(),
        options: draft.options
          .filter((o) => o.text.trim().length > 0)
          .map((o) => ({ id: o.id, text: o.text.trim() })),
        correctOptionId: draft.correctOptionId,
        explanation: draft.explanation.trim() || undefined,
        tags: parseTags(draft.tagsRaw),
      })
      setCreating(false)
      setDraft(emptyDraft())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar pergunta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!editingId) return
    const msg = validate(draft)
    if (msg) {
      setError(msg)
      return
    }
    setSaving(true)
    try {
      await updateMutation({
        id: editingId,
        text: draft.text.trim(),
        options: draft.options
          .filter((o) => o.text.trim().length > 0)
          .map((o) => ({ id: o.id, text: o.text.trim() })),
        correctOptionId: draft.correctOptionId,
        explanation: draft.explanation.trim() || undefined,
        tags: parseTags(draft.tagsRaw),
      })
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(row: QuestionRow) {
    const preview = row.text.length > 60 ? `${row.text.slice(0, 60)}...` : row.text
    if (!window.confirm(`Excluir pergunta: "${preview}"? Esta ação é irreversível.`)) return
    await removeMutation({ id: row._id })
    if (editingId === row._id) setEditingId(null)
  }

  const showingEditor = creating || editingId !== null
  const editorTitle = creating ? 'Nova pergunta' : 'Editar pergunta'

  return (
    <DashboardPageShell
      eyebrow="Professor"
      title="Banco de questões"
      description="Cadastre perguntas reutilizáveis e organize por tags. Importe direto no quiz da aula sem reescrever tudo."
      actions={
        !showingEditor ? (
          <button
            type="button"
            onClick={startCreate}
            className={brandPrimaryButtonClass}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova pergunta
          </button>
        ) : null
      }
    >
      {showingEditor && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/34">
            {editorTitle}
          </h2>
          <QuestionEditor
            draft={draft}
            setDraft={setDraft}
            onSubmit={creating ? handleCreate : handleUpdate}
            onCancel={cancelEditor}
            saving={saving}
            error={error}
            submitLabel={creating ? 'Criar pergunta' : 'Salvar alterações'}
          />
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className={cn('flex flex-wrap items-center gap-2 p-4', brandPanelSoftClass)}>
          <span className="text-xs font-medium text-white/52">Filtrar por tag:</span>
          <button
            type="button"
            onClick={() => setTagFilter('')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-all',
              tagFilter === ''
                ? 'bg-[#F37E20]/15 text-[#F2BD8A] ring-1 ring-inset ring-[#F37E20]/30'
                : 'bg-white/5 text-white/56 hover:bg-white/10',
            )}
          >
            Todas
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTagFilter(t === tagFilter ? '' : t)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all',
                tagFilter === t
                  ? 'bg-[#F37E20]/15 text-[#F2BD8A] ring-1 ring-inset ring-[#F37E20]/30'
                  : 'bg-white/5 text-white/56 hover:bg-white/10',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {rows === undefined ? (
        <div className={cn('h-32 animate-pulse', brandPanelClass)} />
      ) : rows.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          }
          title={tagFilter ? 'Nenhuma pergunta com essa tag' : 'Seu banco ainda está vazio'}
          description={
            tagFilter
              ? `Tente outra tag ou crie uma nova pergunta com a tag "${tagFilter}".`
              : 'Crie perguntas reutilizáveis aqui e depois importe nos quizzes das suas aulas.'
          }
          action={
            !showingEditor ? (
              <button
                type="button"
                onClick={startCreate}
                className={brandPrimaryButtonClass}
              >
                Criar primeira pergunta
              </button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row._id}
              className={cn('p-5 transition-colors', brandPanelClass)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-6 text-white">{row.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={brandStatusPillClass('success')}>
                      Resposta {correctOptionLabel(row)}
                    </span>
                    <span className={brandStatusPillClass('neutral')}>
                      {row.options.length} alternativas
                    </span>
                    {row.tags?.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#F37E20]/8 px-2.5 py-0.5 text-[11px] font-medium text-[#F2BD8A]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-white/72 transition-all hover:border-white/22 hover:bg-white/8"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(row)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  )
}
