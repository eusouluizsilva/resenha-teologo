import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  cn,
} from '@/lib/brand'

type QuizOption = { id: string; text: string }
type QuizQuestion = {
  id: string
  text: string
  options: QuizOption[]
  correctId: string
  explanation: string
}

type BankRow = {
  _id: Id<'questionBank'>
  text: string
  options: { id: string; text: string }[]
  correctOptionId: string
  explanation?: string
  tags?: string[]
}

function uid() {
  return crypto.randomUUID()
}

function rowToQuiz(row: BankRow): QuizQuestion {
  // Cria novos ids locais para opções, mas preserva qual era a correta.
  const newOptions = row.options.map((o) => ({ id: uid(), text: o.text }))
  const oldCorrectIdx = row.options.findIndex((o) => o.id === row.correctOptionId)
  const correctId = newOptions[oldCorrectIdx]?.id ?? newOptions[0]?.id ?? ''
  return {
    id: uid(),
    text: row.text,
    options: newOptions,
    correctId,
    explanation: row.explanation ?? '',
  }
}

export function QuestionBankImportDialog({
  open,
  onClose,
  onImport,
  alreadyAddedTexts,
  remainingSlots,
}: {
  open: boolean
  onClose: () => void
  onImport: (questions: QuizQuestion[]) => void
  alreadyAddedTexts: Set<string>
  remainingSlots: number
}) {
  const [tagFilter, setTagFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const rows = useQuery(
    api.questionBank.list,
    open ? (tagFilter ? { tag: tagFilter } : {}) : 'skip',
  ) as BankRow[] | undefined
  const tags = useQuery(api.questionBank.listTags, open ? {} : 'skip') as string[] | undefined

  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      setSearch('')
      setTagFilter('')
    }
  }, [open])

  const filteredRows = useMemo(() => {
    if (!rows) return []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.text.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.includes(q)),
    )
  }, [rows, search])

  if (!open) return null

  const overLimit = selected.size > remainingSlots

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleImport() {
    if (!rows) return
    if (overLimit) return
    const picked = rows.filter((r) => selected.has(r._id)).map(rowToQuiz)
    if (picked.length === 0) return
    onImport(picked)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importar perguntas do banco"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          'flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden p-6',
          brandPanelClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Importar do banco de questões
            </h2>
            <p className="mt-1 text-sm text-white/56">
              Selecione perguntas para incluir neste quiz. Você pode editar depois.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-white/56 transition-all hover:border-white/22 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por texto ou tag"
            className="flex-1 min-w-[200px] rounded-2xl border border-white/10 bg-[#10161E] px-4 py-2.5 text-sm text-white placeholder-white/28 focus:border-[#F37E20]/55 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/10"
          />
        </div>

        {tags && tags.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
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

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {rows === undefined ? (
            <div className="h-32 animate-pulse rounded-2xl bg-white/4" />
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-10 text-center">
              <p className="text-sm text-white/56">
                {rows.length === 0
                  ? 'Seu banco está vazio. Crie perguntas em "Banco de questões" no menu lateral.'
                  : 'Nenhum resultado para esta busca/filtro.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredRows.map((row) => {
                const isAdded = alreadyAddedTexts.has(row.text.trim())
                const isChecked = selected.has(row._id)
                return (
                  <li key={row._id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-all',
                        isChecked
                          ? 'border-[#F37E20]/35 bg-[#F37E20]/8'
                          : 'border-white/8 bg-white/[0.025] hover:border-white/22',
                        isAdded && !isChecked && 'opacity-60',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(row._id)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[#F37E20] focus:ring-[#F37E20]/30"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-5 text-white">{row.text}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-white/48">
                            {row.options.length} alternativas
                          </span>
                          {isAdded && (
                            <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              Já no quiz
                            </span>
                          )}
                          {row.tags?.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-[#F37E20]/8 px-2 py-0.5 text-[10px] font-medium text-[#F2BD8A]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
          <p className="text-xs text-white/48">
            {selected.size} selecionada(s)
            {remainingSlots < 99 && ` · ${remainingSlots} vaga(s) no quiz`}
          </p>
          {overLimit && (
            <p className="text-xs text-red-300">
              Excede o limite de {remainingSlots} pergunta(s) restantes.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(brandSecondaryButtonClass, 'px-4 py-2 text-sm')}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={selected.size === 0 || overLimit}
              className={cn(brandPrimaryButtonClass, 'px-4 py-2 text-sm')}
            >
              Importar {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
