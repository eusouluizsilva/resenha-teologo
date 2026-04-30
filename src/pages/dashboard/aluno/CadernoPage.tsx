import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPanelSoftClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  cn,
} from '@/lib/brand'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { downloadEntryPdf, downloadNotebookPdf } from '@/lib/notebookPdf'
import { useCurrentAppUser } from '@/lib/currentUser'

function formatDate(ts?: number) {
  if (!ts) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ts))
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

type SortMode = 'updated_desc' | 'updated_asc' | 'lesson_asc'

type NotebookSummary = {
  _id: Id<'notebooks'>
  title: string
  createdAt: number
  updatedAt?: number
}

type TimestampEntry = {
  _id: Id<'lessonTimestamps'>
  timestampSeconds: number
  note: string
}

type EnrichedEntry = {
  _id: Id<'notebookEntries'>
  _creationTime: number
  lessonTitle: string
  lessonSlug?: string
  courseTitle: string
  courseSlug?: string
  content: string
  updatedAt?: number
  timestamps?: TimestampEntry[]
}

function formatVideoTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function NotebookCard({
  notebook,
  selected,
  onSelect,
  onRename,
  onDelete,
}: {
  notebook: NotebookSummary
  selected: boolean
  onSelect: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group relative flex w-full flex-col gap-2 rounded-[1.35rem] border px-5 py-4 text-left transition-all duration-200',
        selected
          ? 'border-[#F37E20]/30 bg-[#F37E20]/8 shadow-[0_20px_48px_rgba(243,126,32,0.08)]'
          : 'border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]',
      )}
    >
      <button type="button" onClick={onSelect} className="flex flex-col gap-1 text-left">
        <p className={cn('font-display text-base font-semibold', selected ? 'text-white' : 'text-white/86')}>
          {notebook.title}
        </p>
        <p className="text-xs text-white/48">
          Atualizado em {formatDate(notebook.updatedAt ?? notebook.createdAt)}
        </p>
      </button>
      {selected && (
        <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onRename}
            aria-label="Renomear caderno"
            className="rounded-md p-1.5 text-white/56 hover:bg-white/8 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Apagar caderno"
            className="rounded-md p-1.5 text-white/56 hover:bg-red-500/16 hover:text-red-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function ReadingMode({
  entry,
  studentName,
  onClose,
}: {
  entry: EnrichedEntry
  studentName: string
  onClose: () => void
}) {
  // Trava scroll da página enquanto o modal está aberto
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Esc fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const words = countWords(entry.content)

  function handleExport() {
    void downloadEntryPdf({
      studentName,
      entry: {
        lessonTitle: entry.lessonTitle,
        courseTitle: entry.courseTitle,
        content: entry.content,
        updatedAt: entry.updatedAt ?? entry._creationTime,
      },
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-[#F7F5F2] text-[#111827]"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/8 bg-[#F7F5F2]/95 px-4 py-3 backdrop-blur sm:px-8">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#111827]/70 hover:bg-black/5 hover:text-[#111827]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-black/5"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-10 sm:px-8">
        <article className="mx-auto max-w-[680px] font-serif">
          <p className="text-xs uppercase tracking-[0.2em] text-[#F37E20]">{entry.courseTitle}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-[#111827] sm:text-4xl">
            {entry.lessonTitle}
          </h1>
          <p className="mt-3 text-sm text-[#6B7280]">
            {formatDate(entry.updatedAt ?? entry._creationTime)} · {words} {words === 1 ? 'palavra' : 'palavras'}
          </p>
          <div className="mt-8 whitespace-pre-wrap text-[18px] leading-[1.8] text-[#1F2937]">
            {entry.content || '(sem conteúdo)'}
          </div>
          {entry.timestamps && entry.timestamps.length > 0 && (
            <div className="mt-10 rounded-2xl border border-black/8 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
                Anotações por momento
              </p>
              <ul className="mt-4 space-y-4">
                {entry.timestamps.map((t) => (
                  <li key={t._id} className="flex gap-4 text-base leading-7 text-[#1F2937]">
                    <span className="mt-1 shrink-0 rounded-full border border-[#F37E20]/30 bg-[#F37E20]/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#F37E20]">
                      {formatVideoTimestamp(t.timestampSeconds)}
                    </span>
                    <span className="whitespace-pre-wrap font-serif">{t.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {entry.courseSlug && entry.lessonSlug && (
            <Link
              to={`/dashboard/meus-cursos/${entry.courseSlug}/aula/${entry.lessonSlug}`}
              className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F37E20] hover:text-[#E06A10]"
            >
              Voltar à aula
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          )}
        </article>
      </div>
    </div>
  )
}

function NotebookDetail({
  notebookId,
  notebookTitle,
  studentName,
}: {
  notebookId: Id<'notebooks'>
  notebookTitle: string
  studentName: string
}) {
  const entries = useQuery(api.notebooks.listNotebookEntries, { notebookId }) as
    | EnrichedEntry[]
    | undefined
  const [query, setQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [sortMode, setSortMode] = useState<SortMode>('updated_desc')
  const [readingEntry, setReadingEntry] = useState<EnrichedEntry | null>(null)

  const courseOptions = useMemo(() => {
    if (!entries) return [] as { slug: string; title: string }[]
    const seen = new Map<string, string>()
    for (const e of entries) {
      const key = e.courseSlug ?? e.courseTitle
      if (!seen.has(key)) seen.set(key, e.courseTitle)
    }
    return Array.from(seen, ([slug, title]) => ({ slug, title })).sort((a, b) =>
      a.title.localeCompare(b.title, 'pt-BR'),
    )
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return [] as EnrichedEntry[]
    const q = query.trim().toLowerCase()
    let list = entries
    if (q) {
      list = list.filter(
        (e) =>
          e.lessonTitle.toLowerCase().includes(q) ||
          e.courseTitle.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q),
      )
    }
    if (courseFilter !== 'all') {
      list = list.filter((e) => (e.courseSlug ?? e.courseTitle) === courseFilter)
    }
    const sorted = [...list]
    if (sortMode === 'updated_desc') {
      sorted.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    } else if (sortMode === 'updated_asc') {
      sorted.sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0))
    } else {
      sorted.sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle, 'pt-BR'))
    }
    return sorted
  }, [entries, query, courseFilter, sortMode])

  const totalWords = useMemo(() => {
    if (!entries) return 0
    return entries.reduce((acc, e) => acc + countWords(e.content), 0)
  }, [entries])

  function handleExport() {
    if (!entries || entries.length === 0) return
    void downloadNotebookPdf({
      notebookTitle,
      studentName,
      entries: entries.map((e) => ({
        lessonTitle: e.lessonTitle,
        courseTitle: e.courseTitle,
        content: e.content,
        updatedAt: e.updatedAt ?? e._creationTime,
      })),
    })
  }

  if (entries === undefined) {
    return (
      <div className={cn('animate-pulse p-6', brandPanelClass)}>
        <div className="h-4 w-32 rounded-full bg-white/8" />
        <div className="mt-4 h-3 w-2/3 rounded-full bg-white/6" />
      </div>
    )
  }

  return (
    <>
      <div className={cn('flex flex-col overflow-hidden', brandPanelClass)}>
        <div className="flex flex-col gap-4 border-b border-white/6 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">Caderno</p>
            <h3 className="mt-1 truncate font-display text-xl font-bold text-white">{notebookTitle}</h3>
            <p className="mt-0.5 text-sm text-white/48">
              {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
              {totalWords > 0 && (
                <>
                  {' · '}
                  {totalWords.toLocaleString('pt-BR')} {totalWords === 1 ? 'palavra' : 'palavras'}
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={entries.length === 0}
            className={cn(brandSecondaryButtonClass, 'disabled:opacity-40 disabled:cursor-not-allowed')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar caderno
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-white/6 px-6 py-4 sm:flex-row sm:items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por aula, curso ou conteúdo..."
            className={cn(brandInputClass, 'flex-1')}
          />
          {courseOptions.length > 1 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className={cn(brandInputClass, 'sm:w-56')}
            >
              <option value="all">Todos os cursos</option>
              {courseOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className={cn(brandInputClass, 'sm:w-44')}
          >
            <option value="updated_desc">Mais recentes</option>
            <option value="updated_asc">Mais antigas</option>
            <option value="lesson_asc">Aula (A-Z)</option>
          </select>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/48">
              Este caderno ainda não tem entradas. Entre em uma aula e escreva suas anotações.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/48">Nenhuma entrada corresponde aos filtros.</p>
          ) : (
            <ul className="space-y-4">
              {filtered.map((entry) => {
                const words = countWords(entry.content)
                return (
                  <li
                    key={entry._id}
                    className="group rounded-[1.2rem] border border-white/8 bg-white/[0.02] p-5 transition-colors hover:border-white/16"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <p className="font-display text-base font-semibold text-white">{entry.lessonTitle}</p>
                      <p className="text-xs text-white/36">
                        {formatDate(entry.updatedAt ?? entry._creationTime)}
                        {' · '}
                        {words} {words === 1 ? 'palavra' : 'palavras'}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-white/36">{entry.courseTitle}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/78">{entry.content}</p>
                    {entry.timestamps && entry.timestamps.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/36">
                          Anotações por momento ({entry.timestamps.length})
                        </p>
                        <ul className="mt-2 space-y-2">
                          {entry.timestamps.map((t) => (
                            <li key={t._id} className="flex gap-3 text-sm leading-6 text-white/72">
                              <span className="mt-0.5 shrink-0 rounded-full border border-[#F37E20]/24 bg-[#F37E20]/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#F2BD8A]">
                                {formatVideoTimestamp(t.timestampSeconds)}
                              </span>
                              <span className="whitespace-pre-wrap">{t.note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setReadingEntry(entry)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F2BD8A] hover:text-[#F37E20]"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Modo leitura
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void downloadEntryPdf({
                            studentName,
                            entry: {
                              lessonTitle: entry.lessonTitle,
                              courseTitle: entry.courseTitle,
                              content: entry.content,
                              updatedAt: entry.updatedAt ?? entry._creationTime,
                            },
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/56 hover:text-white"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        PDF
                      </button>
                      {entry.courseSlug && entry.lessonSlug && (
                        <Link
                          to={`/dashboard/meus-cursos/${entry.courseSlug}/aula/${entry.lessonSlug}`}
                          className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-white/56 hover:text-white"
                        >
                          Abrir aula
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      {readingEntry && (
        <ReadingMode
          entry={readingEntry}
          studentName={studentName}
          onClose={() => setReadingEntry(null)}
        />
      )}
    </>
  )
}

export function CadernoPage() {
  const { currentUser } = useCurrentAppUser()
  const notebooks = useQuery(api.notebooks.listMine, {})
  const createNotebook = useMutation(api.notebooks.create)
  const renameNotebook = useMutation(api.notebooks.rename)
  const removeNotebook = useMutation(api.notebooks.remove)
  const [selectedId, setSelectedId] = useState<Id<'notebooks'> | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLoading = notebooks === undefined
  const list = notebooks ?? []

  const selected = selectedId ? list.find((n) => n._id === selectedId) : list[0]

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const id = await createNotebook({ title: newTitle.trim() })
      setSelectedId(id)
      setNewTitle('')
      setCreating(false)
    } finally {
      setBusy(false)
    }
  }

  async function handleRename(notebook: NotebookSummary) {
    const newName = window.prompt('Renomear caderno', notebook.title)
    if (!newName || newName.trim() === notebook.title) return
    setError(null)
    try {
      await renameNotebook({ id: notebook._id, title: newName.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao renomear')
    }
  }

  async function handleDelete(notebook: NotebookSummary) {
    if (!window.confirm(`Apagar o caderno "${notebook.title}"?`)) return
    setError(null)
    try {
      await removeNotebook({ id: notebook._id })
      if (selectedId === notebook._id) setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao apagar')
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Caderno digital"
      description="Suas anotações organizadas por caderno. Filtre por curso, busque, exporte em PDF e leia no modo focado."
      maxWidthClass="max-w-6xl"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {isLoading ? (
        <div className={cn('animate-pulse p-6', brandPanelClass)}>
          <div className="h-4 w-32 rounded-full bg-white/8" />
        </div>
      ) : list.length === 0 && !creating ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="Ainda sem cadernos"
          description="Crie seu primeiro caderno para organizar anotações por assunto. Cada aula vira uma entrada dentro do caderno ativo."
          action={
            <button type="button" onClick={() => setCreating(true)} className={brandPrimaryButtonClass}>
              Criar meu primeiro caderno
            </button>
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]"
        >
          <motion.aside variants={fadeUp} className={cn('flex flex-col gap-4 p-5', brandPanelSoftClass)}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">
                Meus cadernos
              </p>
              <button
                type="button"
                onClick={() => setCreating((v) => !v)}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/78 hover:border-[#F37E20]/30 hover:text-white"
              >
                {creating ? 'Fechar' : 'Novo'}
              </button>
            </div>

            {creating && (
              <form onSubmit={handleCreate} className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nome do caderno"
                  className={brandInputClass}
                  maxLength={50}
                  autoFocus
                />
                <button type="submit" disabled={!newTitle.trim() || busy} className={brandPrimaryButtonClass}>
                  {busy ? 'Criando...' : 'Criar caderno'}
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2">
              {list.map((nb) => (
                <NotebookCard
                  key={nb._id}
                  notebook={nb}
                  selected={(selected?._id ?? null) === nb._id}
                  onSelect={() => setSelectedId(nb._id)}
                  onRename={() => void handleRename(nb)}
                  onDelete={() => void handleDelete(nb)}
                />
              ))}
            </div>
          </motion.aside>

          <motion.section variants={fadeUp}>
            {selected ? (
              <NotebookDetail
                notebookId={selected._id}
                notebookTitle={selected.title}
                studentName={currentUser?.name ?? 'Aluno'}
              />
            ) : (
              <div className={cn('flex h-full min-h-[240px] items-center justify-center p-6', brandPanelClass)}>
                <p className="text-sm text-white/48">Selecione um caderno para ver as entradas.</p>
              </div>
            )}
          </motion.section>
        </motion.div>
      )}
    </DashboardPageShell>
  )
}
