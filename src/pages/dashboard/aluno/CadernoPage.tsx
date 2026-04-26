import { useMemo, useState } from 'react'
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
import { downloadNotebookPdf } from '@/lib/notebookPdf'
import { useCurrentAppUser } from '@/lib/currentUser'

function formatDate(ts?: number) {
  if (!ts) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ts))
}

type NotebookSummary = {
  _id: Id<'notebooks'>
  title: string
  createdAt: number
  updatedAt?: number
}

function NotebookCard({
  notebook,
  selected,
  onSelect,
}: {
  notebook: NotebookSummary
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full flex-col gap-2 rounded-[1.35rem] border px-5 py-4 text-left transition-all duration-200',
        selected
          ? 'border-[#F37E20]/30 bg-[#F37E20]/8 shadow-[0_20px_48px_rgba(243,126,32,0.08)]'
          : 'border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]',
      )}
    >
      <p className={cn('font-display text-base font-semibold', selected ? 'text-white' : 'text-white/86')}>
        {notebook.title}
      </p>
      <p className="text-xs text-white/48">
        Atualizado em {formatDate(notebook.updatedAt ?? notebook.createdAt)}
      </p>
    </button>
  )
}

function NotebookDetail({ notebookId, notebookTitle, studentName }: { notebookId: Id<'notebooks'>; notebookTitle: string; studentName: string }) {
  const entries = useQuery(api.notebooks.listNotebookEntries, { notebookId })
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!entries) return []
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.lessonTitle.toLowerCase().includes(q) ||
        e.courseTitle.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q),
    )
  }, [entries, query])

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
    <div className={cn('flex flex-col overflow-hidden', brandPanelClass)}>
      <div className="flex flex-col gap-4 border-b border-white/6 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">Caderno</p>
          <h3 className="mt-1 truncate font-display text-xl font-bold text-white">{notebookTitle}</h3>
          <p className="mt-0.5 text-sm text-white/48">
            {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
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
          Exportar PDF
        </button>
      </div>

      <div className="border-b border-white/6 px-6 py-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por aula, curso ou conteúdo..."
          className={brandInputClass}
        />
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/48">
            Este caderno ainda não tem entradas. Entre em uma aula e escreva suas anotações.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/48">Nenhuma entrada corresponde à busca.</p>
        ) : (
          <ul className="space-y-4">
            {filtered.map((entry) => (
              <li key={entry._id} className="rounded-[1.2rem] border border-white/8 bg-white/[0.02] p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <p className="font-display text-base font-semibold text-white">{entry.lessonTitle}</p>
                  <p className="text-xs text-white/36">{formatDate(entry.updatedAt ?? entry._creationTime)}</p>
                </div>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-white/36">{entry.courseTitle}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/78">{entry.content}</p>
                {entry.courseSlug && entry.lessonSlug && (
                  <Link
                    to={`/dashboard/meus-cursos/${entry.courseSlug}/aula/${entry.lessonSlug}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F2BD8A] hover:text-[#F37E20]"
                  >
                    Abrir aula
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function CadernoPage() {
  const { currentUser } = useCurrentAppUser()
  const notebooks = useQuery(api.notebooks.listMine, {})
  const createNotebook = useMutation(api.notebooks.create)
  const [selectedId, setSelectedId] = useState<Id<'notebooks'> | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [busy, setBusy] = useState(false)

  const isLoading = notebooks === undefined
  const list = notebooks ?? []

  const selected = selectedId ? list.find((n) => n._id === selectedId) : list[0]

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || busy) return
    setBusy(true)
    try {
      const id = await createNotebook({ title: newTitle.trim() })
      setSelectedId(id)
      setNewTitle('')
      setCreating(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Caderno digital"
      description="Suas anotações organizadas por caderno. Crie cadernos por assunto ou curso e exporte em PDF quando quiser."
      maxWidthClass="max-w-6xl"
    >
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
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
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
                  maxLength={80}
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
