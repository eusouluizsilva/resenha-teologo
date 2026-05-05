import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'

export function NotebookSection({
  lessonId,
}: {
  lessonId: Id<'lessons'>
}) {
  const notebooks = useQuery(api.notebooks.listMine, {}) ?? undefined
  const [activeNotebookId, setActiveNotebookId] = useState<Id<'notebooks'> | null>(
    null
  )
  const [newNotebookOpen, setNewNotebookOpen] = useState(false)
  const [newNotebookTitle, setNewNotebookTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  )
  const [isDirty, setIsDirty] = useState(false)

  const createNotebook = useMutation(api.notebooks.create)
  const renameNotebook = useMutation(api.notebooks.rename)
  const removeNotebook = useMutation(api.notebooks.remove)
  const upsertEntry = useMutation(api.notebooks.upsertEntry)

  const [editingNotebookId, setEditingNotebookId] = useState<Id<'notebooks'> | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [notebookActionError, setNotebookActionError] = useState<string | null>(null)
  const [view, setView] = useState<'lesson' | 'all'>('lesson')

  // Seleciona caderno padrão quando carrega lista.
  useEffect(() => {
    if (!notebooks || activeNotebookId) return
    if (notebooks.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveNotebookId(notebooks[0]._id)
    }
  }, [notebooks, activeNotebookId])

  const entry = useQuery(
    api.notebooks.getEntry,
    activeNotebookId
      ? { notebookId: activeNotebookId, lessonId }
      : 'skip'
  )

  const allEntries = useQuery(
    api.notebooks.listNotebookEntries,
    activeNotebookId && view === 'all' ? { notebookId: activeNotebookId } : 'skip'
  )

  // Sincroniza conteúdo quando troca de caderno ou quando entrada carrega do servidor.
  useEffect(() => {
    if (entry === undefined) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(entry?.content ?? '')
    setTags(entry?.tags ?? [])

    setIsDirty(false)

    setSaveStatus('idle')
  }, [entry, activeNotebookId])

  // Auto-save com debounce de 1.5s após última alteração (texto ou tags).
  useEffect(() => {
    if (!isDirty || !activeNotebookId) return
    const handle = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await upsertEntry({
          notebookId: activeNotebookId,
          lessonId,
          content,
          tags,
        })
        setSaveStatus('saved')
        setIsDirty(false)
      } catch {
        setSaveStatus('idle')
      }
    }, 1500)
    return () => clearTimeout(handle)
  }, [content, tags, isDirty, activeNotebookId, lessonId, upsertEntry])

  // Mesma normalização do server para evitar duplicatas no chip ao adicionar.
  function normalizeTagClient(raw: string): string {
    return raw
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 24)
  }

  function addTag(raw: string) {
    const t = normalizeTagClient(raw)
    if (!t) return
    if (tags.includes(t)) {
      setTagInput('')
      return
    }
    if (tags.length >= 8) return
    setTags([...tags, t])
    setTagInput('')
    setIsDirty(true)
    setSaveStatus('idle')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
    setIsDirty(true)
    setSaveStatus('idle')
  }

  async function handleCreateNotebook() {
    const title = newNotebookTitle.trim()
    if (!title) return
    const id = await createNotebook({ title })
    setActiveNotebookId(id as Id<'notebooks'>)
    setNewNotebookTitle('')
    setNewNotebookOpen(false)
  }

  function startEditingNotebook(id: Id<'notebooks'>, currentTitle: string) {
    setEditingNotebookId(id)
    setEditingTitle(currentTitle)
    setNotebookActionError(null)
  }

  function cancelEditingNotebook() {
    setEditingNotebookId(null)
    setEditingTitle('')
  }

  async function commitRenameNotebook() {
    if (!editingNotebookId) return
    const title = editingTitle.trim()
    if (!title) {
      cancelEditingNotebook()
      return
    }
    try {
      await renameNotebook({ id: editingNotebookId, title })
      cancelEditingNotebook()
    } catch (e) {
      setNotebookActionError(e instanceof Error ? e.message : 'Não foi possível renomear.')
    }
  }

  async function handleDeleteNotebook(id: Id<'notebooks'>, title: string) {
    if (!window.confirm(`Apagar o caderno "${title}"?`)) return
    setNotebookActionError(null)
    try {
      await removeNotebook({ id })
      if (activeNotebookId === id) {
        setActiveNotebookId(null)
      }
    } catch (e) {
      setNotebookActionError(e instanceof Error ? e.message : 'Não foi possível apagar.')
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">
            Caderno digital
          </h2>
          <p className="text-xs text-gray-500">
            Organize anotações em cadernos. Cada aula tem sua entrada dentro
            do caderno ativo.
          </p>
        </div>
      </div>

      {notebooks === undefined ? (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-6 text-xs text-gray-400">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
          Carregando cadernos...
        </div>
      ) : notebooks.length === 0 && !newNotebookOpen ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-gray-700">
            Crie seu primeiro caderno
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Cadernos separam seus estudos por assunto ou curso.
          </p>
          <button
            type="button"
            onClick={() => setNewNotebookOpen(true)}
            className="mt-4 rounded-xl bg-[#F37E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#e06e10]"
          >
            Criar caderno
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
            {notebooks.map((nb) => {
              const isActive = activeNotebookId === nb._id
              const isEditing = editingNotebookId === nb._id

              if (isEditing) {
                return (
                  <input
                    key={nb._id}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    maxLength={50}
                    autoFocus
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={() => commitRenameNotebook()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitRenameNotebook()
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelEditingNotebook()
                      }
                    }}
                    className="w-40 rounded-full border border-[#F37E20]/40 bg-white px-3 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                  />
                )
              }

              return (
                <div
                  key={nb._id}
                  className={cn(
                    'group flex items-center gap-1 rounded-full border pr-1 transition-all',
                    isActive
                      ? 'border-[#F37E20] bg-[#F37E20]/10 text-[#F37E20]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveNotebookId(nb._id)}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {nb.title}
                  </button>
                  {isActive && (
                    <>
                      <button
                        type="button"
                        title="Renomear caderno"
                        onClick={() => startEditingNotebook(nb._id, nb.title)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-full p-1 text-[#F37E20] hover:bg-[#F37E20]/15 transition-opacity"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Apagar caderno"
                        onClick={() => handleDeleteNotebook(nb._id, nb.title)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-full p-1 text-[#F37E20] hover:bg-[#F37E20]/15 transition-opacity"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              )
            })}

            {newNotebookOpen ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newNotebookTitle}
                  onChange={(e) => setNewNotebookTitle(e.target.value)}
                  placeholder="Nome do caderno"
                  maxLength={50}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateNotebook()
                    if (e.key === 'Escape') {
                      setNewNotebookOpen(false)
                      setNewNotebookTitle('')
                    }
                  }}
                  className="w-40 rounded-full border border-[#F37E20]/40 bg-white px-3 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                />
                <button
                  type="button"
                  onClick={handleCreateNotebook}
                  className="rounded-full bg-[#F37E20] px-3 py-1 text-xs font-bold text-white hover:bg-[#e06e10]"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewNotebookOpen(false)
                    setNewNotebookTitle('')
                  }}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNewNotebookOpen(true)}
                className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500 hover:border-[#F37E20]/40 hover:text-[#F37E20]"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Novo caderno
              </button>
            )}
          </div>

          {notebookActionError && (
            <div role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              {notebookActionError}
            </div>
          )}

          {activeNotebookId && (
            <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setView('lesson')}
                className={cn(
                  'rounded-full px-3 py-1 font-semibold transition-all',
                  view === 'lesson'
                    ? 'bg-[#F37E20]/10 text-[#F37E20]'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Esta aula
              </button>
              <button
                type="button"
                onClick={() => setView('all')}
                className={cn(
                  'rounded-full px-3 py-1 font-semibold transition-all',
                  view === 'all'
                    ? 'bg-[#F37E20]/10 text-[#F37E20]'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Caderno completo
              </button>
            </div>
          )}

          {activeNotebookId && view === 'lesson' && (
            <div className="p-4">
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setIsDirty(true)
                  setSaveStatus('idle')
                }}
                placeholder="Escreva suas anotações sobre esta aula..."
                maxLength={20000}
                className="min-h-[180px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-4 py-3 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
              />
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-[#F37E20]/10 px-2.5 py-1 text-[11px] font-semibold text-[#F37E20]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remover etiqueta ${tag}`}
                        className="text-[#F37E20]/70 hover:text-[#F37E20]"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {tags.length < 8 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          addTag(tagInput)
                        }
                        if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
                          removeTag(tags[tags.length - 1])
                        }
                      }}
                      onBlur={() => {
                        if (tagInput.trim()) addTag(tagInput)
                      }}
                      placeholder={tags.length === 0 ? 'Etiquetas (Enter)' : 'Adicionar'}
                      maxLength={24}
                      className="min-w-[120px] flex-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/20"
                    />
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>
                  {content.length.toLocaleString()} / 20.000 caracteres
                </span>
                <span>
                  {saveStatus === 'saving'
                    ? 'Salvando...'
                    : saveStatus === 'saved'
                    ? 'Salvo automaticamente'
                    : isDirty
                    ? 'Alterações não salvas'
                    : 'Atualizado'}
                </span>
              </div>
            </div>
          )}

          {activeNotebookId && view === 'all' && (
            <div className="p-4">
              {allEntries === undefined ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
                  Carregando anotações...
                </div>
              ) : allEntries.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhuma anotação neste caderno ainda. Use a aba "Esta aula" para começar.
                </p>
              ) : (
                <ul className="space-y-3">
                  {allEntries.map((e) => {
                    const isCurrent = e.lessonId === lessonId
                    return (
                      <li
                        key={e._id}
                        className={cn(
                          'rounded-xl border p-3 transition-all',
                          isCurrent
                            ? 'border-[#F37E20]/40 bg-[#F37E20]/5'
                            : 'border-gray-200 bg-white'
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-gray-700">
                              {e.lessonTitle}
                            </p>
                            <p className="truncate text-[11px] text-gray-400">
                              {e.courseTitle}
                            </p>
                          </div>
                          {!isCurrent && e.courseSlug && e.lessonSlug && (
                            <Link
                              to={`/dashboard/meus-cursos/${e.courseId}/aula/${e.lessonId}`}
                              className="shrink-0 text-[11px] font-semibold text-[#F37E20] hover:underline"
                            >
                              Abrir aula
                            </Link>
                          )}
                          {isCurrent && (
                            <span className="shrink-0 rounded-full bg-[#F37E20]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F37E20]">
                              Aula atual
                            </span>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {e.content || (
                            <span className="text-gray-400 italic">Sem conteúdo</span>
                          )}
                        </p>
                        {e.tags && e.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {e.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
